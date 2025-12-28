import mongoose, { Document, Schema } from 'mongoose';
import { softDeletePlugin, SoftDeleteDocument } from '../core/softDeletePlugin';

export interface IRelayChannel {
    channelIndex: number; // 1-based index (1, 2, 3, 4...)
    controllerPortId?: string; // The physical port on the controller (e.g., "D2")
    name?: string; // Optional custom name for this channel
    state: boolean; // Current state (true=ON, false=OFF)
    isOccupied: boolean; // Is this channel connected to a device?
    occupiedBy?: {
        type: 'device';
        id: string;
        name: string;
    };
}

export interface IRelay extends SoftDeleteDocument {
    name: string;
    controllerId: mongoose.Types.ObjectId; // The controller this relay board is connected to
    type: '1-channel' | '2-channel' | '4-channel' | '8-channel' | '16-channel';
    triggerLogic: 'HIGH' | 'LOW'; // Physical trigger logic of the relay module
    channels: IRelayChannel[];
    description?: string;
}

const RelayChannelSchema = new Schema({
    channelIndex: { type: Number, required: true },
    controllerPortId: { type: String, required: false },
    name: { type: String },
    state: { type: Boolean, default: false },
    isOccupied: { type: Boolean, default: false },
    occupiedBy: {
        type: { type: String, enum: ['device'] },
        id: { type: String },
        name: { type: String }
    }
}, { _id: false });

const RelaySchema = new Schema({
    name: { type: String, required: true },
    controllerId: { type: Schema.Types.ObjectId, ref: 'Controller', required: false },
    type: { type: String, enum: ['1-channel', '2-channel', '4-channel', '8-channel', '16-channel'], required: true },
    triggerLogic: { type: String, enum: ['HIGH', 'LOW'], default: 'HIGH' },
    channels: [RelayChannelSchema],
    description: { type: String }
}, {
    timestamps: true
});

RelaySchema.plugin(softDeletePlugin);

export const Relay = mongoose.model<IRelay>('Relay', RelaySchema);
