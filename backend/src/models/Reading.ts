import mongoose, { Schema, Document } from 'mongoose';

export interface IReading extends Document {
    timestamp: Date;
    metadata: {
        deviceId: string;
        deviceName: string;
        deviceType: string; // driverId
        location?: string;
    };
    readings: Record<string, number | string | boolean>;
}

const ReadingSchema: Schema = new Schema({
    timestamp: { type: Date, required: true, index: true },
    metadata: {
        deviceId: { type: String, required: true, index: true },
        deviceName: { type: String, required: true },
        deviceType: { type: String, required: true },
        location: { type: String }
    },
    readings: { type: Schema.Types.Mixed, required: true }
}, {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false
});

// Compound index for efficient querying by device over time
ReadingSchema.index({ 'metadata.deviceId': 1, timestamp: -1 });

export const Reading = mongoose.model<IReading>('Reading', ReadingSchema);
