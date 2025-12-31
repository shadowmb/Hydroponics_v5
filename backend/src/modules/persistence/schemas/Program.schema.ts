import mongoose, { Schema, Document } from 'mongoose';
import { softDeletePlugin, ISoftDelete } from '../plugins/softDelete.plugin';

// --- Advanced Program Types ---
export type ProgramType = 'BASIC' | 'ADVANCED';
export type TriggerOperator = '>' | '<' | '>=' | '<=' | '=' | '!=' | 'between';
export type TriggerBehavior = 'continue' | 'break';
export type DataSource = 'cached' | 'live';

export interface ITrigger {
    id: string;
    sensorId: string;
    operator: TriggerOperator;
    value: number;
    valueMax?: number;  // For 'between' operator
    flowId: string;
    behavior: TriggerBehavior;
}

export interface ITimeWindow {
    id: string;
    name: string;
    startTime: string;  // "HH:mm"
    endTime: string;    // "HH:mm"
    checkInterval: number;  // minutes
    dataSource: DataSource;
    triggers: ITrigger[];
    fallbackFlowId?: string;
}

export interface IProgram extends Document, ISoftDelete {
    id: string;
    name: string;
    description?: string;
    isActive: boolean;
    minCycleInterval: number;

    // Program Type (defaults to BASIC for backward compatibility)
    type?: ProgramType;

    // BASIC mode: existing schedule array
    schedule: {
        time: string; // HH:mm
        name: string;
        description?: string;
        steps: {
            flowId: string;
            overrides: Record<string, any>;
        }[];
        overrides?: Record<string, any>;
    }[];

    // ADVANCED mode: time windows with triggers
    windows?: ITimeWindow[];
}

// --- Trigger Sub-Schema ---
const TriggerSchema = new Schema({
    id: { type: String, required: true },
    sensorId: { type: String, required: true },
    operator: { type: String, enum: ['>', '<', '>=', '<=', '=', '!=', 'between'], required: true },
    value: { type: Number, required: true },
    valueMax: { type: Number },  // For 'between' operator
    flowId: { type: String, required: true },
    behavior: { type: String, enum: ['continue', 'break'], default: 'break' }
}, { _id: false });

// --- Time Window Sub-Schema ---
const TimeWindowSchema = new Schema({
    id: { type: String, required: true },
    name: { type: String, required: true },
    startTime: { type: String, required: true },  // "HH:mm"
    endTime: { type: String, required: true },    // "HH:mm"
    checkInterval: { type: Number, default: 5 },  // minutes
    dataSource: { type: String, enum: ['cached', 'live'], default: 'cached' },
    triggers: [TriggerSchema],
    fallbackFlowId: { type: String }
}, { _id: false });

// --- Main Program Schema ---
const ProgramSchema = new Schema<IProgram>({
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    isActive: { type: Boolean, default: false },
    minCycleInterval: { type: Number, default: 60 },

    // Program Type (BASIC = existing behavior, ADVANCED = time windows)
    type: { type: String, enum: ['BASIC', 'ADVANCED'], default: 'BASIC' },

    // BASIC mode schedule
    schedule: [{
        time: { type: String, required: true },
        name: { type: String, required: true, default: 'Event' },
        description: { type: String },
        steps: [{
            flowId: { type: String, required: true },
            overrides: { type: Schema.Types.Mixed, default: {} }
        }],
        overrides: { type: Schema.Types.Mixed, default: {} }
    }],

    // ADVANCED mode windows
    windows: [TimeWindowSchema]
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

ProgramSchema.plugin(softDeletePlugin);

export const ProgramModel = mongoose.model<IProgram>('Program', ProgramSchema);
