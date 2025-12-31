import mongoose, { Schema, Document } from 'mongoose';

export interface INotificationRule extends Document {
    event: string;        // e.g. "PROGRAM_START", "CRITICAL_ERROR"
    channelId: string;    // Reference to NotificationChannel
    isEnabled: boolean;
    template?: string;    // Custom message template
    createdAt: Date;
    updatedAt: Date;
}

const NotificationRuleSchema = new Schema<INotificationRule>({
    event: {
        type: String,
        required: true,
        unique: true, // One rule per event type per system (simplification for now)
        enum: [
            'PROGRAM_START',
            'PROGRAM_STOP',
            'CYCLE_START',
            'CYCLE_COMPLETE',
            'DEVICE_OFFLINE',
            'DEVICE_ERROR',
            'CRITICAL_ERROR',
            'SYSTEM_STARTUP'
        ]
    },
    channelId: {
        type: String, // Storing as String ID for flexibility, or ObjectId
        ref: 'NotificationChannel',
        required: false // Can be null if we want to just disable or have no channel
    },
    isEnabled: {
        type: Boolean,
        default: true
    },
    template: {
        type: String,
        required: false
    }
}, {
    timestamps: true,
    toJSON: {
        transform: function (doc, ret) {
            delete (ret as any).__v;
            return ret;
        }
    }
});

export const NotificationRule = mongoose.model<INotificationRule>('NotificationRule', NotificationRuleSchema);
