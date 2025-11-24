import mongoose, { Schema } from 'mongoose';
import { z } from 'zod';
import { softDeletePlugin, SoftDeleteDocument, SoftDeleteModel } from '../core/softDeletePlugin';

// ... (Zod omitted for brevity) ...

// --- Mongoose Schema ---
const DeviceSchema = new Schema<IDevice>(
    {
        name: { type: String, required: true, unique: true },
        type: { type: String, enum: ['CONTROLLER', 'SENSOR', 'ACTUATOR'], required: true },
        isEnabled: { type: Boolean, default: true },

        hardware: {
            boardType: String,
            port: String,
            pin: Number,
            parentId: { type: String, ref: 'Device' }, // Controller ID
            relayId: { type: String, ref: 'Relay' },   // Relay ID (if connected via relay)
            channel: Number,                           // Relay Channel Index (if connected via relay)
        },

        config: {
            driverId: { type: String, required: true, ref: 'DeviceTemplate' },
            pollInterval: Number,
            calibration: {
                multiplier: { type: Number, default: 1 },
                offset: { type: Number, default: 0 },
                points: [{
                    raw: Number,
                    value: Number
                }]
            },
        },

        metadata: {
            description: String,
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Apply Plugins
DeviceSchema.plugin(softDeletePlugin);

// Export Model
export const DeviceModel = (mongoose.models.Device as SoftDeleteModel<IDevice>) || mongoose.model<IDevice, SoftDeleteModel<IDevice>>('Device', DeviceSchema);
