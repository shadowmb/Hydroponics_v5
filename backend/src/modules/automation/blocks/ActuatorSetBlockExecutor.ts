import { IBlockExecutor, ExecutionContext, BlockResult } from '../interfaces';
import { hardware } from '../../hardware/HardwareService';
import { deviceRepository } from '../../persistence/repositories/DeviceRepository';

export class ActuatorSetBlockExecutor implements IBlockExecutor {
    type = 'ACTUATOR_SET';

    async execute(ctx: ExecutionContext, params: any): Promise<BlockResult> {
        const { deviceId, value } = params;

        if (!deviceId) {
            return { success: false, error: 'Missing required param: deviceId' };
        }

        try {
            // 1. Fetch Device to get Driver ID
            const device = await deviceRepository.findById(deviceId);
            if (!device) {
                return { success: false, error: `Device ${deviceId} not found` };
            }

            const driverId = device.config?.driverId;
            if (!driverId) {
                return { success: false, error: `Device ${deviceId} has no driver configured` };
            }

            // 2. Determine Command and Args
            // Default to RELAY_SET for actuators, but could be DIGITAL_WRITE depending on driver
            // For now, let's assume standard relay/actuator behavior where we send 'RELAY_SET' or similar.
            // Actually, HardwareService handles 'RELAY_SET' specifically for relays.
            // If it's a direct pin, we might need 'DIGITAL_WRITE'.
            // Let's use a generic 'SET' or check the driver?
            // For simplicity and existing patterns, 'RELAY_SET' is often used for on/off.

            const command = 'RELAY_SET';
            const args = { state: value ? 1 : 0 };

            await hardware.sendCommand(deviceId, driverId, command, args);
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }
}
