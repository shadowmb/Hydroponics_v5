import mongoose, { Schema, Document } from 'mongoose';

export interface IAIChatShortcut extends Document {
    label: string;
    prompt: string;
    category: string;
    icon?: string;
    enabled: boolean;
    order?: number;
}

const AIChatShortcutSchema = new Schema<IAIChatShortcut>({
    label: { type: String, required: true },
    prompt: { type: String, required: true },
    category: { type: String, required: true, default: 'General' },
    icon: { type: String },
    enabled: { type: Boolean, default: true },
    order: { type: Number, default: 0 }
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

// Explicitly set collection name to 'ai_shortcuts'
export const AIChatShortcutModel = mongoose.model<IAIChatShortcut>('AIChatShortcut', AIChatShortcutSchema, 'ai_shortcuts');
