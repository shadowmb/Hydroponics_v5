import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Checkbox } from '../ui/checkbox';
import { TimePicker24 } from '../ui/time-picker-24';
import type { ITimeWindow, DataSource } from './types';

interface TimeWindowModalProps {
    open: boolean;
    onClose: () => void;
    onSave: (window: ITimeWindow, autoShift?: boolean) => void;
    window?: ITimeWindow | null;
    flows: { id: string; name: string }[];
    existingWindows: ITimeWindow[];  // For smart defaults
}

const generateId = () => `tw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const TimeWindowModal: React.FC<TimeWindowModalProps> = ({
    open,
    onClose,
    onSave,
    window: editingWindow,
    flows,
    existingWindows
}) => {
    const isEditing = !!editingWindow;

    // Form state
    const [name, setName] = useState('');
    const [startTime, setStartTime] = useState('08:00');
    const [endTime, setEndTime] = useState('10:00');
    const [checkInterval, setCheckInterval] = useState(5);
    const [dataSource, setDataSource] = useState<DataSource>('cached');
    const [fallbackFlowId, setFallbackFlowId] = useState('');
    const [autoAdjust, setAutoAdjust] = useState(false);

    // Reset form when modal opens
    useEffect(() => {
        if (open) {
            if (editingWindow) {
                // Editing mode - populate from existing
                setName(editingWindow.name);
                setStartTime(editingWindow.startTime);
                setEndTime(editingWindow.endTime);
                setCheckInterval(editingWindow.checkInterval);
                setDataSource(editingWindow.dataSource);
                setFallbackFlowId(editingWindow.fallbackFlowId || '');
            } else {
                // New mode - smart defaults
                const lastWindow = existingWindows[existingWindows.length - 1];
                if (lastWindow) {
                    // Start where last window ended
                    setStartTime(lastWindow.endTime);
                    // End 2 hours later
                    const [h, m] = lastWindow.endTime.split(':').map(Number);
                    const endHour = (h + 2) % 24;
                    setEndTime(`${String(endHour).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
                } else {
                    setStartTime('08:00');
                    setEndTime('10:00');
                }
                setName(`Прозорец ${existingWindows.length + 1}`);
                setCheckInterval(5);
                setDataSource('cached');
                setFallbackFlowId('');
            }
        }
    }, [open, editingWindow, existingWindows]);

    const toMinutes = (time: string) => {
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
    };

    const handleSave = () => {
        const startMins = toMinutes(startTime);
        const endMins = toMinutes(endTime);

        // 1. Basic Validation: Start < End
        if (startMins >= endMins) {
            toast.error("Крайният час трябва да е след началния!");
            return;
        }

        // 2. Overlap Validation
        const hasOverlap = existingWindows.some(w => {
            if (isEditing && w.id === editingWindow.id) return false;
            const wStart = toMinutes(w.startTime);
            const wEnd = toMinutes(w.endTime);
            // Check if ranges overlap: (StartA < EndB) and (EndA > StartB)
            return (startMins < wEnd && endMins > wStart);
        });

        if (hasOverlap && !autoAdjust) {
            toast.error("Времевият прозорец се припокрива с друг съществуващ прозорец!");
            return;
        }

        const windowData: ITimeWindow = {
            id: editingWindow?.id || generateId(),
            name,
            startTime,
            endTime,
            checkInterval,
            dataSource,
            triggers: editingWindow?.triggers || [],
            fallbackFlowId: fallbackFlowId || undefined
        };
        onSave(windowData, autoAdjust);
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? '✏️ Редакция на прозорец' : '📅 Нов времеви прозорец'}
                    </DialogTitle>
                    <DialogDescription>
                        Времевият прозорец определя кога системата ще проверява условията.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Name */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Име</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="col-span-3"
                            placeholder="напр. Сутрешно поливане"
                        />
                    </div>

                    {/* Time Range */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Време</Label>
                        <div className="col-span-3 flex items-center gap-2">
                            <TimePicker24
                                value={startTime}
                                onChange={setStartTime}
                            />
                            <span className="text-muted-foreground">до</span>
                            <TimePicker24
                                value={endTime}
                                onChange={setEndTime}
                            />
                        </div>
                    </div>

                    {/* Auto Adjust */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <div className="col-start-2 col-span-3 flex items-center space-x-2">
                            <Checkbox
                                id="autoAdjust"
                                checked={autoAdjust}
                                onCheckedChange={(checked) => setAutoAdjust(checked as boolean)}
                            />
                            <Label htmlFor="autoAdjust" className="text-sm font-normal text-muted-foreground cursor-pointer">
                                Автоматично преместване на следващи прозорци при застъпване
                            </Label>
                        </div>
                    </div>

                    {/* Check Interval */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Интервал</Label>
                        <div className="col-span-3 flex items-center gap-2">
                            <Select
                                value={String(checkInterval)}
                                onValueChange={(v) => setCheckInterval(Number(v))}
                            >
                                <SelectTrigger className="w-24">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">1 мин</SelectItem>
                                    <SelectItem value="5">5 мин</SelectItem>
                                    <SelectItem value="10">10 мин</SelectItem>
                                    <SelectItem value="15">15 мин</SelectItem>
                                    <SelectItem value="30">30 мин</SelectItem>
                                    <SelectItem value="60">60 мин</SelectItem>
                                </SelectContent>
                            </Select>
                            <span className="text-sm text-muted-foreground">между проверките</span>
                        </div>
                    </div>

                    {/* Data Source */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Данни</Label>
                        <RadioGroup
                            value={dataSource}
                            onValueChange={(v) => setDataSource(v as DataSource)}
                            className="col-span-3 flex gap-4"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="cached" id="cached" />
                                <Label htmlFor="cached" className="font-normal">
                                    Кеширани (бързо)
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="live" id="live" />
                                <Label htmlFor="live" className="font-normal">
                                    Live (точно)
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* Fallback Flow */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Fallback</Label>
                        <Select
                            value={fallbackFlowId || '__none__'}
                            onValueChange={(v) => setFallbackFlowId(v === '__none__' ? '' : v)}
                        >
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Без fallback (по избор)" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__none__">Без fallback</SelectItem>
                                {flows.map(flow => (
                                    <SelectItem key={flow.id} value={flow.id}>
                                        {flow.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Отказ</Button>
                    <Button onClick={handleSave}>
                        {isEditing ? 'Запази' : 'Добави'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
