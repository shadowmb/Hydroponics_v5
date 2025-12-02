import mongoose, { Schema, Document } from 'mongoose';
import { softDeletePlugin, ISoftDelete } from '../plugins/softDelete.plugin';

export interface ICycleSession extends Document, ISoftDelete {
    id: string;
    cycleId: string;
    startTime: Date;
    endTime?: Date;
    status: 'running' | 'completed' | 'failed' | 'stopped' | 'paused';
    currentStepIndex: number;
    currentFlowSessionId?: string; // ID of the underlying Automation Session
    logs: any[];
    context: any; // Snapshot of cycle context (if any)
}

const CycleSessionSchema = new Schema<ICycleSession>({
    cycleId: { type: String, required: true, index: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    status: { type: String, enum: ['running', 'completed', 'failed', 'stopped', 'paused'], default: 'running' },
    currentStepIndex: { type: Number, default: 0 },
    currentFlowSessionId: { type: String },
    logs: { type: [Object], default: [] },
    context: { type: Schema.Types.Mixed, default: {} }
}, {
    timestamps: true,
    toJSON: {
        transform: (doc, ret: any) => {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
            return ret;
        }
    }
});

CycleSessionSchema.plugin(softDeletePlugin);

export const CycleSessionModel = mongoose.model<ICycleSession>('CycleSession', CycleSessionSchema);
