import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, Check } from 'lucide-react';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { bg } from 'date-fns/locale';

import { useAI } from '../../context/AIContext';

interface Insight {
    id: string;
    actionName: string;
    content: string;
    type: 'info' | 'warning' | 'critical';
    isRead: boolean;
    createdAt: string;
}

export function AIInsightsButton() {
    const { openChat, setInitialMessage } = useAI();
    const [open, setOpen] = useState(false);
    const [insights, setInsights] = useState<Insight[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

    const handleInsightClick = async (insight: Insight) => {
        setOpen(false); // Close popover

        // Mark as read if needed
        if (!insight.isRead) {
            // allow async mark read to happen in background
            axios.post(`${API_URL}/ai/insights/mark-read`).catch(console.error);
        }

        // Context Prompt
        const contextPrompt = `
**Анализ на Insight:**
Действие: "${insight.actionName}"
Съобщение:
"${insight.content}"

---
Моля, обясни повече за това състояние и какво трябва да направя?
`;
        setInitialMessage(contextPrompt);
        openChat();
    };

    const fetchData = async () => {
        try {
            const [listRes, countRes] = await Promise.all([
                axios.get(`${API_URL}/ai/insights`),
                axios.get(`${API_URL}/ai/insights/count`)
            ]);
            if (listRes.data.success) setInsights(listRes.data.data);
            if (countRes.data.success) setUnreadCount(countRes.data.count);
        } catch (error) {
            console.error("Failed to fetch insights", error);
        }
    };

    useEffect(() => {
        // Initial fetch
        fetchData();

        // Poll every 10 seconds for new notifications
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleMarkAllRead = async () => {
        try {
            await axios.post(`${API_URL}/ai/insights/mark-read`);
            setUnreadCount(0);
            setInsights(prev => prev.map(i => ({ ...i, isRead: true })));
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-600 ring-2 ring-background animate-pulse" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                    <h4 className="font-semibold">Известия (Insights)</h4>
                    {unreadCount > 0 && (
                        <Button variant="ghost" size="sm" onClick={handleMarkAllRead} className="text-xs h-8">
                            <Check className="mr-1 h-3 w-3" /> Маркирай всички
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-[300px]">
                    {insights.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground text-sm">
                            Няма нови известия.
                        </div>
                    ) : (
                        <div className="divide-y">
                            {insights.map((insight) => (
                                <div
                                    key={insight.id}
                                    className={`p-4 hover:bg-muted/50 transition-colors ${!insight.isRead ? 'bg-muted/20' : ''} cursor-pointer`}
                                    onClick={() => handleInsightClick(insight)}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <Badge variant="outline" className="text-[10px] font-normal">
                                            {insight.actionName}
                                        </Badge>
                                        <span className="text-[10px] text-muted-foreground">
                                            {formatDistanceToNow(new Date(insight.createdAt), { addSuffix: true, locale: bg })}
                                        </span>
                                    </div>
                                    <p className="text-sm mt-1 whitespace-pre-wrap leading-snug text-foreground/90 line-clamp-2">
                                        {insight.content}
                                    </p>
                                    <div className="text-xs text-primary mt-2">
                                        💬 Кликни за анализ
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
