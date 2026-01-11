import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ChatShortcut {
    id?: string;
    label: string;
    prompt: string;
    category: string;
    order?: number;
}


interface ShortcutDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    shortcut?: ChatShortcut | null;
    onSave: (shortcut: ChatShortcut) => Promise<void>;
}

const DEFAULT_SHORTCUT: ChatShortcut = {
    label: '',
    prompt: '',
    category: 'General',
    order: 0
};

export function ShortcutDialog({ open, onOpenChange, shortcut, onSave }: ShortcutDialogProps) {
    const [formData, setFormData] = useState<ChatShortcut>(DEFAULT_SHORTCUT);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (shortcut) {
            setFormData({ ...shortcut });
        } else {
            setFormData({ ...DEFAULT_SHORTCUT });
        }
    }, [shortcut, open]);

    const handleSave = async () => {
        setLoading(true);
        try {
            await onSave(formData);
            onOpenChange(false);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{shortcut ? 'Редактиране на Въпрос' : 'Нов Бърз Въпрос'}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Заглавие (Label)</Label>
                        <Input
                            value={formData.label}
                            onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                            placeholder="Напр. Анализ на pH"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Категория</Label>
                        <Input
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            placeholder="Напр. General"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Системен Промпт</Label>
                        <Textarea
                            className="min-h-[150px]"
                            value={formData.prompt}
                            onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                            placeholder="Инструкции към AI..."
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Отказ</Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading ? 'Записване...' : 'Запиши'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
