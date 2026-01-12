/**
 * UdpProtocolHandler v2 - Pin-based sensor resolution
 * 
 * Now uses PinAssignmentManager to determine:
 * - What sensor is assigned to which pin
 * - What values to return based on sensor type
 */

import { DeviceState } from './DeviceState.js';
import { PinAssignmentManager } from './PinAssignmentManager.js';
import { SensorRegistry } from './SensorRegistry.js';

interface ControllerInfo {
    mac: string;
    model: string;
    firmwareVersion: string;
}

export class UdpProtocolHandler {
    private deviceState: DeviceState;
    private pinManager: PinAssignmentManager;
    private sensorRegistry: SensorRegistry;
    private info: ControllerInfo;
    private capabilities: string[] = [
        'ANALOG', 'DIGITAL_READ', 'DIGITAL_WRITE', 'RELAY_SET',
        'PWM_WRITE', 'SERVO_WRITE', 'DHT_READ', 'ONEWIRE_READ_TEMP',
        'ULTRASONIC_TRIG_ECHO', 'I2C_READ', 'MODBUS_RTU_READ', 'UART_READ_DISTANCE',
        'PULSE_RATE'
    ];

    constructor(
        deviceState: DeviceState,
        pinManager: PinAssignmentManager,
        sensorRegistry: SensorRegistry,
        info: ControllerInfo
    ) {
        this.deviceState = deviceState;
        this.pinManager = pinManager;
        this.sensorRegistry = sensorRegistry;
        this.info = info;
    }

    /**
     * Main command handler
     */
    handleCommand(rawCommand: string): object | string | null {
        const command = rawCommand.trim();
        if (command !== 'PING' && command !== 'STATUS') {
            console.log(`[PROTO] RX: ${command}`);
        }

        // Error injection checks
        if (this.deviceState.getIsOffline()) {
            console.log('[PROTO] Simulating offline - no response');
            return null;
        }

        const parts = command.split('|');
        const cmd = parts[0];
        const params = parts.slice(1);

        if (this.deviceState.isCommandBlocked(cmd)) {
            console.log(`[PROTO] Command ${cmd} blocked - simulating timeout`);
            return null;
        }

        if (this.deviceState.shouldReturnInvalid(cmd)) {
            console.log(`[PROTO] Command ${cmd} - simulating invalid response`);
            return 'INVALID_RESPONSE{{{broken_json';
        }

        try {
            return this.routeCommand(cmd, params);
        } catch (e: any) {
            return { ok: 0, error: e.message };
        }
    }

    private routeCommand(cmd: string, params: string[]): object {
        switch (cmd) {
            // ============ System Commands ============
            case 'PING':
                return { ok: 1, pong: 1 };

            case 'STATUS':
                return {
                    ok: 1,
                    status: 'running',
                    up: this.deviceState.getUptime()
                };

            case 'INFO':
                return {
                    ok: 1,
                    up: this.deviceState.getUptime(),
                    mem: 32768,
                    ver: this.info.firmwareVersion,
                    capabilities: this.capabilities
                };

            case 'RESET':
                console.log('[PROTO] Reset command received');
                return { ok: 1, msg: 'Resetting...' };

            case 'HYDROPONICS_DISCOVERY':
                return {
                    type: 'ANNOUNCE',
                    mac: this.info.mac,
                    ip: '127.0.0.1',
                    model: this.info.model,
                    firmware: this.info.firmwareVersion,
                    capabilities: this.capabilities
                };

            // ============ Sensor Commands (Pin-Based) ============
            case 'ANALOG':
                return this.handlePinBasedCommand(cmd, params, 'value');

            case 'DIGITAL_READ':
                return this.handleDigitalRead(params);

            case 'DHT_READ':
                return this.handleDhtRead(params);

            case 'ONEWIRE_READ_TEMP':
                return this.handlePinBasedCommand(cmd, params, 'value');

            case 'ULTRASONIC_TRIG_ECHO':
                return this.handleMultiPinCommand(cmd, params);

            case 'UART_READ_DISTANCE':
                return this.handleMultiPinCommand(cmd, params);

            case 'I2C_READ':
                return this.handleI2cRead(params);

            case 'MODBUS_RTU_READ':
                return this.handleModbusRead(params);

            case 'PULSE_RATE':
                return this.handlePinBasedCommand(cmd, params, 'hz');

            // ============ Actuator Commands ============
            case 'DIGITAL_WRITE':
                return this.handleDigitalWrite(params);

            case 'RELAY_SET':
                return this.handleRelaySet(params);

            case 'PWM_WRITE':
                return this.handlePwmWrite(params);

            case 'SERVO_WRITE':
                return this.handleServoWrite(params);

            default:
                return { ok: 0, error: 'ERR_INVALID_COMMAND' };
        }
    }

    // ============ Pin-Based Sensor Handlers ============

    /**
     * Handle single-pin commands (ANALOG, ONEWIRE_READ_TEMP)
     * Uses pin assignment to get correct value
     * 
     * IMPORTANT: For ANALOG commands, backend expects raw value in 'value' key
     * (based on template valuePath). The ConversionService handles the rest.
     */
    private handlePinBasedCommand(cmd: string, params: string[], defaultKey: string): object {
        if (params.length < 1) {
            return { ok: 0, error: 'ERR_MISSING_PIN' };
        }

        const pin = params[0];
        const assignment = this.pinManager.getAssignment(pin);

        if (!assignment) {
            // No sensor assigned - return error for easier debugging
            console.log(`[PROTO] No sensor assigned to ${pin}, returning error`);
            return { ok: 0, error: 'ERR_NO_SENSOR_ASSIGNED' };
        }

        // Get values from assignment
        const values = assignment.values;
        const sensor = this.sensorRegistry.getSensor(assignment.sensorId);

        // Get valuePath from template - this is the key backend expects
        const valuePath = sensor?.commands['READ']?.valuePath || defaultKey;

        // For ANALOG sensors, return raw value in the expected key (usually 'value')
        // The first value in our values map is the raw reading
        const firstValueKey = Object.keys(values)[0];
        const rawValue = values[firstValueKey] ?? 0;

        console.log(`[PROTO] Pin ${pin} (${assignment.sensorId}) → {"ok":1,"${valuePath}":${rawValue}}`);
        return { ok: 1, [valuePath]: rawValue };
    }

    /**
     * Handle multi-pin commands (ULTRASONIC, UART_DISTANCE)
     * Uses first pin for assignment lookup
     */
    private handleMultiPinCommand(cmd: string, params: string[]): object {
        if (params.length < 2) {
            return { ok: 0, error: 'ERR_MISSING_PINS' };
        }

        // Use first pin (TRIG or RX) for lookup
        const primaryPin = params[0];
        const assignment = this.pinManager.getAssignment(primaryPin);

        if (!assignment) {
            console.log(`[PROTO] No sensor assigned to ${primaryPin}, returning error`);
            return { ok: 0, error: 'ERR_NO_SENSOR_ASSIGNED' };
        }

        // Get distance value from assignment
        const values = assignment.values;
        const distance = values['distance'] ?? values['value'] ?? 100;

        console.log(`[PROTO] Multi-pin ${primaryPin} (${assignment.sensorId}) → distance: ${distance}`);
        return { ok: 1, distance };
    }

    /**
     * Handle DHT_READ - returns both temp and humidity
     */
    private handleDhtRead(params: string[]): object {
        if (params.length < 1) {
            return { ok: 0, error: 'ERR_MISSING_PIN' };
        }

        const pin = params[0];
        const assignment = this.pinManager.getAssignment(pin);

        if (!assignment) {
            // Default values
            return { ok: 1, temp: 25.0, humidity: 50.0 };
        }

        const values = assignment.values;
        return {
            ok: 1,
            temp: values['temp'] ?? 25.0,
            humidity: values['humidity'] ?? 50.0
        };
    }

    private handleDigitalRead(params: string[]): object {
        if (params.length < 1) {
            return { ok: 0, error: 'ERR_MISSING_PIN' };
        }
        const pin = params[0];
        const value = this.deviceState.getRelayState(pin);
        return { ok: 1, value };
    }

    private handleI2cRead(params: string[]): object {
        if (params.length < 2) {
            return { ok: 0, error: 'ERR_MISSING_PARAMS' };
        }
        // Simulate I2C response
        const light = this.deviceState.getSensorValue('light');
        const highByte = Math.floor(light / 256);
        const lowByte = light % 256;
        return { ok: 1, data: [highByte, lowByte] };
    }

    private handleModbusRead(params: string[]): object {
        if (params.length < 1) {
            return { ok: 0, error: 'ERR_MISSING_PARAMS' };
        }
        try {
            const jsonParams = JSON.parse(params[0]);
            const len = jsonParams.len || 1;
            const txPin = jsonParams.txPin;
            const rxPin = jsonParams.rxPin;

            // Try to find assignment on TX or RX pin
            let assignment = this.pinManager.getAssignment(String(txPin));
            if (!assignment && rxPin !== undefined) {
                assignment = this.pinManager.getAssignment(String(rxPin));
            }

            const registers: number[] = [];

            if (assignment) {
                // Return the actual simulated value
                // We take the first value from the map (e.g. 'par': 123)
                const val = Number(Object.values(assignment.values)[0] ?? 0);

                // Fill registers with this value (simplification for single-value sensors)
                for (let i = 0; i < len; i++) {
                    registers.push(Math.round(val));
                }
                console.log(`[PROTO] Modbus Read (Pin ${txPin}/${rxPin}) -> ${val}`);
            } else {
                console.warn(`[PROTO] Modbus Read: No sensor on Pin ${txPin}/${rxPin}, returning 0`);
                for (let i = 0; i < len; i++) {
                    registers.push(0);
                }
            }

            return { ok: 1, registers };
        } catch (e) {
            console.error('[PROTO] Modbus Error:', e);
            return { ok: 0, error: 'ERR_INVALID_JSON' };
        }
    }

    // ============ Actuator Handlers ============

    private handleDigitalWrite(params: string[]): object {
        if (params.length < 2) {
            return { ok: 0, error: 'ERR_MISSING_PARAMS' };
        }
        const pin = params[0];
        const state = parseInt(params[1]) as 0 | 1;
        this.deviceState.setRelayState(pin, state);
        return { ok: 1 };
    }

    private handleRelaySet(params: string[]): object {
        if (params.length < 2) {
            return { ok: 0, error: 'ERR_MISSING_PARAMS' };
        }
        const pin = params[0];
        const state = parseInt(params[1]) as 0 | 1;
        this.deviceState.setRelayState(pin, state);
        console.log(`[RELAY] Pin ${pin} set to ${state === 1 ? 'ON' : 'OFF'}`);
        return { ok: 1 };
    }

    private handlePwmWrite(params: string[]): object {
        if (params.length < 2) {
            return { ok: 0, error: 'ERR_MISSING_PARAMS' };
        }
        const pin = params[0];
        const value = parseInt(params[1]);
        console.log(`[PWM] Pin ${pin} set to ${value}`);
        return { ok: 1 };
    }

    private handleServoWrite(params: string[]): object {
        if (params.length < 2) {
            return { ok: 0, error: 'ERR_MISSING_PARAMS' };
        }
        const pin = params[0];
        const angle = parseInt(params[1]);
        console.log(`[SERVO] Pin ${pin} set to ${angle}°`);
        return { ok: 1 };
    }
}
