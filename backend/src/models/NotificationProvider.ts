import mongoose, { Schema, Document } from 'mongoose';

export interface INotificationProvider extends Document {
    name: string;
    type: 'telegram' | 'email';
    config: Record<string, any>; // Stores token, chatId, smtp host, etc.
    isEnabled: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const NotificationProviderSchema = new Schema<INotificationProvider>({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['telegram', 'email'],
        required: true
    },
    config: {
        type: Schema.Types.Mixed,
        default: {}
    },
    isEnabled: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    toJSON: {
        transform: function (doc, ret) {
            delete (ret as any).__v;

            // Basic Security Masking for v1
            if (ret.config) {
                if (ret.config.token) ret.config.token = '***_MASKED_***';
                if (ret.config.password) ret.config.password = '***_MASKED_***';
                if (ret.config.apiKey) ret.config.apiKey = '***_MASKED_***';
            }
            return ret;
        }
    }
});

export const NotificationProvider = mongoose.model<INotificationProvider>('NotificationProvider', NotificationProviderSchema);
