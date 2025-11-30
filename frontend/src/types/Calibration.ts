export interface WizardStep {
    type: 'input' | 'measure' | 'action' | 'set_limit' | 'select';
    key?: string;
    label: string;
    default?: any;
    unit?: string;
    command?: string;
    params?: Record<string, any>;
    refKey?: string;
    instructions?: string;
    options?: string[];
}

export interface CalibrationStrategy {
    id: string;
    name: string;
    description: string;
    category: 'SENSOR' | 'ACTUATOR' | 'BOTH';
    compatibility: string[];
    storageSchema: Record<string, any>;
    wizard: {
        component: string;
        steps: WizardStep[];
        formula?: string;
    };
}
