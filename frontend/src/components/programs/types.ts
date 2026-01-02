/**
 * Types for Advanced Programs UI
 */

export type ProgramType = 'BASIC' | 'ADVANCED';
export type TriggerOperator = '>' | '<' | '>=' | '<=' | '=' | '!=' | 'between';
export type TriggerBehavior = 'continue' | 'break';
export type DataSource = 'cached' | 'live';

export interface ITrigger {
    id: string;
    sensorId: string;
    operator: TriggerOperator;
    value: number;
    valueMax?: number;
    flowId?: string;    // Deprecated
    flowIds?: string[]; // New
    behavior: TriggerBehavior;
}

export interface ITimeWindow {
    id: string;
    name: string;
    startTime: string;
    endTime: string;
    checkInterval: number;
    dataSource: DataSource;
    triggers: ITrigger[];
    fallbackFlowId?: string;    // Deprecated
    fallbackFlowIds?: string[]; // New
}

export interface IAdvancedProgram {
    id?: string;
    name: string;
    description?: string;
    type: ProgramType;
    isActive: boolean;
    minCycleInterval: number;
    schedule: any[];  // For BASIC mode
    windows: ITimeWindow[];  // For ADVANCED mode
}

// Sensor info for dropdown
export interface ISensorOption {
    id: string;
    name: string;
    type: string;
    unit?: string;
    categoryGroup?: string;
}
