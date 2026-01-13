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
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Checkbox } from '../ui/checkbox';
import { Textarea } from '../ui/textarea';
import { TimePicker24 } from '../ui/time-picker-24';
import type { ITimeWindow, DataSource } from './types';

interface TimeWindowModalProps {
    open: boolean;
    onClose: () => void;
    onSave: (window: ITimeWindow, autoShift?: boolean) => Promise<boolean | void> | boolean | void;
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
    const [description, setDescription] = useState('');

    // New state for Linked Fallback support
    const [manualFallback, setManualFallback] = useState(false);

    // Reset state when opening/editing
    useEffect(() => {
        if (open) {
            if (editingWindow) {
                setName(editingWindow.name);
                setStartTime(editingWindow.startTime);
                setEndTime(editingWindow.endTime);
                setCheckInterval(editingWindow.checkInterval);
                setDataSource(editingWindow.dataSource);
                setDescription(editingWindow.description || '');

                // Migrate legacy fallbackFlowId
                let currentFlows: string[] = [];
                if (editingWindow.fallbackFlowIds && editingWindow.fallbackFlowIds.length > 0) {
                    currentFlows = editingWindow.fallbackFlowIds;
                } else if (editingWindow.fallbackFlowId) {
                    currentFlows = [editingWindow.fallbackFlowId];
                }
                setFallbackFlowIds(currentFlows);

                // Determine manual mode: if we have flows, it's manual. 
                // If it's empty, we assume it's Linked (unless user explicitly enables manual, handled by interactions)
                // Actually, for editing, if it's empty, it could be "No Fallback" OR "Linked". 
                // But generally if it's empty, we can start as "Not Manual" (allow linking).
                // If the user wants to add flows, they click the switch.
                setManualFallback(currentFlows.length > 0);
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
                setDescription('');
                setManualFallback(false);
            }
            setAutoAdjust(false); // Reset checkbox
        }
    }, [open, editingWindow, existingWindows]);

    const toMinutes = (time: string) => {
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
    };

    const handleSave = async () => {
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
            fallbackFlowId: undefined, // Fully deprecated/cleared
            fallbackFlowIds: manualFallback ? fallbackFlowIds : [], // If not manual, ensure empty flow list
            fallbackTriggerId: manualFallback ? undefined : editingWindow?.fallbackTriggerId, // Preserve link if not manual
            description
        };
        const result = await onSave(windowData, autoAdjust);
        if (result !== false) {
            onClose();
        }
    };

    // Helper methods for fallback flows
    const addFallbackFlow = (id: string) => {
        setFallbackFlowIds([...fallbackFlowIds, id]);
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
            <DialogContent className="sm:max-w-[500px]" onInteractOutside={(e) => e.preventDefault()}>
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
                    <div className="grid grid-cols-4 items-start gap-4 border-t pt-4">
                        <Label className="text-right pt-2">Fallback</Label>
                        <div className="col-span-3 space-y-3">
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="manual-fallback"
                                    checked={manualFallback}
                                    onCheckedChange={(checked) => {
                                        setManualFallback(checked);
                                        // If turning OFF manual, clear the flow IDs
                                        if (!checked) setFallbackFlowIds([]);
                                    }}
                                />
                                <Label htmlFor="manual-fallback" className="font-normal cursor-pointer">
                                    Ръчна конфигурация (статични потоци)
                                </Label>
                            </div>

                            {!manualFallback && (
                                <div className="text-sm text-blue-200 bg-blue-950/40 p-3 rounded border border-blue-900/50 flex gap-2">
                                    <span>ℹ️</span>
                                    <span>Когато е изключено, Fallback логиката може да се настрои от таблото за управление (Dashboard) чрез свързване (Link) към съществуващ тригър.</span>
                                </div>
                            )}

                            {manualFallback && (
                                <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
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
                                        <Select
                                            key={fallbackFlowIds.length}
                                            onValueChange={(val) => {
                                                addFallbackFlow(val);
                                            }}
                                            value=""
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="➕ Добави fallback..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {flows.map(flow => (
                                                    <SelectItem
                                                        key={flow.id}
                                                        value={flow.id}
                                                    >
                                                        {flow.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Description (Note) */}
                    <div className="grid grid-cols-4 items-start gap-4">
                        <Label htmlFor="desc" className="text-right pt-2">Бележка</Label>
                        <Textarea
                            id="desc"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="col-span-3"
                            placeholder="Добави бележка или описание..."
                        />
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
