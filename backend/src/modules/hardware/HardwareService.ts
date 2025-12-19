import { events } from '../../core/EventBusService';
import { logger } from '../../core/LoggerService';
import { HardwarePacket } from './interfaces';
import { v4 as uuidv4 } from 'uuid';
import { templates } from './DeviceTemplateManager';
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

    private constructor() { }

    public static getInstance(): HardwareService {
        if (!HardwareService.instance) {
            HardwareService.instance = new HardwareService();
        }
        return HardwareService.instance;
    }

    public async initialize(): Promise<void> {
        logger.info('🚀 [HardwareService] Initializing...');
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

    public async sendCommand(
        deviceId: string,
        driverId: string,
        command: string,
        params: Record<string, any> = {},
        context: { pin?: number | string; pins?: any[]; address?: string } = {}
    ): Promise<any> {
        const { DeviceModel } = await import('../../models/Device');
        const deviceDoc = await DeviceModel.findById(deviceId);
        if (!deviceDoc) throw new Error(`Device ${deviceId} not found`);

        if (command === 'TEST_DOSING') {
            return CalibrationService.getInstance().runDosingTest(
                this,
                deviceId,
                driverId,
                Number(params.duration),
                context
            );
        }

        let controllerId: string;
        let resolvedPin: string | undefined;

        if (deviceDoc.hardware?.relayId) {
            const { Relay } = await import('../../models/Relay');
            const relay = await Relay.findById(deviceDoc.hardware.relayId);
            if (!relay) throw new Error(`Relay ${deviceDoc.hardware.relayId} not found`);
            if (!relay.controllerId) throw new Error(`Relay ${relay.name} not linked to a controller`);
            controllerId = relay.controllerId.toString();

            const channelIndex = deviceDoc.hardware.channel;
            const channel = relay.channels.find(c => c.channelIndex === channelIndex);
            if (!channel) throw new Error(`Invalid relay channel ${channelIndex}`);
            resolvedPin = channel.controllerPortId;

            if (command === 'RELAY_SET' || command === 'DIGITAL_WRITE') {
                const newState = params.state === 1 || params.state === true;
                await Relay.updateOne(
                    { _id: relay._id, "channels.channelIndex": channelIndex },
                    { $set: { "channels.$.state": newState } }
                );
            }
        } else if (deviceDoc.hardware?.parentId) {
            controllerId = deviceDoc.hardware.parentId.toString();
        } else {
            throw new Error(`Device ${deviceId} not linked to a controller or relay`);
        }

        const driver = templates.getDriver(driverId);
        const finalContext = {
            ...context,
            pin: resolvedPin || context.pin,
            pins: deviceDoc.hardware?.pins || context.pins
        };

        const packetData = driver.createPacket(command, params, finalContext);

        if (packetData.cmd === 'MODBUS_RTU_READ' && packetData.pins && Array.isArray(packetData.pins)) {
            const rx = packetData.pins.find((p: any) => p.role === 'RX');
            const tx = packetData.pins.find((p: any) => p.role === 'TX');
            if (rx) packetData.rxPin = rx.gpio;
            if (tx) packetData.txPin = tx.gpio;
            delete packetData.pins;
        }

        const packet: HardwarePacket = {
            id: uuidv4(),
            cmd: packetData.cmd,
            deviceId,
            ...packetData
        };

        return this.enqueueCommand(controllerId, packet);
    }

    public async readSensorValue(deviceId: string, strategyOverride?: string): Promise<{
        raw: number,
        value: number | null,
        unit?: string,
        baseValue: number | null,
        baseUnit: string,
        hwValue: number,
        hwUnit: string,
        details?: any
    }> {
        const { DeviceModel } = await import('../../models/Device');
        const device = await DeviceModel.findById(deviceId);
        if (!device) throw new Error('Device not found');

        const { contextResolver } = await import('./HardwareContextResolver');
        const context = await contextResolver.resolveContext(device, this.readSensorValue.bind(this));

        const rawResponse = await this.sendCommand(deviceId, device.config.driverId, 'READ', {}, context);

        const driverDoc = templates.getDriver(device.config.driverId);
        const valuePath = driverDoc.commands?.READ?.valuePath;
        const { sensorProcessor } = await import('./SensorProcessor');

        let raw = 0;
        const samplingConfig = device.config?.sampling || driverDoc.sampling;

        if (samplingConfig && typeof samplingConfig.count === 'number' && samplingConfig.count > 1) {
            raw = await sensorProcessor.performSampling(
                deviceId,
                device.config.driverId,
                {
                    count: samplingConfig.count,
                    delayMs: samplingConfig.delayMs || 0
                },
                async () => this.sendCommand(deviceId, device.config.driverId, 'READ', {}, { pins: device.hardware?.pins }),
                valuePath
            );
        } else {
            raw = sensorProcessor.extractRawValue(rawResponse, valuePath);
        }

        if (isNaN(raw)) raw = 0;

        const basicResult = await sensorProcessor.processRawToBasic(raw, device, driverDoc, context, strategyOverride);
        const { value: baseLogValue, unit: baseLogUnit, hwValue: baseHwValue, hwUnit: baseHwUnit, activeStrategy, details: conversionDetails } = basicResult;

        try {
            device.lastReading = { value: isNaN(baseLogValue) ? null : baseLogValue, raw, timestamp: new Date() };
            await device.save();
        } catch (err) { logger.warn({ deviceId, err }, '⚠️ DB Save Failed'); }

        const displayResult = sensorProcessor.processBasicToDisplay(baseLogValue, baseLogUnit, device);
        const { value: displayVal, unit: displayUnitFinal } = displayResult;

        const readings: Record<string, any> = (typeof rawResponse === 'object') ? { ...rawResponse } : { value: rawResponse };
        const outputs = driverDoc.commands?.READ?.outputs;
        if (outputs && outputs.length === 1 && outputs[0].key) readings[outputs[0].key] = isNaN(displayVal) ? null : displayVal;

        events.emit('device:data', {
            deviceId: device.id, deviceName: device.name, driverId: device.config.driverId,
            value: isNaN(displayVal) ? null : displayVal, raw, unit: displayUnitFinal,
            baseValue: isNaN(baseLogValue) ? null : baseLogValue, baseUnit: baseLogUnit,
            hwValue: baseHwValue, hwUnit: baseHwUnit, readings,
            details: { ...rawResponse, baseHwValue, baseHwUnit, baseLogValue, baseLogUnit, activeStrategy, ...conversionDetails },
            timestamp: new Date()
        });

        return {
            raw, value: isNaN(displayVal) ? null : displayVal, unit: displayUnitFinal,
            baseValue: isNaN(baseLogValue) ? null : baseLogValue, baseUnit: baseLogUnit,
            hwValue: baseHwValue, hwUnit: baseHwUnit,
            details: { ...(typeof rawResponse === 'object' ? rawResponse : { rawResponse }), baseHwValue, baseHwUnit, baseLogValue, baseLogUnit, activeStrategy, ...conversionDetails }
        };
    }


    public async sendSystemCommand(controllerId: string, cmd: string, params: any = {}): Promise<any> {
        const packet: HardwarePacket = { id: uuidv4(), cmd, ...params };
        return this.enqueueCommand(controllerId, packet);
    }

    private async enqueueCommand(controllerId: string, packet: HardwarePacket): Promise<any> {
        const { transportManager } = await import('./HardwareTransportManager');
        return transportManager.enqueueCommand(controllerId, packet);
    }

    public async disconnectController(controllerId: string): Promise<void> {
        const { transportManager } = await import('./HardwareTransportManager');
        await transportManager.disconnectController(controllerId);
    }

    private async checkHealth(controllerId: string): Promise<boolean> {
        try {
            const response = await this.sendSystemCommand(controllerId, 'PING');
            return !!response;
        } catch (err) { return false; }
    }

    public async syncStatus(): Promise<Record<string, string>> {
        const controllers = await Controller.find();
        const results: Record<string, string> = {};
        await Promise.all(controllers.map(async (c) => {
            results[c.name] = await this.refreshControllerStatus(c._id.toString());
        }));
        return results;
    }

    public async refreshControllerStatus(controllerId: string): Promise<'online' | 'offline'> {
        const controller = await Controller.findById(controllerId);
        if (!controller) throw new Error('Controller not found');
        const { DeviceModel } = await import('../../models/Device');
        const { Relay } = await import('../../models/Relay');

        const isOnline = controller.isActive !== false && await this.checkHealth(controllerId);
        const newStatus = isOnline ? 'online' : 'offline';
        const statusChanged = controller.status !== newStatus;
        controller.status = newStatus;
        controller.lastConnectionCheck = new Date();
        await controller.save();

        if (statusChanged) events.emit('controller:update', { id: controllerId, status: newStatus });

        if (newStatus === 'online') {
            try {
                const info = await this.sendSystemCommand(controllerId, 'INFO');
                if (info && Array.isArray(info.capabilities)) {
                    controller.capabilities = info.capabilities.map((c: string) => c.toLowerCase());
                    await controller.save();
                }
            } catch (err) { }
        }

        try {
            const relays = await Relay.find({ controllerId: controller._id });
            const devices = await DeviceModel.find({ $or: [{ 'hardware.parentId': controller._id }, { 'hardware.relayId': { $in: relays.map(r => r._id) } }] });

            for (const device of devices) {
                if (device.isEnabled === false) continue;
                const newDStatus = newStatus === 'offline' ? 'offline' : (device.status === 'error' ? 'error' : 'online');
                const dChanged = device.status !== newDStatus;
                device.status = newDStatus;
                device.lastConnectionCheck = new Date();
                await device.save();
                if (dChanged) events.emit('device:update', { id: device._id.toString(), status: newDStatus });
            }
        } catch (err) { }

        return newStatus;
    }

    /**
     * Updates device configuration and performs role-strategy synchronization.
     * IF the activeRole changes, the conversionStrategy is explicitly cleared to
     * prevent old calibration math from affecting a different physical measurement context.
     * This follows the "Explicit over Implicit" strategy selection philosophy.
     */
    public async updateDeviceConfig(deviceId: string, config: any): Promise<any> {
        const { DeviceModel } = await import('../../models/Device');
        const device = await DeviceModel.findById(deviceId);
        if (!device) throw new Error('Device not found');

        // Check if role is changing
        const oldRole = device.config?.activeRole;
        const newRole = config?.activeRole;

        if (newRole !== undefined && newRole !== oldRole) {
            logger.info({ deviceId, oldRole, newRole }, '🔄 [HardwareService] Role changed, clearing conversion strategy');
            config.conversionStrategy = ''; // Reset strategy to force explicit selection
        }

        device.config = { ...device.config, ...config };
        await device.save();
        return device;
    }

    public async refreshDeviceStatus(deviceId: string): Promise<void> {
        const { DeviceModel } = await import('../../models/Device');
        const device = await DeviceModel.findById(deviceId);
        if (!device) throw new Error('Device not found');

        let controllerId = device.hardware?.parentId;

        if (!controllerId && device.hardware?.relayId) {
            const { Relay } = await import('../../models/Relay');
            const relay = await Relay.findById(device.hardware.relayId);
            if (relay) {
                controllerId = relay.controllerId?.toString();
            }
        }

        if (controllerId) {
            await this.refreshControllerStatus(controllerId);
        } else {
            logger.warn({ deviceId }, '⚠️ Cannot refresh device status: No parent controller found');
        }
    }

    public async refreshRelayStatus(relayId: string): Promise<void> {
        const { Relay } = await import('../../models/Relay');
        const relay = await Relay.findById(relayId);
        if (!relay) throw new Error('Relay not found');

        if (relay.controllerId) {
            await this.refreshControllerStatus(relay.controllerId.toString());
        } else {
            logger.warn({ relayId }, '⚠️ Cannot refresh relay status: No parent controller found');
        }
    }

    private getValueByPath(obj: any, path: string): any {
        return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    }
}

export const hardware = HardwareService.getInstance();
