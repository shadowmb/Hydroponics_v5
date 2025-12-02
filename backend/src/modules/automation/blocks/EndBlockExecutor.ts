import { IBlockExecutor, ExecutionContext, BlockResult } from '../interfaces';

export class EndBlockExecutor implements IBlockExecutor {
    public readonly type = 'END';

    async execute(context: ExecutionContext, params: any): Promise<BlockResult> {
        return {
            success: true,
            output: { message: 'Program Ended' },
            nextBlockId: null // Explicitly stop execution
        };
    }
}
