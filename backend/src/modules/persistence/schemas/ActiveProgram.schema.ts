import mongoose, { Schema, Document } from 'mongoose';

export type ActiveProgramStatus = 'loaded' | 'ready' | 'running' | 'paused' | 'stopped' | 'completed' | 'scheduled';

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

export interface IActiveProgram extends Document {
    sourceProgramId: string; // Reference to the template Program
    name: string; // Snapshot of name
    status: ActiveProgramStatus;
    minCycleInterval: number; // Minutes
    startTime?: Date;
    endTime?: Date;
    schedule: IActiveScheduleItem[];
    currentScheduleItemId?: string; // ID of the currently running item
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
    schedule: [ActiveScheduleItemSchema],
    currentScheduleItemId: { type: String }
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
