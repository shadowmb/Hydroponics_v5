import { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Plus, MessageSquare, Trash2, Search, Pencil, Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { bg } from 'date-fns/locale';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface ChatSession {
    id: string;
    title: string;
    updatedAt: string;
}

interface ChatSessionSidebarProps {
    onSelectSession: (id: string) => void;
    activeSessionId?: string;
    onNewChat: () => void;
    refreshTrigger?: number;
}

export function ChatSessionSidebar({ onSelectSession, activeSessionId, onNewChat, refreshTrigger }: ChatSessionSidebarProps) {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [deleteId, setDeleteId] = useState<string | null>(null); // For dialog

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

    const fetchSessions = async () => {
        try {
            const res = await axios.get(`${API_URL}/ai/sessions`);
            if (res.data.success) {
                setSessions(res.data.data);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const confirmDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setDeleteId(id);
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await axios.delete(`${API_URL}/ai/sessions/${deleteId}`);
            setDeleteId(null);
            fetchSessions();
            if (activeSessionId === deleteId) onNewChat();
        } catch (error) {
            console.error(error);
        }
    };

    const startEditing = (e: React.MouseEvent, session: ChatSession) => {
        e.stopPropagation();
        setEditingSessionId(session.id);
        setEditTitle(session.title);
    };

    const cancelEditing = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        setEditingSessionId(null);
        setEditTitle('');
    };

    const saveTitle = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!editTitle.trim()) return;
        try {
            await axios.patch(`${API_URL}/ai/sessions/${id}/title`, { title: editTitle });
            setEditingSessionId(null);
            fetchSessions();
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchSessions();
        // Poll for updates (e.g. if title changes)
        const interval = setInterval(fetchSessions, 10000);
        return () => clearInterval(interval);
    }, [refreshTrigger]);

    const filteredSessions = sessions.filter(s =>
        s.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="w-64 border-r bg-muted/20 flex flex-col h-full">
            <div className="p-4 border-b space-y-4">
                <Button onClick={onNewChat} className="w-full justify-start" variant="default">
                    <Plus className="mr-2 h-4 w-4" /> Нов чат
                </Button>
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Търсене..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
            <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                    {filteredSessions.map(session => (
                        <div
                            key={session.id}
                            onClick={() => onSelectSession(session.id)}
                            className={`group flex items-center justify-between p-2 rounded-md text-sm cursor-pointer hover:bg-accent ${activeSessionId === session.id ? 'bg-accent text-accent-foreground font-medium' : 'text-muted-foreground'}`}
                        >
                            <div className="flex items-center overflow-hidden flex-1 mr-2">
                                <MessageSquare className="mr-2 h-4 w-4 shrink-0" />

                                {editingSessionId === session.id ? (
                                    <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
                                        <Input
                                            value={editTitle}
                                            onChange={(e) => setEditTitle(e.target.value)}
                                            className="h-6 text-xs px-1"
                                            autoFocus
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') saveTitle(e as any, session.id);
                                                if (e.key === 'Escape') cancelEditing();
                                            }}
                                        />
                                        <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={(e) => saveTitle(e, session.id)}>
                                            <Check className="h-3 w-3 text-green-500" />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={cancelEditing}>
                                            <X className="h-3 w-3 text-red-500" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col overflow-hidden">
                                        <span className="truncate">{session.title}</span>
                                        <span className="text-[10px] opacity-70">
                                            {formatDistanceToNow(new Date(session.updatedAt), { addSuffix: true, locale: bg })}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {editingSessionId !== session.id && (
                                <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={(e) => startEditing(e, session)}
                                    >
                                        <Pencil className="h-3 w-3 text-muted-foreground hover:text-primary" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={(e) => confirmDelete(e, session.id)}
                                    >
                                        <Trash2 className="h-3 w-3 text-muted-foreground hover:text-red-500" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </ScrollArea>

            <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Изтриване на разговор</DialogTitle>
                        <DialogDescription>
                            Сигурни ли сте, че искате да изтриете този разговор? Това действие е необратимо.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteId(null)}>Отказ</Button>
                        <Button variant="destructive" onClick={handleDelete}>Изтрий</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
