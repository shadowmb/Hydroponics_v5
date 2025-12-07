

export interface ValidationRule {
    field: string;
    required?: boolean;
    validate?: (value: any, context?: any) => boolean;
    message: string;
}

export const BlockValidationRules: Record<string, ValidationRule[]> = {
    'SENSOR_READ': [
        { field: 'deviceId', required: true, message: 'Device is required' },
        { field: 'variable', required: true, message: 'Output variable is required' }
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
        {
            field: 'maxIterations',
            validate: (val) => val > 0,
            message: 'Max iterations must be positive'
        }
    ]
};

export const CommonRules = {
    VariableFormat: (val: string) => /^{{[a-zA-Z0-9_]+}}$/.test(val) || /^[a-zA-Z0-9_]+$/.test(val),
};
