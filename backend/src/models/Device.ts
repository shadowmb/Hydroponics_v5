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
        variantId?: string;
        // activeRole: Key from template.roles (e.g., 'distance', 'volume')
        activeRole?: string;
        pollInterval?: number;
        conversionStrategy?: string;
        calibrations?: Record<string, { lastCalibrated: Date; data: any }>;
        validation?: {
            range?: { min: number; max: number };
            retryCount?: number;
            retryDelayMs?: number;
            fallbackAction?: 'error' | 'useLastValid' | 'useDefault' | 'skip';
            defaultValue?: number;
            staleLimit?: number;
            staleTimeoutMs?: number;
        };
        sampling?: {
            count?: number;
            delayMs?: number;
        };
        compensation?: {
            temperature?: {
                enabled: boolean;
                source: 'default' | 'external' | 'internal';
                default?: number;
                externalDeviceId?: string;
            };
        };
        voltage?: {
            reference?: number;
        };
        invertedLogic?: boolean; // For NC/NO or software inversion
    };

    metadata?: {
        description?: string;
    };

    tags: string[]; // New: Tags for grouping
    group: 'Water' | 'Air' | 'Light' | 'Power' | 'Other'; // New: Strict grouping

    // Dashboard Settings
    dashboardPinned?: boolean; // Whether device is pinned to dashboard
    dashboardOrder?: number;   // Display order on dashboard (0-5)
    displayUnit?: string;      // User preferred display unit (Primary)
    displayUnits?: Map<string, string>; // Multi-value overrides (key -> unit)

    lastReading?: {
        value: number | null;
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
            parentId: { type: String, ref: 'Controller' }, // Controller ID
            relayId: { type: String, ref: 'Relay' },   // Relay ID (if connected via relay)
            channel: Number,                           // Relay Channel Index (if connected via relay)
        },

        config: {
            driverId: { type: String, required: true, ref: 'DeviceTemplate' },
            variantId: { type: String }, // New: Support for template variants
            activeRole: { type: String }, // New: Selected Role Key
            pollInterval: Number,
            conversionStrategy: { type: String, default: 'linear' },
            calibrations: {
                // Dynamic structure to support various strategies: { [strategyId]: { lastCalibrated: Date, data: any } }
                type: Schema.Types.Mixed,
                default: {}
            },
            validation: {
                range: {
                    min: Number,
                    max: Number
                },
                retryCount: { type: Number, default: 3 },
                retryDelayMs: { type: Number, default: 100 },
                fallbackAction: {
                    type: String,
                    enum: ['error', 'useLastValid', 'useDefault', 'skip'],
                    default: 'error'
                },
                defaultValue: Number,
                staleLimit: { type: Number, default: 1 },
                staleTimeoutMs: { type: Number, default: 30000 }
            },
            sampling: {
                count: { type: Number, default: 1 },
                delayMs: { type: Number, default: 0 }
            },
            compensation: {
                temperature: {
                    enabled: { type: Boolean, default: false },
                    source: { type: String, enum: ['default', 'external', 'internal'], default: 'default' },
                    default: Number,
                    externalDeviceId: String
                }
            },
            voltage: {
                reference: Number
            },
            invertedLogic: { type: Boolean, default: false }
        },

        metadata: {
            description: String,
        },

        tags: { type: [String], default: [] }, // New: Tags for grouping
        group: { type: String, enum: ['Water', 'Air', 'Light', 'Power', 'Other'], default: 'Other' }, // New: Strict grouping

        // Dashboard Settings
        dashboardPinned: { type: Boolean, default: false },
        dashboardOrder: { type: Number, default: 0 },
        displayUnit: { type: String },
        displayUnits: { type: Map, of: String },

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
