import { IBlockExecutor, ExecutionContext, BlockResult } from '../interfaces';

export class LoopBlockExecutor implements IBlockExecutor {
    type = 'LOOP';

    async execute(ctx: ExecutionContext, params: any): Promise<BlockResult> {
        const { loopType = 'COUNT', count, variable, operator, value, _blockId } = params;

        // Get previous state (iteration count)
        const previousState = ctx.resumeState?.[_blockId] || {};
        const currentIteration = (previousState.iteration || 0) + 1;

        let shouldLoop = false;

        if (loopType === 'COUNT') {
            const maxIterations = Number(count) || 1;
            // Loop if we haven't reached max iterations yet
            // Note: currentIteration starts at 1 on first run
            shouldLoop = currentIteration <= maxIterations;
        } else if (loopType === 'WHILE') {
            if (!variable) {
                return { success: false, error: 'Missing variable for WHILE loop' };
            }

            const left = ctx.variables[variable];
            let right = value;

            // Resolve variable reference in value
            if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
                const varName = value.slice(2, -2);
                right = ctx.variables[varName];
            } else {
                right = this.parseValue(value);
            }

            switch (operator) {
                case '==': shouldLoop = left == right; break;
                case '!=': shouldLoop = left != right; break;
                case '>': shouldLoop = Number(left) > Number(right); break;
                case '<': shouldLoop = Number(left) < Number(right); break;
                case '>=': shouldLoop = Number(left) >= Number(right); break;
                case '<=': shouldLoop = Number(left) <= Number(right); break;
                default: return { success: false, error: `Unknown operator: ${operator}` };
            }
        }

        // If loop finishes, we should probably reset the state so next time it runs fresh?
        // Or does the engine handle that?
        // Usually, if we exit the loop, we might re-enter it later in the same flow execution?
        // If we re-enter, we want fresh state.
        // But if we are looping, we want preserved state.

        // Strategy:
        // If shouldLoop is TRUE, we save state { iteration: currentIteration }.
        // If shouldLoop is FALSE, we return NO state (or reset it), so next entry is fresh.
        // However, 'resumeState' is typically for pausing/resuming. 
        // For runtime state persistence within a flow, we might need a different mechanism if the Engine clears state on block completion.
        // BUT: The engine passes `resumeState` which is loaded from DB.
        // We need a transient runtime state for loops.
        // `ctx.context`? No, that's global.

        // Let's assume `resumeState` is the place.
        // If we return `state`, it overwrites/updates the entry for this block.
        // If we exit loop (false), we should probably clear it.

        const nextState = shouldLoop ? { iteration: currentIteration } : undefined;

        return {
            success: true,
            output: shouldLoop, // Engine uses this to choose 'body' (true) or 'exit' (false)
            state: nextState
        };
    }

    private parseValue(val: any): any {
        if (!isNaN(Number(val))) return Number(val);
        if (val === 'true') return true;
        if (val === 'false') return false;
        return val;
    }
}
