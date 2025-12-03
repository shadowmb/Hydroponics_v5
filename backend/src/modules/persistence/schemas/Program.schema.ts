import mongoose, { Schema, Document } from 'mongoose';
import { softDeletePlugin, ISoftDelete } from '../plugins/softDelete.plugin';

export interface IProgram extends Document, ISoftDelete {
    id: string;
    name: string;
    description?: string;
    isActive: boolean;
    schedule: {
        time: string; // HH:mm
        cycleId: string; // Refers to Cycle.id
        overrides?: Record<string, any>;
    }[];
}

const ProgramSchema = new Schema<IProgram>({
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    isActive: { type: Boolean, default: false },
    schedule: [{
        time: { type: String, required: true }, // Validation regex could be added
        cycleId: { type: String, required: true },
        overrides: { type: Schema.Types.Mixed }
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
