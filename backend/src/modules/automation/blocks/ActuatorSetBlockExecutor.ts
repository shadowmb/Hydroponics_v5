import { IBlockExecutor, ExecutionContext, BlockResult } from '../interfaces';
import { hardware } from '../../hardware/HardwareService';

export class ActuatorSetBlockExecutor implements IBlockExecutor {
    type = 'ACTUATOR_SET';

    async execute(ctx: ExecutionContext, params: any): Promise<BlockResult> {
        const { deviceId, driverId, command, args } = params;

        if (!deviceId || !driverId || !command) {
            return { success: false, error: 'Missing required params: deviceId, driverId, command' };
        }

        // Mandatory Await as per Rules
        try {
            await hardware.sendCommand(deviceId, driverId, command, args || {});
            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }
}
