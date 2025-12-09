import { IBlockExecutor, ExecutionContext, BlockResult } from '../interfaces';

export class LoopBlockExecutor implements IBlockExecutor {
    type = 'LOOP';

    async execute(ctx: ExecutionContext, params: any): Promise<BlockResult> {
        const { loopType = 'COUNT', count, variable, operator, value, _blockId, interval, limitMode = 'COUNT', timeout } = params;

        // Get previous state
        const previousState = ctx.resumeState?.[_blockId] || {};
        const currentIteration = (previousState.iteration || 0) + 1;
        const loopStartTime = previousState.startTime || Date.now(); // Track when loop started

        // --- INTERVAL LOGIC ---
        // If an interval is set, we wait.
        // We wait if this is NOT the very first run (so run 1 is immediate),
        // OR if you want to pace every run? 
        // Standard industrial practice: delay is usually cycle time.
        // Let's simpler: If interval > 0, we delay at start of execution.
        // Exception: logic says if we just started, maybe run immediately?
        // Let's stick to: Delay if iteration > 1.
        if (interval && interval > 0 && currentIteration > 1) {
            await new Promise(resolve => setTimeout(resolve, interval * 1000));
        }

        let shouldLoop = false;
        let errorMessage: string | undefined;

        // --- 1. CHECK LIMITS (Count vs Time) ---
        if (limitMode === 'TIME') {
            // Time-based limit
            const elapsedSeconds = (Date.now() - loopStartTime) / 1000;
            if (timeout && elapsedSeconds > timeout) {
                return { success: false, error: `Loop timed out after ${elapsedSeconds.toFixed(1)}s (Limit: ${timeout}s)` };
            }
            // For Time mode, we default 'shouldLoop' to TRUE (infinite until timeout),
            // unless condition fails below.
            shouldLoop = true;
        } else {
            // Count-based limit
            const maxIterations = Number(count) || 1;
            shouldLoop = currentIteration <= maxIterations;
        }

        // --- 2. CHECK CONDITION (If applicable) ---
        if (shouldLoop && loopType === 'WHILE') {
            if (!variable) {
                return { success: false, error: 'Missing variable for WHILE loop' };
            }

            const left = ctx.variables[variable];
            let right = value;
            let tolerance = 0;

            // Resolve variable reference in value
            if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
                const varName = value.slice(2, -2);
                right = ctx.variables[varName];
                const toleranceVarName = `${varName}_tolerance`;
                if (ctx.variables[toleranceVarName] !== undefined) {
                    tolerance = Number(ctx.variables[toleranceVarName]);
                }
            } else {
                right = this.parseValue(value);
            }

            switch (operator) {
                case '==':
                    shouldLoop = tolerance > 0 ? Math.abs(Number(left) - Number(right)) <= tolerance : left == right;
                    break;
                case '!=':
                    shouldLoop = tolerance > 0 ? Math.abs(Number(left) - Number(right)) > tolerance : left != right;
                    break;
                case '>': shouldLoop = Number(left) > Number(right); break;
                case '<': shouldLoop = Number(left) < Number(right); break;
                case '>=': shouldLoop = Number(left) >= Number(right); break;
                case '<=': shouldLoop = Number(left) <= Number(right); break;
                default: return { success: false, error: `Unknown operator: ${operator}` };
            }
        }

        const nextState = shouldLoop ? { iteration: currentIteration, startTime: loopStartTime } : undefined;

        return {
            success: true,
            output: shouldLoop,
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
