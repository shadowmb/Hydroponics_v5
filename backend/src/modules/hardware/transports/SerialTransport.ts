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

            // Serialize Parameters based on Command Type
            // SENSORS (Single Pin)
            if (['ANALOG', 'DIGITAL_READ', 'DHT_READ', 'ONEWIRE_READ_TEMP'].includes(packet.cmd)) {
                const pinStr = this.formatPin(packet);
                if (pinStr) message += `|${pinStr}`;
            }
            // ACTUATORS (Pin + State/Value)
            else if (['RELAY_SET', 'DIGITAL_WRITE'].includes(packet.cmd)) {
                const pinStr = this.formatPin(packet);
                if (pinStr) message += `|${pinStr}`;
                if (packet.state !== undefined) message += `|${packet.state}`;
            }
            else if (packet.cmd === 'PWM_WRITE') {
                const pinStr = this.formatPin(packet);
                if (pinStr) message += `|${pinStr}`;
                if (packet.value !== undefined) message += `|${packet.value}`;
            }
            else if (packet.cmd === 'SERVO_WRITE') {
                const pinStr = this.formatPin(packet);
                if (pinStr) message += `|${pinStr}`;
                if (packet.angle !== undefined) message += `|${packet.angle}`;
            }
            // MODBUS RTU (Hybrid Format: CMD|RX|TX|JSON)
            else if (packet.cmd === 'MODBUS_RTU_READ') {
                let rxStr: string | undefined;
                let txStr: string | undefined;

                // 1. Try to get from 'pins' array (New Format)
                if (packet.pins && Array.isArray(packet.pins)) {
                    const rxPin = packet.pins.find((p: any) => p.role === 'RX');
                    const txPin = packet.pins.find((p: any) => p.role === 'TX');
                    if (rxPin) rxStr = `${rxPin.portId}_${rxPin.gpio}`;
                    if (txPin) txStr = `${txPin.portId}_${txPin.gpio}`;
                }

                // 2. Fallback to packet properties (Legacy/Direct)
                if (!rxStr && packet.rx !== undefined) rxStr = String(packet.rx);
                if (!txStr && packet.tx !== undefined) txStr = String(packet.tx);

                // 3. Ensure 'D' prefix for legacy digital pins if they are just numbers
                // (Only if we didn't get a Label_GPIO string)
                if (rxStr && !rxStr.includes('_') && /^\d+$/.test(rxStr)) rxStr = `D${rxStr}`;
                if (txStr && !txStr.includes('_') && /^\d+$/.test(txStr)) txStr = `D${txStr}`;

                if (!rxStr || !txStr) {
                    throw new Error('MODBUS_RTU_READ requires RX and TX pins');
                }

                message += `|${rxStr}|${txStr}`;

                // Add JSON params
                const jsonParams = {
                    addr: packet.addr,
                    func: packet.func,
                    reg: packet.reg,
                    count: packet.count
                };
                message += `|${JSON.stringify(jsonParams)}`;
            }
            // I2C READ (Format: I2C_READ|ADDR|COUNT)
            else if (packet.cmd === 'I2C_READ') {
                const addr = packet.addr !== undefined ? packet.addr : packet.address;
                const count = packet.count !== undefined ? packet.count : packet.bytes;

                if (addr === undefined || count === undefined) {
                    throw new Error('I2C_READ requires addr and count parameters');
                }
                message += `|${addr}|${count}`;
            }
        }

        // Add newline delimiter
        const data = message + '\n';
        logger.info({ packet, serialized: data.trim() }, '📤 [SerialTransport] Sending Raw String (DEBUG)');

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

    private formatPin(packet: HardwarePacket): string | undefined {
        if (packet.pins && Array.isArray(packet.pins) && packet.pins.length > 0) {
            const p = packet.pins.find((p: any) => p.role === 'default') || packet.pins[0];
            return `${p.portId}_${p.gpio}`;
        }
        if (packet.pin !== undefined) {
            return `${packet.pin}`;
        }
        return undefined;
    }
}
