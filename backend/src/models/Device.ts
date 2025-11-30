import mongoose, { Schema } from 'mongoose';
import { z } from 'zod';
import { softDeletePlugin, SoftDeleteDocument, SoftDeleteModel } from '../core/softDeletePlugin';

// --- Interfaces ---
export interface IDevice extends SoftDeleteDocument {
    name: string;
    type: 'CONTROLLER' | 'SENSOR' | 'ACTUATOR';
    isEnabled: boolean;
    status: 'online' | 'offline' | 'error';
    lastConnectionCheck?: Date;

    hardware: {
        boardType?: string;
        port?: string;
        pin?: number;
        pins?: { role: string; portId: string; gpio: number }[]; // New: Multi-pin support with resolved GPIO
        parentId?: string; // Controller ID
        relayId?: string;  // Relay ID
        channel?: number;
    };

    config: {
        driverId: string;
        pollInterval?: number;
        conversionStrategy?: string;
        calibration?: Record<string, any>; // Dynamic calibration data based on strategy
    };

    metadata?: {
        description?: string;
    };

    tags: string[]; // New: Tags for grouping

    lastReading?: {
        value: number;
        raw: number;
        timestamp: Date;
    };
}

// --- Mongoose Schema ---
const DeviceSchema = new Schema<IDevice>(
    {
        name: { type: String, required: true, unique: true },
        type: { type: String, enum: ['CONTROLLER', 'SENSOR', 'ACTUATOR'], required: true },
        isEnabled: { type: Boolean, default: true },
        status: { type: String, enum: ['online', 'offline', 'error'], default: 'offline' },
        lastConnectionCheck: Date,

        hardware: {
            boardType: String,
            port: String, // Legacy/Single-pin support
            pin: Number,
            pins: [{
                role: String,
                portId: String,
                gpio: Number
            }], // New: Multi-pin support with resolved GPIO
            parentId: { type: String, ref: 'Device' }, // Controller ID
            relayId: { type: String, ref: 'Relay' },   // Relay ID (if connected via relay)
            channel: Number,                           // Relay Channel Index (if connected via relay)
        },

        config: {
            driverId: { type: String, required: true, ref: 'DeviceTemplate' },
            pollInterval: Number,
            conversionStrategy: { type: String, default: 'linear' },
            calibration: {
                // Dynamic structure to support various strategies
                type: Schema.Types.Mixed,
                default: {}
            },
        },

        metadata: {
            description: String,
        },

        tags: { type: [String], default: [] }, // New: Tags for grouping

        lastReading: {
            value: Number,
            raw: Number,
            timestamp: Date
        }
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
