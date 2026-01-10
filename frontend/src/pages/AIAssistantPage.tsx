// Force refresh
import { useState, useEffect } from 'react';
import { ChatSessionSidebar } from '@/components/ai/ChatSessionSidebar';
import { FullScreenChat } from '@/components/ai/FullScreenChat';
import { useAI } from '@/context/AIContext';
import axios from 'axios';

export function AIAssistantPage() {
    const [activeSessionId, setActiveSessionId] = useState<string | undefined>(undefined);
    const { closeChat } = useAI();

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Auto-close popup when entering this page
    useEffect(() => {
        closeChat();
    }, []);

    const handleNewChat = async () => {
        try {
            const res = await axios.post(`${API_URL}/ai/sessions`);
            if (res.data.success) {
                setActiveSessionId(res.data.data.id);
                setRefreshTrigger(prev => prev + 1);
            }
        } catch (error) {
            console.error("Failed to create session", error);
        }
    };

    return (
        <div className="flex h-full bg-background">
            <ChatSessionSidebar
                activeSessionId={activeSessionId}
                onSelectSession={setActiveSessionId}
                onNewChat={handleNewChat}
                refreshTrigger={refreshTrigger}
            />
            <div className="flex-1 h-full relative">
                <FullScreenChat key={activeSessionId} sessionId={activeSessionId} />
            </div>
        </div>
    );
}
