import { IBlockExecutor, ExecutionContext, BlockResult } from '../interfaces';

export class IfBlockExecutor implements IBlockExecutor {
    type = 'IF';

    async execute(ctx: ExecutionContext, params: any): Promise<BlockResult> {
        // [HEAVY DEBUG] Dump inputs
        console.log('[IfBlock DEBUG] Params:', JSON.stringify(params, null, 2));

        const { variable, operator, value } = params;

        if (!variable) {
            return { success: false, error: 'Missing required param: variable' };
        }

        const left = this.getVariable(ctx, variable);

        // Resolve 'value' if it's a variable reference
        let right: any = value;

        if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
            const varName = value.slice(2, -2).trim();
            right = this.getVariable(ctx, varName);

            // Debugging for specific user issue
            if (right === undefined) {
                console.warn(`[IfBlock] Variable '${varName}' not found in context. Keys: ${Object.keys(ctx.variables).join(', ')}`);
            }
        } else {
            right = this.parseValue(value);
        }

        let result = false;

        // Safety for NaN
        if (left === undefined || right === undefined || isNaN(Number(left)) || isNaN(Number(right))) {
            console.warn(`[IfBlock] Comparison involves NaN/undefined: ${left} ${operator} ${right}`);
        }

        // Create explicit helper to try resolving tolerance for a given variable name
        // Create explicit helper to try resolving tolerance for a given variable name
        const resolveTolerance = (varName: string) => {
            let tolVar = `${varName}_tolerance`;
            let modeVar = `${varName}_tolerance_mode`;

            let tol = this.getVariable(ctx, tolVar);
            let mode = this.getVariable(ctx, modeVar);

            // [HEAVY DEBUG] Case-insensitive / Fuzzy fallback
            if (tol === undefined) {
                // Normalizer function: lowercase + remove all non-alphanumeric (spaces, underscores, etc)
                const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

                const targetSlug = normalize(tolVar); // e.g. "global_2_tolerance" -> "global2tolerance"

                const foundKey = Object.keys(ctx.variables).find(k => normalize(k) === targetSlug);

                if (foundKey) {
                    console.log(`[IfBlock DEBUG] Fuzzy match found: '${tolVar}' -> '${foundKey}'`);
                    tol = ctx.variables[foundKey];

                    // Also try to find mode with matching pattern
                    const targetModeSlug = normalize(modeVar);
                    const foundModeKey = Object.keys(ctx.variables).find(k => normalize(k) === targetModeSlug);
                    if (foundModeKey) {
                        mode = ctx.variables[foundModeKey];
                    }
                }
            }

            // [IfBlock DEBUG] Dump context if tolerance is missing
            if (tol !== undefined) {
                console.log(`[IfBlock Tolerance] Applied for '${varName}': ${tol} (Mode: ${mode || 'symmetric'})`);
            }

            return {
                tolerance: tol !== undefined ? Number(tol) : 0,
                mode: mode
            };
        };

        // 1. Check Left Side Tolerance
        let tolerance = 0;
        let toleranceMode: string | undefined = undefined;

        // "variable" param is the name of the Left variable
        if (variable) {
            console.log(`[IfBlock DEBUG] Checking Left Tolerance for: '${variable}'`);
            const leftTol = resolveTolerance(variable);
            if (leftTol.tolerance > 0) {
                tolerance = leftTol.tolerance;
                toleranceMode = leftTol.mode;
            }
        }

        // 2. Check Right Side Tolerance (if value is a variable {{...}})
        // Only override if Left didn't provide tolerance (or maybe preference?)
        // Let's assume Valid Config usually puts tolerance on the Target.
        // If both have tolerance, Left takes precedence (arbitrary choice, but consistent).
        if (tolerance === 0 && typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
            console.log('[IfBlock DEBUG] Checking Right Tolerance for:', value);
            const rightVarName = value.slice(2, -2).trim();
            const rightTol = resolveTolerance(rightVarName);
            if (rightTol.tolerance > 0) {
                tolerance = rightTol.tolerance;
                toleranceMode = rightTol.mode;
            }
        }

        switch (operator) {
            case '==': {
                let conditionResult = false;

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

            case '>': {
                // Algo: Left > Right
                // Tolerance: "Ideally > Right, but (Right - Tol) is acceptable"
                // Mode Lower/Symmetric: Yes, we allow dipping below Right by Tol.
                // Mode Upper: No, we strict Right.

                if (tolerance > 0) {
                    // If mode is Default(Symmetric) OR Lower, we effectively Lower the bar.
                    const effectiveRight = (toleranceMode === undefined || toleranceMode === 'symmetric' || toleranceMode === 'lower')
                        ? Number(right) - tolerance
                        : Number(right);

                    result = Number(left) > effectiveRight;
                } else {
                    result = Number(left) > Number(right);
                }
                break;
            }
            case '<': {
                // Algo: Left < Right
                // Tolerance: "Ideally < Right, but (Right + Tol) is acceptable"
                // Mode Upper/Symmetric: Yes, we allow going above Right by Tol.

                if (tolerance > 0) {
                    // If mode is Default(Symmetric) OR Upper, we effectively Raise the bar.
                    const effectiveRight = (toleranceMode === undefined || toleranceMode === 'symmetric' || toleranceMode === 'upper')
                        ? Number(right) + tolerance
                        : Number(right);

                    result = Number(left) < effectiveRight;
                } else {
                    result = Number(left) < Number(right);
                }
                break;
            }
            case '>=': {
                // Algo: Left >= Right
                // Tolerance: "Ideally >= Right, but (Right - Tol) is ok"
                // Mode Lower/Symmetric: Apply Tol.

                if (tolerance > 0) {
                    const effectiveRight = (toleranceMode === undefined || toleranceMode === 'symmetric' || toleranceMode === 'lower')
                        ? Number(right) - tolerance
                        : Number(right);

                    result = Number(left) >= effectiveRight;
                } else {
                    result = Number(left) >= Number(right);
                }
                break;
            }
            case '<=': {
                // Algo: Left <= Right
                // Tolerance: "Ideally <= Right, but (Right + Tol) is ok"
                // Mode Upper/Symmetric: Apply Tol.

                if (tolerance > 0) {
                    const effectiveRight = (toleranceMode === undefined || toleranceMode === 'symmetric' || toleranceMode === 'upper')
                        ? Number(right) + tolerance
                        : Number(right);

                    result = Number(left) <= effectiveRight;
                } else {
                    result = Number(left) <= Number(right);
                }
                break;
            }
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
