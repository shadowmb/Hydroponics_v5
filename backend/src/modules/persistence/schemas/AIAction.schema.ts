import mongoose, { Schema, Document } from 'mongoose';
import { softDeletePlugin, ISoftDelete } from '../plugins/softDelete.plugin';

export interface IAIAction extends Document, ISoftDelete {
    name: string;
    enabled: boolean;

    // 1. TRIGGER
    trigger: {
        type: 'schedule' | 'sensor';

        // Schedule specific
        cron?: string;        // "0 22 * * *"

        // Sensor specific
        sensorId?: string;
        operator?: '>' | '<' | '=' | 'range';
        value?: number;
        rangeMax?: number;    // If operator is range

        // Time Window (When trigger is valid)
        activeWindow?: {
            enabled: boolean;
            startTime: string; // "10:00"
            endTime: string;   // "12:00"
        };

        // Repetition/Frequency
        frequency?: {
            type: 'interval' | 'once' | 'daily' | 'date_range';
            intervalMinutes?: number; // Check every N minutes
            startDate?: Date;
            endDate?: Date;
        };

        cooldownMinutes?: number;
    };

    // 2. INTELLIGENCE
    payload: {
        systemPrompt: string;
        contextConfiguration?: {
            // Placeholder for future history options
        };
    };

    // 3. OUTPUT
    outputs: {
        saveInsight: boolean;
        notifyTelegram: boolean;
        notifyEmail: boolean;
    };

    lastRun?: Date;
}

const AIActionSchema = new Schema<IAIAction>({
    name: { type: String, required: true },
    enabled: { type: Boolean, default: true },

    trigger: {
        type: { type: String, enum: ['schedule', 'sensor'], required: true },

        cron: { type: String },

        sensorId: { type: String },
        operator: { type: String, enum: ['>', '<', '=', 'range'] },
        value: { type: Number },
        rangeMax: { type: Number },

        activeWindow: {
            enabled: { type: Boolean, default: false },
            startTime: { type: String },
            endTime: { type: String }
        },

        frequency: {
            type: { type: String, enum: ['interval', 'once', 'daily', 'date_range'], default: 'interval' },
            intervalMinutes: { type: Number },
            startDate: { type: Date },
            endDate: { type: Date }
        },

        cooldownMinutes: { type: Number, default: 60 }
    },

    payload: {
        systemPrompt: { type: String, required: true },
        contextConfiguration: { type: Schema.Types.Mixed, default: {} }
    },

    outputs: {
        saveInsight: { type: Boolean, default: true },
        notifyTelegram: { type: Boolean, default: false },
        notifyEmail: { type: Boolean, default: false }
    },

    lastRun: { type: Date }

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

AIActionSchema.plugin(softDeletePlugin);

export const AIActionModel = mongoose.model<IAIAction>('AIAction', AIActionSchema);
