import { IBlockExecutor, ExecutionContext, BlockResult } from './interfaces';
import { logger } from '../../core/LoggerService';
import { hardware } from '../hardware/HardwareService';

export class LogBlockExecutor implements IBlockExecutor {
    type = 'LOG';

    async execute(ctx: ExecutionContext, params: any): Promise<BlockResult> {
        const level = params.level || 'info';
        const message = params.message || '';

        (logger as any)[level]({ block: 'LOG', ctx: ctx.programId }, message);

        return { success: true };
    }
}

export class WaitBlockExecutor implements IBlockExecutor {
    type = 'WAIT';

    async execute(ctx: ExecutionContext, params: any): Promise<BlockResult> {
        const duration = params.duration || 1000;
        logger.debug({ duration }, '⏳ WAIT Block Started');

        await new Promise(resolve => setTimeout(resolve, duration));

        return { success: true };
    }
}

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
