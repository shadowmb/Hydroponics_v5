import mongoose, { Schema, Document } from 'mongoose';
import { softDeletePlugin, ISoftDelete } from '../plugins/softDelete.plugin';

export interface IFlow extends Document, ISoftDelete {
    id: string;
    name: string;
    description?: string;
    mode: 'SIMPLE' | 'EXPERT';
    nodes: any[];
    edges: any[];
    inputs?: {
        name: string;
        type: 'number' | 'string' | 'boolean';
        default?: any;
        description?: string;
    }[];
    variables?: {
        id: string;
        name: string;
        type: 'number' | 'string' | 'boolean';
        value?: any;
        scope: 'local' | 'global';
        unit?: string;
    }[];
    isActive: boolean;
}

export const FlowSchema = new Schema<IFlow>({
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    mode: { type: String, enum: ['SIMPLE', 'EXPERT'], default: 'SIMPLE' },
    nodes: { type: [Object], default: [] },
    edges: { type: [Object], default: [] },
    inputs: [{
        name: { type: String, required: true },
        type: { type: String, enum: ['number', 'string', 'boolean'], required: true },
        default: { type: Schema.Types.Mixed },
        description: { type: String }
    }],
    variables: [{
        id: { type: String, required: true },
        name: { type: String, required: true },
        type: { type: String, enum: ['number', 'string', 'boolean'], required: true },
        value: { type: Schema.Types.Mixed },
        scope: { type: String, enum: ['local', 'global'], required: true },
        unit: { type: String }
    }],
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

FlowSchema.plugin(softDeletePlugin);

export const FlowModel = mongoose.model<IFlow>('Flow', FlowSchema);
