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
    communication_by: string[];
    communication_type: string[];
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
    communication_by: [{ type: String }],
    communication_type: [{ type: String }],
    ports: [PortTemplateSchema]
}, {
    timestamps: true
});

export const ControllerTemplate = mongoose.model<IControllerTemplate>('ControllerTemplate', ControllerTemplateSchema);
