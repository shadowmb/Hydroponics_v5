import mongoose, { Schema, Document } from 'mongoose';

export interface INotificationChannel extends Document {
    name: string;        // e.g. "Critical Alerts", "Daily Report"
    description?: string;
    providerIds: string[]; // List of NotificationProvider IDs linked to this channel
    isSystem: boolean;     // If true, cannot be deleted (e.g. "Default")
    createdAt: Date;
    updatedAt: Date;
}

const NotificationChannelSchema = new Schema<INotificationChannel>({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: { type: String },
    providerIds: [{
        type: Schema.Types.ObjectId,
        ref: 'NotificationProvider'
    }],
    isSystem: {
        type: Boolean,
        default: false
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

export const NotificationChannel = mongoose.model<INotificationChannel>('NotificationChannel', NotificationChannelSchema);
