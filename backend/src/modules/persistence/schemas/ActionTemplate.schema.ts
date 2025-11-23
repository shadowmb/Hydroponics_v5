import mongoose, { Schema, Document } from 'mongoose';
import { softDeletePlugin, ISoftDelete } from '../plugins/softDelete.plugin';

export interface IActionTemplate extends Document, ISoftDelete {
    id: string;
    name: string;
    type: string; // e.g., 'ACTUATOR_SET', 'WAIT'
    defaultParams: Record<string, any>;
    description?: string;
}

const ActionTemplateSchema = new Schema<IActionTemplate>({
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    type: { type: String, required: true },
    defaultParams: { type: Schema.Types.Mixed, default: {} },
    description: { type: String }
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

ActionTemplateSchema.plugin(softDeletePlugin);

export const ActionTemplateModel = mongoose.model<IActionTemplate>('ActionTemplate', ActionTemplateSchema);
