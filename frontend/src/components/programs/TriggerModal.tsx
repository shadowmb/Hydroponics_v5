import React, { useState, useEffect } from 'react';
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
import { Switch } from '../ui/switch';
import type { ITrigger, TriggerOperator, TriggerBehavior, ISensorOption } from './types';

import { Textarea } from '../ui/textarea';

interface TriggerModalProps {
    open: boolean;
    onClose: () => void;
    onSave: (trigger: ITrigger) => Promise<boolean | void> | boolean | void;
    trigger?: ITrigger | null;
    sensors: ISensorOption[];
    flows: { id: string; name: string }[];
}

const OPERATORS: { value: TriggerOperator; label: string }[] = [
    { value: '>', label: '> По-голямо от' },
    { value: '<', label: '< По-малко от' },
    { value: '>=', label: '≥ По-голямо или равно' },
    { value: '<=', label: '≤ По-малко или равно' },
    { value: '=', label: '= Равно на' },
    { value: '!=', label: '≠ Различно от' },
    { value: 'between', label: 'Между (диапазон)' },
];

const generateId = () => `tr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const TriggerModal: React.FC<TriggerModalProps> = ({
    open,
    onClose,
    onSave,
    trigger: editingTrigger,
    sensors,
    flows
}) => {
    const isEditing = !!editingTrigger;

    // State for multi-conditions
    const [conditions, setConditions] = useState<{
        id: string; // temp id for UI keys
        sensorId: string;
        operator: TriggerOperator;
        value: number;
        valueMax?: number;
    }[]>([]);

    const [logicalOperator, setLogicalOperator] = useState<'AND' | 'OR'>('AND');

    // Legacy fields state (no longer used for UI, but kept for type safety if needed)
    const [behavior, setBehavior] = useState<TriggerBehavior>('break');
    // Repeating Logic State
    const [repeatMode, setRepeatMode] = useState<'once' | 'count' | 'always'>('once');
    const [repeatCount, setRepeatCount] = useState<number>(0);

    const [description, setDescription] = useState('');

    // State for flows (Multi)
    const [flowIds, setFlowIds] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);

    // New State for Unconditional Execution
    const [conditionEnabled, setConditionEnabled] = useState(true);

    // Reset form when modal opens
    useEffect(() => {
        if (open) {
            if (editingTrigger) {
                // logic: if conditions array exists, use it. Else migrate legacy single fields.
                if (editingTrigger.conditions && editingTrigger.conditions.length > 0) {
                    setConditions(editingTrigger.conditions.map(c => ({
                        ...c,
                        id: Math.random().toString(36).substr(2, 9)
                    })));
                    setLogicalOperator(editingTrigger.logicalOperator || 'AND');
                } else {
                    // Legacy migration
                    setConditions([{
                        id: Math.random().toString(36).substr(2, 9),
                        sensorId: editingTrigger.sensorId || '',
                        operator: editingTrigger.operator || '>',
                        value: editingTrigger.value || 0,
                        valueMax: editingTrigger.valueMax || 0
                    }]);
                    setLogicalOperator('AND');
                }

                setDescription(editingTrigger.description || '');

                // Migrate legacy flowId to flowIds if needed
                if (editingTrigger.flowIds && editingTrigger.flowIds.length > 0) {
                    setFlowIds(editingTrigger.flowIds);
                } else if (editingTrigger.flowId) {
                    setFlowIds([editingTrigger.flowId]);
                } else {
                    setFlowIds([]);
                }

                setBehavior(editingTrigger.behavior);
                setRepeatMode(editingTrigger.repeatMode || 'once');
                setRepeatCount(editingTrigger.repeatCount || 0);

                // Initialize conditionEnabled
                setConditionEnabled(editingTrigger.conditionEnabled !== false);
            } else {
                // New Trigger defaults
                setConditions([{
                    id: Math.random().toString(36).substr(2, 9),
                    sensorId: sensors[0]?.id || '',
                    operator: '>',
                    value: 0,
                    valueMax: 0
                }]);
                setLogicalOperator('AND');
                setFlowIds([]);
                setBehavior('break');
                setRepeatMode('once');
                setRepeatCount(0);
                setDescription('');
                setConditionEnabled(true);
            }
        }
    }, [open, editingTrigger, sensors]);

    const handleSave = async () => {
        // Validate
        const validConditions = conditions.filter(c => c.sensorId);
        // If conditions enabled, ensure valid conditions exist. 
        if ((conditionEnabled && validConditions.length === 0) || flowIds.length === 0) return;

        setSaving(true);
        try {
            // Map UI conditions back to pure data (remove temp IDs)
            const conditionsData = validConditions.map(({ id, ...rest }) => rest);

            const triggerData: ITrigger = {
                id: editingTrigger?.id || generateId(),

                // New Fields
                conditionEnabled,
                conditions: conditionsData, // Always send drafted conditions (preserved if user toggles off/on)
                logicalOperator,

                // Legacy fields (optional, but let's clear them or set first one for compat?)
                // Better to set them to first condition for backwards compat if backend readers rely on it
                sensorId: conditionsData[0]?.sensorId,
                operator: conditionsData[0]?.operator,
                value: conditionsData[0]?.value,
                valueMax: conditionsData[0]?.valueMax,

                flowId: flowIds[0], // Deprecated but kept for compatibility
                flowIds, // New
                behavior,
                repeatMode,
                repeatCount,
                description
            };
            console.log('TriggerModal: Calling onSave with:', triggerData);
            const result = await onSave(triggerData);
            console.log('TriggerModal: onSave result:', result);
            if (result !== false) {
                onClose();
            }
        } finally {
            setSaving(false);
        }
    };

    // Add Condition
    const addCondition = () => {
        setConditions([...conditions, {
            id: Math.random().toString(36).substr(2, 9),
            sensorId: sensors[0]?.id || '',
            operator: '>',
            value: 0
        }]);
    };

    // Remove Condition
    const removeCondition = (index: number) => {
        if (conditions.length <= 1) return; // Don't remove last one
        const newConditions = [...conditions];
        newConditions.splice(index, 1);
        setConditions(newConditions);
    };

    // Update Condition
    const updateCondition = (index: number, field: string, val: any) => {
        const newConditions = [...conditions];
        newConditions[index] = { ...newConditions[index], [field]: val };
        setConditions(newConditions);
    };

    // Add flow to list
    const addFlow = (id: string) => {
        setFlowIds([...flowIds, id]);
    };

    // Remove flow from list
    const removeFlow = (index: number) => {
        const newFlows = [...flowIds];
        newFlows.splice(index, 1);
        setFlowIds(newFlows);
    };

    // Move flow up
    const moveFlowUp = (index: number) => {
        if (index === 0) return;
        const newFlows = [...flowIds];
        [newFlows[index - 1], newFlows[index]] = [newFlows[index], newFlows[index - 1]];
        setFlowIds(newFlows);
    };

    // Move flow down
    const moveFlowDown = (index: number) => {
        if (index === flowIds.length - 1) return;
        const newFlows = [...flowIds];
        [newFlows[index], newFlows[index + 1]] = [newFlows[index + 1], newFlows[index]];
        setFlowIds(newFlows);
    };

    // Group sensors by category
    const groupedSensors = sensors.reduce((acc, sensor) => {
        const group = sensor.categoryGroup || 'Други';
        if (!acc[group]) acc[group] = [];
        acc[group].push(sensor);
        return acc;
    }, {} as Record<string, ISensorOption[]>);

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (!val && !saving) onClose();
        }}>
            <DialogContent
                className="sm:max-w-[750px] max-h-[85vh] flex flex-col p-0 gap-0" // Fixed height, flex, no padding
                onInteractOutside={(e) => e.preventDefault()}
            >
                <div className="px-6 py-4 border-b">
                    <DialogHeader>
                        <DialogTitle>
                            {isEditing ? '✏️ Редакция на тригер' : '⚡ Нов тригер'}
                        </DialogTitle>
                        <DialogDescription>
                            Тригерът определя условието за активиране на поток.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-slate-700/50 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-slate-600">
                    <div className="flex flex-col gap-6">

                        {/* CONDITIONS SECTION */}
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between bg-muted/30 p-3 rounded-lg border border-border/50">
                                <div className="space-y-0.5">
                                    <Label className="text-base font-semibold">Активиране по Условие</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Ако е изключено, тригерът ще се изпълнява <strong className="text-orange-500">безусловно</strong> при всяка проверка на прозореца.
                                    </p>
                                </div>
                                <Switch
                                    checked={conditionEnabled}
                                    onCheckedChange={setConditionEnabled}
                                />
                            </div>

                            {conditionEnabled ? (
                                <>
                                    {conditions.length > 1 && (
                                        <div className="flex flex-col gap-2">
                                            <Label className="text-xs uppercase text-muted-foreground">Логически Оператор</Label>
                                            <div className="flex items-center gap-1">
                                                <div className="flex items-center gap-1 bg-muted/20 rounded-md border p-0.5 w-fit">
                                                    <Button
                                                        size="sm"
                                                        variant={logicalOperator === 'AND' ? "default" : "ghost"}
                                                        onClick={() => setLogicalOperator('AND')}
                                                        className="h-7 text-xs px-3 font-semibold"
                                                    >
                                                        ВСИЧКИ (AND)
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant={logicalOperator === 'OR' ? "default" : "ghost"}
                                                        onClick={() => setLogicalOperator('OR')}
                                                        className="h-7 text-xs px-3 font-semibold"
                                                    >
                                                        ПОНЕ ЕДНО (OR)
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        {conditions.map((cond, index) => {
                                            const selectedSensor = sensors.find(s => s.id === cond.sensorId);
                                            const isBetween = cond.operator === 'between';

                                            return (
                                                <div key={cond.id} className="grid grid-cols-12 gap-3 items-center bg-slate-500/5 p-2 rounded border border-slate-500/10 relative group">
                                                    {conditions.length > 1 && (
                                                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${logicalOperator === 'AND' ? 'bg-blue-500' : 'bg-orange-500'} rounded-l-md opacity-80`} />
                                                    )}

                                                    <div className="col-span-5 pl-2">
                                                        <Select value={cond.sensorId} onValueChange={(v) => updateCondition(index, 'sensorId', v)}>
                                                            <SelectTrigger className="h-9 text-sm bg-background/50 border-slate-500/20 hover:bg-background">
                                                                <SelectValue placeholder="Избери Сензор..." />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {Object.entries(groupedSensors).map(([group, groupSensors]) => (
                                                                    <React.Fragment key={group}>
                                                                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted">
                                                                            {group}
                                                                        </div>
                                                                        {groupSensors.map(sensor => (
                                                                            <SelectItem key={sensor.id} value={sensor.id}>
                                                                                {sensor.name}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </React.Fragment>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className="col-span-3">
                                                        <Select
                                                            value={cond.operator}
                                                            onValueChange={(v) => updateCondition(index, 'operator', v as TriggerOperator)}
                                                        >
                                                            <SelectTrigger className="h-9 justify-between px-2 bg-background/50 border-slate-500/20 hover:bg-background">
                                                                <span className="font-mono font-bold w-full text-center">{cond.operator}</span>
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {OPERATORS.map(op => (
                                                                    <SelectItem key={op.value} value={op.value}>
                                                                        <span className="font-mono font-bold w-6 inline-block text-center">{op.value}</span>
                                                                        <span className="text-xs text-muted-foreground ml-2">{op.label.replace(op.value, '').trim()}</span>
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className={`${isBetween ? 'col-span-4' : 'col-span-3'} flex items-center gap-2`}>
                                                        <div className="relative w-full">
                                                            <Input
                                                                type="number"
                                                                value={cond.value}
                                                                onChange={(e) => updateCondition(index, 'value', Number(e.target.value))}
                                                                className="h-9 w-full pr-6 text-right font-mono bg-background/50 border-slate-500/20 focus:bg-background [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                            />
                                                            {selectedSensor?.unit && (
                                                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">
                                                                    {selectedSensor.unit}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {isBetween && (
                                                            <>
                                                                <span className="text-muted-foreground text-xs font-bold">➜</span>
                                                                <div className="relative w-full">
                                                                    <Input
                                                                        type="number"
                                                                        value={cond.valueMax || 0}
                                                                        onChange={(e) => updateCondition(index, 'valueMax', Number(e.target.value))}
                                                                        className="h-9 w-full pr-6 text-right font-mono bg-background/50 border-slate-500/20 focus:bg-background [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                    />
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>

                                                    {!isBetween && conditions.length > 1 && (
                                                        <div className="col-span-1 flex justify-end">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-transparent"
                                                                onClick={() => removeCondition(index)}
                                                            >
                                                                <span className="text-lg leading-none">×</span>
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={addCondition}
                                            className="w-fit border-dashed text-muted-foreground hover:text-primary h-8 border-slate-500/20"
                                        >
                                            + Добави условие
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-md">
                                    <div className="flex gap-2 items-start">
                                        <span className="text-xl">⚠️</span>
                                        <div className="space-y-1">
                                            <p className="font-semibold text-orange-500">Внимание: Безусловно Изпълнение</p>
                                            <p className="text-sm text-muted-foreground">
                                                Този тригер ще се изпълнява при всяка проверка на времевия прозорец.<br />
                                                <span className="font-bold text-orange-400">ВАЖНО:</span> Използването на поведение <strong>Continue</strong> с <strong>Always (Постоянно)</strong> може да доведе до непрекъснато изпълнение (spam).
                                                Препоръчително е да използвате <strong>Once</strong> или <strong>Count</strong>.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="border-t border-border/40" />

                        {/* FLOWS SECTION */}
                        <div className="flex flex-col gap-2">
                            <Label>Потоци (Действия)</Label>
                            <div className="space-y-3">
                                {/* Selected Flows List */}
                                {flowIds.length > 0 && (
                                    <div className="grid grid-cols-2 gap-2 border rounded-md p-2 bg-muted/20">
                                        {flowIds.map((id, index) => {
                                            const flow = flows.find(f => f.id === id);
                                            return (
                                                <div key={`${id}-${index}`} className="flex items-center justify-between bg-background p-2 rounded border text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-muted-foreground font-mono text-xs w-5 text-center">{index + 1}.</span>
                                                        <span className="font-medium">{flow?.name || 'Unknown Flow'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <div className="flex flex-col gap-0.5">
                                                            {index > 0 && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-4 w-5 hover:bg-slate-700/50"
                                                                    onClick={() => moveFlowUp(index)}
                                                                    title="Мести нагоре"
                                                                >
                                                                    <span className="text-[10px] leading-none">▲</span>
                                                                </Button>
                                                            )}
                                                            {index < flowIds.length - 1 && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-4 w-5 hover:bg-slate-700/50"
                                                                    onClick={() => moveFlowDown(index)}
                                                                    title="Мести надолу"
                                                                >
                                                                    <span className="text-[10px] leading-none">▼</span>
                                                                </Button>
                                                            )}
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-100"
                                                            onClick={() => removeFlow(index)}
                                                            title="Премахни"
                                                        >
                                                            ×
                                                        </Button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* Add Flow Dropdown */}
                                <div className="flex gap-2">
                                    <Select
                                        key={flowIds.length}
                                        onValueChange={(val) => {
                                            addFlow(val);
                                        }}
                                        value=""
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="➕ Добави поток..." />
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
                                <p className="text-xs text-muted-foreground">
                                    Потоците се изпълняват последователно в реда, в който са добавени.
                                </p>
                            </div>
                        </div>

                        <div className="border-t border-border/40" />

                        {/* BEHAVIOR SECTION */}
                        <div className="flex flex-col gap-3">
                            <Label>Поведение</Label>
                            <RadioGroup
                                value={behavior}
                                onValueChange={(v) => setBehavior(v as TriggerBehavior)}
                                className="grid grid-cols-2 gap-4"
                            >
                                <div className="flex items-start space-x-3 bg-muted/10 p-3 rounded border border-transparent hover:border-border cursor-pointer transition-colors">
                                    <RadioGroupItem value="break" id="break" className="mt-1" />
                                    <div>
                                        <Label htmlFor="break" className="font-semibold text-red-500 cursor-pointer">
                                            🛑 Break & Stop
                                        </Label>
                                        <p className="text-xs text-muted-foreground mt-1 leading-tight">
                                            Изпълни потоците и <strong>спри</strong> проверката на следващи тригъри.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start space-x-3 bg-muted/10 p-3 rounded border border-transparent hover:border-border cursor-pointer transition-colors">
                                    <RadioGroupItem value="continue" id="continue" className="mt-1" />
                                    <div>
                                        <Label htmlFor="continue" className="font-semibold text-green-500 cursor-pointer">
                                            ⏭ Continue
                                        </Label>
                                        <p className="text-xs text-muted-foreground mt-1 leading-tight">
                                            Изпълни потоците и <strong>продължи</strong> към следващите тригъри.
                                        </p>
                                    </div>
                                </div>
                            </RadioGroup>

                            {/* REPEAT MODE (Only if Continue) */}
                            {behavior === 'continue' && (
                                <div className="mt-2 bg-blue-500/10 p-4 rounded border border-blue-500/20">
                                    <Label className="mb-3 block">Повторяемост (Repeat Mode)</Label>
                                    <RadioGroup
                                        value={repeatMode}
                                        onValueChange={(v) => setRepeatMode(v as any)}
                                        className="gap-3"
                                    >
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="once" id="rm_once" />
                                            <Label htmlFor="rm_once" className="font-normal cursor-pointer">
                                                Веднъж (Once) <span className="text-muted-foreground text-xs ml-1">- Изпълнява се само веднъж на прозорец</span>
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="always" id="rm_always" />
                                            <Label htmlFor="rm_always" className="font-normal cursor-pointer">
                                                Постоянно (Always) <span className="text-muted-foreground text-xs ml-1">- При всяка проверка (ако условието е вярно)</span>
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="count" id="rm_count" />
                                            <Label htmlFor="rm_count" className="font-normal cursor-pointer">
                                                Брой пъти (Count Limited)
                                            </Label>
                                        </div>
                                    </RadioGroup>

                                    {repeatMode === 'count' && (
                                        <div className="mt-3 ml-6 flex items-center gap-3">
                                            <Label className="text-xs">Максимален брой изпълнения:</Label>
                                            <Input
                                                type="number"
                                                min={1}
                                                value={repeatCount}
                                                onChange={(e) => setRepeatCount(Number(e.target.value))}
                                                className="w-24 h-8 bg-background"
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* NOTE SECTION */}
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="desc">Бележка (Опционално)</Label>
                            <Textarea
                                id="desc"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="min-h-[60px]"
                                placeholder="Опиши защо е нужен този тригер..."
                            />
                        </div>
                    </div>
                </div>
                <div className="p-6 pt-4 border-t bg-muted/5 mt-auto">
                    <DialogFooter>
                        <Button variant="outline" onClick={onClose}>Отказ</Button>
                        <Button onClick={handleSave} disabled={(conditionEnabled && conditions.length === 0) || flowIds.length === 0}>
                            {isEditing ? 'Запази' : 'Добави'}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
};
