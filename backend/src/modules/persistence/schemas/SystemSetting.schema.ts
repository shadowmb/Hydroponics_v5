import mongoose, { Schema, Document } from 'mongoose';
import { softDeletePlugin, ISoftDelete } from '../plugins/softDelete.plugin';

export interface ISystemSetting extends Document, ISoftDelete {
    key: string;       // e.g., 'ai_config', 'notification_rules'
    value: any;        // JSON object with the actual settings
    category: string;  // e.g., 'ai', 'system'
    description?: string;
}

const SystemSettingSchema = new Schema<ISystemSetting>({
    key: { type: String, required: true, unique: true, index: true },
    value: { type: Schema.Types.Mixed, default: {} },
    category: { type: String, required: true, index: true },
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

SystemSettingSchema.plugin(softDeletePlugin);

export const SystemSettingModel = mongoose.model<ISystemSetting>('SystemSetting', SystemSettingSchema);
