/**
 * PinAssignmentManager - Manages sensor-to-pin assignments
 * 
 * Handles:
 * - Assigning sensors to specific pins
 * - Storing sensor values
 * - Looking up sensor by pin when command arrives
 */

import { SensorRegistry, SensorTemplate } from './SensorRegistry';

export interface PinAssignment {
    sensorId: string;           // Template ID: "dfrobot_ph_pro"
    pins: string[];             // Assigned pins: ["A0_14"] or ["D2_2", "D3_3"]
    values: Record<string, number>;  // Current values: { ph: 6.5 } or { temp: 24, humidity: 60 }
}

export interface AssignedSensorInfo {
    sensorId: string;
    sensorName: string;
    pins: string[];
    hardwareCmd: string;
    values: Record<string, number>;
    limits?: { min: number; max: number };
    rawUnit?: string;
}

export class PinAssignmentManager {
    private assignments: Map<string, PinAssignment> = new Map();  // pinKey -> assignment
    private sensorRegistry: SensorRegistry;

    constructor(sensorRegistry: SensorRegistry) {
        this.sensorRegistry = sensorRegistry;
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
        }
    }

    /**
     * Get assignment by any of its pins
     */
    getAssignment(pin: string): PinAssignment | undefined {
        return this.assignments.get(pin);
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
            const limits = isAnalog
                ? { min: 0, max: 1023, unit: 'adc' }  // Standard Arduino ADC range
                : sensor.hardwareLimits;

            result.push({
                sensorId: assignment.sensorId,
                sensorName: sensor.name,
                pins: assignment.pins,
                hardwareCmd: hwCmd,
                values: assignment.values,
                limits,
                rawUnit: isAnalog ? 'adc' : this.sensorRegistry.getRawUnit(assignment.sensorId)
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
    exportConfig(): { sensorId: string; pins: string[]; values: Record<string, number> }[] {
        const seen = new Set<string>();
        const result: { sensorId: string; pins: string[]; values: Record<string, number> }[] = [];

        for (const [, assignment] of this.assignments) {
            const key = assignment.pins.join(',');
            if (seen.has(key)) continue;
            seen.add(key);
            result.push({
                sensorId: assignment.sensorId,
                pins: assignment.pins,
                values: assignment.values
            });
        }

        return result;
    }

    /**
     * Import assignments from JSON
     */
    importConfig(config: { sensorId: string; pins: string[]; values?: Record<string, number> }[]): void {
        this.clear();
        for (const item of config) {
            this.assignSensor(item.sensorId, item.pins);
            if (item.values) {
                const assignment = this.assignments.get(item.pins[0]);
                if (assignment) {
                    assignment.values = { ...assignment.values, ...item.values };
                }
            }
        }
    }
}
