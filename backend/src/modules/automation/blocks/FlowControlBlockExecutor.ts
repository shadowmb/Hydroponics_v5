import { IBlockExecutor, ExecutionContext, BlockResult } from '../interfaces';

export class FlowControlBlockExecutor implements IBlockExecutor {
    type = 'FLOW_CONTROL';

    async execute(ctx: ExecutionContext, params: any): Promise<BlockResult> {
        const { controlType, labelName, targetLabel } = params;

        // LABEL: Passive block, just passing through.
        if (controlType === 'LABEL') {
            return { success: true };
        }

        // GOTO / LOOP_BACK: Jump to target
        if (controlType === 'GOTO' || controlType === 'LOOP_BACK') {
            if (!targetLabel) {
                return { success: false, error: `Missing target for ${controlType}` };
            }

            // The 'targetLabel' in params holds the ID of the target block 
            // (based on our frontend logic: options.value = node.id)

            return {
                success: true,
                nextBlockId: targetLabel
            };
        }

        return { success: true };
    }
}
