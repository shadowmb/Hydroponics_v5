import { IBlockExecutor, ExecutionContext, BlockResult } from '../interfaces';

export class IfBlockExecutor implements IBlockExecutor {
    type = 'IF';

    async execute(ctx: ExecutionContext, params: any): Promise<BlockResult> {
        const { variable, operator, value } = params;

        if (!variable) {
            return { success: false, error: 'Missing required param: variable' };
        }

        const left = ctx.variables[variable];

        // Resolve 'value' if it's a variable reference
        let right = value;
        if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
            const varName = value.slice(2, -2);
            right = ctx.variables[varName];
        } else {
            right = this.parseValue(value);
        }

        let result = false;

        switch (operator) {
            case '==': result = left == right; break;
            case '!=': result = left != right; break;
            case '>': result = Number(left) > Number(right); break;
            case '<': result = Number(left) < Number(right); break;
            case '>=': result = Number(left) >= Number(right); break;
            case '<=': result = Number(left) <= Number(right); break;
            default: return { success: false, error: `Unknown operator: ${operator}` };
        }

        // IF block has two paths: TRUE (default next) and FALSE (custom edge)
        // In our graph, we usually have edges labeled 'true' or 'false'
        // But standard BlockResult expects 'nextBlockId'.
        // The AutomationEngine logic for 'nextBlockId' is:
        // if nextBlockId is undefined, find first outgoing edge.
        // We need to tell the engine which edge to take.
        // Actually, the engine logic (AutomationEngine.ts:264) handles explicit nextBlockId.
        // But we don't know the IDs of the next blocks here easily without traversing edges.
        // Wait, the engine passes `context.edges` to `executeBlock` but NOT to `executor.execute`.

        // REVISION: We need to return a result that the Engine can use to pick the path.
        // Or we simply return `output: result` and let the Engine decide?
        // The current Engine implementation (lines 264-270) is simple:
        // if (nextBlockId === undefined) -> find first edge.

        // We need to modify AutomationEngine to handle Conditional Edges based on `output`.
        // OR we return the specific `nextBlockId` if we had access to edges.
        // Since we don't have edges in `execute`, we should probably return `output: boolean`.
        // AND we need to update `AutomationEngine.ts` to look at `output` for IF blocks.

        return {
            success: true,
            output: result
        };
    }

    private parseValue(val: any): any {
        if (!isNaN(Number(val))) return Number(val);
        if (val === 'true') return true;
        if (val === 'false') return false;
        return val;
    }
}
