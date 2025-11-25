import { IHardwareTransport, HardwarePacket, HardwareResponse } from '../interfaces';
import { ReadlineParser } from '@serialport/parser-readline';
import { logger } from '../../../core/LoggerService';

export class SerialTransport implements IHardwareTransport {
    private port: any | null = null; // SerialPort instance
    private parser: any | null = null;
    private path: string = '';
    private _isConnected: boolean = false;

    private messageHandler: ((msg: HardwareResponse | any) => void) | null = null;
    private errorHandler: ((err: Error) => void) | null = null;
    private closeHandler: (() => void) | null = null;

    async connect(path: string, options?: any): Promise<void> {
        this.path = path;
        const baudRate = options?.baudRate || 9600;
        logger.info({ path, baudRate }, '🔌 [SerialTransport] Connecting...');

        try {
            // Dynamic import for robustness
            const { SerialPort } = await import('serialport');

            return new Promise((resolve, reject) => {
                this.port = new SerialPort({
                    path: this.path,
                    baudRate: baudRate,
                    autoOpen: false
                });


                this.port.open((err: Error | null) => {
                    if (err) {
                        logger.error({ err, path }, '❌ [SerialTransport] Failed to open port');
                        reject(err);
                        return;
                    }

                    logger.info({ path }, '✅ [SerialTransport] Port Opened');
                    this._isConnected = true;

                    // Setup Parser
                    this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\n' }));


                    this.parser.on('data', (data: string) => {
                        logger.debug({ data }, '📥 [SerialTransport] Raw Data Received');
                        this.handleData(data);
                    });

                    this.port.on('error', (err: Error) => {
                        logger.error({ err }, '🔥 [SerialTransport] Port Error');
                        if (this.errorHandler) this.errorHandler(err);
                    });

                    this.port.on('close', () => {
                        logger.warn({ path }, '🔌 [SerialTransport] Port Closed');
                        this._isConnected = false;
                        if (this.closeHandler) this.closeHandler();
                    });

                    // Wait for Arduino Reset/Startup (optional, but good practice)
                    setTimeout(() => {
                        resolve();
                    }, 2000);
                });
            });
        } catch (error: any) {
            logger.error({ error }, '❌ [SerialTransport] Connection Exception');
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        if (this.port && this.port.isOpen) {
            return new Promise((resolve, reject) => {
                this.port.close((err: Error | null) => {
                    if (err) reject(err);
                    else {
                        this._isConnected = false;
                        resolve();
                    }
                });
            });
        }
    }

    async send(packet: HardwarePacket): Promise<void> {
        if (!this.port || !this._isConnected) {
            throw new Error('Serial port not connected');
        }

        // Convert Packet to Delimited String: CMD|PARAM1|PARAM2...
        let message = '';
        if (packet.cmd === 'PING') {
            message = 'PING';
        } else if (packet.cmd === 'STATUS') {
            message = 'STATUS';
        } else {
            message = packet.cmd;
        }

        // Add newline delimiter
        const data = message + '\n';
        logger.debug({ data: data.trim() }, '📤 [SerialTransport] Sending Raw String');

        return new Promise((resolve, reject) => {
            this.port.write(data, (err: Error | null) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    private handleData(raw: string): void {
        try {
            const trimmed = raw.trim();
            if (!trimmed) return;

            // Try parsing JSON
            try {
                const msg = JSON.parse(trimmed);
                if (this.messageHandler) {
                    this.messageHandler(msg);
                }
            } catch (e) {
                // If not JSON, log as debug info or handle as raw text
                logger.debug({ raw: trimmed }, '📝 [SerialTransport] Raw Data');
                // Optional: Emit as log message
                if (this.messageHandler) {
                    this.messageHandler({ type: 'log', message: trimmed });
                }
            }
        } catch (error) {
            logger.error({ error }, '❌ [SerialTransport] Parse Error');
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
