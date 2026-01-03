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

export interface IActiveProgram {
    _id: string;
    sourceProgramId: string;
    name: string;
    status: ActiveProgramStatus;
    minCycleInterval: number;
    startTime?: string;
    endTime?: string;
    schedule: IActiveScheduleItem[];
    currentScheduleItemId?: string;
    createdAt: string;
    updatedAt: string;
    // Advanced Mode Fields
    windows?: any[]; // keeping as any for now to avoid circular deps with ITimeWindow if complex
    windowsState?: IWindowState[];
}

export interface IWindowState {
    windowId: string;
    status: 'pending' | 'active' | 'completed' | 'skipped';
    triggersExecuted: string[];
    lastCheck?: Date;
    skipUntil?: Date;
}
