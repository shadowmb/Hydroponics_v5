import { IBlockExecutor, ExecutionContext, BlockResult } from '../interfaces';
import { hardware } from '../../hardware/HardwareService';

export class SensorReadBlockExecutor implements IBlockExecutor {
    type = 'SENSOR_READ';

    async execute(ctx: ExecutionContext, params: any): Promise<BlockResult> {
        const { deviceId, variable } = params;

        if (!deviceId) {
            return { success: false, error: 'Missing required param: deviceId' };
        }

        try {
            // 1. Read Sensor Value
            const result = await hardware.readSensorValue(deviceId);

            // 2. Save to Variable (if configured)
            if (variable) {
                ctx.variables[variable] = result.value;
            }

            return {
                success: true,
                output: result.value
            };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }
}
