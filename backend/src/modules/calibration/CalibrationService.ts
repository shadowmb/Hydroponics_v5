import { logger } from '../../core/LoggerService';
import type { HardwareService } from '../hardware/HardwareService';

export class CalibrationService {
    private static instance: CalibrationService;

    private constructor() { }

    public static getInstance(): CalibrationService {
        if (!CalibrationService.instance) {
            CalibrationService.instance = new CalibrationService();
        }
        return CalibrationService.instance;
    }

    /**
     * Executes a volumetric flow (dosing) test.
     */
    public async runDosingTest(
        hardwareService: HardwareService,
        deviceId: string,
        driverId: string,
        duration: number,
        context: any = {}
    ): Promise<{ success: boolean, message: string }> {
        const testContext = { ...context, source: 'CalibrationService', action: 'runDosingTest' };

        try {
            // Optional: Check status before starting? 
            // For now, we just proceed.
        } catch (err: any) {
            // If the error is "Pump is already ON", rethrow it
            if (err.message && err.message.includes('Pump is already ON')) {
                throw err;
            }
            // Otherwise, log warning but proceed (or fail safe? Better to fail safe)
            logger.warn({ err }, '⚠️ [CalibrationService] Could not verify pump state before test. Proceeding with caution.');
        }

        // 1. Turn ON
        await hardwareService.sendCommand(deviceId, driverId, 'ON', {}, testContext);

        // 2. Wait
        await new Promise(resolve => setTimeout(resolve, duration * 1000));

        // 3. Turn OFF
        await hardwareService.sendCommand(deviceId, driverId, 'OFF', {}, testContext);

        logger.info({ deviceId }, '🧪 [CalibrationService] Dosing Test Complete');
        return { success: true, message: 'Dosing test completed' };
    }
    public async saveCalibration(deviceId: string, strategyId: string, data: any): Promise<any> {
        const { DeviceModel } = await import('../../models/Device'); // Dynamic import to avoid circular dependency if any
        const device = await DeviceModel.findById(deviceId);
        if (!device) throw new Error('Device not found');

        if (!device.config.calibrations) {
            device.config.calibrations = {};
        }

        // Sanitize data: remove UI-specific fields (starting with _)
        const sanitizedData = Object.keys(data).reduce((acc, key) => {
            if (!key.startsWith('_')) {
                acc[key] = data[key];
            }
            return acc;
        }, {} as any);

        // Save under the specific strategy ID
        device.config.calibrations[strategyId] = {
            lastCalibrated: new Date(),
            data: sanitizedData
        };

        // Mark as modified because it's a Mixed type
        device.markModified('config.calibrations');

        await device.save();

        logger.info({ deviceId, strategyId }, '✅ [CalibrationService] Calibration saved');

        return device;
    }
    public async deleteCalibration(deviceId: string, strategyId: string): Promise<any> {
        const { DeviceModel } = await import('../../models/Device');
        const device = await DeviceModel.findById(deviceId);
        if (!device) throw new Error('Device not found');

        if (device.config.calibrations && device.config.calibrations[strategyId]) {
            // Remove the specific strategy key
            delete device.config.calibrations[strategyId];

            // Mark as modified
            device.markModified('config.calibrations');
            await device.save();

            logger.info({ deviceId, strategyId }, '🗑️ [CalibrationService] Calibration deleted');
        }

        return device;
    }
}
