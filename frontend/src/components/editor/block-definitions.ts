export type FieldType = 'text' | 'number' | 'boolean' | 'select' | 'device' | 'variable';

export interface FieldDefinition {
    label: string;
    type: FieldType;
    placeholder?: string;
    options?: { label: string; value: string | number | boolean }[];
    defaultValue?: any;
    description?: string;
}

export interface BlockDefinition {
    label: string;
    fields: Record<string, FieldDefinition>;
}

export const BLOCK_DEFINITIONS: Record<string, BlockDefinition> = {
    LOG: {
        label: 'Log Message',
        fields: {
            message: {
                label: 'Message',
                type: 'text',
                placeholder: 'Enter log message',
                defaultValue: 'Program step executed'
            },
            level: {
                label: 'Log Level',
                type: 'select',
                options: [
                    { label: 'Info', value: 'info' },
                    { label: 'Warning', value: 'warn' },
                    { label: 'Error', value: 'error' }
                ],
                defaultValue: 'info'
            }
        }
    },
    WAIT: {
        label: 'Wait / Delay',
        fields: {
            duration: {
                label: 'Duration (ms)',
                type: 'number',
                defaultValue: 1000,
                description: 'Time to wait in milliseconds'
            }
        }
    },
    ACTUATOR_SET: {
        label: 'Control Device',
        fields: {
            deviceId: {
                label: 'Device',
                type: 'device',
                placeholder: 'Select a device'
            },
            action: {
                label: 'Action',
                type: 'select',
                options: [
                    { label: 'Turn ON', value: 'ON' },
                    { label: 'Turn OFF', value: 'OFF' },
                    { label: 'Pulse ON', value: 'PULSE_ON' },
                    { label: 'Pulse OFF', value: 'PULSE_OFF' }
                    // Dynamic options like 'DOSE' will be added by PropertiesPanel
                ],
                // defaultValue: 'ON' - Removed to force manual selection
            },
            duration: {
                label: 'Duration (ms)',
                type: 'number', // Can be toggled to variable in UI
                placeholder: 'e.g. 5000',
                description: 'Time to keep the state'
            },
            amount: {
                label: 'Amount',
                type: 'number', // Can be toggled to variable in UI
                placeholder: 'e.g. 100',
                description: 'Quantity to dose'
            }
        }
    },
    SENSOR_READ: {
        label: 'Read Sensor',
        fields: {
            deviceId: {
                label: 'Sensor',
                type: 'device',
                placeholder: 'Select a sensor'
            },
            variable: {
                label: 'Save to Variable',
                type: 'variable',
                placeholder: 'Select variable',
                description: 'Variable to store the reading'
            }
        }
    },
    IF: {
        label: 'Condition (IF)',
        fields: {
            variable: {
                label: 'Variable',
                type: 'variable',
                placeholder: 'Select variable'
            },
            operator: {
                label: 'Operator',
                type: 'select',
                options: [
                    { label: 'Equals (==)', value: '==' },
                    { label: 'Not Equals (!=)', value: '!=' },
                    { label: 'Greater Than (>)', value: '>' },
                    { label: 'Less Than (<)', value: '<' },
                    { label: 'Greater/Equal (>=)', value: '>=' },
                    { label: 'Less/Equal (<=)', value: '<=' }
                ],
                defaultValue: '=='
            },
            value: {
                label: 'Comparison Value',
                type: 'text', // Can be number or string, keep text for flexibility
                placeholder: 'Value to compare against'
            }
        }
    },
    LOOP: {
        label: 'Loop',
        fields: {
            loopType: {
                label: 'Loop Type',
                type: 'select',
                options: [
                    { label: 'Repeat X Times', value: 'COUNT' },
                    { label: 'While Condition is True', value: 'WHILE' }
                ],
                defaultValue: 'COUNT'
            },
            count: {
                label: 'Iterations',
                type: 'number',
                placeholder: 'e.g. 5',
                defaultValue: 1,
                description: 'Number of times to repeat'
            },
            maxIterations: {
                label: 'Max Iterations (Safety)',
                type: 'number',
                placeholder: 'e.g. 10',
                defaultValue: 10,
                description: 'Safety limit for WHILE loops'
            },
            variable: {
                label: 'Variable',
                type: 'variable',
                placeholder: 'Select variable'
            },
            operator: {
                label: 'Operator',
                type: 'select',
                options: [
                    { label: 'Equals (==)', value: '==' },
                    { label: 'Not Equals (!=)', value: '!=' },
                    { label: 'Greater Than (>)', value: '>' },
                    { label: 'Less Than (<)', value: '<' },
                    { label: 'Greater/Equal (>=)', value: '>=' },
                    { label: 'Less/Equal (<=)', value: '<=' }
                ],
                defaultValue: '=='
            },
            value: {
                label: 'Comparison Value',
                type: 'text',
                placeholder: 'Value to compare against'
            }
        }
    }
};
