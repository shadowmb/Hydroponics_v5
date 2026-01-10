import { ChatSessionModel, IChatSession, IChatMessage } from '../../persistence/schemas/ChatSession.schema';

class ChatSessionService {

    async createSession(initialMessage?: IChatMessage): Promise<IChatSession> {
        const messages = initialMessage ? [initialMessage] : [];
        return await ChatSessionModel.create({
            title: 'New Chat',
            messages
        });
    }

    async getSessions(archived = false): Promise<IChatSession[]> {
        return await ChatSessionModel.find({ isArchived: archived })
            .sort({ updatedAt: -1 })
            .select('title updatedAt messages'); // Select only needed fields for list
    }

    async getSessionById(id: string): Promise<IChatSession | null> {
        return await ChatSessionModel.findById(id);
    }

    async addMessage(sessionId: string, message: IChatMessage): Promise<IChatSession | null> {
        return await ChatSessionModel.findByIdAndUpdate(
            sessionId,
            {
                $push: { messages: message },
                $set: { updatedAt: new Date() } // Force update timestamp
            },
            { new: true }
        );
    }

    async updateTitle(sessionId: string, title: string): Promise<IChatSession | null> {
        return await ChatSessionModel.findByIdAndUpdate(sessionId, { title }, { new: true });
    }

    async archiveSession(id: string): Promise<IChatSession | null> {
        return await ChatSessionModel.findByIdAndUpdate(id, { isArchived: true }, { new: true });
    }

    async deleteSession(id: string): Promise<boolean> {
        const res = await ChatSessionModel.findByIdAndDelete(id);
        return !!res;
    }
}

export const chatSessionService = new ChatSessionService();
