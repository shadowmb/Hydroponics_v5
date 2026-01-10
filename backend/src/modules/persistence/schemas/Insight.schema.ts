import mongoose, { Schema, Document } from 'mongoose';

export interface IInsight extends Document {
    actionId?: string;      // Link to the action that generated this
    actionName: string;     // Snapshot of name in case action is deleted
    content: string;        // The AI advice/analysis
    type: 'info' | 'warning' | 'critical'; // Severity (could be determined by AI)
    isRead: boolean;
    createdAt: Date;
}

const InsightSchema = new Schema<IInsight>({
    actionId: { type: String },
    actionName: { type: String, required: true },
    content: { type: String, required: true },
    type: { type: String, enum: ['info', 'warning', 'critical'], default: 'info' },
    isRead: { type: Boolean, default: false }
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

export const InsightModel = mongoose.model<IInsight>('Insight', InsightSchema);
