// Force refresh
import { useState, useEffect } from 'react';
import { ChatSessionSidebar } from '@/components/ai/ChatSessionSidebar';
import { FullScreenChat } from '@/components/ai/FullScreenChat';
import { useAI } from '@/context/AIContext';
import { aiService } from '@/services/ai.service';
import { Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AIAssistantPage() {
    const { activeSessionId, setActiveSessionId, closeChat, sessionRefreshTrigger, isPluginActive } = useAI();
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
                {!isPluginActive ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 text-center">
                        <div className="bg-muted/30 p-6 rounded-full mb-6">
                            <Bot className="h-16 w-16 opacity-50" />
                        </div>
                        <h2 className="text-2xl font-semibold mb-2">AI Модулът не е инсталиран</h2>
                        <p className="max-w-md mb-8">
                            За да използвате асистента, моля инсталирайте допълнителния AI плъгин.
                        </p>
                        <Button variant="outline" disabled>
                            Научете повече (Coming Soon)
                        </Button>
                    </div>
                ) : (
                    <FullScreenChat key={activeSessionId} sessionId={activeSessionId || undefined} />
                )}
            </div>
        </div>
    );
}
