import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import { ScrollArea } from '@/components/ui/scroll-area';
import { Bell, Check, MessageCircle, Trash2 } from 'lucide-react';
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

import { useNavigate } from 'react-router-dom';

export function AIInsightsButton() {
    const { setInitialMessage } = useAI();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [insights, setInsights] = useState<Insight[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [deleteId, setDeleteId] = useState<string | null>(null);

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
        navigate('/assistant');
    };

    const confirmDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setDeleteId(id);
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await axios.delete(`${API_URL}/ai/insights/${deleteId}`);
            setDeleteId(null);
            fetchData(); // Refresh list
        } catch (error) {
            console.error(error);
        }
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
                                    className={`p-3 rounded-lg border transition-colors relative group ${insight.isRead ? 'bg-background hover:bg-muted/50 border-border/50' : 'bg-primary/5 border-primary/20 hover:bg-primary/10'
                                        }`}
                                    onClick={() => handleInsightClick(insight)}
                                >
                                    <div className="flex justify-between items-start mb-1 pr-6">
                                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-background border">
                                            {insight.actionName}
                                        </span>
                                    </div>
                                    <p className="text-sm leading-relaxed text-foreground/90 mb-3">
                                        {insight.content}
                                    </p>

                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                            {formatDistanceToNow(new Date(insight.createdAt), { addSuffix: true, locale: bg })}
                                        </span>
                                        <div className="flex items-center text-xs text-primary font-medium opacity-80 group-hover:opacity-100">
                                            <MessageCircle size={12} className="mr-1.5" />
                                            Кликни за анализ
                                        </div>
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={(e) => confirmDelete(e, insight.id)}
                                    >
                                        <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-500" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>

            <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Изтриване на известие</DialogTitle>
                        <DialogDescription>
                            Сигурни ли сте, че искате да изтриете това известие?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteId(null)}>Отказ</Button>
                        <Button variant="destructive" onClick={handleDelete}>Изтрий</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Popover>
    );
}
