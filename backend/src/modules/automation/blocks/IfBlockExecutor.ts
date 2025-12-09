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
            case '==':
                if (tolerance > 0) {
                    result = Math.abs(Number(left) - Number(right)) <= tolerance;
                } else {
                    result = left == right;
                }
                break;
            case '!=':
                if (tolerance > 0) {
                    result = Math.abs(Number(left) - Number(right)) > tolerance;
                } else {
                    result = left != right;
                }
                break;
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
