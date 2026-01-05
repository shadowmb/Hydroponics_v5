/**
 * SensorRegistry - Loads and manages device/sensor templates
 * 
 * Provides sensor metadata including pin requirements and response formats
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface SensorOutput {
    key: string;
    label: string;
    unit: string;
}

export interface SensorCommand {
    hardwareCmd: string;
    valuePath?: string;
    sourceUnit?: string;
    outputs?: SensorOutput[];
}

export interface SensorPin {
    name: string;       // "Signal", "TRIG", "ECHO", "RX", "TX"
    type: string;       // "ANALOG_IN", "DIGITAL_IN", "DIGITAL_OUT"
}

export interface SensorTemplate {
    id: string;
    name: string;
    description: string;
    category: 'SENSOR' | 'ACTUATOR';
    measurements?: Record<string, { rawUnit: string; baseUnit: string }>;
    hardwareLimits?: { min: number; max: number; unit: string };
    commands: Record<string, SensorCommand>;
    pins: SensorPin[];
    initialState?: { value: number };
}

export class SensorRegistry {
    private sensors: Map<string, SensorTemplate> = new Map();
    private configPath: string;

    constructor() {
        // Path to backend device config
        this.configPath = path.resolve(__dirname, '../../backend/config/devices');
        this.loadSensors();
    }

    private loadSensors(): void {
        try {
            if (!fs.existsSync(this.configPath)) {
                console.warn('[Registry] Devices path not found:', this.configPath);
                return;
            }

            this.scanDirectory(this.configPath);
            console.log(`[Registry] Total sensors/devices: ${this.sensors.size}`);
        } catch (e) {
            console.error('[Registry] Error loading sensors:', e);
        }
    }

    private scanDirectory(dir: string): void {
        const items = fs.readdirSync(dir, { withFileTypes: true });

        for (const item of items) {
            const fullPath = path.join(dir, item.name);

            if (item.isDirectory()) {
                this.scanDirectory(fullPath);
            } else if (item.name.endsWith('.json')) {
                try {
                    const content = fs.readFileSync(fullPath, 'utf-8');
                    const template = JSON.parse(content) as SensorTemplate;
                    this.sensors.set(template.id, template);
                    console.log(`[Registry] Loaded sensor: ${template.id} (${template.name})`);
                } catch (e) {
                    console.error(`[Registry] Failed to load ${fullPath}:`, e);
                }
            }
        }
    }

    getSensor(id: string): SensorTemplate | undefined {
        return this.sensors.get(id);
    }

    listSensors(): { id: string; name: string; category: string; pinCount: number }[] {
        return Array.from(this.sensors.values()).map(s => ({
            id: s.id,
            name: s.name,
            category: s.category,
            pinCount: s.pins.length
        }));
    }

    getSensorsByCategory(category: 'SENSOR' | 'ACTUATOR'): SensorTemplate[] {
        return Array.from(this.sensors.values()).filter(s => s.category === category);
    }

    getHardwareCommand(sensorId: string): string | undefined {
        const sensor = this.sensors.get(sensorId);
        if (!sensor) return undefined;

        const readCmd = sensor.commands['READ'] || sensor.commands['TOGGLE'];
        return readCmd?.hardwareCmd;
    }

    getRawUnit(sensorId: string): string | undefined {
        const sensor = this.sensors.get(sensorId);
        if (!sensor?.measurements) return undefined;

        const firstMeasurement = Object.values(sensor.measurements)[0];
        return firstMeasurement?.rawUnit;
    }

    getOutputKeys(sensorId: string): string[] {
        const sensor = this.sensors.get(sensorId);
        if (!sensor) return ['value'];

        const readCmd = sensor.commands['READ'];
        if (readCmd?.outputs) {
            return readCmd.outputs.map(o => o.key);
        }
        return ['value'];
    }
}
