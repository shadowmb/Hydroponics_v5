// Basic AI Service for Frontend
export const aiService = {
    chatEndpoint: 'http://localhost:3000/api/ai/chat', // Use config/env in real app

    // Basic fetch (not used for streaming usually, but for reference)
    async checkHealth() {
        // Placeholder
        return true;
    }
};
