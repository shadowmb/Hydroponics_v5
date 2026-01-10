import { useState, useEffect, useRef } from 'react';
import { useChat } from '@tanstack/ai-react';
import { fetchServerSentEvents } from '@tanstack/ai-client'; // Ensure correct import path
// Note: If /react path fails, standard is '@tanstack/ai-client' but need to check exports
import { useAI } from '../../context/AIContext';
import { Button } from '../ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { X, Send, Trash2, Bot, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
// import { aiService } from '@/services/ai.service'; 

export function AIChatPopup() {
    const { isOpen, closeChat } = useAI();
    const scrollRef = useRef<HTMLDivElement>(null);

    // Local state for input since useChat doesn't manage it in this lib
    const [inputValue, setInputValue] = useState('');
    const [error, setError] = useState<string | null>(null);

    // TanStack AI Hook
    const { messages, sendMessage, isLoading, clear } = useChat({
        connection: fetchServerSentEvents('http://localhost:3000/api/ai/chat'),
        onError: (err) => {
            console.error("Chat Error:", err);
            // Try to parse friendly error message
            let msg = err.message || "An unknown error occurred.";

            // Should try to distinguish between simple network fail and backend detailed error
            if (msg.includes('500') || msg.includes('400')) {
                // Often the error message from fetch includes the status text, 
                // but ideally the adapter extracts the body. 
                // If the backend returns JSON { error: "...", details: "..." }, 
                // the adapter might put that in err.message.
            }
            setError(msg);
        },
    });

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isLoading, error]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        setError(null); // Clear previous errors
        try {
            await sendMessage(inputValue);
        } catch (e) {
            // Error is handled by onError callback usually, but fallback here
        }
        setInputValue('');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="fixed bottom-4 right-4 z-50 w-[400px] shadow-2xl"
                >
                    <Card className="h-[600px] flex flex-col border-primary/20 bg-background/95 backdrop-blur-sm">

                        {/* Header */}
                        <CardHeader className="flex flex-row items-center justify-between py-3 px-4 border-b">
                            <div className="flex items-center gap-2">
                                <div className={`p-1.5 rounded-full ${isLoading ? 'bg-amber-500/20 text-amber-500 animate-pulse' : 'bg-primary/20 text-primary'}`}>
                                    <Bot size={18} />
                                </div>
                                <CardTitle className="text-base font-medium">Hydroponics AI</CardTitle>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => { clear(); setError(null); }}>
                                    <Trash2 size={16} />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={closeChat}>
                                    <X size={18} />
                                </Button>
                            </div>
                        </CardHeader>

                        {/* Messages Area */}
                        <CardContent className="flex-1 p-0 overflow-hidden relative">
                            <ScrollArea className="h-full p-4">
                                {messages.length === 0 && !error ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground space-y-4 mt-20 opacity-50">
                                        <Bot size={48} />
                                        <p className="text-sm">Ask me about your system,<br />sensors, or general advice.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {messages.map((m) => {
                                            // Helper to extract text content from message parts
                                            const textContent = m.parts
                                                .filter(p => p.type === 'text')
                                                .map(p => (p as any).content || '')
                                                .join('');

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
                                                            <ReactMarkdown
                                                                remarkPlugins={[remarkGfm]}
                                                                components={{
                                                                    pre: ({ node, ...props }) => <div className="overflow-auto w-full my-2 bg-black/10 dark:bg-black/30 p-2 rounded-md" {...props as any} />,
                                                                    code: ({ node, ...props }) => <code className="bg-black/10 dark:bg-black/30 px-1 py-0.5 rounded text-xs" {...props as any} />
                                                                }}
                                                            >
                                                                {textContent}
                                                            </ReactMarkdown>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {/* Loading Indicator */}
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

                                        {/* Error Alert Bubble */}
                                        {error && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="flex w-full gap-2 justify-center"
                                            >
                                                <div className="bg-destructive/10 text-destructive border border-destructive/20 rounded-xl px-4 py-3 text-sm flex items-start gap-2 max-w-[90%]">
                                                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                                    <div className="flex-1">
                                                        <p className="font-semibold">System Error</p>
                                                        <p className="opacity-90">{error}</p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}

                                        <div ref={scrollRef} />
                                    </div>
                                )}
                            </ScrollArea>
                        </CardContent>

                        {/* Input Footer */}
                        <CardFooter className="p-3 bg-muted/20 border-t">
                            <form onSubmit={handleSubmit} className="flex w-full gap-2 items-center">
                                <Input
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder="Type your question..."
                                    className="flex-1 bg-background border-input focus-visible:ring-primary/20"
                                    disabled={isLoading}
                                />
                                <Button type="submit" size="icon" disabled={isLoading || !inputValue.trim()} className={isLoading ? "animate-pulse" : ""}>
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
