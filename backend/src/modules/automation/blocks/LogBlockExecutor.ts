import { IBlockExecutor, ExecutionContext, BlockResult } from '../interfaces';
import { logger } from '../../../core/LoggerService';

export class LogBlockExecutor implements IBlockExecutor {
    type = 'LOG';

    async execute(ctx: ExecutionContext, params: any): Promise<BlockResult> {
        const level = params.level || 'info';
        const message = params.message || '';

        (logger as any)[level]({ block: 'LOG', ctx: ctx.programId }, message);

        return { success: true };
    }
}
