export type ActiveProgramStatus = 'loaded' | 'ready' | 'running' | 'paused' | 'stopped' | 'completed';
export type ScheduleItemStatus = 'pending' | 'running' | 'completed' | 'skipped' | 'failed';

export interface IActiveScheduleItem {
    _id: string;
    time: string;
    cycleId: string;
    cycleName?: string;
    cycleDescription?: string;
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
}
