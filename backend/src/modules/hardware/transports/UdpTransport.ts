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

    async send(packet: HardwarePacket): Promise<string> {
        if (!this.socket) throw new Error('UDP Socket not initialized');

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
            // MODBUS RTU (JSON Format: CMD|JSON)
            else if (packet.cmd === 'MODBUS_RTU_READ') {
                // Construct parameters matching firmware generic implementation
                const jsonParams: any = {
                    slaveId: packet.slaveId ?? packet.addr ?? 1,
                    funcCode: packet.funcCode ?? packet.func ?? 3,
                    startAddr: packet.startAddr ?? packet.reg ?? 0,
                    len: packet.len ?? packet.count ?? 1,
                    baudRate: packet.baudRate ?? 9600
                };

                // Add pins if available (Firmware handles 'pins' array or rxPin/txPin)
                if (packet.pins && Array.isArray(packet.pins)) {
                    jsonParams.pins = packet.pins;
                } else if (packet.rxPin !== undefined && packet.txPin !== undefined) {
                    jsonParams.rxPin = packet.rxPin;
                    jsonParams.txPin = packet.txPin;
                } else if (packet.rx !== undefined && packet.tx !== undefined) {
                    // Fallback for legacy
                    jsonParams.rxPin = packet.rx;
                    jsonParams.txPin = packet.tx;
                }

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
            // UART SENSORS (Format: UART_READ_DISTANCE|RX|TX)
            else if (packet.cmd === 'UART_READ_DISTANCE') {
                let rxStr: string | undefined;
                let txStr: string | undefined;

                if (packet.pins && Array.isArray(packet.pins)) {
                    const rxPin = packet.pins.find((p: any) => p.role === 'RX');
                    const txPin = packet.pins.find((p: any) => p.role === 'TX');
                    if (rxPin) rxStr = `${rxPin.portId}_${rxPin.gpio}`;
                    if (txPin) txStr = `${txPin.portId}_${txPin.gpio}`;
                }

                if (!rxStr || !txStr) {
                    throw new Error('UART_READ_DISTANCE requires RX and TX pins');
                }

                message += `|${rxStr}|${txStr}`;
            }
            // ULTRASONIC (Format: ULTRASONIC_TRIG_ECHO|TRIG|ECHO)
            else if (packet.cmd === 'ULTRASONIC_TRIG_ECHO') {
                let trigStr: string | undefined;
                let echoStr: string | undefined;

                if (packet.pins && Array.isArray(packet.pins)) {
                    const trigPin = packet.pins.find((p: any) => p.role === 'TRIG');
                    const echoPin = packet.pins.find((p: any) => p.role === 'ECHO');
                    if (trigPin) trigStr = `${trigPin.portId}_${trigPin.gpio}`;
                    if (echoPin) echoStr = `${echoPin.portId}_${echoPin.gpio}`;
                }

                if (!trigStr || !echoStr) {
                    throw new Error('ULTRASONIC_TRIG_ECHO requires TRIG and ECHO pins');
                }

                message += `|${trigStr}|${echoStr}`;
            }
        }

        logger.debug({ ip: this.targetIp, port: this.targetPort, message }, '📤 [UdpTransport] Sending');

        return new Promise((resolve, reject) => {
            this.socket?.send(message, this.targetPort, this.targetIp, (err) => {
                if (err) reject(err);
                else resolve(message);
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
