import mongoose, { Schema, Document } from 'mongoose';
import { softDeletePlugin, ISoftDelete } from '../plugins/softDelete.plugin';

/**
 * Analytics aggregation types - how the value is calculated
 */
export type AnalyticsType = 'SUM' | 'DELTA' | 'TREND' | 'NONE';

/**
 * Resource statistic for a single resource role
 */
export interface IResourceStat {
    value: number;           // Main calculated value (SUM for actuators, DELTA for sensors)
    unit: string;            // Unit of measurement
    type: AnalyticsType;     // How it was calculated
    startValue?: number;     // First reading in the session
    endValue?: number;       // Last reading in the session
    average?: number;        // Average of all readings
    min?: number;            // Minimum reading
    max?: number;            // Maximum reading
    count?: number;          // Number of readings
}

/**
 * Execution context - identifies the source of the data
 */
export interface IExecutionContext {
    programId: string;
    programName: string;
    windowId?: string;
    windowName?: string;
    flowId?: string;
    flowName?: string;
    cycleId?: string;
    cycleName?: string;
    executionType: 'WINDOW' | 'CYCLE' | 'MANUAL';
    sessionId?: string;      // Link to ExecutionSession for tracing
}

/**
 * Resource Daily Summary - aggregated analytics data
 * One record per window/cycle execution
 */
export interface IResourceDailySummary extends Document, ISoftDelete {
    date: string;            // YYYY-MM-DD format
    timestamp: Date;         // Exact time of recording
    context: IExecutionContext;
    resources: Record<string, IResourceStat>;
}

// --- Mongoose Schemas ---

const ResourceStatSchema = new Schema<IResourceStat>({
    value: { type: Number, required: true },
    unit: { type: String, required: true },
    type: { type: String, enum: ['SUM', 'DELTA', 'TREND', 'NONE'], required: true },
    startValue: { type: Number },
    endValue: { type: Number },
    average: { type: Number },
    min: { type: Number },
    max: { type: Number },
    count: { type: Number }
}, { _id: false });

const ExecutionContextSchema = new Schema<IExecutionContext>({
    programId: { type: String, required: true },
    programName: { type: String, required: true },
    windowId: { type: String },
    windowName: { type: String },
    flowId: { type: String },
    flowName: { type: String },
    cycleId: { type: String },
    cycleName: { type: String },
    executionType: { type: String, enum: ['WINDOW', 'CYCLE', 'MANUAL'], required: true },
    sessionId: { type: String }
}, { _id: false });

const ResourceDailySummarySchema = new Schema<IResourceDailySummary>({
    date: { type: String, required: true, index: true },
    timestamp: { type: Date, required: true, default: Date.now },
    context: { type: ExecutionContextSchema, required: true },
    resources: { type: Schema.Types.Mixed, required: true }
}, {
    timestamps: true,
    toJSON: {
        transform: (_doc, ret: any) => {
            delete ret._id;
            delete ret.__v;
            return ret;
        }
    }
});

// Indexes for fast queries
ResourceDailySummarySchema.index({ 'context.programId': 1, date: 1 });
ResourceDailySummarySchema.index({ 'context.flowId': 1, date: 1 });
ResourceDailySummarySchema.index({ 'context.windowId': 1 });
ResourceDailySummarySchema.index({ 'context.cycleId': 1 });

ResourceDailySummarySchema.plugin(softDeletePlugin);

export const ResourceDailySummaryModel = mongoose.model<IResourceDailySummary>(
    'ResourceDailySummary',
    ResourceDailySummarySchema
);
