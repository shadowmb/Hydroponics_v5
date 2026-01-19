import { IBlockExecutor, ExecutionContext, BlockResult } from '../interfaces';
import { logger } from '../../../core/LoggerService';

export class LogBlockExecutor implements IBlockExecutor {
    type = 'LOG';

    async execute(ctx: ExecutionContext, params: any): Promise<BlockResult> {
        const level = params.level || 'info';
        const message = params.message || '';
        const systemAction = params.systemAction || 'NONE';

        (logger as any)[level]({ block: 'LOG', ctx: ctx.programId, action: systemAction }, message);

        let actionLabel = '';
        if (systemAction === 'PAUSE') actionLabel = 'Pause Program';
        else if (systemAction === 'STOP') actionLabel = 'Stop Program';
        else if (systemAction === 'None') actionLabel = 'Log Only';
        else if (systemAction === 'NONE') actionLabel = 'Log Only';
        else actionLabel = systemAction;

        return {
            success: true,
            summary: actionLabel, // Summary is now the Action Label
            output: { systemAction },
            logData: {
                action: 'LOG',
                level,
                message,
                systemAction,
                flowId: ctx.programId || 'default'
            }
        };
    }
}
