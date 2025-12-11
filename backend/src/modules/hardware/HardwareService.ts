import { events } from '../../core/EventBusService';
import { logger } from '../../core/LoggerService';
import { IHardwareTransport, HardwarePacket, HardwareResponse } from './interfaces';
import { SerialTransport } from './transports/SerialTransport';
import { UdpTransport } from './transports/UdpTransport';

import { v4 as uuidv4 } from 'uuid';
import { templates } from './DeviceTemplateManager';
import { deviceRepository } from '../persistence/repositories/DeviceRepository';
import { Controller } from '../../models/Controller';
import { conversionService } from '../../services/conversion/ConversionService';
import { CalibrationService } from '../calibration/CalibrationService';

export interface Device {
    id: string;
    name: string;
    type: string;
    driverId: string;
    pin?: number;
    pins?: { role: string; portId: string; gpio: number }[];
    config: Record<string, any>;
    state: Record<string, any>;
    lastSeen: Date;
}

export class HardwareService {
    private static instance: HardwareService;
    private devices: Map<string, Device> = new Map();
    private commandQueues: Map<string, (() => Promise<void>)[]> = new Map();
    private isProcessingQueue: Map<string, boolean> = new Map();
    private activeCommands: Map<string, string> = new Map(); // controllerId -> requestId
    private pendingRequests: Map<string, { resolve: Function, reject: Function, timeout: NodeJS.Timeout }> = new Map();
    private transports: Map<string, IHardwareTransport> = new Map();

    private constructor() {
        // Singleton
    }

    public static getInstance(): HardwareService {
        if (!HardwareService.instance) {
            HardwareService.instance = new HardwareService();
        }
        return HardwareService.instance;
    }

    public async initialize(): Promise<void> {
        logger.info('🚀 [HardwareService] Initializing...');

        // Load all devices into memory
        try {
            await templates.loadTemplates();

            const { DeviceModel } = await import('../../models/Device');
            const devices = await DeviceModel.find({ isEnabled: true });

            for (const devConfig of devices) {
                try {
                    const driverId = devConfig.config?.driverId;
                    if (!driverId) continue;

                    const template = templates.getDriver(driverId);
                    if (!template) {
                        logger.warn({ driverId, deviceId: devConfig.id }, '⚠️ Driver not found for device');
                        continue;
                    }

                    const device: Device = {
                        id: devConfig.id,
                        name: devConfig.name,
                        type: devConfig.type,
                        driverId: driverId,
                        pin: devConfig.hardware?.pin,
                        pins: devConfig.hardware?.pins,
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

    // ... (lines 96-197)

    public async sendCommand(
        deviceId: string,
        driverId: string,
        command: string,
        params: Record<string, any> = {},
        context: { pin?: number | string; pins?: any[]; address?: string } = {}
    ): Promise<any> {
        // 1. Find which controller owns this device
        const { DeviceModel } = await import('../../models/Device');
        const deviceDoc = await DeviceModel.findById(deviceId);

        // Check if device exists
        if (!deviceDoc) {
            throw new Error(`Device ${deviceId} not found`);
        }

        // --- INTERCEPT SPECIAL COMMANDS ---
        if (command === 'TEST_DOSING') {
            return CalibrationService.getInstance().runDosingTest(
                this,
                deviceId,
                driverId,
                Number(params.duration),
                context
            );
        }
        // ----------------------------------

        let controllerId: string;
        let resolvedPin: string | undefined;

        // Case A: Connected via Relay
        if (deviceDoc.hardware?.relayId) {
            const { Relay } = await import('../../models/Relay');
            const relay = await Relay.findById(deviceDoc.hardware.relayId);
            if (!relay) throw new Error(`Relay ${deviceDoc.hardware.relayId} not found`);

            if (!relay.controllerId) throw new Error(`Relay ${relay.name} not linked to a controller`);
            controllerId = relay.controllerId.toString();

            // Find the channel
            const channelIndex = deviceDoc.hardware.channel;
            const channel = relay.channels.find(c => c.channelIndex === channelIndex);
            if (!channel) throw new Error(`Invalid relay channel ${channelIndex}`);

            // Use the physical pin from the relay channel
            resolvedPin = channel.controllerPortId;

            // Update Relay State in DB (Shadow State)
            // We do this asynchronously to not block the command
            // But we might want to wait if we want strict consistency? 
            // For now, fire and forget or await? Let's await to ensure DB is in sync.
            if (command === 'RELAY_SET' || command === 'DIGITAL_WRITE') {
                // params.state is 1 or 0
                const newState = params.state === 1 || params.state === true;
                // Update specific channel state
                await Relay.updateOne(
                    { _id: relay._id, "channels.channelIndex": channelIndex },
                    { $set: { "channels.$.state": newState } }
                );
            }

        }
        // Case B: Direct Connection
        else if (deviceDoc.hardware?.parentId) {
            controllerId = deviceDoc.hardware.parentId.toString();
        } else {
            throw new Error(`Device ${deviceId} not linked to a controller or relay`);
        }

        // 2. Get Driver & Create Packet
        const driver = templates.getDriver(driverId);

        // Merge context with device pins
        // If we resolved a pin from Relay, it takes precedence
        const finalContext = {
            ...context,
            pin: resolvedPin || context.pin, // Inject resolved pin (e.g. "D2")
            pins: deviceDoc.hardware?.pins || context.pins
        };

        const packetData = driver.createPacket(command, params, finalContext);

        // --- OPTIMIZATION: Flatten MODBUS_RTU_READ Payload ---
        if (packetData.cmd === 'MODBUS_RTU_READ' && packetData.pins && Array.isArray(packetData.pins)) {
            const rx = packetData.pins.find((p: any) => p.role === 'RX');
            const tx = packetData.pins.find((p: any) => p.role === 'TX');

            if (rx) packetData.rxPin = rx.gpio;
            if (tx) packetData.txPin = tx.gpio;

            // Remove 'pins' from packet so it doesn't get serialized
            delete packetData.pins;
        }
        // -----------------------------------------------------

        const packet: HardwarePacket = {
            id: uuidv4(),
            cmd: packetData.cmd,
            deviceId, // Attach deviceId for tracking in executePacket
            ...packetData
        };

        // Event emission moved to executePacket to capture raw wire data
        // events.emit('command:sent', ...); 

        // 3. Enqueue
        return this.enqueueCommand(controllerId, packet);
    }

    /**
     * Reads a sensor value, returning both RAW and Converted data.
     */
    public async readSensorValue(deviceId: string, strategyOverride?: string): Promise<{ raw: number, value: number, unit?: string, details?: any }> {
        const { DeviceModel } = await import('../../models/Device');
        const device = await DeviceModel.findById(deviceId);
        if (!device) throw new Error('Device not found');

        // Execute 'READ' command
        const rawResponse = await this.sendCommand(
            deviceId,
            device.config.driverId,
            'READ',
            {},
            {
                pins: device.hardware?.pins
            }
        );

        let raw = 0;

        // Check if Driver has a specific value path configured
        const driver = templates.getDriver(device.config.driverId);
        const valuePath = driver.commands?.READ?.valuePath;
        let valueFound = false;

        if (valuePath && typeof rawResponse === 'object') {
            const extracted = this.getValueByPath(rawResponse, valuePath);
            if (extracted !== undefined) {
                raw = Number(extracted);
                valueFound = true;
            } else {
                logger.warn({ deviceId, valuePath, rawResponse }, '⚠️ [HardwareService] Configured valuePath not found in response, attempting auto-detect');
            }
        }

        if (!valueFound) {
            // Fallback: Auto-detect common formats
            if (typeof rawResponse === 'number') {
                raw = rawResponse;
            } else if (typeof rawResponse === 'object') {
                if (Array.isArray(rawResponse) && rawResponse.length > 0) {
                    raw = Number(rawResponse[0]);
                } else if ('registers' in rawResponse && Array.isArray(rawResponse.registers) && rawResponse.registers.length > 0) {
                    // Handle Modbus response: { ok: 1, registers: [val1, val2] }
                    raw = Number(rawResponse.registers[0]);
                } else if ('val' in rawResponse) raw = Number(rawResponse.val);
                else if ('value' in rawResponse) raw = Number(rawResponse.value);
                else if ('raw' in rawResponse) raw = Number(rawResponse.raw);
                else raw = Number(rawResponse); // Try casting the whole object? Unlikely.
            }
        }

        if (isNaN(raw)) {
            logger.warn({ deviceId, rawResponse }, '⚠️ [HardwareService] Could not parse RAW value from sensor');
            raw = 0;
        }

        // --- VALIDATION STEP ---
        // Validate the RAW/Base value BEFORE converting to display units
        // This ensures we filter out invalid readings early
        const validation = device.config?.validation;
        if (validation && (validation.range?.min !== undefined || validation.range?.max !== undefined)) {
            const minValid = validation.range.min === undefined || raw >= validation.range.min;
            const maxValid = validation.range.max === undefined || raw <= validation.range.max;

            if (!minValid || !maxValid) {
                logger.warn({
                    deviceId,
                    raw,
                    min: validation.range.min,
                    max: validation.range.max
                }, '⚠️ [HardwareService] Sensor value out of valid range');

                // For now, throw error. Future: implement retry/fallback via SensorValidationService
                throw new Error(`Sensor value ${raw} is out of valid range [${validation.range.min ?? '-∞'} - ${validation.range.max ?? '∞'}]`);
            }
        }
        // --- END VALIDATION ---

        // --- Smart Conversion (Auto-Strategy) ---
        // We ask ConversionService to find the best strategy for our desired Display Unit.
        const targetUnit = device.displayUnit || device.displayUnits?.get('_primary'); // Use primary display unit as target if valid

        const smartResult = conversionService.convertSmart(device, raw, targetUnit);
        let value = smartResult.value;
        const activeStrategy = smartResult.strategyUsed; // The strategy that was actually used

        // --- Normalization Layer ---
        // Check if driver has a sourceUnit and normalize if needed
        const driverDoc = templates.getDriver(device.config.driverId);
        // @ts-ignore - sourceUnit is new, might not be in interface yet
        let sourceUnit = driverDoc.commands?.READ?.sourceUnit;

        // If the strategy explicitly output a unit (e.g. 'l'), that becomes our new sourceUnit for downstream logic.
        if (smartResult.unit && smartResult.unit !== 'any') {
            // If strategy changed unit, we trust it.
            if (activeStrategy !== 'linear' && activeStrategy !== 'raw') {
                logger.info({
                    deviceId,
                    strategy: activeStrategy,
                    oldUnit: sourceUnit,
                    newUnit: smartResult.unit
                }, '🔄 [HardwareService] Smart Strategy Switched Unit');
                sourceUnit = smartResult.unit;
            }
        }
        // ---------------------------------------

        logger.info({
            deviceId,
            driverId: device.config.driverId,
            sourceUnit,
            raw,
            value
        }, '🔍 [HardwareService] Checking Normalization');

        let baseValue = value;
        let baseUnit = sourceUnit;

        if (sourceUnit) {
            try {
                // Dynamic import with absolute path to avoid relative path hell and ts-node restrictions
                const registryPath = require('path').resolve(__dirname, '../../../../shared/UnitRegistry');
                const { normalizeValue, convertValue } = require(registryPath);

                const normalized = normalizeValue(value, sourceUnit);

                logger.info({ normalized }, '🔍 [HardwareService] Normalization Result');

                if (normalized) {
                    // If normalization happened, we update 'value' to be the Base Unit
                    if (normalized.baseUnit !== sourceUnit) {
                        logger.info({ deviceId, from: sourceUnit, to: normalized.baseUnit, original: value, normalized: normalized.value }, '📏 [HardwareService] Normalized Value');
                        value = normalized.value;
                        baseValue = normalized.value;
                        baseUnit = normalized.baseUnit;
                        // Update the sourceUnit to reflect the new Normalized Base Unit
                        // This ensures downstream consumers (like SensorRead block) know the value is now in 'mm', not 'cm'
                        sourceUnit = normalized.baseUnit;
                    }
                } else {
                    logger.warn({ deviceId, sourceUnit }, '⚠️ [HardwareService] Unknown sourceUnit in driver');
                }

                // --- Display Unit Conversion ---

                // 1. Single Value (Primary)
                // If user selected a specific display unit, convert from base unit to display unit
                if (device.displayUnit) {
                    try {
                        const displayConverted = convertValue(value, sourceUnit, device.displayUnit);
                        if (displayConverted !== null) {
                            logger.info({ deviceId, from: sourceUnit, to: device.displayUnit, original: value, converted: displayConverted }, '👀 [HardwareService] Converted Primary to Display Unit');
                            value = displayConverted;
                            sourceUnit = device.displayUnit;
                        } else {
                            logger.warn({ deviceId, from: sourceUnit, to: device.displayUnit }, '⚠️ [HardwareService] Failed to convert primary value');
                        }
                    } catch (convErr) {
                        logger.warn({ err: convErr, deviceId }, '⚠️ [HardwareService] Display Unit Conversion Error');
                    }
                }

                // 2. Multi-Value Conversion (Readings)
                // Iterate through readings (e.g. { temp: 22, humidity: 40 })
                // If device.displayUnits has an entry (e.g. { temp: 'F' }), convert it.
                if (device.displayUnits && device.displayUnits.size > 0 && typeof rawResponse === 'object') {
                    // We need to resolve the output unit for each key from the driver definition
                    const outputs = driver.commands?.READ?.outputs || [];

                    for (const output of outputs) {
                        const key = output.key;
                        const preferredUnit = device.displayUnits.get(key);

                        // Skip if no reading for this key or no preference
                        // Note: readings object might be flat or use valuePath. 
                        // Assuming 'readings' constructed below gets updated logic? 
                        // Currently 'readings' is constructed AFTER this block (lines 368).
                        // We must act on the rawResponse/details keys OR defer this until readings is built.
                        // Let's do it on the raw/normalized values if possible.

                        // Since 'value' is already normalized/converted, we need the OTHER values.
                        // But wait, normalizeValue only ran on the PRIMARY value above.
                        // We need to Normalize -> Convert for ALL outputs.
                    }
                }

            } catch (err) {
                logger.error({ err, sourceUnit }, '❌ [HardwareService] Failed to load UnitRegistry');
            }
        }

        // Save last reading to DB
        try {
            device.lastReading = {
                value,
                raw,
                timestamp: new Date()
            };
            await device.save();

            // Construct readings object with normalized value and correct key
            const readings: Record<string, any> = (typeof rawResponse === 'object') ? { ...rawResponse } : { value: rawResponse };

            // Get Outputs definition
            const outputs = driver.commands?.READ?.outputs;

            if (outputs && outputs.length === 1 && outputs[0].key) {
                // Single Value Case: Use the already processed 'value'
                readings[outputs[0].key] = value;
            } else if (outputs && outputs.length > 1) {
                // Re-using logic from above is tricky without refactoring.

                // Let's iterate outputs and convert if needed
                if (device.displayUnits && device.displayUnits.size > 0) {
                    // We need UnitRegistry. 
                    // Since we are outside the previous try-block, let's re-import safely or move this logic up.
                    // IMPORTANT: Moving Logic UP is better.
                }
            }

            // Emit data event for HistoryService
            events.emit('device:data', {
                deviceId: device.id,
                deviceName: device.name,
                driverId: device.config.driverId,
                value,
                raw,
                unit: sourceUnit, // Send the final unit (display unit if converted)
                readings,     // <--- NEW: Send constructed readings
                details: rawResponse, // Pass raw response as details
                timestamp: new Date()
            });

        } catch (error) {
            logger.warn({ deviceId, error }, '⚠️ Failed to save lastReading to DB');
        }

        return {
            raw,
            value,
            unit: sourceUnit,
            details: {
                ...(typeof rawResponse === 'object' ? rawResponse : { rawResponse }),
                baseValue,
                baseUnit
            }
        };
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

            transport.send(packet)
                .then((raw: string) => { // Capture raw string
                    // Emit 'command:sent' with raw wire protocol data
                    events.emit('command:sent', {
                        deviceId: packet.deviceId || 'unknown',
                        packet: packet,
                        raw: raw, // The 1:1 string
                        controllerId
                    });
                })
                .catch(err => {
                    clearTimeout(timeout);
                    this.pendingRequests.delete(packet.id);
                    this.activeCommands.delete(controllerId);
                    reject(err);
                });
        });
    }

    // --- Transport Management ---

    private async getOrConnectTransport(controllerId: string): Promise<IHardwareTransport> {
        if (this.transports.has(controllerId)) {
            const transport = this.transports.get(controllerId)!;
            if (transport.isConnected()) {
                return transport;
            }
        }

        const controller = await Controller.findById(controllerId);
        if (!controller) {
            throw new Error(`Controller ${controllerId} not found`);
        }

        let transport: IHardwareTransport;

        // Determine Transport Type
        if (controller.connection?.type === 'network' || controller.connection?.ip) {
            logger.info({ controllerId, ip: controller.connection.ip }, '🔌 [HardwareService] Creating UDP Transport');
            transport = new UdpTransport();

            // Bind Events
            transport.onMessage((msg) => this.handleMessage(controllerId, msg));
            transport.onError((err) => this.handleError(controllerId, err));
            transport.onClose(() => this.handleClose(controllerId));

            await transport.connect(controller.connection.ip || 'localhost', { port: controller.connection.port || 8888 });

        } else if (controller.connection?.type === 'serial' || controller.connection?.serialPort) {
            logger.info({ controllerId, port: controller.connection.serialPort }, '🔌 [HardwareService] Creating Serial Transport');
            transport = new SerialTransport();

            // Bind Events
            transport.onMessage((msg) => this.handleMessage(controllerId, msg));
            transport.onError((err) => this.handleError(controllerId, err));
            transport.onClose(() => this.handleClose(controllerId));

            await transport.connect(controller.connection.serialPort!, { baudRate: controller.connection.baudRate || 115200 });
        } else {
            throw new Error(`Invalid connection config for controller ${controller.name}`);
        }

        this.transports.set(controllerId, transport);

        return transport;
    }

    public async disconnectController(controllerId: string): Promise<void> {
        if (this.transports.has(controllerId)) {
            const transport = this.transports.get(controllerId)!;
            await transport.disconnect();
            this.transports.delete(controllerId);
            this.activeCommands.delete(controllerId);
            this.commandQueues.delete(controllerId);
            this.isProcessingQueue.delete(controllerId);
            logger.info({ controllerId }, '🔌 [HardwareService] Controller Disconnected');
        }
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

        let isOnline = false;

        // If inactive, force offline
        if (controller.isActive === false) {
            isOnline = false;
        } else {
            isOnline = await this.checkHealth(controllerId);
        }

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
            events.emit('controller:update', { id: controller._id.toString(), status: newStatus });
        }

        // --- Fetch Capabilities if Online ---
        if (newStatus === 'online') {
            try {
                // We use INFO command to get capabilities (same as Discovery)
                // Some firmwares might reply to STATUS with capabilities too, but INFO is safer standard
                const infoResponse = await this.sendSystemCommand(controllerId, 'INFO');

                if (infoResponse && Array.isArray(infoResponse.capabilities)) {
                    // Compare with existing to avoid unnecessary writes? 
                    // Mongoose handles this well, but let's be explicit.
                    const newCaps = infoResponse.capabilities.sort();
                    const oldCaps = (controller.capabilities || []).sort();

                    if (JSON.stringify(newCaps) !== JSON.stringify(oldCaps)) {
                        controller.capabilities = infoResponse.capabilities.map((c: string) => c.toLowerCase());
                        await controller.save();
                        logger.info({ controllerId, capabilities: controller.capabilities }, '✨ [HardwareService] Capabilities Updated');
                    }
                }
            } catch (capError) {
                logger.warn({ controllerId, err: capError }, '⚠️ Failed to fetch capabilities');
            }
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
                    events.emit('device:update', { id: device._id.toString(), status: newDeviceStatus });
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

    // --- Helper Methods ---

    private getValueByPath(obj: any, path: string): any {
        return path.split('.').reduce((acc, part) => acc && acc[part], obj);
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
