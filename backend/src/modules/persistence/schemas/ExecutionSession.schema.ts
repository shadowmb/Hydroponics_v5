import mongoose, { Schema, Document } from 'mongoose';
import { softDeletePlugin, ISoftDelete } from '../plugins/softDelete.plugin';

export interface IExecutionSession extends Document, ISoftDelete {
    programId: string;
    startTime: Date;
    endTime?: Date;
    status: 'idle' | 'loaded' | 'running' | 'completed' | 'failed' | 'error' | 'paused' | 'stopped';
    logs: any[];
    context: any; // Snapshot of execution context
}

const ExecutionSessionSchema = new Schema<IExecutionSession>({
    programId: { type: String, required: true, index: true },
    startTime: { type: Date, required: true, index: true },
    endTime: { type: Date },
    status: {
        type: String,
        enum: ['idle', 'loaded', 'running', 'completed', 'failed', 'error', 'paused', 'stopped'],
        required: true,
        index: true
    },
    logs: { type: [Object], default: [] },
    context: { type: Schema.Types.Mixed, default: {} }
}, {
    timestamps: true, // Adds createdAt, updatedAt
    toJSON: {
        transform: (doc, ret: any) => {
            delete ret._id;
            delete ret.__v;
            return ret;
        }
    }
});

// Indexes
ExecutionSessionSchema.index({ createdAt: -1 }); // For recent sessions
ExecutionSessionSchema.index({ programId: 1, startTime: -1 }); // For program history

ExecutionSessionSchema.plugin(softDeletePlugin);

export const ExecutionSessionModel = mongoose.model<IExecutionSession>('ExecutionSession', ExecutionSessionSchema);
