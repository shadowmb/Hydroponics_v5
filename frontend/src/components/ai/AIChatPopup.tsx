import { useState, useEffect, useRef, useMemo } from 'react';
import { useChat } from '@tanstack/ai-react';
import { fetchServerSentEvents } from '@tanstack/ai-client'; // Ensure correct import path
// Note: If /react path fails, standard is '@tanstack/ai-client' but need to check exports
import { useAI } from '../../context/AIContext';
import { Button } from '../ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { X, Send, Bot, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { aiService } from '@/services/ai.service';

import { useLocation } from 'react-router-dom';

export function AIChatPopup() {
    const { isOpen, closeChat, activeSessionId, setActiveSessionId, triggerSessionRefresh, sessionRefreshTrigger, isSessionValidating } = useAI();
    const scrollRef = useRef<HTMLDivElement>(null);
    const location = useLocation();

    // Local state
    const [inputValue, setInputValue] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [sessions, setSessions] = useState<any[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false); // New state

    // Ref to track if we just created a session
    const isCreatingSession = useRef(false);

    // API URL
    const apiUrl = 'http://localhost:3000/api/ai/chat';

    // Dynamic connection that updates when sessionId changes
    const connection = useMemo(() => {
        const url = activeSessionId
            ? `${apiUrl}?sessionId=${activeSessionId}`
            : apiUrl;
        return fetchServerSentEvents(url);
    }, [activeSessionId]);

    // TanStack AI Hook
    const { messages, sendMessage, isLoading, setMessages } = useChat({
        connection,
        onError: (err) => {
            console.error("Chat Error:", err);
            setError(err.message || "An unknown error occurred.");
        },
    });

    // Load History when activeSessionId changes
    useEffect(() => {
        const loadHistory = async () => {
            if (!activeSessionId) {
                setMessages([]);
                return;
            }

            if (isCreatingSession.current) {
                isCreatingSession.current = false;
                return;
            }

            setIsLoadingHistory(true);
            try {
                const session = await aiService.getSession(activeSessionId);
                if (session && session.messages) {
                    const history = session.messages.map((m: any) => ({
                        id: m._id || m.id || Math.random().toString(36),
                        role: m.role,
                        content: m.content,
                        parts: [{ type: 'text', content: m.content }]
                    }));
                    setMessages(history);
                } else {
                    setMessages([]);
                }
            } catch (err) {
                console.error("Failed to load session history", err);
                if ((err as any).response?.status === 404) {
                    setActiveSessionId(null);
                }
            } finally {
                setIsLoadingHistory(false);
            }
        };
        // Only load if not validating
        if (!isSessionValidating) {
            loadHistory();
        }
    }, [activeSessionId, isSessionValidating, setMessages, setActiveSessionId]);

    // ... (keep loadSessions and refresh effect) [We're skipping those lines in Replacement, so assume they are untouched if not in target]
    // Wait, the previous replacement might affect context lines. 
    // Let's include loadSessions to be safe in targeting.

    // Load Sessions list
    const loadSessions = async () => {
        try {
            const list = await aiService.getSessions();
            setSessions(list);
        } catch (e) {
            console.error("Failed to load sessions", e);
        }
    };

    useEffect(() => {
        if (showHistory) {
            loadSessions();
        }
    }, [sessionRefreshTrigger]);

    const handleNewChat = async () => {
        try {
            const newSession = await aiService.createSession();
            isCreatingSession.current = true;
            const newId = newSession._id || newSession.id;
            setActiveSessionId(newId);
            setMessages([]);
            setShowHistory(false);
            triggerSessionRefresh();
        } catch (e) {
            console.error("Failed to create session", e);
        }
    };

    const handleSelectSession = (id: string) => {
        setActiveSessionId(id);
        setShowHistory(false);
    };

    // ... scrollRef effect ...
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isLoading, error, isLoadingHistory]);

    // ... useAI context stuff ...
    const { initialMessage, setInitialMessage } = useAI();
    useEffect(() => {
        if (isOpen && initialMessage && !isLoading && !isSessionValidating) {
            const ensureSession = async () => {
                if (!activeSessionId) {
                    const newSession = await aiService.createSession();
                    setActiveSessionId(newSession._id || newSession.id);
                }
                sendMessage(initialMessage);
                setInitialMessage(null);
            };
            ensureSession();
        }
    }, [isOpen, initialMessage, isLoading, sendMessage, setInitialMessage, activeSessionId, setActiveSessionId, isSessionValidating]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading || isSessionValidating) return;
        if (!activeSessionId) return;

        setError(null);
        const msg = inputValue;
        setInputValue('');

        try {
            await sendMessage(msg);
        } catch (e) {
            console.error("Msg failed", e);
            setInputValue(msg);
            setError("Failed to send message");
        }
    };

    if (location.pathname === '/assistant') return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="fixed bottom-4 right-4 z-[100] w-[400px] shadow-2xl"
                >
                    <Card className="h-[600px] flex flex-col border-primary/20 bg-background/95 backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b">
                            <div className="flex items-center gap-2">
                                <div className={`p-1.5 rounded-full ${isLoading || isSessionValidating || isLoadingHistory ? 'bg-amber-500/20 text-amber-500 animate-pulse' : 'bg-primary/20 text-primary'}`}>
                                    <Bot size={18} />
                                </div>
                                <div className="flex flex-col">
                                    <CardTitle className="text-base font-medium leading-none">Hydroponics AI</CardTitle>
                                    <span className="text-[10px] text-muted-foreground">
                                        {isSessionValidating ? 'Verifying Session...' : activeSessionId ? 'Session Active' : 'New Chat'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground"
                                    onClick={() => {
                                        if (showHistory) setShowHistory(false);
                                        else { loadSessions(); setShowHistory(true); }
                                    }}
                                    title="History"
                                    disabled={isSessionValidating}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v5h5" /><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" /></svg>
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={handleNewChat} title="New Chat" disabled={isSessionValidating}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={closeChat}>
                                    <X size={18} />
                                </Button>
                            </div>
                        </CardHeader>

                        <CardContent className="flex-1 p-0 overflow-hidden relative">
                            {/* Validating State Overlay or Content */}
                            {isSessionValidating ? (
                                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                    <span className="w-2 h-2 bg-primary rounded-full animate-bounce"></span>
                                    <p className="text-xs mt-2">Connecting...</p>
                                </div>
                            ) : showHistory ? (
                                <ScrollArea className="h-full p-4">
                                    <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Recent Conversations</h3>
                                    <div className="space-y-2">
                                        {sessions.map(s => {
                                            const sessionId = s._id || s.id;
                                            return (
                                                <div
                                                    key={sessionId}
                                                    onClick={() => handleSelectSession(sessionId)}
                                                    className={cn(
                                                        "p-3 rounded-lg text-sm cursor-pointer border transition-colors",
                                                        sessionId === activeSessionId
                                                            ? "bg-primary/10 border-primary/20 text-primary"
                                                            : "bg-muted/30 border-transparent hover:bg-muted"
                                                    )}
                                                >
                                                    <div className="font-medium truncate">{s.title || 'New Chat'}</div>
                                                    <div className="text-[10px] opacity-70 mt-1">
                                                        {new Date(s.updatedAt).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </ScrollArea>
                            ) : (
                                <ScrollArea className="h-full p-4">
                                    {isLoadingHistory ? (
                                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
                                            <span className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                                        </div>
                                    ) : messages.length === 0 && !error ? (
                                        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground space-y-4 mt-20 opacity-50">
                                            <Bot size={48} />
                                            {!activeSessionId ? (
                                                <>
                                                    <p className="text-sm">Start a conversation to get help.</p>
                                                    <Button variant="outline" size="sm" onClick={handleNewChat}>
                                                        Start New Chat
                                                    </Button>
                                                </>
                                            ) : (
                                                <p className="text-sm">Session Ready.<br />Type below to start.</p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {messages.map((m) => {
                                                const textContent = typeof (m as any).content === 'string'
                                                    ? (m as any).content
                                                    : Array.isArray(m.parts)
                                                        ? m.parts.filter(p => p.type === 'text').map(p => (p as any).content || '').join('')
                                                        : '';

                                                return (
                                                    <div key={m.id} className={cn("flex w-full gap-2", m.role === 'user' ? "justify-end" : "justify-start")}>
                                                        {m.role === 'assistant' && (
                                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                                                                <Bot size={14} className="text-primary" />
                                                            </div>
                                                        )}

                                                        <div className={cn(
                                                            "max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                                                            m.role === 'user'
                                                                ? "bg-primary text-primary-foreground rounded-tr-none"
                                                                : "bg-muted text-foreground rounded-tl-none border border-border/50"
                                                        )}>
                                                            <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                                    {textContent}
                                                                </ReactMarkdown>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {isLoading && (
                                                <div className="flex w-full gap-2 justify-start">
                                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                                                        <Bot size={14} className="text-primary" />
                                                    </div>
                                                    <div className="bg-muted rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1">
                                                        <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                                        <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                                        <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce"></span>
                                                    </div>
                                                </div>
                                            )}
                                            {error && (
                                                <div className="flex justify-center my-4">
                                                    <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-md px-4 py-2 text-sm flex items-center gap-2">
                                                        <AlertCircle size={16} />
                                                        {error}
                                                    </div>
                                                </div>
                                            )}
                                            <div ref={scrollRef} />
                                        </div>
                                    )}
                                </ScrollArea>
                            )}
                        </CardContent>

                        <CardFooter className="p-3 bg-muted/20 border-t">
                            <form onSubmit={handleSubmit} className="flex w-full gap-2 items-center">
                                <Input
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder={isSessionValidating ? "Verifying..." : activeSessionId ? "Type your question..." : "Start a new chat first"}
                                    className="flex-1 bg-background border-input focus-visible:ring-primary/20"
                                    disabled={isLoading || !activeSessionId || isSessionValidating}
                                />
                                <Button type="submit" size="icon" disabled={isLoading || !inputValue.trim() || !activeSessionId || isSessionValidating} className={isLoading ? "animate-pulse" : ""}>
                                    <Send size={18} />
                                </Button>
                            </form>
                        </CardFooter>

                    </Card>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
