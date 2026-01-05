/**
 * ScenarioEngine - Automated scenario playback for testing
 * 
 * Loads JSON scenario files and updates DeviceState over time.
 * Supports: linear drift, constant values, random fluctuation, error injection
 */

import { DeviceState } from './DeviceState.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ScenarioAction {
    sensor?: string;
    type: 'linear' | 'constant' | 'random' | 'error_timeout' | 'error_invalid' | 'error_offline';
    value?: number;
    from?: number;
    to?: number;
    min?: number;
    max?: number;
    duration?: number;
    startAt?: number;
    commands?: string[];
}

interface Scenario {
    name: string;
    duration: number;
    actions: ScenarioAction[];
}

export class ScenarioEngine {
    private deviceState: DeviceState;
    private activeScenario: Scenario | null = null;
    private intervalId: NodeJS.Timeout | null = null;
    private startTime: number = 0;
    private scenariosDir: string;

    constructor(deviceState: DeviceState) {
        this.deviceState = deviceState;
        this.scenariosDir = path.join(__dirname, '../scenarios');

        // Create scenarios directory if it doesn't exist
        if (!fs.existsSync(this.scenariosDir)) {
            fs.mkdirSync(this.scenariosDir, { recursive: true });
            this.createDefaultScenarios();
        }
    }

    private createDefaultScenarios(): void {
        // Create a default pH drift scenario
        const phDrift: Scenario = {
            name: 'pH Drift Down',
            duration: 60,
            actions: [
                { sensor: 'pH', type: 'linear', from: 7.0, to: 5.5, duration: 60 },
                { sensor: 'EC', type: 'constant', value: 1.8 }
            ]
        };

        const connectionTest: Scenario = {
            name: 'Connection Dropout Test',
            duration: 60,
            actions: [
                { sensor: 'pH', type: 'constant', value: 6.5 },
                { type: 'error_timeout', commands: ['PING'], startAt: 20, duration: 10 }
            ]
        };

        const randomFluctuation: Scenario = {
            name: 'Random Fluctuation',
            duration: 120,
            actions: [
                { sensor: 'pH', type: 'random', min: 6.0, max: 7.0 },
                { sensor: 'temperature', type: 'random', min: 22, max: 26 },
                { sensor: 'humidity', type: 'random', min: 55, max: 70 }
            ]
        };

        fs.writeFileSync(
            path.join(this.scenariosDir, 'ph_drift.json'),
            JSON.stringify(phDrift, null, 2)
        );
        fs.writeFileSync(
            path.join(this.scenariosDir, 'connection_test.json'),
            JSON.stringify(connectionTest, null, 2)
        );
        fs.writeFileSync(
            path.join(this.scenariosDir, 'random_fluctuation.json'),
            JSON.stringify(randomFluctuation, null, 2)
        );

        console.log('[SCENARIO] Created default scenarios in', this.scenariosDir);
    }

    listScenarios(): string[] {
        try {
            return fs.readdirSync(this.scenariosDir)
                .filter(f => f.endsWith('.json'))
                .map(f => f.replace('.json', ''));
        } catch {
            return [];
        }
    }

    loadScenario(name: string): Scenario {
        const filePath = path.join(this.scenariosDir, `${name}.json`);
        if (!fs.existsSync(filePath)) {
            throw new Error(`Scenario '${name}' not found`);
        }
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content) as Scenario;
    }

    startScenario(name: string): void {
        if (this.intervalId) {
            this.stopScenario();
        }

        this.activeScenario = this.loadScenario(name);
        this.startTime = Date.now();

        console.log(`[SCENARIO] Starting: ${this.activeScenario.name} (${this.activeScenario.duration}s)`);

        // Update every 500ms
        this.intervalId = setInterval(() => {
            this.tick();
        }, 500);
    }

    stopScenario(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        if (this.activeScenario) {
            console.log(`[SCENARIO] Stopped: ${this.activeScenario.name}`);
            this.activeScenario = null;
        }
        // Clear any error injections
        this.deviceState.clearAllErrors();
    }

    private tick(): void {
        if (!this.activeScenario) return;

        const elapsed = (Date.now() - this.startTime) / 1000;

        // Check if scenario is complete
        if (elapsed >= this.activeScenario.duration) {
            console.log(`[SCENARIO] Completed: ${this.activeScenario.name}`);
            this.stopScenario();
            return;
        }

        // Process each action
        for (const action of this.activeScenario.actions) {
            this.processAction(action, elapsed);
        }
    }

    private processAction(action: ScenarioAction, elapsed: number): void {
        // Handle error injection with time window
        if (action.type.startsWith('error_')) {
            const startAt = action.startAt || 0;
            const duration = action.duration || 10;
            const isActive = elapsed >= startAt && elapsed < startAt + duration;

            switch (action.type) {
                case 'error_timeout':
                    if (action.commands) {
                        for (const cmd of action.commands) {
                            if (isActive) {
                                this.deviceState.blockCommand(cmd);
                            } else {
                                this.deviceState.unblockCommand(cmd);
                            }
                        }
                    }
                    break;
                case 'error_invalid':
                    if (action.commands) {
                        for (const cmd of action.commands) {
                            this.deviceState.setInvalidResponse(cmd, isActive);
                        }
                    }
                    break;
                case 'error_offline':
                    this.deviceState.setOffline(isActive);
                    break;
            }
            return;
        }

        // Handle sensor value changes
        if (!action.sensor) return;

        let value: number;
        const actionDuration = action.duration || this.activeScenario!.duration;

        switch (action.type) {
            case 'constant':
                value = action.value || 0;
                break;

            case 'linear':
                const from = action.from || 0;
                const to = action.to || 0;
                const progress = Math.min(elapsed / actionDuration, 1);
                value = from + (to - from) * progress;
                break;

            case 'random':
                const min = action.min || 0;
                const max = action.max || 100;
                value = min + Math.random() * (max - min);
                break;

            default:
                return;
        }

        this.deviceState.setSensorValue(action.sensor, value);
    }
}
