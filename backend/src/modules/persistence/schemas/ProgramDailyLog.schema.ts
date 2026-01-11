import mongoose, { Schema, Document } from 'mongoose';
import { softDeletePlugin, ISoftDelete } from '../plugins/softDelete.plugin';

export type LogEventType = 'WINDOW_EVENT' | 'TRIGGER_MATCH' | 'TRIGGER_SKIP' | 'FLOW_EXECUTED' | 'ERROR' | 'INFO' | 'WARNING' | 'TRIGGER_EVALUATION';

export interface ILogEvent {
    timestamp: Date;
    type: LogEventType;
    message: string;
    metadata?: Record<string, any>; // Flexible metadata (sensor values, window names, etc)
    executionSessionId?: string; // Link to detailed execution session if applicable
}

export interface IProgramDailyLog extends Document, ISoftDelete {
    programId: string;
    date: string; // YYYY-MM-DD
    isVisible: boolean; // For "visual clear" functionality
    events: ILogEvent[];
}

const LogEventSchema = new Schema({
    timestamp: { type: Date, required: true, default: Date.now },
    type: {
        type: String,
        enum: ['WINDOW_EVENT', 'TRIGGER_MATCH', 'TRIGGER_SKIP', 'FLOW_EXECUTED', 'ERROR', 'INFO', 'WARNING', 'TRIGGER_EVALUATION'],
        required: true
    },
    message: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
    executionSessionId: { type: String }
}, { _id: false });

const ProgramDailyLogSchema = new Schema<IProgramDailyLog>({
    programId: { type: String, required: true, index: true },
    date: { type: String, required: true, index: true }, // Format: YYYY-MM-DD
    isVisible: { type: Boolean, default: true },
    events: [LogEventSchema]
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

// Composite index for fast lookups per program per day
ProgramDailyLogSchema.index({ programId: 1, date: 1 }, { unique: true });

ProgramDailyLogSchema.plugin(softDeletePlugin);

export const ProgramDailyLogModel = mongoose.model<IProgramDailyLog>('ProgramDailyLog', ProgramDailyLogSchema);
