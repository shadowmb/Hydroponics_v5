import mongoose, { Schema, Document } from 'mongoose';

export interface IDeviceTemplate extends Omit<Document, '_id'> {
    _id: string; // Manual ID (e.g., 'dfrobot_ph_pro')
    name: string;
    description?: string;
    category: 'CONTROLLER' | 'SENSOR' | 'ACTUATOR';
    supportedStrategies?: string[]; // List of supported calibration strategies
    capabilities: string[]; // List of supported commands (e.g., ['ANALOG', 'DHT_READ'])
    commands: Record<string, any>; // Command definitions
    portRequirements: {
        type: 'analog' | 'digital' | 'i2c' | 'uart';
        count: number;
        description?: string;
    }[];
    pins?: {
        name: string;
        type: 'DIGITAL_IN' | 'DIGITAL_OUT' | 'ANALOG_IN' | 'PWM_OUT';
    }[];
    requirements?: {
        interface?: 'digital' | 'analog' | 'i2c' | 'uart' | 'onewire';
        voltage?: string;
        pin_count?: {
            digital?: number;
            analog?: number;
            uart?: number;
            i2c?: number;
        };
    };
    uiConfig?: {
        category?: string;
        icon?: string;
        recommendedPins?: string[];
    };
    initialState?: Record<string, any>;
}

const DeviceTemplateSchema = new Schema<IDeviceTemplate>({
    _id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String },
    category: { type: String, enum: ['CONTROLLER', 'SENSOR', 'ACTUATOR'], default: 'SENSOR' },
    supportedStrategies: [{ type: String }],
    capabilities: [{ type: String }],
    commands: { type: Map, of: Schema.Types.Mixed },
    portRequirements: [{
        type: { type: String, enum: ['analog', 'digital', 'i2c', 'uart'] },
        count: { type: Number },
        description: { type: String }
    }],
    pins: [{
        name: { type: String },
        type: { type: String, enum: ['DIGITAL_IN', 'DIGITAL_OUT', 'ANALOG_IN', 'PWM_OUT'] }
    }],
    requirements: {
        interface: { type: String, enum: ['digital', 'analog', 'i2c', 'uart', 'onewire'] },
        voltage: { type: String },
        pin_count: {
            digital: { type: Number },
            analog: { type: Number },
            uart: { type: Number },
            i2c: { type: Number }
        }
    },
    uiConfig: {
        category: { type: String },
        icon: { type: String },
        recommendedPins: [{ type: String }]
    },
    initialState: { type: Schema.Types.Mixed }
}, {
    timestamps: true,
    _id: false // Don't auto-generate _id
});

export const DeviceTemplate = mongoose.model<IDeviceTemplate>('DeviceTemplate', DeviceTemplateSchema);
