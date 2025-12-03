import { IBlockExecutor, ExecutionContext, BlockResult } from '../interfaces';

export class StartBlockExecutor implements IBlockExecutor {
    public readonly type = 'START';

    async execute(context: ExecutionContext, params: any): Promise<BlockResult> {
        return {
            success: true,
            output: { message: 'Program Started' }
        };
    }
}
