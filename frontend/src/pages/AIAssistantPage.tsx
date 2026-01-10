// Force refresh
import { useState, useEffect } from 'react';
import { ChatSessionSidebar } from '@/components/ai/ChatSessionSidebar';
import { FullScreenChat } from '@/components/ai/FullScreenChat';
import { useAI } from '@/context/AIContext';
import { aiService } from '@/services/ai.service';

export function AIAssistantPage() {
    const { activeSessionId, setActiveSessionId, closeChat, sessionRefreshTrigger } = useAI();
    const [localRefresh, setLocalRefresh] = useState(0);

    // Combine triggers
    const refreshKey = sessionRefreshTrigger + localRefresh;

    // Auto-close popup when entering this page
    useEffect(() => {
        closeChat();
    }, []);

    const handleNewChat = async () => {
        try {
            const res = await aiService.createSession();
            // Check if response is the object itself or wrapped in success
            // In aiService we returned response.data.data for createSession
            // Wait, look at aiService.ts:
            // createSession: async (): Promise<any> => { const response = ...; return response.data.data; }
            // So res is the session object directly.
            if (res && res._id) {
                setActiveSessionId(res._id);
                setLocalRefresh(prev => prev + 1);
            }
        } catch (error) {
            console.error("Failed to create session", error);
        }
    };

    return (
        <div className="flex h-full bg-background">
            <ChatSessionSidebar
                activeSessionId={activeSessionId || undefined}
                onSelectSession={setActiveSessionId}
                onNewChat={handleNewChat}
                refreshTrigger={refreshKey}
            />
            <div className="flex-1 h-full relative">
                <FullScreenChat key={activeSessionId} sessionId={activeSessionId || undefined} />
            </div>
        </div>
    );
}
