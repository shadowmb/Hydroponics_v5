export type ActiveProgramStatus = 'loaded' | 'ready' | 'running' | 'paused' | 'stopped' | 'completed' | 'scheduled';
export type ScheduleItemStatus = 'pending' | 'running' | 'completed' | 'skipped' | 'failed';

export interface IActiveScheduleItem {
    _id: string;
    time: string;
    name: string;
    description?: string;
    cycleId: string;
    cycleName?: string;
    cycleDescription?: string;
    steps?: {
        flowId: string;
        overrides: Record<string, any>;
    }[];
    overrides: Record<string, any>;
    status: ScheduleItemStatus;
    skipUntil?: string; // ISO Date string
}

// Active Program Interface Updates
export interface IActiveProgram {
    _id: string;
    sourceProgramId: string;
    name: string;
    type?: 'BASIC' | 'ADVANCED';
    status: ActiveProgramStatus;
    minCycleInterval: number;
    startTime?: string;
    endTime?: string;
    schedule: IActiveScheduleItem[];
    currentScheduleItemId?: string;
    createdAt: string;
    updatedAt: string;
    // Advanced Mode Fields
    windows?: any[];
    windowsState?: IWindowState[];
    variableOverrides?: Record<string, any>;
    windowOverrides?: Record<string, Record<string, any>>;
    // Runtime execution fields
    nextCheckTime?: string; // ISO date
    forceCheckRequired?: boolean;
    currentTriggerIndex?: number;
    currentFlowId?: string;
    // Flows reference for lookup
    flows?: { id: string, name: string }[];
}

export interface IWindowState {
    windowId: string;
    status: 'pending' | 'active' | 'completed' | 'skipped' | 'interrupted';
    triggersExecuted: string[]; // IDs of triggers that are "done" (won't fire again)
    triggersExecuting?: string[]; // IDs of triggers currently running a flow
    triggerCounts?: Map<string, number>; // Map of triggerId -> execution count
    lastCheck?: Date;
    skipUntil?: Date;
}

// Variable definition from backend
export interface IVariable {
    name: string;
    type: 'string' | 'number' | 'boolean';
    default?: any;
    description?: string;
    unit?: string;
    hasTolerance?: boolean;
    flowId?: string;
    flowName?: string;
    flowDescription?: string;
}

export interface IContext {
    contextId: string;
    label: string;
    description?: string;
    variables: IVariable[];
}
