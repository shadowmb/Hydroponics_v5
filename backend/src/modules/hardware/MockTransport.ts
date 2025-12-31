import { IHardwareTransport, HardwarePacket, HardwareResponse } from './interfaces';
import { logger } from '../../core/LoggerService';

/**
 * MockTransport
 * Simulates a Serial connection for testing purposes.
 * Echoes commands back as "ok" and simulates random sensor data.
 */
export class MockTransport implements IHardwareTransport {
    private connected = false;
    private messageHandler: ((msg: HardwareResponse | any) => void) | null = null;
    private errorHandler: ((err: Error) => void) | null = null;
    private closeHandler: (() => void) | null = null;
    private simulationInterval: NodeJS.Timeout | null = null;

    public async connect(path: string): Promise<void> {
        logger.info({ path }, '🔌 [Mock] Connecting...');
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
        this.connected = true;
        this.startSimulation();
        logger.info('✅ [Mock] Connected');
    }

    public async disconnect(): Promise<void> {
        this.connected = false;
        if (this.simulationInterval) clearInterval(this.simulationInterval);
        if (this.closeHandler) this.closeHandler();
        logger.info('🔌 [Mock] Disconnected');
    }

    public async send(packet: HardwarePacket): Promise<string> {
        if (!this.connected) throw new Error('Not connected');

        logger.debug({ packet }, '📤 [Mock] Sending Packet');

        // Simulate Response Delay
        setTimeout(() => {
            const response: HardwareResponse = {
                id: packet.id,
                status: 'ok',
                data: { simulated: true, echo: packet.cmd }
            };

            // Simulate "Error" for specific command
            if (packet.cmd === 'FAIL_ME') {
                response.status = 'error';
                response.error = 'Simulated Failure';
            }

            if (this.messageHandler) this.messageHandler(response);
        }, 100);

        return 'ok';
    }

    public onMessage(handler: (msg: HardwareResponse | any) => void): void {
        this.messageHandler = handler;
    }

    public onError(handler: (err: Error) => void): void {
        this.errorHandler = handler;
    }

    public onClose(handler: () => void): void {
        this.closeHandler = handler;
    }

    public isConnected(): boolean {
        return this.connected;
    }

    private startSimulation() {
        // Simulate random sensor data every 5 seconds
        this.simulationInterval = setInterval(() => {
            if (!this.connected) return;

            const sensorMsg = {
                type: 'sensor',
                deviceId: 'temp_sensor_1',
                value: 20 + Math.random() * 5
            };

            // if (this.messageHandler) this.messageHandler(sensorMsg); // Uncomment to spam logs
        }, 5000);
    }
}
