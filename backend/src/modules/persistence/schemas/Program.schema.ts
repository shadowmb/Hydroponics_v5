import mongoose, { Schema, Document } from 'mongoose';
import { softDeletePlugin, ISoftDelete } from '../plugins/softDelete.plugin';

export interface IProgram extends Document, ISoftDelete {
    id: string;
    name: string;
    description?: string;
    blocks: any[]; // Array of Block definitions
    triggers: any[]; // Array of Trigger definitions
    active: boolean;
}

export const ProgramSchema = new Schema<IProgram>({
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    blocks: { type: [Object], default: [] },
    triggers: { type: [Object], default: [] },
    active: { type: Boolean, default: true }
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
