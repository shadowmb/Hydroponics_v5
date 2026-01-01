import mongoose, { Schema, Document } from 'mongoose';
import { ProgramType, ITimeWindow } from './Program.schema';

export type ActiveProgramStatus = 'loaded' | 'ready' | 'running' | 'paused' | 'stopped' | 'completed' | 'scheduled';
export type WindowStatus = 'pending' | 'active' | 'completed' | 'skipped';

export interface IActiveScheduleItem {
    _id?: string;
    time: string; // HH:mm
    name: string; // Event Name
    description?: string; // Event Description
    cycleId: string;
    cycleName?: string; // Snapshot of cycle name (Legacy/Internal)
    cycleDescription?: string; // Snapshot of cycle description (Legacy/Internal)
    steps: {
        flowId: string;
        overrides: Record<string, any>;
    }[];
    overrides: Record<string, any>; // Variable overrides for this execution
    status: 'pending' | 'running' | 'completed' | 'skipped' | 'failed';
    skipUntil?: Date; // If skipped, until when
}

// --- Advanced Mode: Window State ---
export interface IWindowState {
    windowId: string;
    status: WindowStatus;
    triggersExecuted: string[];  // IDs of executed triggers
    lastCheck?: Date;
}

export interface IActiveProgram extends Document {
    sourceProgramId: string; // Reference to the template Program
    name: string; // Snapshot of name
    status: ActiveProgramStatus;
    minCycleInterval: number; // Minutes
    startTime?: Date;
    endTime?: Date;

    // Program Type (BASIC or ADVANCED)
    type?: ProgramType;

    // BASIC mode: schedule items
    schedule: IActiveScheduleItem[];
    currentScheduleItemId?: string; // ID of the currently running item

    // ADVANCED mode: window states (runtime tracking)
    windows?: ITimeWindow[];  // Snapshot from template
    windowsState?: IWindowState[];  // Runtime state
    dayCompleteEmitted?: boolean;  // Prevent duplicate day_complete events
}

const ActiveScheduleItemSchema = new Schema<IActiveScheduleItem>({
    time: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String },
    cycleId: { type: String, required: true },
    cycleName: { type: String },
    cycleDescription: { type: String },
    steps: [{
        flowId: { type: String, required: true },
        overrides: { type: Schema.Types.Mixed, default: {} }
    }],
    overrides: { type: Schema.Types.Mixed, default: {} },
    status: {
        type: String,
        enum: ['pending', 'running', 'completed', 'skipped', 'failed'],
        default: 'pending'
    },
    skipUntil: { type: Date }
});

// --- Window State Sub-Schema (Advanced Mode) ---
const WindowStateSchema = new Schema({
    windowId: { type: String, required: true },
    status: { type: String, enum: ['pending', 'active', 'completed', 'skipped'], default: 'pending' },
    triggersExecuted: [{ type: String }],
    lastCheck: { type: Date }
}, { _id: false });

const ActiveProgramSchema = new Schema<IActiveProgram>({
    sourceProgramId: { type: String, required: true },
    name: { type: String, required: true },
    status: {
        type: String,
        enum: ['loaded', 'ready', 'running', 'paused', 'stopped', 'completed', 'scheduled'],
        default: 'loaded'
    },
    minCycleInterval: { type: Number, default: 0 },
    startTime: { type: Date },
    endTime: { type: Date },

    // Program Type
    type: { type: String, enum: ['BASIC', 'ADVANCED'], default: 'BASIC' },

    // BASIC mode
    schedule: [ActiveScheduleItemSchema],
    currentScheduleItemId: { type: String },

    // ADVANCED mode
    windows: { type: Schema.Types.Mixed },  // Snapshot of ITimeWindow[]
    windowsState: [WindowStateSchema],
    dayCompleteEmitted: { type: Boolean, default: false }  // Prevent duplicate day_complete events
}, {
    timestamps: true,
    toJSON: {
        transform: (doc, ret: any) => {
            delete ret._id;
            delete ret.__v;
            return ret;
        }
    }
});

export const ActiveProgramModel = mongoose.model<IActiveProgram>('ActiveProgram', ActiveProgramSchema);
