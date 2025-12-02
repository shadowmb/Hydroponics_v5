import mongoose, { Schema, Document } from 'mongoose';
import { softDeletePlugin, ISoftDelete } from '../plugins/softDelete.plugin';

export interface IProgram extends Document, ISoftDelete {
    id: string;
    name: string;
    description?: string;
    mode: 'SIMPLE' | 'EXPERT';
    nodes: any[];
    edges: any[];
    isActive: boolean;
}

export const ProgramSchema = new Schema<IProgram>({
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    mode: { type: String, enum: ['SIMPLE', 'EXPERT'], default: 'SIMPLE' },
    nodes: { type: [Object], default: [] },
    edges: { type: [Object], default: [] },
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

ProgramSchema.plugin(softDeletePlugin);

export const ProgramModel = mongoose.model<IProgram>('Program', ProgramSchema);
