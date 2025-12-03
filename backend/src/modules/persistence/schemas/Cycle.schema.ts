import mongoose, { Schema, Document } from 'mongoose';
import { softDeletePlugin, ISoftDelete } from '../plugins/softDelete.plugin';

export interface ICycle extends Document, ISoftDelete {
    id: string;
    name: string;
    description?: string;
    steps: {
        flowId: string; // Refers to ActionTemplate.id
        overrides: Record<string, any>;
    }[];
}

const CycleSchema = new Schema<ICycle>({
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    steps: [{
        flowId: { type: String, required: true },
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

CycleSchema.plugin(softDeletePlugin);

export const CycleModel = mongoose.model<ICycle>('Cycle', CycleSchema);
