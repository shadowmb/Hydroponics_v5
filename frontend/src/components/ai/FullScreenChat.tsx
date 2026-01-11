import axios from 'axios';
import { useState, useEffect, useRef } from 'react';
import { useChat } from '@tanstack/ai-react';
import { fetchServerSentEvents } from '@tanstack/ai-client';
import { useAI } from '@/context/AIContext';
import { useUIState } from '@/context/UIStateContext'; // Import Hook
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, AlertCircle } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { aiService } from '@/services/ai.service';
import { AI_MODELS } from '@/config/aiModels';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { ShortcutSelector } from './ShortcutSelector';

interface FullScreenChatProps {
    sessionId?: string;
}

export function FullScreenChat({ sessionId }: FullScreenChatProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [inputValue, setInputValue] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [activeModelName, setActiveModelName] = useState<string | null>(null);

    // Fetch Active Model
    useEffect(() => {
        const fetchModel = async () => {
            try {
                const settings = await aiService.getSettings();

                const config = settings?.data;
                if (!config) {
                    return;
                }

                let modelId = '';

                // 1. Check mode
                if (config.mode === 'advanced' && config.roles?.assistant) {
                    modelId = config.roles.assistant.model;
                } else {
                    modelId = config.global?.model; // Safe access
                }

                // 2. Find Name
                if (modelId) {
                    let foundName = modelId;
                    // Iterate providers
                    for (const [, models] of Object.entries(AI_MODELS)) {
                        const match = models.find(m => m.id === modelId);
                        if (match) {
                            foundName = match.name;
                            break;
                        }
                    }

                    setActiveModelName(foundName);
                } else {
                    setActiveModelName('No Model Selected');
                }
            } catch (e) {
                console.error("💥 Failed to load AI settings", e);
                setActiveModelName('Error Loading');
            }
        };
        fetchModel();
    }, []);

    const apiUrl = `http://localhost:3000/api/ai/chat${sessionId ? `?sessionId=${sessionId}` : ''}`;

    const { messages, sendMessage, isLoading, setMessages } = useChat({
        connection: fetchServerSentEvents(apiUrl),
        body: { sessionId },
        onError: (err) => {
            console.error("Chat Error:", err);
            setError(err.message || "An unknown error occurred.");
        },
    });

    // Load History
    useEffect(() => {
        if (!sessionId) return;

        const loadHistory = async () => {
            try {
                const res = await axios.get(`http://localhost:3000/api/ai/sessions/${sessionId}`);
                if (res.data.success && res.data.data.messages) {
                    const history = res.data.data.messages.map((m: any) => ({
                        id: m._id || m.id || Math.random().toString(36),
                        role: m.role,
                        content: m.content,
                        parts: [{ type: 'text', content: m.content }]
                    }));
                    setMessages(history);
                }
            } catch (err) {
                console.error("Failed to load history", err);
            }
        };
        loadHistory();
    }, [sessionId, setMessages]);

    // EFFECT to reload/clear chat when sessionId changes
    // Note: useChat doesn't support changing URL/Headers easily on the fly without remounting key.
    // So we will key the component by sessionId in the parent.

    const { initialMessage, setInitialMessage } = useAI();
    const { uiState } = useUIState(); // Use Real State

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isLoading, error]);

    // Context Injection for Full Screen
    useEffect(() => {
        if (initialMessage && !isLoading) {
            // If we have a session, we might want to append it?
            // Or just send it as a new message.
            sendMessage(initialMessage);
            setInitialMessage(null);
        }
    }, [initialMessage, isLoading, sendMessage, setInitialMessage]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;
        setError(null);
        try {
            // 1. Capture UI State (Real Data)
            const uiContext = {
                step: uiState.wizard.active ? uiState.wizard.step : undefined,
                wizard: uiState.wizard.active ? uiState.wizard.name : undefined,
                config: uiState.wizard.active ? uiState.wizard.config : undefined,
                path: window.location.pathname
            };
            // 2. Append Hidden Marker
            const finalMsg = `${inputValue}\n\n:::HYDROPONICS_CTX_V5:::${JSON.stringify(uiContext)}`;
            await sendMessage(finalMsg);
        } catch (e) { }
        setInputValue('');
    };

    if (!sessionId) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Bot size={64} className="mb-4 opacity-20" />
                <h2 className="text-xl font-semibold">Select a conversation</h2>
                <p>Choose a previous chat from the sidebar or start a new one.</p>
            </div>
        );
    }

    return (
        <Card className="flex flex-col h-full border-0 rounded-none shadow-none bg-background">
            <CardHeader className="py-3 px-4 border-b">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                    <Bot size={20} className="text-primary" />
                    AI Assistant
                    {activeModelName && (
                        <Badge variant="outline" className="ml-2 text-xs font-normal text-muted-foreground border-primary/20 bg-primary/5">
                            {activeModelName}
                        </Badge>
                    )}
                </CardTitle>
            </CardHeader>

            <CardContent className="flex-1 p-0 overflow-hidden relative">
                <ScrollArea className="h-full p-6">
                    {messages.length === 0 && !error ? (
                        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground space-y-4 mt-20 opacity-50">
                            <Bot size={48} />
                            <p>Start a new conversation related to your hydroponics system.</p>
                        </div>
                    ) : (
                        <div className="space-y-6 max-w-3xl mx-auto">
                            {messages.map((m) => {
                                let textContent = typeof (m as any).content === 'string'
                                    ? (m as any).content
                                    : Array.isArray(m.parts)
                                        ? m.parts.filter(p => p.type === 'text').map(p => (p as any).content || '').join('')
                                        : '';

                                // Remove Context Marker from UI
                                textContent = textContent.replace(/(?:\n+:::HYDROPONICS_CTX_V5:::)([\s\S]*?)$/, '').trim();

                                return (
                                    <div key={m.id} className={cn("flex w-full gap-4", m.role === 'user' ? "justify-end" : "justify-start")}>
                                        {m.role === 'assistant' && (
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                                                <Bot size={14} className="text-primary" />
                                            </div>
                                        )}
                                        <div className={cn(
                                            "max-w-[80%] rounded-2xl px-5 py-3 text-sm shadow-sm",
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
                                <div className="flex w-full gap-4 justify-start">
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
            </CardContent>

            <CardFooter className="p-4 border-t bg-muted/10 flex-col gap-2 items-stretch">
                <div className="max-w-3xl mx-auto w-full space-y-2">
                    <ShortcutSelector
                        onSelect={(prompt) => setInputValue(prompt)}
                    />
                    <form onSubmit={handleSubmit} className="flex gap-2 items-center">
                        <Input
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 bg-background"
                            disabled={isLoading}
                        />
                        <Button type="submit" size="icon" disabled={isLoading || !inputValue.trim()}>
                            <Send size={18} />
                        </Button>
                    </form>
                </div>
            </CardFooter>
        </Card>
    );
}
