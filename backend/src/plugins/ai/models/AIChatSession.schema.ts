import mongoose, { Schema, Document } from 'mongoose';

export interface IAIChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
}

export interface IAIChatSession extends Document {
    title: string;
    messages: IAIChatMessage[];
    isArchived: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ChatMessageSchema = new Schema({
    role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
}, { _id: false });

const AIChatSessionSchema = new Schema<IAIChatSession>({
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

// Explicitly set collection name to 'ai_sessions'
export const AIChatSessionModel = mongoose.model<IAIChatSession>('AIChatSession', AIChatSessionSchema, 'ai_sessions');
