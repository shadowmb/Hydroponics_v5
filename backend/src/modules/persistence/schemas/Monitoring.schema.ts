import mongoose, { Schema, Document } from 'mongoose';
import { softDeletePlugin, ISoftDelete } from '../plugins/softDelete.plugin';

export interface IMonitoring extends Document, ISoftDelete {
    id: string;
    name: string;
    flowId: string; // Refers to ActionTemplate.id
    intervalMinutes: number;
    priority: number; // Higher number = Higher priority (or vice versa, let's say 1 is highest)
    isActive: boolean;
}

const MonitoringSchema = new Schema<IMonitoring>({
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    flowId: { type: String, required: true },
    intervalMinutes: { type: Number, required: true, min: 1 },
    priority: { type: Number, default: 10 },
    isActive: { type: Boolean, default: true }
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

MonitoringSchema.plugin(softDeletePlugin);

export const MonitoringModel = mongoose.model<IMonitoring>('Monitoring', MonitoringSchema);
