import { useState, useEffect, useRef, useMemo } from 'react';
import { useChat } from '@tanstack/ai-react';
import { fetchServerSentEvents } from '@tanstack/ai-client';
import { useAI } from '../../context/AIContext';
import { Button } from '../ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { X, Send, Bot, AlertCircle, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { aiService } from '@/services/ai.service';
import { useLocation } from 'react-router-dom';
import { useUIState } from '@/context/UIStateContext'; // Import Hook

// Wrapper handling Visibility, Animation, and Re-mounting (Keying)
export function AIChatPopup() {
    const { isOpen, activeSessionId } = useAI();
    const location = useLocation();

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
                    {/* Key forces remount on session change, ensuring useChat hooks get fresh config */}
                    <AIChatContent key={activeSessionId || 'new'} sessionId={activeSessionId} />
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// Inner Content Component (Logic)
function AIChatContent({ sessionId }: { sessionId: string | null }) {
    const { closeChat, setActiveSessionId, triggerSessionRefresh, sessionRefreshTrigger, isSessionValidating } = useAI();
    const scrollRef = useRef<HTMLDivElement>(null);

    // Local state
    const [inputValue, setInputValue] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [sessions, setSessions] = useState<any[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [title, setTitle] = useState('New Chat');
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [titleInput, setTitleInput] = useState('');
    const isCreatingSession = useRef(false);

    // Context Injection
    const { uiState } = useUIState();

    // Dynamic Connection
    const apiUrl = 'http://localhost:3000/api/ai/chat';
    const connection = useMemo(() => {
        const url = sessionId
            ? `${apiUrl}?sessionId=${sessionId}`
            : apiUrl;
        return fetchServerSentEvents(url);
    }, [sessionId]);

    // TanStack AI Hook - Now guaranteed to have fresh sessionId in body if provided
    const { messages, sendMessage, isLoading, setMessages } = useChat({
        connection,
        body: {
            sessionId: sessionId || undefined // Only pass if exists
        },
        onError: (err) => {
            console.error("Chat Error:", err);
            setError(err.message || "An unknown error occurred.");
        },
    });

    // Load History
    useEffect(() => {
        const loadHistory = async () => {
            if (!sessionId) {
                setMessages([]);
                return;
            }

            if (isCreatingSession.current) {
                isCreatingSession.current = false;
                return;
            }

            setIsLoadingHistory(true);
            try {
                const session = await aiService.getSession(sessionId);
                if (session) {
                    setTitle(session.title || 'New Chat');
                    setTitleInput(session.title || 'New Chat');
                    if (session.messages) {
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

        if (!isSessionValidating) {
            loadHistory();
        }
    }, [sessionId, isSessionValidating, setMessages, setActiveSessionId]);

    // Load Sessions List
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
    }, [sessionRefreshTrigger, showHistory]);

    const handleNewChat = async () => {
        try {
            const newSession = await aiService.createSession();
            isCreatingSession.current = true;
            const newId = newSession._id || newSession.id;
            setActiveSessionId(newId);
            // Component will remount with new ID
        } catch (e) {
            console.error("Failed to create session", e);
        }
    };

    const handleSelectSession = (id: string) => {
        setActiveSessionId(id);
        // Component will remount
    };

    const handleTitleSave = async () => {
        if (!sessionId || !titleInput.trim()) return;
        try {
            await aiService.updateSessionTitle(sessionId, titleInput);
            setTitle(titleInput);
            setIsEditingTitle(false);
            triggerSessionRefresh(); // Refresh list if open
        } catch (e) {
            console.error("Failed to update title", e);
            // Revert?
        }
    };

    // Scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isLoading, error, isLoadingHistory]);

    // Initial Message Handling (Context)
    const { initialMessage, setInitialMessage } = useAI();
    useEffect(() => {
        if (initialMessage && !isLoading && !isSessionValidating) {
            const ensureSession = async () => {
                if (!sessionId) {
                    // Create logic if missing
                    const newSession = await aiService.createSession();
                    setActiveSessionId(newSession._id || newSession.id);
                    // Remount happens, message will be pending? 
                    // No, context holds initialMessage. Next mount picks it up.
                } else {
                    sendMessage(initialMessage);
                    setInitialMessage(null);
                }
            };
            ensureSession();
        }
    }, [initialMessage, isLoading, sendMessage, setInitialMessage, sessionId, setActiveSessionId, isSessionValidating]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading || isSessionValidating) return;
        if (!sessionId) return;

        setError(null);
        const msg = inputValue;
        setInputValue('');

        // 1. Capture UI State (Real Data)
        const uiContext = {
            step: uiState.wizard.active ? uiState.wizard.step : undefined,
            wizard: uiState.wizard.active ? uiState.wizard.name : undefined,
            config: uiState.wizard.active ? uiState.wizard.config : undefined,
            path: window.location.pathname
        };

        // 2. Append Hidden Marker
        const finalMsg = `${msg}\n\n:::HYDROPONICS_CTX_V5:::${JSON.stringify(uiContext)}`;

        try {
            await sendMessage(finalMsg);
        } catch (e) {
            console.error("Msg failed", e);
            setInputValue(msg);
            setError("Failed to send message");
        }
    };

    return (
        <Card className="h-[600px] flex flex-col border-primary/20 bg-background/95 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b">
                <div className="flex items-center gap-2 flex-1 overflow-hidden">
                    <div className={`p-1.5 rounded-full ${isLoading || isSessionValidating || isLoadingHistory ? 'bg-amber-500/20 text-amber-500 animate-pulse' : 'bg-primary/20 text-primary'} shrink-0`}>
                        <Bot size={18} />
                    </div>
                    <div className="flex flex-col flex-1 overflow-hidden">
                        {isEditingTitle ? (
                            <div className="flex items-center gap-1">
                                <Input
                                    value={titleInput}
                                    onChange={(e) => setTitleInput(e.target.value)}
                                    className="h-6 text-sm py-0 px-1 w-[140px] border-primary/50"
                                    autoFocus
                                    onBlur={(e) => {
                                        // Delay to allow button click to register if relatedTarget is the button?
                                        // Actually simplest is just save on blur, but prevent double save
                                        // But if user cancels via Escape, we don't want save.
                                        // Let's rely on Enter/Button and just close on clean blur?
                                        // Standard behavior: Blur = Save.
                                        // We just need to make sure Button click doesn't conflict.
                                        if (!e.relatedTarget) { // If clicking outside app?
                                            handleTitleSave();
                                        } else {
                                            // Ensure we save if clicking elsewhere EXCEPT Cancel?
                                            handleTitleSave();
                                        }
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault(); // Prevent form submit if any
                                            handleTitleSave();
                                            // Force blur to close?
                                            e.currentTarget.blur();
                                        } else if (e.key === 'Escape') {
                                            e.preventDefault();
                                            setTitleInput(title);
                                            setIsEditingTitle(false);
                                        }
                                    }}
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-green-500 hover:text-green-600 hover:bg-green-100"
                                    onMouseDown={(e) => {
                                        e.preventDefault(); // Prevent input blur
                                        handleTitleSave();
                                    }}
                                >
                                    <Check size={14} />
                                </Button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 group cursor-pointer" onClick={() => sessionId && setIsEditingTitle(true)}>
                                <CardTitle className="text-base font-medium leading-none truncate" title={title}>
                                    {isSessionValidating ? 'Connecting...' : title}
                                </CardTitle>
                                {sessionId && (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></svg>
                                )}
                            </div>
                        )}
                        <span className="text-[10px] text-muted-foreground truncate">
                            {isSessionValidating ? 'Verifying Session...' : sessionId ? 'Hydroponics AI' : 'New Chat'}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
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
                                const sId = s._id || s.id;
                                return (
                                    <div
                                        key={sId}
                                        onClick={() => handleSelectSession(sId)}
                                        className={cn(
                                            "p-3 rounded-lg text-sm cursor-pointer border transition-colors",
                                            sId === sessionId
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
                                {!sessionId ? (
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
                                    let textContent = typeof (m as any).content === 'string'
                                        ? (m as any).content
                                        : Array.isArray(m.parts)
                                            ? m.parts.filter((p: any) => p.type === 'text').map((p: any) => p.content || '').join('')
                                            : '';

                                    // Remove Context Marker from UI
                                    textContent = textContent.replace(/(?:\n+:::HYDROPONICS_CTX_V5:::)([\s\S]*?)$/, '').trim();

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
                        placeholder={isSessionValidating ? "Verifying..." : sessionId ? "Type your question..." : "Start a new chat first"}
                        className="flex-1 bg-background border-input focus-visible:ring-primary/20"
                        disabled={isLoading || !sessionId || isSessionValidating}
                    />
                    <Button type="submit" size="icon" disabled={isLoading || !inputValue.trim() || !sessionId || isSessionValidating} className={isLoading ? "animate-pulse" : ""}>
                        <Send size={18} />
                    </Button>
                </form>
            </CardFooter>
        </Card>
    );
}
