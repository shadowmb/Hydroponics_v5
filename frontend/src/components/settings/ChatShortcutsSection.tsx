import { useState, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, ArrowUpDown } from 'lucide-react';
import { aiService } from '@/services/ai.service';
import { ShortcutDialog } from './ShortcutDialog';
import { toast } from 'sonner';

interface ChatShortcut {
    id: string;
    label: string;
    prompt: string;
    category: string;
    enabled?: boolean;
    order?: number;
}

export function ChatShortcutsSection() {
    const [shortcuts, setShortcuts] = useState<ChatShortcut[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingShortcut, setEditingShortcut] = useState<ChatShortcut | null>(null);

    useEffect(() => {
        fetchShortcuts();
    }, []);

    const fetchShortcuts = async () => {
        setLoading(true);
        try {
            const data = await aiService.getShortcuts();
            setShortcuts(data || []);
        } catch (error) {
            console.error("Failed to fetch shortcuts", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingShortcut(null);
        setDialogOpen(true);
    };

    const handleEdit = (s: ChatShortcut) => {
        setEditingShortcut(s);
        setDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Сигурни ли сте, че искате да изтриете този въпрос?')) return;
        try {
            await aiService.deleteShortcut(id);
            toast.success('Въпросът е изтрит');
            fetchShortcuts();
        } catch (error) {
            toast.error('Грешка при изтриване');
        }
    };

    const handleSave = async (data: any) => {
        try {
            if (data.id) {
                await aiService.updateShortcut(data.id, data);
                if (dialogOpen) toast.success('Въпросът е обновен');
            } else {
                await aiService.createShortcut(data);
                toast.success('Въпросът е създаден');
            }
            fetchShortcuts();
        } catch (error) {
            toast.error('Грешка при запис');
            console.error(error);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-card p-4 rounded-lg border shadow-sm">
                <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        📋 Бързи Въпроси
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Управлявайте шаблоните за бързи въпроси в чата.
                    </p>
                </div>
                <Button onClick={handleCreate} className="gap-2">
                    <Plus size={16} /> Добави Въпрос
                </Button>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[200px]">Заглавие</TableHead>
                            <TableHead>Категория</TableHead>
                            <TableHead>Статус</TableHead>
                            <TableHead className="w-[400px]">Промпт (Preview)</TableHead>
                            <TableHead className="text-right">Действия</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                    Зареждане...
                                </TableCell>
                            </TableRow>
                        ) : shortcuts.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                    Няма добавени въпроси.
                                </TableCell>
                            </TableRow>
                        ) : (
                            shortcuts.map((s) => (
                                <TableRow key={s.id}>
                                    <TableCell className="font-medium">{s.label}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">{s.category}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center space-x-2">
                                            <Switch
                                                checked={s.enabled !== false}
                                                onCheckedChange={(checked) => handleSave({ ...s, enabled: checked })}
                                            />
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-xs truncate max-w-[400px]">
                                        {s.prompt}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(s)}>
                                                <Edit size={16} />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="hover:text-destructive" onClick={() => handleDelete(s.id)}>
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <ShortcutDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                shortcut={editingShortcut}
                onSave={handleSave}
            />
        </div>
    );
}
