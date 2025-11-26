import mongoose, { Schema, Document } from 'mongoose';

export interface IDeviceTemplate extends Omit<Document, '_id'> {
    _id: string; // Manual ID (e.g., 'dfrobot_ph_pro')
    name: string;
    description: string;
    physicalType: 'ph' | 'ec' | 'temp' | 'humidity' | 'distance' | 'flow' | 'light' | 'relay' | 'pump' | 'valve' | 'other';
    requiredCommand: string; // e.g., 'ANALOG', 'ONEWIRE', 'SET_PIN'
    defaultUnits: string[];

    portRequirements: {
        type: 'analog' | 'digital' | 'i2c' | 'uart';
        count: number;
        description?: string;
    }[];

    pins?: {
        name: string;
        type: 'DIGITAL_IN' | 'DIGITAL_OUT' | 'ANALOG_IN' | 'PWM_OUT';
    }[];

    executionConfig: {
        commandType: string;
        parameters?: Record<string, any>;
        responseMapping?: {
            valueKey?: string;
            conversionMethod?: string;
        };
    };

    uiConfig: {
        category: string;
        icon?: string;
    };
}

const DeviceTemplateSchema = new Schema<IDeviceTemplate>({
    _id: { type: String, required: true }, // User-friendly ID
    name: { type: String, required: true },
    description: { type: String },
    physicalType: {
        type: String,
        required: true,
        enum: ['ph', 'ec', 'temp', 'humidity', 'distance', 'flow', 'light', 'relay', 'pump', 'valve', 'other']
    },
    requiredCommand: { type: String, required: true },
    defaultUnits: [{ type: String }],

    portRequirements: [{
        type: { type: String, enum: ['analog', 'digital', 'i2c', 'uart'], required: true },
        count: { type: Number, default: 1 },
        description: String
    }],

    pins: [{
        name: { type: String, required: true },
        type: { type: String, enum: ['DIGITAL_IN', 'DIGITAL_OUT', 'ANALOG_IN', 'PWM_OUT'], required: true }
    }],

    executionConfig: {
        commandType: { type: String, required: true },
        parameters: { type: Schema.Types.Mixed },
        responseMapping: {
            valueKey: String,
            conversionMethod: String
        }
    },

    uiConfig: {
        category: { type: String, required: true },
        icon: String
    }
}, {
    timestamps: true
});

export const DeviceTemplate = mongoose.model<IDeviceTemplate>('DeviceTemplate', DeviceTemplateSchema);
