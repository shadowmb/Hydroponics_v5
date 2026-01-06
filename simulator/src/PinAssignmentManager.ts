/**
 * PinAssignmentManager - Manages sensor-to-pin assignments
 * 
 * Handles:
 * - Assigning sensors to specific pins
 * - Storing sensor values
 * - Looking up sensor by pin when command arrives
 */

import { SensorRegistry, SensorTemplate } from './SensorRegistry';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface PinAssignment {
    sensorId: string;           // Template ID: "dfrobot_ph_pro"
    pins: string[];             // Assigned pins: ["A0_14"] or ["D2_2", "D3_3"]
    values: Record<string, number>;  // Current values: { ph: 6.5 } or { temp: 24, humidity: 60 }
    calibrationPoints?: { raw: number, value: number }[]; // Raw <-> Value mapping
}

export interface AssignedSensorInfo {
    sensorId: string;
    sensorName: string;
    pins: string[];
    hardwareCmd: string;
    values: Record<string, number>;
    limits?: { min: number; max: number; unit: string };
    perKeyLimits?: Record<string, { min?: number; max?: number }>;
    rawUnit?: string;
    units?: Record<string, string>; // Per-key units (e.g. { temp: 'C', humidity: '%' })
    calibrationPoints?: { raw: number, value: number }[];
}

export class PinAssignmentManager {
    private assignments: Map<string, PinAssignment> = new Map();  // pinKey -> assignment
    private configPath: string = '';

    constructor(private sensorRegistry: SensorRegistry) {
        // Default init with empty path, waiting for setConfigProfile
    }

    /**
     * Set the current profile ID for persistence
     * This switches the loaded file provided it exists
     */
    setConfigProfile(profileId: string) {
        // Sanitize ID just in case
        const safeId = profileId.replace(/[^a-z0-9_\-]/gi, '_');
        this.configPath = path.join(__dirname, `../data/assignments_${safeId}.json`);

        // Ensure data directory exists
        const dataDir = path.dirname(this.configPath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        console.log(`[PinManager] Switched config to profile: ${profileId}`);
        this.loadConfig();
    }

    /**
     * setCalibration - Store calibration points for a pin's sensor
     */
    setCalibration(pin: string, points: { raw: number, value: number }[]) {
        const assignment = this.assignments.get(pin);
        if (assignment) {
            assignment.calibrationPoints = points;
            console.log(`[PinManager] Set calibration for ${assignment.sensorId}:`, points);
            this.saveConfig();
        }
    }

    /**
     * Assign a sensor to one or more pins
     * @param sensorId - The sensor template ID
     * @param pins - Array of pin IDs in format "Label_GPIO" (e.g., ["A0_14"] or ["D2_2", "D3_3"])
     */
    assignSensor(sensorId: string, pins: string[]): boolean {
        const sensor = this.sensorRegistry.getSensor(sensorId);
        if (!sensor) {
            console.error(`[PinManager] Unknown sensor: ${sensorId}`);
            return false;
        }

        if (pins.length !== sensor.pins.length) {
            console.error(`[PinManager] ${sensorId} requires ${sensor.pins.length} pins, got ${pins.length}`);
            return false;
        }

        // Initialize values from template
        const values: Record<string, number> = {};
        const outputKeys = this.sensorRegistry.getOutputKeys(sensorId);
        const initialValue = sensor.initialState?.value ?? 0;

        for (const key of outputKeys) {
            values[key] = initialValue;
        }

        const assignment: PinAssignment = {
            sensorId,
            pins,
            values
        };

        // Store by primary pin (first pin)
        const primaryPin = pins[0];
        this.assignments.set(primaryPin, assignment);

        // Also index by additional pins for multi-pin sensors
        for (let i = 1; i < pins.length; i++) {
            this.assignments.set(pins[i], assignment);
        }

        console.log(`[PinManager] Assigned ${sensorId} to pins: ${pins.join(', ')}`);
        this.saveConfig();
        return true;
    }

    /**
     * Remove sensor assignment from pins
     */
    unassignPin(pin: string): void {
        const assignment = this.assignments.get(pin);
        if (assignment) {
            // Remove all related pins
            for (const p of assignment.pins) {
                this.assignments.delete(p);
            }
            console.log(`[PinManager] Unassigned sensor from pin: ${pin}`);
            this.saveConfig();
        }
    }

    /**
     * Get assignment by any of its pins
     * Supports lookup by full ID ("D11_11") or just GPIO number ("11")
     */
    getAssignment(pin: string): PinAssignment | undefined {
        // 1. Try exact match (e.g. "D11_11")
        if (this.assignments.has(pin)) {
            return this.assignments.get(pin);
        }

        // 2. Try looking up by suffix (e.g. find "D11_11" when searching for "11")
        for (const key of this.assignments.keys()) {
            if (key.endsWith(`_${pin}`)) {
                return this.assignments.get(key);
            }
        }

        // 3. Try looking up by prefix (e.g. find "D0_0" when searching for "D0")
        for (const key of this.assignments.keys()) {
            if (key.startsWith(`${pin}_`)) {
                return this.assignments.get(key);
            }
        }

        return undefined;
    }

    /**
     * Get sensor template for a pin
     */
    getSensorForPin(pin: string): SensorTemplate | undefined {
        const assignment = this.assignments.get(pin);
        if (!assignment) return undefined;
        return this.sensorRegistry.getSensor(assignment.sensorId);
    }

    /**
     * Update sensor value(s) for a pin
     */
    setValue(pin: string, key: string, value: number): void {
        const assignment = this.assignments.get(pin);
        if (assignment) {
            assignment.values[key] = value;
            this.saveConfig();
        }
    }

    /**
     * Get all values for a sensor
     */
    getValues(pin: string): Record<string, number> | undefined {
        return this.assignments.get(pin)?.values;
    }

    /**
     * Get all assigned sensors with their info
     */
    getAllAssignments(): AssignedSensorInfo[] {
        const seen = new Set<string>();
        const result: AssignedSensorInfo[] = [];

        for (const [pin, assignment] of this.assignments) {
            // Skip if we've already processed this sensor (multi-pin)
            const key = assignment.pins.join(',');
            if (seen.has(key)) continue;
            seen.add(key);

            const sensor = this.sensorRegistry.getSensor(assignment.sensorId);
            if (!sensor) continue;

            // For ANALOG sensors, use ADC limits (0-1023 for 10-bit, 0-16383 for 14-bit)
            const hwCmd = this.sensorRegistry.getHardwareCommand(assignment.sensorId) || '';
            const isAnalog = hwCmd === 'ANALOG';

            // Determine limits
            let limits = sensor.hardwareLimits;
            if (isAnalog) {
                limits = { min: 0, max: 1023, unit: 'adc' };
            }

            // Get per-key limits
            const perKeyLimits = this.sensorRegistry.getAllLimits(assignment.sensorId);

            // Get per-key units
            const units = isAnalog
                ? { value: 'adc' }
                : this.sensorRegistry.getAllRawUnits(assignment.sensorId);

            result.push({
                sensorId: assignment.sensorId,
                sensorName: sensor.name,
                pins: assignment.pins,
                hardwareCmd: hwCmd,
                values: assignment.values,
                limits,
                perKeyLimits,
                rawUnit: isAnalog ? 'adc' : this.sensorRegistry.getRawUnit(assignment.sensorId),
                units,
                calibrationPoints: assignment.calibrationPoints
            });
        }

        return result;
    }

    /**
     * Clear all assignments
     */
    clear(): void {
        this.assignments.clear();
        console.log('[PinManager] Cleared all assignments');
    }

    /**
     * Export assignments to JSON (for persistence)
     */
    exportConfig(): { sensorId: string; pins: string[]; values: Record<string, number>; calibrationPoints?: { raw: number; value: number }[] }[] {
        const seen = new Set<string>();
        const result: { sensorId: string; pins: string[]; values: Record<string, number>; calibrationPoints?: { raw: number; value: number }[] }[] = [];

        for (const [, assignment] of this.assignments) {
            const key = assignment.pins.join(',');
            if (seen.has(key)) continue;
            seen.add(key);
            result.push({
                sensorId: assignment.sensorId,
                pins: assignment.pins,
                values: assignment.values,
                calibrationPoints: assignment.calibrationPoints
            });
        }

        return result;
    }

    /**
     * Import assignments from JSON
     */
    importConfig(config: { sensorId: string; pins: string[]; values?: Record<string, number>; calibrationPoints?: { raw: number; value: number }[] }[]): void {
        this.clear();
        for (const item of config) {
            this.assignSensor(item.sensorId, item.pins);
            const assignment = this.assignments.get(item.pins[0]);
            if (assignment) {
                if (item.values) assignment.values = { ...assignment.values, ...item.values };
                if (item.calibrationPoints) assignment.calibrationPoints = item.calibrationPoints;
            }
        }
    }

    // ============ Persistence ============

    setConfigId(controllerId: string) {
        // Create filename based on controller ID
        const safeId = controllerId.replace(/[^a-zA-Z0-9_-]/g, '_');
        this.configPath = path.join(__dirname, `../data/assignments_${safeId}.json`);

        // Ensure data directory exists
        const dataDir = path.dirname(this.configPath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        console.log(`[PinManager] Set config path: ${this.configPath}`);
        this.loadConfig();
    }

    reset() {
        this.clear();
        this.saveConfig();
        console.log('[PinManager] Reset configuration');
    }

    private saveConfig() {
        if (!this.configPath) return;
        try {
            const data = this.exportConfig();
            fs.writeFileSync(this.configPath, JSON.stringify(data, null, 2));
        } catch (e) {
            console.error('[PinManager] Error saving config:', e);
        }
    }

    private loadConfig() {
        if (!this.configPath) return;
        if (!fs.existsSync(this.configPath)) {
            // New config, clear current state
            this.clear();
            return;
        }

        try {
            const content = fs.readFileSync(this.configPath, 'utf-8');
            const data = JSON.parse(content);
            this.importConfig(data);
            console.log(`[PinManager] Loaded ${data.length} assignments from config`);
        } catch (e) {
            console.error('[PinManager] Error loading config:', e);
        }
    }
}
