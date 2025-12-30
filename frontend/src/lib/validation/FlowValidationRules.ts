


import { validateBlockStrategy } from '@shared/strategies/StrategyRegistry';

export interface ValidationRule {
    field: string;
    required?: boolean;
    validate?: (value: any, data?: any, context?: any) => boolean;
    message: string;
}

export const BlockValidationRules: Record<string, ValidationRule[]> = {
    'SENSOR_READ': [
        { field: 'deviceId', required: true, message: 'Device is required' },
        { field: 'variable', required: true, message: 'Output variable is required' },
        {
            field: 'variable',
            message: 'Incompatible Units',
            validate: (variableId, data, context) => {
                if (!context || !data.deviceId || !variableId) return true;

                const { devices, variables, deviceTemplates } = context;
                const device = devices.get(data.deviceId);
                const variable = variables.find((v: any) => v.id === variableId);

                // Basic checks
                if (!device || !variable) return true;

                // Strict Unit Check: If the variable has NO unit, but we are in a sensor context, fail.
                // WE want to force the user to select a unit for the variable.
                if (!variable.unit) {
                    return false; // Error: Variable has no unit defined.
                }

                // Prepare context for Strategy Registry to resolve 'any' strategies
                // (e.g. linear strategy falls back to device default unit)
                const driverId = typeof device.config?.driverId === 'object' ? (device.config.driverId as any)._id : device.config?.driverId;
                const template = deviceTemplates?.find((t: any) => t._id === driverId || t._id === device.driverId);

                // Use Centralized Validation
                // data.readingType holds the strategyId for SENSOR_READ
                // If readingType is missing (legacy), passed as undefined -> validateBlockStrategy handles it
                const result = validateBlockStrategy(data.readingType, variable.unit, { device, template });

                return result.isValid;
            }
        }
    ],
    'ACTUATOR_SET': [
        { field: 'deviceId', required: true, message: 'Device is required' },
        { field: 'action', required: true, message: 'Action is required' }
    ],
    'WAIT': [
        { field: 'duration', required: true, message: 'Duration is required' },
        {
            field: 'duration',
            validate: (val) => val > 0,
            message: 'Duration must be positive'
        }
    ],
    'IF': [
        { field: 'variable', required: true, message: 'Variable to check is required' },
        { field: 'operator', required: true, message: 'Operator is required' },
        { field: 'value', required: true, message: 'Comparison value is required' }
    ],
    'LOOP': [
        {
            field: 'variable',
            required: false,
            message: 'Variable is required for WHILE loops',
            validate: (val, data) => data?.loopType !== 'WHILE' || (!!val)
        },
        {
            field: 'operator',
            required: false,
            message: 'Operator is required for WHILE loops',
            validate: (val, data) => data?.loopType !== 'WHILE' || (!!val)
        },
        {
            field: 'value',
            required: false,
            message: 'Value is required for WHILE loops',
            validate: (val, data) => data?.loopType !== 'WHILE' || (val !== undefined && val !== '')
        },
        // --- Limit Mode Validation ---
        {
            field: 'limitMode',
            required: false, // Defaults to COUNT if missing
            message: 'Limit Mode is invalid',
            validate: (val) => !val || ['COUNT', 'TIME'].includes(val)
        },
        {
            field: 'count',
            message: 'Invalid Iterations count (must be positive number or compatible variable)',
            validate: (val, data, context) => {
                const mode = data?.limitMode || 'COUNT';
                if (mode !== 'COUNT') return true;

                // 1. Check if Variable
                if (typeof val === 'string' && val.startsWith('{{')) {
                    if (!context || !context.variables) return true; // Can't validate without context

                    const varName = val.slice(2, -2);
                    const variable = context.variables.find((v: any) => v.id === varName);

                    if (variable && variable.unit) {
                        // Strict Whitelist: Only allow explicit counting units
                        // The user requested: "only if it is iteration do not give error"
                        const allowedUnits = ['count', 'iterations', 'integer', 'index', '#'];

                        // If the variable has a unit, it MUST be one of the allowed counting types.
                        // Any physical unit (C, L, pH) or other generic unit will fail.
                        if (!allowedUnits.includes(variable.unit)) {
                            return false;
                        }
                    }
                    return true;
                }

                // 2. Check if Number
                return Number(val) > 0;
            }
        },
        {
            field: 'timeout',
            message: 'Timeout is required for Time mode',
            validate: (val, data) => {
                const mode = data?.limitMode || 'COUNT';
                if (mode === 'TIME') {
                    return val > 0;
                }
                return true; // Ignore if Count mode
            }
        },
        {
            field: 'interval',
            message: 'Interval must be positive',
            validate: (val) => !val || val >= 0
        }
    ]
};

export const CommonRules = {
    VariableFormat: (val: string) => /^{{[a-zA-Z0-9_]+}}$/.test(val) || /^[a-zA-Z0-9_]+$/.test(val),
};
