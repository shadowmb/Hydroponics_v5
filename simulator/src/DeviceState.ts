/**
 * DeviceState - In-memory state management for the simulator
 * 
 * Stores:
 * - Sensor values (pH, EC, temperature, etc.)
 * - Relay/actuator states (ON/OFF)
 * - System info (uptime, etc.)
 */

export interface SensorState {
    value: number;
    lastUpdated: Date;
}

export interface RelayState {
    state: 0 | 1;
    lastUpdated: Date;
}

export class DeviceState {
    private sensors: Map<string, SensorState> = new Map();
    private relays: Map<string, RelayState> = new Map();
    private startTime: Date = new Date();

    // Error injection state
    private blockedCommands: Set<string> = new Set();
    private invalidResponseCommands: Set<string> = new Set();
    private isOffline: boolean = false;

    constructor() {
        // Initialize default sensors with realistic values
        this.sensors.set('pH', { value: 6.5, lastUpdated: new Date() });
        this.sensors.set('EC', { value: 1.8, lastUpdated: new Date() });
        this.sensors.set('temperature', { value: 24.0, lastUpdated: new Date() });
        this.sensors.set('humidity', { value: 60.0, lastUpdated: new Date() });
        this.sensors.set('waterLevel', { value: 75.0, lastUpdated: new Date() });
        this.sensors.set('light', { value: 500, lastUpdated: new Date() });
    }

    // ============ Sensor Methods ============

    getSensorValue(name: string): number {
        const sensor = this.sensors.get(name);
        return sensor ? sensor.value : 0;
    }

    setSensorValue(name: string, value: number): void {
        this.sensors.set(name, { value, lastUpdated: new Date() });
    }

    getAllSensors(): Record<string, SensorState> {
        const result: Record<string, SensorState> = {};
        this.sensors.forEach((state, name) => {
            result[name] = state;
        });
        return result;
    }

    // ============ Relay Methods ============

    getRelayState(pin: string): 0 | 1 {
        const relay = this.relays.get(pin);
        return relay ? relay.state : 0;
    }

    setRelayState(pin: string, state: 0 | 1): void {
        this.relays.set(pin, { state, lastUpdated: new Date() });
    }

    getAllRelays(): Record<string, RelayState> {
        const result: Record<string, RelayState> = {};
        this.relays.forEach((state, pin) => {
            result[pin] = state;
        });
        return result;
    }

    // ============ System Methods ============

    getUptime(): number {
        return Date.now() - this.startTime.getTime();
    }

    getFullState(): {
        sensors: Record<string, SensorState>;
        relays: Record<string, RelayState>;
        uptime: number;
        isOffline: boolean;
        blockedCommands: string[];
    } {
        return {
            sensors: this.getAllSensors(),
            relays: this.getAllRelays(),
            uptime: this.getUptime(),
            isOffline: this.isOffline,
            blockedCommands: Array.from(this.blockedCommands)
        };
    }

    // ============ Error Injection Methods ============

    blockCommand(cmd: string): void {
        this.blockedCommands.add(cmd);
    }

    unblockCommand(cmd: string): void {
        this.blockedCommands.delete(cmd);
    }

    isCommandBlocked(cmd: string): boolean {
        return this.blockedCommands.has(cmd);
    }

    setInvalidResponse(cmd: string, enabled: boolean): void {
        if (enabled) {
            this.invalidResponseCommands.add(cmd);
        } else {
            this.invalidResponseCommands.delete(cmd);
        }
    }

    shouldReturnInvalid(cmd: string): boolean {
        return this.invalidResponseCommands.has(cmd);
    }

    setOffline(offline: boolean): void {
        this.isOffline = offline;
    }

    getIsOffline(): boolean {
        return this.isOffline;
    }

    clearAllErrors(): void {
        this.blockedCommands.clear();
        this.invalidResponseCommands.clear();
        this.isOffline = false;
    }

    // ============ Analog Pin Simulation ============

    /**
     * Simulates an analog read based on sensor name prefix
     * Maps pin names to sensor types for realistic values
     */
    getAnalogValue(pin: string): number {
        // Default: return a value based on stored sensors or random
        // In a real implementation, pins would be mapped to specific sensors
        const sensorMap: Record<string, string> = {
            'A0': 'pH',
            'A1': 'EC',
            'A2': 'light',
            'A3': 'moisture'
        };

        const pinLabel = pin.split('_')[0]; // Extract A0 from A0_14
        const sensorName = sensorMap[pinLabel];

        if (sensorName) {
            const value = this.getSensorValue(sensorName);
            // Convert to ADC range (0-1023 for Arduino, 0-4095 for ESP32)
            // This is just a rough simulation
            return Math.floor((value / 14) * 1023); // Assuming pH-like range 0-14
        }

        // Default random value
        return Math.floor(Math.random() * 1024);
    }
}
