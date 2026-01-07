import mongoose, { Schema, Document } from 'mongoose';

export type AnalyticsType = 'SUM' | 'DELTA' | 'TREND' | 'NONE';

export interface IResourceRole extends Document {
    key: string;            // Unique identifier from JSON templates (e.g., "ph_up", "volume")
    label: string;          // Human-readable display name (e.g., "Acid (pH-)", "Water Level")
    analyticsType: AnalyticsType; // How to aggregate this data
    unit?: string;          // Default display unit (e.g., "ml", "L", "pH")
    color?: string;         // UI identifier for badge color (e.g., "red", "cyan" or hex)
    description?: string;   // Optional description
}

const ResourceRoleSchema: Schema = new Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    label: {
        type: String,
        required: true
    },
    analyticsType: {
        type: String,
        enum: ['SUM', 'DELTA', 'TREND', 'NONE'],
        default: 'NONE'
    },
    unit: { type: String },
    color: { type: String, default: 'gray' },
    description: { type: String }
}, {
    timestamps: true
});

export default mongoose.model<IResourceRole>('ResourceRole', ResourceRoleSchema);
