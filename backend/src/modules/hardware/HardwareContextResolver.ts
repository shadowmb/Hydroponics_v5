import { logger } from '../../core/LoggerService';
import { Controller } from '../../models/Controller';
import { Relay } from '../../models/Relay';
import { DeviceModel } from '../../models/Device';

export interface HardwareContext {
    pins: any[];
    adcMax: number;
    voltage: number;
    temperature: number;
    [key: string]: any;
}

export class HardwareContextResolver {
    private static instance: HardwareContextResolver;

    private constructor() { }

    public static getInstance(): HardwareContextResolver {
        if (!HardwareContextResolver.instance) {
            HardwareContextResolver.instance = new HardwareContextResolver();
        }
        return HardwareContextResolver.instance;
    }

    /**
     * Resolves the full hardware context (VRef, ADC, Compensation) for a device.
     */
    public async resolveContext(device: any, readSensorFn: (id: string) => Promise<any>): Promise<HardwareContext> {
        const context: HardwareContext = {
            pins: device.hardware?.pins || [],
            adcMax: 1023, // Default
            voltage: 5.0, // Default
            temperature: 25.0 // Default
        };

        try {
            // 1. Resolve ADC & System Voltage from Controller/Relay
            let controllerId = device.hardware?.parentId as unknown as string;

            if (!controllerId && device.hardware?.relayId) {
                const relay = await Relay.findById(device.hardware.relayId);
                if (relay && relay.controllerId) controllerId = relay.controllerId.toString();
            }

            if (controllerId) {
                const controller = await Controller.findById(controllerId);
                if (controller && (controller as any).hardwareConfig) {
                    context.adcMax = (controller as any).hardwareConfig.adcResolution || 1023;
                    context.voltage = (controller as any).hardwareConfig.voltageReference || 5.0;
                }
            }

            // 2. Resolve Voltage Override (Device Config)
            if (device.config?.voltage?.reference) {
                context.voltage = device.config.voltage.reference;
            }

            // 3. Resolve Temperature (Compensation)
            const comp = device.config?.compensation?.temperature;
            if (comp?.enabled) {
                let temp = (typeof comp.default === 'number') ? comp.default : 25.0;

                if (comp.source === 'external' && comp.externalDeviceId) {
                    const extDev = await DeviceModel.findById(comp.externalDeviceId);

                    if (extDev) {
                        // Check Freshness
                        const lastRead = extDev.lastReading;
                        const now = Date.now();
                        const lastTs = lastRead?.timestamp ? new Date(lastRead.timestamp).getTime() : 0;
                        const age = now - lastTs;
                        const LIMIT = 5 * 60 * 1000; // 5 min default

                        if (age < LIMIT && lastRead && lastRead.value !== null) {
                            temp = lastRead.value;
                            logger.info({ deviceId: device.id, temp, source: 'external', extDevId: extDev.id, freshness: 'fresh' }, '🌡️ [ContextResolver] Using External Temperature for Compensation');
                        } else {
                            // Active Polling if stale
                            logger.warn({ deviceId: device.id, extDev: extDev.name, age }, '⚠️ [ContextResolver] Stale Temp Data. Polling...');
                            try {
                                const res = await readSensorFn(extDev.id);
                                if (res && typeof res.value === 'number') {
                                    temp = res.value;
                                    logger.info({ deviceId: device.id, temp, source: 'external', extDevId: extDev.id, freshness: 'polled' }, '🌡️ [ContextResolver] Using Polled External Temperature');
                                }
                            } catch (err) {
                                logger.error({ err, deviceId: device.id }, '❌ [ContextResolver] Active Poll Failed. Using Default.');
                            }
                        }
                    }
                }
                context.temperature = temp;
            }
        } catch (ctxErr) {
            logger.error({ err: ctxErr, deviceId: device.id }, '❌ [ContextResolver] Context Resolution Failed');
        }

        return context;
    }
}

export const contextResolver = HardwareContextResolver.getInstance();
