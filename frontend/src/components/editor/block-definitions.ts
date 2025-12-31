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
    description?: string;
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
                label: 'Duration (s)',
                type: 'number',
                defaultValue: 1,
                description: 'Time to wait in seconds'
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
            strategy: {
                label: 'Control Strategy',
                type: 'select',
                options: [], // populated dynamically
                defaultValue: 'actuator_manual'
            },
            action: {
                label: 'Action',
                type: 'select',
                options: [
                    { label: 'Turn ON', value: 'ON' },
                    { label: 'Turn OFF', value: 'OFF' },
                    { label: 'Pulse ON', value: 'PULSE_ON' },
                    { label: 'Pulse OFF', value: 'PULSE_OFF' }
                ],
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
            },
            amountUnit: {
                label: 'Unit',
                type: 'select',
                options: [
                    { label: 'Milliliters (ml)', value: 'ml' },
                    { label: 'Liters (l)', value: 'l' },
                    { label: 'Gallons (gal)', value: 'gal' }
                ],
                defaultValue: 'ml',
                description: 'Unit of measurement'
            },
            // Error Handling Policy
            retryCount: {
                label: 'Retry Count',
                type: 'number',
                defaultValue: 3,
                description: 'Retries before failing'
            },
            retryDelay: {
                label: 'Retry Delay (ms)',
                type: 'number',
                defaultValue: 1000,
                description: 'Time between retries'
            },
            onFailure: {
                label: 'On Failure',
                type: 'select',
                options: [
                    { label: 'Stop Flow', value: 'STOP' },
                    { label: 'Pause Flow', value: 'PAUSE' },
                    { label: 'Continue (Ignore)', value: 'CONTINUE' },
                    { label: 'Jump to Label', value: 'GOTO_LABEL' }
                ],
                defaultValue: 'STOP',
                description: 'Action if device fails'
            },
            errorTargetLabel: {
                label: 'Error Handler Label',
                type: 'text',
                placeholder: 'e.g. SAFE_MODE',
                description: 'Label to jump to on failure'
            },
            errorNotification: {
                label: 'Send Notification',
                type: 'boolean',
                defaultValue: false,
                description: 'Alert on failure'
            },
            notificationChannelId: {
                label: 'Notification Channel',
                type: 'select',
                options: [], // populated dynamically
                defaultValue: '',
                description: 'Channel to send alerts to'
            },
            notificationMode: {
                label: 'Notification Mode',
                type: 'select',
                options: [
                    { label: 'Auto (Errors Only)', value: 'AUTO' },
                    { label: 'Always Alert', value: 'ALWAYS' },
                    { label: 'Mute', value: 'MUTE' }
                ],
                defaultValue: 'AUTO'
            },
            revertOnStop: {
                label: 'Safety Revert on Stop',
                type: 'boolean',
                defaultValue: true,
                description: 'Revert to initial state if flow stops/fails'
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
            readingType: {
                label: 'Read As',
                type: 'select',
                options: [], // populated dynamically
                placeholder: 'Default (Distance)',
                defaultValue: 'linear'
            },
            variable: {
                label: 'Save to Variable',
                type: 'variable',
                placeholder: 'Select variable',
                description: 'Variable to store the reading'
            },
            // Error Handling Policy
            retryCount: {
                label: 'Retry Count',
                type: 'number',
                defaultValue: 3,
                description: 'Number of retries before failing'
            },
            retryDelay: {
                label: 'Retry Delay (ms)',
                type: 'number',
                defaultValue: 1000,
                description: 'Time between retries'
            },
            onFailure: {
                label: 'On Failure',
                type: 'select',
                options: [
                    { label: 'Stop Flow', value: 'STOP' },
                    { label: 'Pause Flow', value: 'PAUSE' },
                    { label: 'Continue (Ignore)', value: 'CONTINUE' },
                    { label: 'Jump to Label', value: 'GOTO_LABEL' }
                ],
                defaultValue: 'STOP',
                description: 'Action to take if all retries fail'
            },
            errorTargetLabel: {
                label: 'Error Handler Label',
                type: 'text',
                placeholder: 'e.g. SAFE_MODE',
                description: 'Label to jump to on failure'
            },
            errorNotification: {
                label: 'Send Notification',
                type: 'boolean',
                defaultValue: false,
                description: 'Send alert on failure'
            },
            notificationChannelId: {
                label: 'Notification Channel',
                type: 'select',
                options: [],
                defaultValue: '',
                description: 'Channel to send alerts to'
            },
            notificationMode: {
                label: 'Notification Mode',
                type: 'select',
                options: [
                    { label: 'Auto (Errors Only)', value: 'AUTO' },
                    { label: 'Always Alert', value: 'ALWAYS' },
                    { label: 'Mute', value: 'MUTE' }
                ],
                defaultValue: 'AUTO'
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
            },
            // Error Handling
            onFailure: {
                label: 'On Failure (Error)',
                type: 'select',
                options: [
                    { label: 'Stop Flow', value: 'STOP' },
                    { label: 'Pause Flow', value: 'PAUSE' },
                    { label: 'Treat as False', value: 'FALSE' },
                    { label: 'Jump to Label', value: 'GOTO_LABEL' }
                ],
                defaultValue: 'STOP',
                description: 'Action if variable missing'
            },
            errorTargetLabel: {
                label: 'Error Handler Label',
                type: 'text',
                placeholder: 'e.g. SAFE_MODE',
                description: 'Label to jump to on failure'
            },
            errorNotification: {
                label: 'Send Notification',
                type: 'boolean',
                defaultValue: false,
                description: 'Alert on error'
            },
            notificationChannelId: {
                label: 'Notification Channel',
                type: 'select',
                options: [],
                defaultValue: '',
                description: 'Channel to send alerts to'
            },
            notificationMode: {
                label: 'Notification Mode',
                type: 'select',
                options: [
                    { label: 'Auto (Errors Only)', value: 'AUTO' },
                    { label: 'Always Alert', value: 'ALWAYS' },
                    { label: 'Mute', value: 'MUTE' }
                ],
                defaultValue: 'AUTO'
            }
        }
    },
    LOOP: {
        label: 'Loop',
        fields: {
            limitMode: {
                label: 'Limit Mode',
                type: 'select',
                options: [
                    { label: 'Count (Iterations)', value: 'COUNT' },
                    { label: 'Time (Duration)', value: 'TIME' }
                ],
                defaultValue: 'COUNT',
                description: 'How to limit the loop'
            },
            interval: {
                label: 'Check Interval (s)',
                type: 'number',
                placeholder: 'e.g. 1',
                defaultValue: 1,
                description: 'Delay between iterations'
            },

            // Limit Parameters (Conditional)
            count: {
                label: 'Iterations',
                type: 'number',
                placeholder: 'e.g. 5',
                defaultValue: 1,
                description: 'Stop after X iterations'
            },
            timeout: {
                label: 'Timeout (Seconds)',
                type: 'number',
                placeholder: 'e.g. 60',
                defaultValue: 60,
                description: 'Stop after X seconds'
            },

            // Stop Condition (Optional)
            variable: {
                label: 'Stop Condition Variable (Optional)',
                type: 'variable',
                placeholder: 'Select variable',
                description: 'If set, loop continues WHILE true'
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
                placeholder: 'Value to compare'
            },

            // Safety / Error Handling
            onFailure: {
                label: 'On Timeout / Error',
                type: 'select',
                options: [
                    { label: 'Stop Flow', value: 'STOP' },
                    { label: 'Pause Flow', value: 'PAUSE' },
                    { label: 'Continue (Ignore)', value: 'CONTINUE' },
                    { label: 'Jump to Label', value: 'GOTO_LABEL' }
                ],
                defaultValue: 'STOP',
                description: 'Action if loop times out or fails'
            },
            errorTargetLabel: {
                label: 'Error Handler Label',
                type: 'text',
                placeholder: 'e.g. SAFE_MODE',
                description: 'Label to jump to on failure'
            },
            errorNotification: {
                label: 'Notify on Error',
                type: 'boolean',
                defaultValue: false,
                description: 'Alert if limit reached or condition fails'
            },
            notificationChannelId: {
                label: 'Notification Channel',
                type: 'select',
                options: [],
                defaultValue: '',
                description: 'Channel to send alerts to'
            },
            notificationMode: {
                label: 'Notification Mode',
                type: 'select',
                options: [
                    { label: 'Auto (Errors Only)', value: 'AUTO' },
                    { label: 'Always Alert', value: 'ALWAYS' },
                    { label: 'Mute', value: 'MUTE' }
                ],
                defaultValue: 'AUTO'
            }
        }
    },
    'FLOW_CONTROL': {
        label: 'Flow Control',
        description: 'Manage flow execution (Jump, Label, Break)',
        fields: {
            controlType: {
                label: 'Control Type',
                type: 'select',
                options: [
                    { label: 'Label (Anchor)', value: 'LABEL' },
                    { label: 'Go To Label', value: 'GOTO' },
                    { label: 'Loop Back (Next Iteration)', value: 'LOOP_BACK' }
                ],
                defaultValue: 'LABEL'
            },
            labelName: {
                label: 'Label Name',
                type: 'text',
                placeholder: 'e.g. MyLoopStart',
                description: 'Unique name for this anchor'
            },
            targetLabel: {
                label: 'Target Label',
                type: 'text',
                placeholder: 'e.g. MyLoopStart',
                description: 'Label to jump to'
            }
        }
    }
};
