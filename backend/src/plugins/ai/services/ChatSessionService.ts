import { AIChatSessionModel, IAIChatSession, IAIChatMessage } from '../models/AIChatSession.schema';

class ChatSessionService {

    async createSession(initialMessage?: IAIChatMessage): Promise<IAIChatSession> {
        const messages = initialMessage ? [initialMessage] : [];
        return await AIChatSessionModel.create({
            title: 'New Chat',
            messages
        });
    }

    async getSessions(archived = false): Promise<IAIChatSession[]> {
        return await AIChatSessionModel.find({ isArchived: archived })
            .sort({ updatedAt: -1 })
            .select('title updatedAt messages'); // Select only needed fields for list
    }

    async getSessionById(id: string): Promise<IAIChatSession | null> {
        return await AIChatSessionModel.findById(id);
    }

    async addMessage(sessionId: string, message: IAIChatMessage): Promise<IAIChatSession | null> {
        console.log(`🧠 ChatSessionService.addMessage: ${sessionId}`, message.content.substring(0, 50));
        return await AIChatSessionModel.findByIdAndUpdate(
            sessionId,
            {
                $push: { messages: message },
                $set: { updatedAt: new Date() } // Force update timestamp
            },
            { new: true }
        );
    }

    async updateTitle(sessionId: string, title: string): Promise<IAIChatSession | null> {
        return await AIChatSessionModel.findByIdAndUpdate(sessionId, { title }, { new: true });
    }

    async archiveSession(id: string): Promise<IAIChatSession | null> {
        return await AIChatSessionModel.findByIdAndUpdate(id, { isArchived: true }, { new: true });
    }

    async deleteSession(id: string): Promise<boolean> {
        const res = await AIChatSessionModel.findByIdAndDelete(id);
        return !!res;
    }
}

export const chatSessionService = new ChatSessionService();
