import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../core/LoggerService';
import { IHardwareTransport, HardwarePacket, HardwareResponse } from './interfaces';
import { SerialTransport } from './transports/SerialTransport';
import { UdpTransport } from './transports/UdpTransport';
import { Controller } from '../../models/Controller';

export class HardwareTransportManager {
    private static instance: HardwareTransportManager;
    private transports: Map<string, IHardwareTransport> = new Map();
    private commandQueues: Map<string, (() => Promise<void>)[]> = new Map();
    private isProcessingQueue: Map<string, boolean> = new Map();
    private activeCommands: Map<string, string> = new Map(); // controllerId -> requestId
    private pendingRequests: Map<string, { resolve: Function, reject: Function, timeout: NodeJS.Timeout }> = new Map();

    private constructor() { }

    public static getInstance(): HardwareTransportManager {
        if (!HardwareTransportManager.instance) {
            HardwareTransportManager.instance = new HardwareTransportManager();
        }
        return HardwareTransportManager.instance;
    }

    public async enqueueCommand(controllerId: string, packet: HardwarePacket): Promise<any> {
        return new Promise((resolve, reject) => {
            if (!this.commandQueues.has(controllerId)) {
                this.commandQueues.set(controllerId, []);
            }
            const queue = this.commandQueues.get(controllerId)!;

            queue.push(async () => {
                try {
                    const transport = await this.getOrConnectTransport(controllerId);
                    const result = await this.executePacket(controllerId, transport, packet);
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            });

            this.processQueue(controllerId);
        });
    }

    private async processQueue(controllerId: string) {
        if (this.isProcessingQueue.get(controllerId)) return;
        this.isProcessingQueue.set(controllerId, true);

        const queue = this.commandQueues.get(controllerId);
        try {
            while (queue && queue.length > 0) {
                const command = queue.shift();
                if (command) await command();
            }
        } finally {
            this.isProcessingQueue.set(controllerId, false);
        }
    }

    public async getOrConnectTransport(controllerId: string): Promise<IHardwareTransport> {
        if (this.transports.has(controllerId)) {
            return this.transports.get(controllerId)!;
        }

        const controller = await Controller.findById(controllerId);
        if (!controller) throw new Error(`Controller ${controllerId} not found`);

        let transport: IHardwareTransport;

        if (controller.connection?.type === 'network') {
            transport = new UdpTransport();
        } else {
            transport = new SerialTransport();
        }

        transport.onMessage((msg) => this.handleMessage(controllerId, msg));
        transport.onError((err) => logger.error({ controllerId, err }, '🔥 Transport Error'));
        transport.onClose(() => {
            logger.warn({ controllerId }, '🔌 Transport Closed');
            this.transports.delete(controllerId);
        });

        if (controller.connection?.type === 'network') {
            await transport.connect(controller.connection.ip || 'localhost', { port: controller.connection.port || 8888 });
        } else {
            await transport.connect(controller.connection?.serialPort || 'COM3', { baudRate: controller.connection?.baudRate || 9600 });
        }
        this.transports.set(controllerId, transport);
        return transport;
    }

    private async executePacket(controllerId: string, transport: IHardwareTransport, packet: HardwarePacket): Promise<any> {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.pendingRequests.delete(packet.id);
                this.activeCommands.delete(controllerId);
                reject(new Error(`Command ${packet.cmd} (ID:${packet.id}) timed out after 5s`));
            }, 5000);

            this.pendingRequests.set(packet.id, { resolve, reject, timeout });
            this.activeCommands.set(controllerId, packet.id);

            transport.send(packet).catch(err => {
                clearTimeout(timeout);
                this.pendingRequests.delete(packet.id);
                this.activeCommands.delete(controllerId);
                reject(err);
            });
        });
    }

    private handleMessage(controllerId: string, msg: HardwareResponse | any): void {
        if (msg.type === 'log') {
            logger.debug({ controllerId, log: msg.message }, 'MCU Log');
            return;
        }

        let requestId = msg.id;
        if (!requestId) {
            requestId = this.activeCommands.get(controllerId);
        }

        if (requestId && this.pendingRequests.has(requestId)) {
            const req = this.pendingRequests.get(requestId)!;
            clearTimeout(req.timeout);
            this.pendingRequests.delete(requestId);
            this.activeCommands.delete(controllerId);

            if (msg.status === 'ok' || msg.success === true || msg.ok === 1) {
                req.resolve(msg.data || msg);
            } else {
                req.reject(new Error(msg.error || 'Unknown Hardware Error'));
            }
        }
    }

    public async disconnectController(controllerId: string): Promise<void> {
        const transport = this.transports.get(controllerId);
        if (transport) {
            await transport.disconnect();
            this.transports.delete(controllerId);
        }
    }

    public isConnected(controllerId: string): boolean {
        return this.transports.has(controllerId);
    }
}

export const transportManager = HardwareTransportManager.getInstance();
