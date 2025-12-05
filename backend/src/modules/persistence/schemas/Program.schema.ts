import mongoose, { Schema, Document } from 'mongoose';
import { softDeletePlugin, ISoftDelete } from '../plugins/softDelete.plugin';

export interface IProgram extends Document, ISoftDelete {
    id: string;
    name: string;
    description?: string;
    isActive: boolean;
    minCycleInterval: number;
    schedule: {
        time: string; // HH:mm
        name: string;
        description?: string;
        // cycleId: string; // Removed
        steps: {
            flowId: string;
            overrides: Record<string, any>;
        }[];
        overrides?: Record<string, any>;
    }[];
}

const ProgramSchema = new Schema<IProgram>({
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    isActive: { type: Boolean, default: false },
    minCycleInterval: { type: Number, default: 60 },
    schedule: [{
        time: { type: String, required: true }, // Validation regex could be added
        name: { type: String, required: true, default: 'Event' },
        description: { type: String },
        // cycleId: { type: String, required: true }, // Removed in favor of embedded steps
        steps: [{
            flowId: { type: String, required: true },
            overrides: { type: Schema.Types.Mixed, default: {} }
        }],
        overrides: { type: Schema.Types.Mixed, default: {} }
    }]
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
