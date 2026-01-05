/**
 * UdpProtocolHandler - Parses UDP commands and generates responses
 * 
 * Implements the same protocol as real firmware:
 * - Command format: CMD|PARAM1|PARAM2|...
 * - Response format: JSON { "ok": 1, "data": ... } or { "ok": 0, "error": "..." }
 */

import { DeviceState } from './DeviceState.js';

interface ControllerInfo {
    mac: string;
    model: string;
    firmwareVersion: string;
}

export class UdpProtocolHandler {
    private deviceState: DeviceState;
    private info: ControllerInfo;
    private capabilities: string[] = [
        'ANALOG', 'DIGITAL_READ', 'DIGITAL_WRITE', 'RELAY_SET',
        'PWM_WRITE', 'SERVO_WRITE', 'DHT_READ', 'ONEWIRE_READ_TEMP',
        'ULTRASONIC_TRIG_ECHO', 'I2C_READ', 'MODBUS_RTU_READ', 'UART_READ_DISTANCE'
    ];

    constructor(deviceState: DeviceState, info: ControllerInfo) {
        this.deviceState = deviceState;
        this.info = info;
    }

    /**
     * Main command handler
     * Returns null if command should be ignored (timeout simulation)
     */
    handleCommand(rawCommand: string): object | string | null {
        const command = rawCommand.trim();

        // Check if offline simulation is active
        if (this.deviceState.getIsOffline()) {
            console.log('[PROTO] Simulating offline - no response');
            return null;
        }

        // Parse command and parameters
        const parts = command.split('|');
        const cmd = parts[0];
        const params = parts.slice(1);

        // Check if command is blocked (timeout simulation)
        if (this.deviceState.isCommandBlocked(cmd)) {
            console.log(`[PROTO] Command ${cmd} blocked - simulating timeout`);
            return null;
        }

        // Check if should return invalid response
        if (this.deviceState.shouldReturnInvalid(cmd)) {
            console.log(`[PROTO] Command ${cmd} - simulating invalid response`);
            return 'INVALID_RESPONSE{{{broken_json';
        }

        // Route to handler
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
                    mem: 32768, // Simulated free memory
                    ver: this.info.firmwareVersion,
                    capabilities: this.capabilities
                };

            case 'RESET':
                console.log('[PROTO] Reset command received - simulating reset');
                return { ok: 1, msg: 'Resetting...' };

            case 'HYDROPONICS_DISCOVERY':
                return {
                    type: 'ANNOUNCE',
                    mac: this.info.mac,
                    ip: '127.0.0.1', // Local simulator
                    model: this.info.model,
                    firmware: this.info.firmwareVersion,
                    capabilities: this.capabilities
                };

            // ============ Sensor Commands ============
            case 'ANALOG':
                return this.handleAnalog(params);

            case 'DIGITAL_READ':
                return this.handleDigitalRead(params);

            case 'DHT_READ':
                return this.handleDhtRead(params);

            case 'ONEWIRE_READ_TEMP':
                return this.handleOneWireTemp(params);

            case 'ULTRASONIC_TRIG_ECHO':
                return this.handleUltrasonic(params);

            case 'UART_READ_DISTANCE':
                return this.handleUartDistance(params);

            case 'I2C_READ':
                return this.handleI2cRead(params);

            case 'MODBUS_RTU_READ':
                return this.handleModbusRead(params);

            // ============ Actuator Commands ============
            case 'DIGITAL_WRITE':
                return this.handleDigitalWrite(params);

            case 'RELAY_SET':
                return this.handleRelaySet(params);

            case 'PWM_WRITE':
                return this.handlePwmWrite(params);

            case 'SERVO_WRITE':
                return this.handleServoWrite(params);

            // ============ Unknown Command ============
            default:
                return { ok: 0, error: 'ERR_INVALID_COMMAND' };
        }
    }

    // ============ Sensor Handlers ============

    private handleAnalog(params: string[]): object {
        if (params.length < 1) {
            return { ok: 0, error: 'ERR_MISSING_PIN' };
        }
        const pin = params[0];
        const value = this.deviceState.getAnalogValue(pin);
        return { ok: 1, value };
    }

    private handleDigitalRead(params: string[]): object {
        if (params.length < 1) {
            return { ok: 0, error: 'ERR_MISSING_PIN' };
        }
        const pin = params[0];
        const value = this.deviceState.getRelayState(pin);
        return { ok: 1, value };
    }

    private handleDhtRead(params: string[]): object {
        const temp = this.deviceState.getSensorValue('temperature');
        const humidity = this.deviceState.getSensorValue('humidity');
        return { ok: 1, temp, humidity };
    }

    private handleOneWireTemp(params: string[]): object {
        const value = this.deviceState.getSensorValue('temperature');
        return { ok: 1, value };
    }

    private handleUltrasonic(params: string[]): object {
        // Returns distance in cm
        const waterLevel = this.deviceState.getSensorValue('waterLevel');
        // Simulate: 100cm tank, waterLevel is percentage
        const distance = 100 - waterLevel; // cm from sensor to water surface
        return { ok: 1, value: distance };
    }

    private handleUartDistance(params: string[]): object {
        const waterLevel = this.deviceState.getSensorValue('waterLevel');
        const distance = (100 - waterLevel) * 10; // mm
        return { ok: 1, value: distance };
    }

    private handleI2cRead(params: string[]): object {
        if (params.length < 2) {
            return { ok: 0, error: 'ERR_MISSING_PARAMS' };
        }
        // Simulate I2C response (e.g., light sensor BH1750)
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
            // Return simulated register values
            const registers: number[] = [];
            for (let i = 0; i < len; i++) {
                registers.push(Math.floor(Math.random() * 65535));
            }
            return { ok: 1, registers };
        } catch (e) {
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
