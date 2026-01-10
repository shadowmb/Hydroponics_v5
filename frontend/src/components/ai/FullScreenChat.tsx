import { useState, useEffect, useRef } from 'react';
import { useChat } from '@tanstack/ai-react';
import { fetchServerSentEvents } from '@tanstack/ai-client';
import { useAI } from '@/context/AIContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils'; // Ensure this path is correct

interface FullScreenChatProps {
    sessionId?: string;
}

export function FullScreenChat({ sessionId }: FullScreenChatProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [inputValue, setInputValue] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Dynamic API URL based on session
    // If we have a sessionId, we might want to append it to the URL or send it as header/body
    // For now, let's assume the backend handles basic chat, but we need to pass sessionId in headers or body.
    // Tanstack AI's fetchServerSentEvents supports additional headers.

    // UPDATE: The useChat hook URL should point to our chat endpoint.
    // If sessionId exists, we should probably load history first. This hook might not handle "loading history" automatically unless the backend returns it specific format.
    // For specific session chat, we might need a custom adapter or URL parameter.

    // Let's look at how we can pass the sessionId. 
    // We can use the 'api' option to point to `/api/ai/chat`. 
    // We can use `headers` to pass `x-session-id`.

    // Construct the API URL. If sessionId exists, we might want to pass it.
    // However, fetchServerSentEvents takes a URL.
    // If we want to persist specific sessions, the API endpoint needs to handle it.
    // Let's append sessionId as query param for now: ?sessionId=...
    const apiUrl = 'http://localhost:3000/api/ai/chat' + (sessionId ? `?sessionId=${sessionId}` : '');

    const { messages, sendMessage, isLoading } = useChat({
        connection: fetchServerSentEvents(apiUrl),
        onError: (err) => {
            console.error("Chat Error:", err);
            setError(err.message || "An unknown error occurred.");
        },
    });

    // EFFECT to reload/clear chat when sessionId changes
    // Note: useChat doesn't support changing URL/Headers easily on the fly without remounting key.
    // So we will key the component by sessionId in the parent.

    const { initialMessage, setInitialMessage } = useAI();

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
            await sendMessage(inputValue);
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
                                const textContent = m.parts
                                    .filter(p => p.type === 'text')
                                    .map(p => (p as any).content || '')
                                    .join('');

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

            <CardFooter className="p-4 border-t bg-muted/10">
                <div className="max-w-3xl mx-auto w-full">
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
