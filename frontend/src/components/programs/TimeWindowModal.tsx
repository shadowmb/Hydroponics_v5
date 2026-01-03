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
    const [autoAdjust, setAutoAdjust] = useState(false);
    const [fallbackFlowIds, setFallbackFlowIds] = useState<string[]>([]);

    // Reset state when opening/editing
    useEffect(() => {
        if (open) {
            if (editingWindow) {
                setName(editingWindow.name);
                setStartTime(editingWindow.startTime);
                setEndTime(editingWindow.endTime);
                setCheckInterval(editingWindow.checkInterval);
                setDataSource(editingWindow.dataSource);

                // Migrate legacy fallbackFlowId
                if (editingWindow.fallbackFlowIds && editingWindow.fallbackFlowIds.length > 0) {
                    setFallbackFlowIds(editingWindow.fallbackFlowIds);
                } else if (editingWindow.fallbackFlowId) {
                    setFallbackFlowIds([editingWindow.fallbackFlowId]);
                } else {
                    setFallbackFlowIds([]);
                }
            } else {
                // Defaults for new window
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
                setFallbackFlowIds([]);
            }
            setAutoAdjust(false); // Reset checkbox
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
            fallbackFlowId: fallbackFlowIds[0], // Deprecated
            fallbackFlowIds // New
        };
        onSave(windowData, autoAdjust);
        onClose();
    };

    // Helper methods for fallback flows
    const addFallbackFlow = (id: string) => {
        if (!fallbackFlowIds.includes(id)) {
            setFallbackFlowIds([...fallbackFlowIds, id]);
        }
    };

    const removeFallbackFlow = (index: number) => {
        const newFlows = [...fallbackFlowIds];
        newFlows.splice(index, 1);
        setFallbackFlowIds(newFlows);
    };

    const moveFallbackFlowUp = (index: number) => {
        if (index === 0) return;
        const newFlows = [...fallbackFlowIds];
        [newFlows[index - 1], newFlows[index]] = [newFlows[index], newFlows[index - 1]];
        setFallbackFlowIds(newFlows);
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

                    {/* Fallback Flow (Multi) */}
                    <div className="grid grid-cols-4 items-start gap-4">
                        <Label className="text-right pt-2">Fallback</Label>
                        <div className="col-span-3 space-y-3">
                            {/* Selected Fallback Flows List */}
                            {fallbackFlowIds.length > 0 ? (
                                <div className="space-y-2 border rounded-md p-2 bg-muted/20">
                                    {fallbackFlowIds.map((id, index) => {
                                        const flow = flows.find(f => f.id === id);
                                        return (
                                            <div key={`${id}-${index}`} className="flex items-center justify-between bg-background p-2 rounded border text-sm">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-muted-foreground font-mono text-xs">{index + 1}.</span>
                                                    <span className="font-medium">{flow?.name || 'Unknown Flow'}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    {index > 0 && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6"
                                                            onClick={() => moveFallbackFlowUp(index)}
                                                            title="Мести нагоре"
                                                        >
                                                            ↑
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-100"
                                                        onClick={() => removeFallbackFlow(index)}
                                                        title="Премахни"
                                                    >
                                                        ×
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-sm text-muted-foreground py-1">
                                    Няма избран fallback поток (по избор).
                                </div>
                            )}

                            {/* Add Fallback Flow Dropdown */}
                            <div className="flex gap-2">
                                <Select onValueChange={addFallbackFlow}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="➕ Добави fallback..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {flows.map(flow => (
                                            <SelectItem
                                                key={flow.id}
                                                value={flow.id}
                                                disabled={fallbackFlowIds.includes(flow.id)}
                                            >
                                                {flow.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
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
