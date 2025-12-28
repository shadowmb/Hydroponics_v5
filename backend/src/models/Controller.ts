import mongoose, { Schema } from 'mongoose';
import { softDeletePlugin, SoftDeleteDocument, SoftDeleteModel } from '../core/softDeletePlugin';

export interface IPortState {
    isActive: boolean;
    isOccupied: boolean;
    occupiedBy?: {
        type: 'relay' | 'device';
        id: string;
        name: string;
    };
    deviceId?: mongoose.Types.ObjectId; // Deprecated but kept for backward compatibility
    triggerLogic?: 'HIGH' | 'LOW'; // Only for relay/digital ports
}

export interface IController extends SoftDeleteDocument {
    name: string;
    type: string; // Reference to ControllerTemplate key (e.g., "Arduino_Uno")
    description?: string;
    macAddress?: string; // Required for network controllers
    status: 'online' | 'offline' | 'error';
    lastSeen?: Date;
    lastConnectionCheck?: Date;
    connection: {
        type: 'serial' | 'network';
        ip?: string;
        port?: number;
        serialPort?: string;
        baudRate?: number;
    };
    ports: Map<string, IPortState>; // Key is Port ID (e.g., "D13")
    capabilities?: string[];
    isActive: boolean;
}

const PortStateSchema = new Schema({
    isActive: { type: Boolean, default: true },
    isOccupied: { type: Boolean, default: false },
    occupiedBy: {
        type: { type: String, enum: ['relay', 'device'] },
        id: { type: String },
        name: { type: String }
    },
    deviceId: { type: Schema.Types.ObjectId, ref: 'Device' },
    pwm: { type: Boolean, default: false },
    interface: { type: String },
    triggerLogic: { type: String, enum: ['HIGH', 'LOW'], default: 'HIGH' }
}, { _id: false });

const ControllerSchema = new Schema({
    name: { type: String, required: true },
    type: { type: String, required: true }, // We store the key, not ObjectId, for flexibility
    description: { type: String },
    macAddress: { type: String }, // sparse allows null/undefined to not conflict
    status: { type: String, enum: ['online', 'offline', 'error'], default: 'offline' },
    lastSeen: { type: Date },
    lastConnectionCheck: { type: Date },
    connection: {
        type: { type: String, enum: ['serial', 'network'], required: true },
        ip: { type: String },
        port: { type: Number },
        serialPort: { type: String },
        baudRate: { type: Number }
    },
    ports: {
        type: Map,
        of: PortStateSchema,
        default: {}
    },
    capabilities: { type: [String], default: [] },
    hardwareConfig: {
        adcResolution: { type: Number, default: 1023 },
        voltageReference: { type: Number, default: 5.0 }
    },
    isActive: { type: Boolean, default: true }
}, {
    timestamps: true
});

// Partial Index: Enforce unique MAC only for active (non-deleted) controllers
ControllerSchema.index({ macAddress: 1 }, { unique: true, partialFilterExpression: { deletedAt: null } });

ControllerSchema.plugin(softDeletePlugin);

export const Controller = (mongoose.models.Controller as SoftDeleteModel<IController>) || mongoose.model<IController, SoftDeleteModel<IController>>('Controller', ControllerSchema);
