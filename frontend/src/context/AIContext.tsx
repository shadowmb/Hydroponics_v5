import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface AIContextType {
    isOpen: boolean;
    initialMessage: string | null;
    setInitialMessage: (msg: string | null) => void;
    activeSessionId: string | null;
    setActiveSessionId: (id: string | null) => void;
    toggleChat: () => void;
    openChat: () => void;
    closeChat: () => void;
    sessionRefreshTrigger: number;
    triggerSessionRefresh: () => void;
    isSessionValidating: boolean; // New state
    isPluginActive: boolean;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

import { aiService } from '@/services/ai.service'; // Import service for validation
import { toast } from 'sonner';

export function AIProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [initialMessage, setInitialMessage] = useState<string | null>(null);
    const [sessionRefreshTrigger, setSessionRefreshTrigger] = useState(0);
    const [isSessionValidating, setIsSessionValidating] = useState(true); // Default true until checked
    const [isPluginActive, setIsPluginActive] = useState(false);

    // Check Plugin Health on Mount
    useEffect(() => {
        aiService.checkHealth().then(active => {
            console.log('🔌 AI Plugin Status:', active);
            setIsPluginActive(active);
        });
    }, []);

    // Initialize from localStorage if available
    const [activeSessionId, setActiveSessionIdState] = useState<string | null>(() => {
        return localStorage.getItem('hydro_ai_session_id') || null;
    });

    // Validate session on mount
    useEffect(() => {
        const validate = async () => {
            const storedId = localStorage.getItem('hydro_ai_session_id');
            if (storedId) {
                try {
                    setIsSessionValidating(true);
                    // Check if valid
                    await aiService.getSession(storedId);
                } catch (e) {
                    console.warn("Stored session invalid, clearing:", storedId);
                    localStorage.removeItem('hydro_ai_session_id');
                    setActiveSessionIdState(null);
                } finally {
                    setIsSessionValidating(false);
                }
            } else {
                setIsSessionValidating(false);
            }
        };
        validate();
    }, []);

    const setActiveSessionId = (id: string | null) => {
        setActiveSessionIdState(id);
        if (id) {
            localStorage.setItem('hydro_ai_session_id', id);
        } else {
            localStorage.removeItem('hydro_ai_session_id');
        }
    };

    const triggerSessionRefresh = () => setSessionRefreshTrigger(prev => prev + 1);

    const toggleChat = () => {
        if (!isPluginActive) {
            toast.info('AI Модулът не е инсталиран', {
                description: 'Моля инсталирайте добавката за да ползвате асистента.'
            });
            return;
        }
        setIsOpen(prev => !prev);
    };
    const openChat = () => {
        if (!isPluginActive) return;
        setIsOpen(true);
    };
    const closeChat = () => setIsOpen(false);

    return (
        <AIContext.Provider value={{
            isOpen, initialMessage, setInitialMessage,
            activeSessionId, setActiveSessionId,
            toggleChat, openChat, closeChat,
            sessionRefreshTrigger, triggerSessionRefresh,
            isSessionValidating, isPluginActive
        }}>
            {children}
        </AIContext.Provider>
    );
}

export function useAI() {
    const context = useContext(AIContext);
    if (context === undefined) {
        throw new Error('useAI must be used within an AIProvider');
    }
    return context;
}
