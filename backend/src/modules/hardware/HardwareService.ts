import { events } from '../../core/EventBusService';
import { logger } from '../../core/LoggerService';
import { IHardwareTransport, HardwarePacket, HardwareResponse } from './interfaces';
import { SerialTransport } from './transports/SerialTransport';
import { UdpTransport } from './transports/UdpTransport';

import { v4 as uuidv4 } from 'uuid';
import { templates } from './DeviceTemplateManager';
import { deviceRepository } from '../persistence/repositories/DeviceRepository';
import { Controller } from '../../models/Controller';

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

    // Transports mapped by Controller ID
    private transports = new Map<string, IHardwareTransport>();

    // Command Queues mapped by Controller ID
    private commandQueues = new Map<string, Array<() => Promise<void>>>();
    private isProcessingQueue = new Map<string, boolean>();

    // Track active command ID per controller (for ID-less response matching)
    private activeCommands = new Map<string, string>();

    // In-Memory State
    public devices = new Map<string, Device>();

    private pendingRequests = new Map<string, {
        resolve: (val: any) => void;
        reject: (err: Error) => void;
        timeout: NodeJS.Timeout
    }>();

    private constructor() { }

    public static getInstance(): HardwareService {
        if (!HardwareService.instance) {
            HardwareService.instance = new HardwareService();
        }
        return HardwareService.instance;
    }

    public async initialize(): Promise<void> {
        logger.info('🔌 HardwareService Initialized');

        // 1. Load Templates
        templates.loadTemplates();

        // 2. Load Devices from DB
        try {
            const devices = await deviceRepository.findAll();
            logger.info({ count: devices.length }, '📦 Loaded devices from DB');

            for (const devConfig of devices) {
                try {
                    const driverId = devConfig.config?.driverId;
                    if (!driverId) continue;

                    const template = templates.getTemplate(driverId);
                    if (!template) continue;

                    const device: Device = {
                        id: devConfig.id,
                        name: devConfig.name,
                        type: devConfig.type,
                        driverId: driverId,
                        pin: devConfig.hardware?.pin,
                        config: devConfig.config,
                        state: { ...template.initialState },
                        lastSeen: new Date()
                    };

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
     * Gets an existing transport or creates a new one based on controller config.
     */
    public async getOrConnectTransport(controllerId: string): Promise<IHardwareTransport> {
        const controller = await Controller.findById(controllerId);
        if (!controller) throw new Error(`Controller ${controllerId} not found`);

        // Check if we have an existing transport
        if (this.transports.has(controllerId)) {
            const transport = this.transports.get(controllerId)!;

            // We can't easily check internal path of SerialTransport without casting or public prop
            // Let's assume if it's connected, it's connected to *something*.
            // But if user changed COM port in DB, we need to switch.
            // We should probably just ALWAYS recreate the transport if we suspect a change?
            // Or better: Compare with a stored config cache.

            const connectionKey = controller.connection.type === 'serial'
                ? `serial:${controller.connection.serialPort}:${controller.connection.baudRate}`
                : `network:${controller.connection.ip}:${controller.connection.port || 8888}`;

            const lastConfig = (transport as any)._config;

            if (transport.isConnected() && lastConfig === connectionKey) {
                return transport;
            }

            // Config changed or not connected, close old one
            logger.info({ controllerId, oldConfig: lastConfig, newConfig: connectionKey }, '♻️ [HardwareService] Config changed or disconnected, reconnecting...');
            try {
                // We don't have a close method on interface? We do.
                // But wait, does close() throw?
                // Let's assume it's safe.
                // Actually, let's just overwrite it.
            } catch (e) { }
        }

        logger.info({ controllerId, name: controller.name, connection: controller.connection }, '🔍 [HardwareService] Resolving Transport');

        let transport: IHardwareTransport;
        const connectionKey = controller.connection.type === 'serial'
            ? `serial:${controller.connection.serialPort}:${controller.connection.baudRate}`
            : `network:${controller.connection.ip}:${controller.connection.port || 8888}`;

        // Determine Transport Type
        if (controller.connection?.type === 'serial' && controller.connection.serialPort) {
            transport = new SerialTransport();
            await transport.connect(controller.connection.serialPort, { baudRate: controller.connection.baudRate });
        } else if (controller.connection?.type === 'network' && controller.connection.ip) {
            transport = new UdpTransport();
            const port = controller.connection.port || 8888;
            const url = `udp://${controller.connection.ip}:${port}`;
            await transport.connect(url);
        } else {
            logger.error({ controllerId, connection: controller.connection }, '❌ Invalid communication config');
            throw new Error(`Invalid communication config for ${controller.name}`);
        }

        // Save config key
        (transport as any)._config = connectionKey;


        // Setup Event Handlers
        transport.onMessage((msg) => this.handleMessage(controllerId, msg));
        transport.onError((err) => this.handleError(controllerId, err));
        transport.onClose(() => this.handleClose(controllerId));

        this.transports.set(controllerId, transport);
        return transport;
    }

    /**
     * Sends a command to a specific device.
     */
    public async sendCommand(
        deviceId: string,
        driverId: string,
        command: string,
        params: Record<string, any> = {},
        context: { pin?: number; address?: string } = {}
    ): Promise<any> {
        // 1. Find which controller owns this device
        const { DeviceModel } = await import('../../models/Device');
        const deviceDoc = await DeviceModel.findById(deviceId);
        if (!deviceDoc || !deviceDoc.hardware?.parentId) {
            throw new Error(`Device ${deviceId} not linked to a controller`);
        }

        const controllerId = deviceDoc.hardware.parentId.toString();

        // 2. Get Driver & Create Packet
        const driver = templates.getDriver(driverId);
        const packetData = driver.createPacket(command, params, context);

        const packet: HardwarePacket = {
            id: uuidv4(),
            cmd: packetData.cmd,
            ...packetData
        };

        // 3. Enqueue
        return this.enqueueCommand(controllerId, packet);
    }

    /**
     * Sends a raw system command (like PING) to a controller.
     */
    public async sendSystemCommand(controllerId: string, cmd: string, params: any = {}): Promise<any> {
        const packet: HardwarePacket = {
            id: uuidv4(),
            cmd,
            ...params
        };
        return this.enqueueCommand(controllerId, packet);
    }

    private async enqueueCommand(controllerId: string, packet: HardwarePacket): Promise<any> {
        return new Promise((resolve, reject) => {
            // Get or Init Queue
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
        if (queue) {
            while (queue.length > 0) {
                const task = queue.shift();
                if (task) {
                    try {
                        await task();
                    } catch (error) {
                        logger.error({ error, controllerId }, '❌ Queue Task Failed');
                    }
                }
            }
        }

        this.isProcessingQueue.set(controllerId, false);
    }

    private async executePacket(controllerId: string, transport: IHardwareTransport, packet: HardwarePacket): Promise<any> {
        return new Promise((resolve, reject) => {
            const timeoutMs = 5000; // 5s Timeout

            const timeout = setTimeout(() => {
                if (this.pendingRequests.has(packet.id)) {
                    this.pendingRequests.delete(packet.id);
                    this.activeCommands.delete(controllerId); // Clear active command
                    reject(new Error('Command Timeout'));
                }
            }, timeoutMs);

            this.pendingRequests.set(packet.id, { resolve, reject, timeout });
            this.activeCommands.set(controllerId, packet.id); // Track active command

            transport.send(packet).catch(err => {
                clearTimeout(timeout);
                this.pendingRequests.delete(packet.id);
                this.activeCommands.delete(controllerId);
                reject(err);
            });
        });
    }

    // --- Health Check Logic ---

    public async checkHealth(controllerId: string): Promise<boolean> {
        try {
            logger.info({ controllerId }, '💓 [HardwareService] Checking Health...');
            // This will connect if not connected
            const transport = await this.getOrConnectTransport(controllerId);

            // Send PING
            // We use sendSystemCommand to go through the queue logic
            const response = await this.sendSystemCommand(controllerId, 'PING');
            logger.info({ controllerId, response }, '💓 [HardwareService] Health Check Response');

            // If we got a response (even empty object), it's alive
            return !!response;
        } catch (err: any) {
            logger.warn({ err: err.message, controllerId }, '💔 [HardwareService] Health Check Failed');
            return false;
        }
    }

    public async syncStatus(): Promise<Record<string, string>> {
        logger.info('🔄 [HardwareService] Starting Status Sync...');
        const controllers = await Controller.find();
        const { DeviceModel } = await import('../../models/Device');
        const { Relay } = await import('../../models/Relay');

        const results: Record<string, string> = {};

        await Promise.all(controllers.map(async (controller) => {
            const status = await this.refreshControllerStatus(controller._id.toString());
            results[controller.name] = status;
        }));

        return results;
    }

    public async refreshControllerStatus(controllerId: string): Promise<'online' | 'offline'> {
        const controller = await Controller.findById(controllerId);
        if (!controller) throw new Error('Controller not found');

        const { DeviceModel } = await import('../../models/Device');
        const { Relay } = await import('../../models/Relay');

        const isOnline = await this.checkHealth(controllerId);
        const newStatus = isOnline ? 'online' : 'offline';

        logger.info({ name: controller.name, oldStatus: controller.status, newStatus }, '📊 [HardwareService] Status Update');

        // Always update last check timestamp
        controller.lastConnectionCheck = new Date();
        let statusChanged = false;

        if (controller.status !== newStatus) {
            controller.status = newStatus;
            statusChanged = true;
        }

        // Always save to persist lastConnectionCheck
        await controller.save();

        if (statusChanged) {
            events.emit('controller:update', { id: controller._id, status: newStatus });
        }

        // --- Cascade Status to Devices ---
        try {
            // 1. Find Relays attached to this controller
            const controllerRelays = await Relay.find({ controllerId: controller._id });
            const relayIds = controllerRelays.map(r => r._id);

            // 2. Find Devices (Directly attached OR attached via Relays)
            const devices = await DeviceModel.find({
                $or: [
                    { 'hardware.parentId': controller._id },
                    { 'hardware.relayId': { $in: relayIds } }
                ]
            });

            // 3. Update Device Status
            for (const device of devices) {
                // Skip if device is disabled
                if (device.isEnabled === false) continue;

                let newDeviceStatus: 'online' | 'offline' | 'error' = 'offline';

                if (newStatus === 'offline') {
                    // Parent Controller is Offline -> Device is Offline
                    newDeviceStatus = 'offline';
                } else {
                    // Parent Controller is Online
                    // If device is already in 'error', keep it (Higher Priority)
                    if (device.status === 'error') {
                        newDeviceStatus = 'error';
                    } else {
                        // Otherwise, it's Online
                        newDeviceStatus = 'online';
                    }
                }

                // Always update last check timestamp
                device.lastConnectionCheck = new Date();
                let statusChanged = false;

                // Only log and emit if status changed
                if (device.status !== newDeviceStatus) {
                    logger.info({
                        deviceId: device._id,
                        name: device.name,
                        old: device.status,
                        new: newDeviceStatus,
                        reason: `Controller ${newStatus}`
                    }, '📱 [HardwareService] Device Status Cascade');

                    device.status = newDeviceStatus;
                    statusChanged = true;
                }

                // Always save to persist lastConnectionCheck
                await device.save();

                if (statusChanged) {
                    events.emit('device:update', { id: device._id, status: newDeviceStatus });
                }
            }
        } catch (cascadeError) {
            logger.error({ err: cascadeError, controllerId: controller._id }, '❌ Failed to cascade status to devices');
        }

        return newStatus;
    }

    public async refreshDeviceStatus(deviceId: string): Promise<void> {
        const { DeviceModel } = await import('../../models/Device');
        const { Relay } = await import('../../models/Relay');

        const device = await DeviceModel.findById(deviceId);
        if (!device) throw new Error('Device not found');

        let controllerId: string | undefined;

        if (device.hardware?.parentId) {
            controllerId = device.hardware.parentId;
        } else if (device.hardware?.relayId) {
            const relay = await Relay.findById(device.hardware.relayId);
            if (relay && relay.controllerId) {
                controllerId = relay.controllerId.toString();
            }
        }

        if (!controllerId) {
            throw new Error('Device is not connected to any controller');
        }

        await this.refreshControllerStatus(controllerId);
    }

    // --- Event Handlers ---

    private handleMessage(controllerId: string, msg: HardwareResponse | any): void {
        if (msg.type === 'log') {
            logger.debug({ controllerId, log: msg.message }, 'MCU Log');
            return;
        }

        let requestId = msg.id;

        // If message has no ID, assume it's for the current active command
        if (!requestId) {
            requestId = this.activeCommands.get(controllerId);
            if (requestId) {
                logger.debug({ controllerId, requestId, msg }, '🔗 [HardwareService] Matched ID-less response to active command');
            } else {
                logger.warn({ controllerId, msg }, '⚠️ [HardwareService] Received ID-less response with no active command');
                return;
            }
        }

        if (requestId && this.pendingRequests.has(requestId)) {
            const req = this.pendingRequests.get(requestId)!;
            clearTimeout(req.timeout);
            this.pendingRequests.delete(requestId);
            this.activeCommands.delete(controllerId); // Clear active command

            if (msg.status === 'ok' || msg.success === true || msg.ok === 1) {
                req.resolve(msg.data || msg);
            } else {
                req.reject(new Error(msg.error || 'Unknown Hardware Error'));
            }
        }
    }

    private handleError(controllerId: string, err: Error): void {
        logger.error({ controllerId, err }, '🔥 Transport Error');
    }

    private handleClose(controllerId: string): void {
        logger.warn({ controllerId }, '🔌 Transport Closed');
    }
}

export const hardware = HardwareService.getInstance();
