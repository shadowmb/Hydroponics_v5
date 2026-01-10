import { createContext, useContext, useState, type ReactNode } from 'react';

interface AIContextType {
    isOpen: boolean;
    initialMessage: string | null;
    setInitialMessage: (msg: string | null) => void;
    toggleChat: () => void;
    openChat: () => void;
    closeChat: () => void;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export function AIProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [initialMessage, setInitialMessage] = useState<string | null>(null);

    const toggleChat = () => setIsOpen(prev => !prev);
    const openChat = () => setIsOpen(true);
    const closeChat = () => setIsOpen(false);

    return (
        <AIContext.Provider value={{ isOpen, initialMessage, setInitialMessage, toggleChat, openChat, closeChat }}>
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
