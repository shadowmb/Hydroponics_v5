import mongoose, { Document, Schema } from 'mongoose';

export interface IPortTemplate {
    id: string;
    label: string;
    type: 'digital' | 'analog';
    reserved?: boolean;
    pwm?: boolean;
    pin: number;
}

export interface IControllerTemplate extends Omit<Document, '_id'> {
    _id: string;
    key: string; // e.g., "Arduino_Uno"
    label: string;
    description?: string;
    architecture?: string;
    communication_by: string[];
    communication_type: string[];
    memory?: {
        flash: number; // bytes
        sram: number; // bytes
        eeprom?: number; // bytes
    };
    pin_counts?: {
        digital: number;
        analog: number;
        pwm?: number;
        i2c?: number;
        spi?: number;
        uart?: number;
    };
    electrical_specs?: {
        logic_voltage: string;
        input_voltage: string;
        max_current_per_pin: string;
        analog_resolution: string;
        adc_range: string;
    };
    firmware_config?: {
        voltage: number;
        clock_speed_hz: number;
        requirements: {
            core: string;
            libraries: Array<{
                name: string;
                version: string;
                required_for: string[];
            }>;
        };
        defines: string[];
        interfaces: {
            serial: { hardware: string[]; usb: string };
            i2c?: string[];
            spi?: string[];
            wifi?: { type: 'native' | 'none'; chipset?: string };
        };
        pins: {
            mappings: Record<string, string | number>;
        };
    };
    constraints?: string[];
    ports: IPortTemplate[];
}

const PortTemplateSchema = new Schema({
    id: { type: String, required: true },
    label: { type: String, required: true },
    type: { type: String, enum: ['digital', 'analog'], required: true },
    reserved: { type: Boolean, default: false },
    pwm: { type: Boolean, default: false },
    pin: { type: Number, required: true }
}, { _id: false });

const ControllerTemplateSchema = new Schema({
    _id: { type: String, required: true },
    key: { type: String, required: true, unique: true },
    label: { type: String, required: true },
    description: { type: String },
    architecture: { type: String },
    communication_by: [{ type: String }],
    communication_type: [{ type: String }],
    memory: {
        flash: { type: Number },
        sram: { type: Number },
        eeprom: { type: Number }
    },
    pin_counts: {
        digital: { type: Number, default: 0 },
        analog: { type: Number, default: 0 },
        pwm: { type: Number, default: 0 },
        i2c: { type: Number, default: 0 },
        spi: { type: Number, default: 0 },
        uart: { type: Number, default: 0 }
    },
    electrical_specs: {
        logic_voltage: { type: String },
        input_voltage: { type: String },
        max_current_per_pin: { type: String },
        analog_resolution: { type: String },
        adc_range: { type: String }
    },
    firmware_config: {
        voltage: { type: Number },
        clock_speed_hz: { type: Number },
        requirements: {
            core: { type: String },
            libraries: [{
                name: String,
                version: String,
                required_for: [String]
            }]
        },
        defines: [{ type: String }],
        interfaces: {
            serial: {
                hardware: [{ type: String }],
                usb: { type: String }
            },
            i2c: [{ type: String }],
            spi: [{ type: String }],
            wifi: {
                type: { type: String, enum: ['native', 'none'] },
                chipset: { type: String }
            }
        },
        pins: {
            mappings: { type: Map, of: Schema.Types.Mixed }
        }
    },
    constraints: [{ type: String }],
    ports: [PortTemplateSchema]
}, {
    timestamps: true
});

export const ControllerTemplate = mongoose.model<IControllerTemplate>('ControllerTemplate', ControllerTemplateSchema);
