export type FieldType = 'text' | 'number' | 'boolean' | 'select' | 'device';

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
            value: {
                label: 'State',
                type: 'select',
                options: [
                    { label: 'ON', value: true },
                    { label: 'OFF', value: false }
                ],
                defaultValue: false
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
                type: 'text',
                placeholder: 'e.g. current_temp',
                description: 'Variable name to store the reading'
            }
        }
    },
    CONDITION: {
        label: 'Condition (IF)',
        fields: {
            variable: {
                label: 'Variable',
                type: 'text',
                placeholder: 'e.g. current_temp'
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
    }
};
