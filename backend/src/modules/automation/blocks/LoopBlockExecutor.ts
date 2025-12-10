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
        // DEBUG: Trace interval and iteration
        console.log(`[LoopBlock Debug] Block: ${_blockId} | Interval: ${interval} (${typeof interval}) | Iteration: ${currentIteration} | Mode: ${limitMode}`);

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
        // Unified Logic: If a variable is defined, we evaluate it regardless of loopType.

        let left: any;
        let right: any;

        if (variable) { // Should check loop condition even if limitMode time suggests looping
            // Resolve 'left'
            left = this.getVariable(ctx, variable);

            // Resolve 'right'
            if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
                const varName = value.slice(2, -2).trim();
                right = this.getVariable(ctx, varName);

                if (right === undefined) {
                    console.warn(`[LoopBlock] Variable '${varName}' not found in context.`);
                }


            } else {
                right = this.parseValue(value);
            }

            // Perform check if we are still within limits OR if it's a WHILE loop behavior
            // Note: If limitMode=TIME and time not expired, shouldLoop is true.
            // But if condition is set (WHILE behavior), we must respect it.
            // So: Result = (TimeOK/CountOK) AND (ConditionOK)

            if (shouldLoop) {
                let conditionResult = false;
                // Helper to resolve tolerance
                // Helper to resolve tolerance (Robust Case-Insensitive)
                const resolveTolerance = (varName: string) => {
                    let tolVar = `${varName}_tolerance`;
                    let modeVar = `${varName}_tolerance_mode`;

                    let tol = this.getVariable(ctx, tolVar);
                    let mode = this.getVariable(ctx, modeVar);

                    // Case-insensitive / Fuzzy fallback
                    if (tol === undefined) {
                        const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
                        const targetSlug = normalize(tolVar);

                        const foundKey = Object.keys(ctx.variables).find(k => normalize(k) === targetSlug);
                        if (foundKey) {
                            tol = ctx.variables[foundKey];

                            // Try to find mode too
                            const targetModeSlug = normalize(modeVar);
                            const foundModeKey = Object.keys(ctx.variables).find(k => normalize(k) === targetModeSlug);
                            if (foundModeKey) {
                                mode = ctx.variables[foundModeKey];
                            }
                        }
                    }

                    return {
                        tolerance: tol !== undefined ? Number(tol) : 0,
                        mode: mode
                    };
                };

                // 1. Check Left Side Tolerance (variable)
                let tolerance = 0;
                let toleranceMode: string | undefined = undefined;

                if (variable) {
                    const leftTol = resolveTolerance(variable);
                    if (leftTol.tolerance > 0) {
                        tolerance = leftTol.tolerance;
                        toleranceMode = leftTol.mode;
                    }
                }

                // 2. Check Right Side Tolerance (value as var)
                // If tolerance not found on left, try right
                if (tolerance === 0 && typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
                    const rightVarName = value.slice(2, -2).trim();
                    const rightTol = resolveTolerance(rightVarName);
                    if (rightTol.tolerance > 0) {
                        tolerance = rightTol.tolerance;
                        toleranceMode = rightTol.mode;
                    }
                }

                // Safety for NaN
                if (left === undefined || right === undefined || isNaN(Number(left)) || isNaN(Number(right))) {
                    console.warn(`[LoopBlock] Comparison involves NaN/undefined: ${left} ${operator} ${right}`);
                }

                switch (operator) {
                    case '==': {
                        if (tolerance > 0) {
                            const diff = Number(left) - Number(right);
                            if (toleranceMode === 'lower') {
                                conditionResult = diff >= -tolerance && diff <= 0.000001;
                            } else if (toleranceMode === 'upper') {
                                conditionResult = diff >= -0.000001 && diff <= tolerance;
                            } else {
                                conditionResult = Math.abs(diff) <= tolerance;
                            }
                        } else {
                            conditionResult = left == right;
                        }
                        break;
                    }
                    case '!=': {
                        let isEqual = false;
                        if (tolerance > 0) {
                            const diff = Number(left) - Number(right);
                            if (toleranceMode === 'lower') {
                                isEqual = diff >= -tolerance && diff <= 0.000001;
                            } else if (toleranceMode === 'upper') {
                                isEqual = diff >= -0.000001 && diff <= tolerance;
                            } else {
                                isEqual = Math.abs(diff) <= tolerance;
                            }
                        } else {
                            isEqual = left == right;
                        }
                        conditionResult = !isEqual;
                        break;
                    }
                    case '>': {
                        if (tolerance > 0) {
                            const effectiveRight = (toleranceMode === undefined || toleranceMode === 'symmetric' || toleranceMode === 'lower')
                                ? Number(right) - tolerance
                                : Number(right);
                            conditionResult = Number(left) > effectiveRight;
                        } else {
                            conditionResult = Number(left) > Number(right);
                        }
                        break;
                    }
                    case '<': {
                        if (tolerance > 0) {
                            const effectiveRight = (toleranceMode === undefined || toleranceMode === 'symmetric' || toleranceMode === 'upper')
                                ? Number(right) + tolerance
                                : Number(right);
                            conditionResult = Number(left) < effectiveRight;
                        } else {
                            conditionResult = Number(left) < Number(right);
                        }
                        break;
                    }
                    case '>=': {
                        if (tolerance > 0) {
                            const effectiveRight = (toleranceMode === undefined || toleranceMode === 'symmetric' || toleranceMode === 'lower')
                                ? Number(right) - tolerance
                                : Number(right);
                            conditionResult = Number(left) >= effectiveRight;
                        } else {
                            conditionResult = Number(left) >= Number(right);
                        }
                        break;
                    }
                    case '<=': {
                        if (tolerance > 0) {
                            const effectiveRight = (toleranceMode === undefined || toleranceMode === 'symmetric' || toleranceMode === 'upper')
                                ? Number(right) + tolerance
                                : Number(right);
                            conditionResult = Number(left) <= effectiveRight;
                        } else {
                            conditionResult = Number(left) <= Number(right);
                        }
                        break;
                    }
                    default: return { success: false, error: `Unknown operator: ${operator}` };
                }
                shouldLoop = conditionResult;
            }
        }

        const nextState = shouldLoop ? { iteration: currentIteration, startTime: loopStartTime } : undefined;

        const summaryDetails = variable
            ? `: ${Number(left).toFixed(2)} ${operator} ${Number(right).toFixed(2)} => ${shouldLoop ? 'TRUE' : 'FALSE'}`
            : '';

        return {
            success: true,
            output: shouldLoop,
            state: nextState,
            summary: `Iteration ${currentIteration}${summaryDetails}` + (shouldLoop ? ' (Continuing)' : ' (Done)')
        };
    }

    private getVariable(ctx: ExecutionContext, name: string): any {
        if (ctx.variables[name] !== undefined) return ctx.variables[name];
        const snake = name.trim().toLowerCase().replace(/\s+/g, '_');
        if (ctx.variables[snake] !== undefined) return ctx.variables[snake];
        return undefined;
    }

    private parseValue(val: any): any {
        if (!isNaN(Number(val))) return Number(val);
        if (val === 'true') return true;
        if (val === 'false') return false;
        return val;
    }
}
