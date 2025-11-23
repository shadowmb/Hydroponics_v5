import { events } from '../../core/EventBusService';
import { logger } from '../../core/LoggerService';
import { IHardwareTransport, HardwarePacket, HardwareResponse } from './interfaces';
import { v4 as uuidv4 } from 'uuid';
import { templates } from './DeviceTemplateManager';
import { deviceRepository } from '../persistence/repositories/DeviceRepository';
// Actually Device is defined in HardwareService.ts usually or interfaces? 
// Wait, Device interface was defined in HardwareService.ts in previous versions?
// No, it was likely inline or in interfaces.ts.
// Let's check interfaces.ts again. It wasn't there.
// It was in HardwareService.ts?
// I need to check where Device interface is.
// In the "Integrate with Services" step I used:
// const device: Device = { ... }
// I need to make sure Device interface is available.
// It was likely defined in HardwareService.ts or I need to define it.
// I will add it to interfaces.ts or define it here.
// Let's define it here for now to match the previous code I wrote in "Integrate with Services".
export interface Device {
    id: string;
    name: string;
    type: string;
    driverId: string;
    pin?: number;
    config: Record<string, any>;
    state: Record<string, any>;
    lastSeen: Date;
}
export class HardwareService {
    private static instance: HardwareService;
    private transport: IHardwareTransport | null = null;

    // In-Memory State
    public devices = new Map<string, Device>(); // Exposed for debugging/API
    private pendingRequests = new Map<string, {
        resolve: (val: any) => void;
        reject: (err: Error) => void;
        timeout: NodeJS.Timeout
    }>();

    // Queue for FIFO execution per device (or global if single serial port)
    // Since we have one serial port for the MCU, we need a global queue to prevent interleaving
    private commandQueue: Array<() => Promise<void>> = [];
    private isProcessingQueue = false;

    private constructor() {
        // Private constructor for Singleton
    }

    public static getInstance(): HardwareService {
        if (!HardwareService.instance) {
            HardwareService.instance = new HardwareService();
        }
        return HardwareService.instance;
    }

    /**
     * Initialize the service with a specific transport.
     * @param transport Serial or Mock transport
     */
    public async initialize(transport: IHardwareTransport): Promise<void> {
        this.transport = transport;

        // Setup Event Handlers
        this.transport.onMessage(this.handleMessage.bind(this));
        this.transport.onError(this.handleError.bind(this));
        this.transport.onClose(this.handleClose.bind(this));

        logger.info('🔌 HardwareService Initialized');

        // 1. Load Templates
        templates.loadTemplates();

        // 2. Load Devices from DB
        try {
            const devices = await deviceRepository.findAll();
            logger.info({ count: devices.length }, '📦 Loaded devices from DB');

            for (const devConfig of devices) {
                try {
                    // Validate against template
                    const driverId = devConfig.config?.driverId;
                    if (!driverId) {
                        logger.warn({ deviceId: devConfig.id }, '⚠️ Device missing driverId');
                        continue;
                    }

                    const template = templates.getTemplate(driverId);
                    if (!template) {
                        logger.warn({ deviceId: devConfig.id, driverId }, '⚠️ Driver not found for device');
                        continue;
                    }

                    // Create Runtime Device Object
                    // Note: State is runtime only, initialized from template
                    const device: Device = {
                        id: devConfig.id,
                        name: devConfig.name,
                        type: devConfig.type,
                        driverId: driverId,
                        pin: devConfig.hardware?.pin,
                        config: devConfig.config,
                        state: { ...template.initialState }, // Runtime state
                        lastSeen: new Date()
                    };

                    // We need to store this device somewhere. 
                    // The previous HardwareService implementation didn't have a 'devices' map exposed or used in the snippet I saw.
                    // Let's check if there is a 'devices' map in HardwareService.
                    // The snippet I restored didn't show a 'devices' map property!
                    // I need to add 'devices' property to HardwareService class.
                    this.devices.set(device.id, device);
                    events.emit('device:connected', { deviceId: device.id });
                } catch (err) {
                    logger.error({ err, deviceId: devConfig.id }, '❌ Failed to load device');
                }
            }
        } catch (err) {
            logger.error({ err }, '❌ Failed to query devices from DB');
        }
    }

    /**
     * Connect to the hardware.
     */
    public async connect(path: string): Promise<void> {
        if (!this.transport) throw new Error('Transport not initialized');

        try {
            await this.transport.connect(path);
            events.emit('device:connected', { deviceId: 'main-controller' }); // TODO: Use real ID
            logger.info({ path }, '✅ Hardware Connected');
        } catch (error: any) {
            logger.error({ error, path }, '❌ Connection Failed');
            throw error;
        }
    }

    /**
     * Send a command to a device.
     * @param deviceId The ID of the device (e.g., 'pump_1')
     * @param driverId The ID of the driver template (e.g., 'relay_active_low')
     * @param command The command name (e.g., 'ON')
     * @param params Command parameters (e.g., { duration: 500 })
     * @param context Hardware context (pin, address)
     */
    /**
     * Send a command to a device.
     * @param deviceId The ID of the device (e.g., 'pump_1')
     * @param driverId The ID of the driver template (e.g., 'relay_active_low')
     * @param command The command name (e.g., 'ON')
     * @param params Command parameters (e.g., { duration: 500 })
     * @param context Hardware context (pin, address)
     */
    public async sendCommand(
        deviceId: string,
        driverId: string,
        command: string,
        params: Record<string, any> = {},
        context: { pin?: number; address?: string } = {}
    ): Promise<any> {
        if (!this.transport) throw new Error('Transport not initialized');

        // 1. Get Driver & Create Packet
        const driver = templates.getDriver(driverId);
        const packetData = driver.createPacket(command, params, context);

        const packet: HardwarePacket = {
            id: uuidv4(),
            cmd: packetData.cmd,
            ...packetData
        };

        // 2. Enqueue Execution (FIFO)
        return new Promise((resolve, reject) => {
            this.commandQueue.push(async () => {
                try {
                    const result = await this.executePacket(packet);
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            });

            this.processQueue();
        });
    }

    private async processQueue() {
        if (this.isProcessingQueue) return;
        this.isProcessingQueue = true;

        while (this.commandQueue.length > 0) {
            const task = this.commandQueue.shift();
            if (task) {
                try {
                    await task();
                } catch (error) {
                    logger.error({ error }, '❌ Queue Task Failed');
                }
            }
        }

        this.isProcessingQueue = false;
    }

    private async executePacket(packet: HardwarePacket): Promise<any> {
        return new Promise((resolve, reject) => {
            // 1. Set Timeout
            const timeout = setTimeout(() => {
                if (this.pendingRequests.has(packet.id)) {
                    this.pendingRequests.delete(packet.id);
                    events.emit('error:critical', { source: 'HardwareService', message: 'Command Timeout', error: new Error('Command Timeout') });
                    reject(new Error('Command Timeout'));
                }
            }, 2000); // 2s Timeout

            // 2. Register Pending Request
            this.pendingRequests.set(packet.id, { resolve, reject, timeout });

            // 3. Send
            this.transport!.send(packet).catch(err => {
                clearTimeout(timeout);
                this.pendingRequests.delete(packet.id);
                reject(err);
            });
        });
    }

    /**
     * Handle incoming messages from the transport.
     */
    private handleMessage(msg: HardwareResponse | any): void {
        // 1. System Messages (Async)
        if (msg.type === 'log') {
            logger.debug({ hwLog: msg }, 'MCU Log');
            return;
        }

        // 2. Response Correlation
        if (msg.id && this.pendingRequests.has(msg.id)) {
            const req = this.pendingRequests.get(msg.id)!;
            clearTimeout(req.timeout);
            this.pendingRequests.delete(msg.id);

            if (msg.status === 'ok') {
                req.resolve(msg.data);
            } else {
                req.reject(new Error(msg.error || 'Unknown Hardware Error'));
            }
            return;
        }

        // 3. Sensor Data (Unsolicited)
        // TODO: Parse sensor data and emit 'sensor:data'
        logger.warn({ msg }, '⚠️ Unhandled Message');
    }

    private handleError(err: Error): void {
        logger.error({ err }, '🔥 Transport Error');
        events.emit('error:critical', { source: 'HardwareService', message: err.message, error: err });
    }

    private handleClose(): void {
        logger.warn('🔌 Transport Closed');
        events.emit('device:disconnected', { deviceId: 'main-controller' });
    }
}

export const hardware = HardwareService.getInstance();
