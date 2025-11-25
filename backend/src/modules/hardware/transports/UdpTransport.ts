import { IHardwareTransport, HardwarePacket, HardwareResponse } from '../interfaces';
import { createSocket, Socket } from 'dgram';
import { logger } from '../../../core/LoggerService';

export class UdpTransport implements IHardwareTransport {
    private socket: Socket | null = null;
    private targetIp: string = '';
    private targetPort: number = 8888;
    private _isConnected: boolean = false;

    private messageHandler: ((msg: HardwareResponse | any) => void) | null = null;
    private errorHandler: ((err: Error) => void) | null = null;
    private closeHandler: (() => void) | null = null;

    async connect(path: string, options?: any): Promise<void> {
        // path is expected to be "udp://IP:PORT" or just "IP"
        // But for simplicity in HardwareService we might just pass the IP

        // Parse IP and Port
        let ip = path;
        let port = 8888;

        if (path.startsWith('udp://')) {
            const parts = path.replace('udp://', '').split(':');
            ip = parts[0];
            if (parts[1]) port = parseInt(parts[1]);
        } else if (path.includes(':')) {
            const parts = path.split(':');
            ip = parts[0];
            if (parts[1]) port = parseInt(parts[1]);
        }

        this.targetIp = ip;
        this.targetPort = port;

        logger.info({ ip, port }, '🔌 [UdpTransport] Initializing...');

        return new Promise((resolve, reject) => {
            try {
                this.socket = createSocket('udp4');

                this.socket.on('error', (err) => {
                    logger.error({ err }, '🔥 [UdpTransport] Socket Error');
                    if (this.errorHandler) this.errorHandler(err);
                });

                this.socket.on('message', (msg, rinfo) => {
                    const raw = msg.toString();
                    logger.debug({ raw, from: rinfo.address }, '📥 [UdpTransport] Received');
                    this.handleData(raw);
                });

                this.socket.on('listening', () => {
                    const address = this.socket?.address();
                    logger.info({ address }, '✅ [UdpTransport] Listening');
                });

                // UDP is connectionless, so we just bind to a random port to listen for responses
                this.socket.bind(0, () => {
                    this._isConnected = true;
                    resolve();
                });

            } catch (err: any) {
                reject(err);
            }
        });
    }

    async disconnect(): Promise<void> {
        if (this.socket) {
            this.socket.close();
            this._isConnected = false;
            if (this.closeHandler) this.closeHandler();
        }
    }

    async send(packet: HardwarePacket): Promise<void> {
        if (!this.socket) throw new Error('UDP Socket not initialized');

        // Convert Packet to Delimited String: CMD|PARAM1|PARAM2...
        // For PING: "PING"
        // For others: We need a way to convert JSON packet to string.
        // For now, let's assume the 'cmd' property is the command, and we handle specific cases.

        let message = '';

        if (packet.cmd === 'PING') {
            message = 'PING';
        } else if (packet.cmd === 'STATUS') {
            message = 'STATUS';
        } else {
            // Fallback or specific command logic
            // If the packet has a raw string representation, use it.
            // Otherwise, construct it.
            message = packet.cmd;
            // TODO: Add parameters if needed
        }

        logger.debug({ ip: this.targetIp, port: this.targetPort, message }, '📤 [UdpTransport] Sending');

        return new Promise((resolve, reject) => {
            this.socket?.send(message, this.targetPort, this.targetIp, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    private handleData(raw: string): void {
        try {
            const trimmed = raw.trim();
            if (!trimmed) return;

            // Firmware returns JSON
            try {
                const msg = JSON.parse(trimmed);
                if (this.messageHandler) {
                    this.messageHandler(msg);
                }
            } catch (e) {
                logger.warn({ raw: trimmed }, '⚠️ [UdpTransport] Non-JSON Response');
            }
        } catch (error) {
            logger.error({ error }, '❌ [UdpTransport] Parse Error');
        }
    }

    onMessage(handler: (msg: HardwareResponse | any) => void): void {
        this.messageHandler = handler;
    }

    onError(handler: (err: Error) => void): void {
        this.errorHandler = handler;
    }

    onClose(handler: () => void): void {
        this.closeHandler = handler;
    }

    isConnected(): boolean {
        return this._isConnected;
    }
}
