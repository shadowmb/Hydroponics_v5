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
    fields?: { key: string; label: string; default?: any; unit?: string }[];
    optionalAction?: {
        label: string;
        description?: string;
        command: string;
        params?: Record<string, any>;
        instructions?: string;
    };
}

export interface CalibrationStrategy {
    id: string;
    name: string;
    description: string;
    category: 'SENSOR' | 'ACTUATOR' | 'BOTH';
    capabilities?: string[];
    compatibility: string[];
    storageSchema: Record<string, any>;
    wizard: {
        component: string;
        steps: WizardStep[];
        formula?: string;
    };
}
