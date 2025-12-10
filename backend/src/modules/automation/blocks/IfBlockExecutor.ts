import { IBlockExecutor, ExecutionContext, BlockResult } from '../interfaces';

export class IfBlockExecutor implements IBlockExecutor {
    type = 'IF';

    async execute(ctx: ExecutionContext, params: any): Promise<BlockResult> {
        const { variable, operator, value } = params;

        if (!variable) {
            return { success: false, error: 'Missing required param: variable' };
        }

        const left = this.getVariable(ctx, variable);

        // Resolve 'value' if it's a variable reference
        let right: any = value;
        let tolerance = 0;

        if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
            const varName = value.slice(2, -2).trim();
            right = this.getVariable(ctx, varName);

            // Debugging for specific user issue
            if (right === undefined) {
                console.warn(`[IfBlock] Variable '${varName}' not found in context. Keys: ${Object.keys(ctx.variables).join(', ')}`);
            }

            // Check for tolerance associated with this variable
            const toleranceVarName = `${varName}_tolerance`;
            const tolVal = this.getVariable(ctx, toleranceVarName);
            if (tolVal !== undefined) {
                tolerance = Number(tolVal);
            }
        } else {
            right = this.parseValue(value);
        }

        let result = false;

        // Safety for NaN
        if (left === undefined || right === undefined || isNaN(Number(left)) || isNaN(Number(right))) {
            console.warn(`[IfBlock] Comparison involves NaN/undefined: ${left} ${operator} ${right}`);
        }

        switch (operator) {
            case '==': {
                let conditionResult = false;

                // Get Tolerance Mode
                const toleranceModeVarName = typeof value === 'string' && value.startsWith('{{')
                    ? `${value.slice(2, -2).trim()}_tolerance_mode`
                    : undefined;
                const toleranceMode = toleranceModeVarName ? this.getVariable(ctx, toleranceModeVarName) : undefined; // 'lower', 'upper', or undefined (symmetric)

                if (tolerance > 0) {
                    const diff = Number(left) - Number(right);

                    if (toleranceMode === 'lower') {
                        // Allow Lower Only: [Target - Tol, Target] -> diff must be between -Tol and 0 (Target >= Left >= Target-Tol)
                        // Actually logic: LEFT should be >= (RIGHT - TOL) AND LEFT <= RIGHT
                        // diff = LEFT - RIGHT. 
                        // LEFT - RIGHT >= -TOL  => diff >= -tolerance
                        // LEFT - RIGHT <= 0     => diff <= 0
                        conditionResult = diff >= -tolerance && diff <= 0.000001; // small epsilon for float comparison?
                    } else if (toleranceMode === 'upper') {
                        // Allow Upper Only: [Target, Target + Tol]
                        // LEFT >= RIGHT AND LEFT <= RIGHT + TOL
                        // diff >= 0 AND diff <= tolerance
                        conditionResult = diff >= -0.000001 && diff <= tolerance;
                    } else {
                        // Symmetric (Default)
                        conditionResult = Math.abs(diff) <= tolerance;
                    }
                } else {
                    conditionResult = left == right;
                }
                result = conditionResult;
                break;
            }
            case '!=': {
                // Logic is inverted '=='
                let isEqual = false;
                // Get Tolerance Mode (Copy from above)
                const toleranceModeVarName = typeof value === 'string' && value.startsWith('{{')
                    ? `${value.slice(2, -2).trim()}_tolerance_mode`
                    : undefined;
                const toleranceMode = toleranceModeVarName ? this.getVariable(ctx, toleranceModeVarName) : undefined;

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
                result = !isEqual;
                break;
            }
            case '>': result = Number(left) > Number(right); break;
            case '<': result = Number(left) < Number(right); break;
            case '>=': result = Number(left) >= Number(right); break;
            case '<=': result = Number(left) <= Number(right); break;
            default: return { success: false, error: `Unknown operator: ${operator}` };
        }

        // Create readable summary
        const summary = `${Number(left).toFixed(2)} ${operator} ${Number(right).toFixed(2)} => ${result ? 'TRUE' : 'FALSE'}`;

        return {
            success: true,
            output: result,
            summary
        };
    }

    private getVariable(ctx: ExecutionContext, name: string): any {
        // 1. Exact match
        if (ctx.variables[name] !== undefined) return ctx.variables[name];

        // 2. Snake_case fallback (Global 2 -> global_2)
        const snake = name.trim().toLowerCase().replace(/\s+/g, '_');
        if (ctx.variables[snake] !== undefined) return ctx.variables[snake];

        // 3. ID lookup? (Pass ID if available) - But we usually have names here.
        return undefined;
    }

    private parseValue(val: any): any {
        if (!isNaN(Number(val))) return Number(val);
        if (val === 'true') return true;
        if (val === 'false') return false;
        return val;
    }
}
