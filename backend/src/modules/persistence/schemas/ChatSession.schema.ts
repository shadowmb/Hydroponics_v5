import mongoose, { Schema, Document } from 'mongoose';

export interface IChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
}

export interface IChatSession extends Document {
    title: string;
    messages: IChatMessage[];
    isArchived: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ChatMessageSchema = new Schema({
    role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
}, { _id: false });

const ChatSessionSchema = new Schema<IChatSession>({
    title: { type: String, default: 'New Conversation' },
    messages: [ChatMessageSchema],
    isArchived: { type: Boolean, default: false }
}, {
    timestamps: true,
    toJSON: {
        transform: (doc, ret: any) => {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
            return ret;
        }
    }
});

export const ChatSessionModel = mongoose.model<IChatSession>('ChatSession', ChatSessionSchema);
