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
    const [description, setDescription] = useState('');

    // State for flows (Multi)
    const [flowIds, setFlowIds] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);

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
                setDescription('');
            }
        }
    }, [open, editingTrigger, sensors]);

    const handleSave = async () => {
        // Validate
        const validConditions = conditions.filter(c => c.sensorId);
        if (validConditions.length === 0 || flowIds.length === 0) return;

        setSaving(true);
        try {
            // Map UI conditions back to pure data (remove temp IDs)
            const conditionsData = validConditions.map(({ id, ...rest }) => rest);

            const triggerData: ITrigger = {
                id: editingTrigger?.id || generateId(),

                // New Fields
                conditions: conditionsData,
                logicalOperator,

                // Legacy fields (optional, but let's clear them or set first one for compat?)
                // Better to set them to first condition for backwards compat if backend readers rely on it
                sensorId: conditionsData[0].sensorId,
                operator: conditionsData[0].operator,
                value: conditionsData[0].value,
                valueMax: conditionsData[0].valueMax,

                flowId: flowIds[0], // Deprecated but kept for compatibility
                flowIds, // New
                behavior,
                description
            };
            const result = await onSave(triggerData);
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
                className="sm:max-w-[700px]" // Wider for multi-conditions
                onInteractOutside={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <div className="grid grid-cols-6 gap-4">
                        <div className="col-span-5 col-start-2 space-y-1">
                            <DialogTitle>
                                {isEditing ? '✏️ Редакция на тригер' : '⚡ Нов тригер'}
                            </DialogTitle>
                            <DialogDescription>
                                Тригерът определя условието за активиране на поток.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="grid gap-4 py-4">

                    {/* LOGICAL OPERATOR (Visible only if > 1 condition) */}
                    {/* LOGICAL OPERATOR (Visible only if > 1 condition) */}
                    {conditions.length > 1 && (
                        <div className="grid grid-cols-6 items-center gap-4">
                            <Label className="text-right text-xs uppercase text-muted-foreground pt-1">Логика</Label>
                            <div className="col-span-5 flex items-center gap-1">
                                <div className="flex items-center gap-1 bg-muted/20 rounded-md border p-0.5">
                                    <Button
                                        size="sm"
                                        variant={logicalOperator === 'AND' ? "default" : "ghost"}
                                        onClick={() => setLogicalOperator('AND')}
                                        className="h-6 text-[10px] px-3 font-semibold"
                                    >
                                        ВСИЧКИ (AND)
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant={logicalOperator === 'OR' ? "default" : "ghost"}
                                        onClick={() => setLogicalOperator('OR')}
                                        className="h-6 text-[10px] px-3 font-semibold"
                                    >
                                        ПОНЕ ЕДНО (OR)
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* CONDITIONS LIST */}
                    <div className="grid grid-cols-6 items-start gap-4">
                        <Label className="text-right pt-2">Условия</Label>

                        <div className="col-span-5 space-y-2">
                            {conditions.map((cond, index) => {
                                const selectedSensor = sensors.find(s => s.id === cond.sensorId);

                                return (
                                    <div key={cond.id} className="grid grid-cols-12 gap-2 items-center bg-slate-500/5 p-1 rounded border border-slate-500/10 relative group">
                                        {/* Line connector decoration if > 1 */}
                                        {conditions.length > 1 && (
                                            <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${logicalOperator === 'AND' ? 'bg-blue-400' : 'bg-orange-400'} rounded-l-md opacity-80`} />
                                        )}

                                        {/* 1. Sensor Info (6 cols) */}
                                        <div className="col-span-6 pl-2">
                                            <Select value={cond.sensorId} onValueChange={(v) => updateCondition(index, 'sensorId', v)}>
                                                <SelectTrigger className="h-8 text-sm bg-background/50 border-slate-500/20 hover:bg-background">
                                                    <SelectValue placeholder="Сензор" />
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

                                        {/* 2. Operator (2 cols) */}
                                        <div className="col-span-2">
                                            <Select
                                                value={cond.operator}
                                                onValueChange={(v) => updateCondition(index, 'operator', v as TriggerOperator)}
                                            >
                                                <SelectTrigger className="h-8 text-center font-mono font-bold justify-center px-1 bg-background/50 border-slate-500/20 hover:bg-background">
                                                    <span>{cond.operator}</span>
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

                                        {/* 3. Value (3 cols) */}
                                        <div className="col-span-3 flex items-center gap-1">
                                            <Input
                                                type="number"
                                                value={cond.value}
                                                onChange={(e) => updateCondition(index, 'value', Number(e.target.value))}
                                                className="h-8 w-full px-2 text-right font-mono bg-background/50 border-slate-500/20 focus:bg-background"
                                            />
                                            {cond.operator === 'between' && (
                                                <>
                                                    <span className="text-muted-foreground text-xs mx-0.5">-</span>
                                                    <Input
                                                        type="number"
                                                        value={cond.valueMax || 0}
                                                        onChange={(e) => updateCondition(index, 'valueMax', Number(e.target.value))}
                                                        className="h-8 w-full px-2 text-right font-mono bg-background/50 border-slate-500/20 focus:bg-background"
                                                    />
                                                </>
                                            )}
                                            {selectedSensor?.unit && (
                                                <span className="text-[10px] text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis max-w-[20px]">
                                                    {sensors.find(s => s.id === cond.sensorId)?.unit}
                                                </span>
                                            )}
                                        </div>

                                        {/* 4. Remove Button (1 col) */}
                                        <div className="col-span-1 flex justify-center">
                                            {conditions.length > 1 && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-slate-400 hover:text-red-500 hover:bg-transparent"
                                                    onClick={() => removeCondition(index)}
                                                >
                                                    <span className="text-lg leading-none">×</span>
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            <Button variant="outline" size="sm" onClick={addCondition} className="w-full border-dashed text-muted-foreground hover:text-primary h-8 border-slate-500/20">
                                + Добави условие
                            </Button>
                        </div>
                    </div>

                    <div className="border-t my-2" />

                    {/* Flows Selection (Multi) */}
                    <div className="grid grid-cols-6 items-start gap-4">
                        <Label className="text-right pt-2">Потоци</Label>
                        <div className="col-span-5 space-y-3">
                            {/* Selected Flows List */}
                            {flowIds.length > 0 && (
                                <div className="space-y-2 border rounded-md p-2 bg-muted/20">
                                    {flowIds.map((id, index) => {
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
                                                            onClick={() => moveFlowUp(index)}
                                                            title="Мести нагоре"
                                                        >
                                                            ↑
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-100"
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
                                    <SelectTrigger>
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

                    {/* Behavior */}
                    <div className="grid grid-cols-6 items-start gap-4">
                        <Label className="text-right pt-2">Поведение</Label>
                        <RadioGroup
                            value={behavior}
                            onValueChange={(v) => setBehavior(v as TriggerBehavior)}
                            className="col-span-5 space-y-2"
                        >
                            <div className="flex items-start space-x-2">
                                <RadioGroupItem value="break" id="break" className="mt-1" />
                                <div>
                                    <Label htmlFor="break" className="font-medium text-red-600">
                                        🛑 Break (Спри прозореца)
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Изпълни потоците и затвори прозореца.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-2">
                                <RadioGroupItem value="continue" id="continue" />
                                <Label htmlFor="continue" className="flex flex-col cursor-pointer">
                                    <span className="font-semibold text-green-500 flex items-center gap-1">
                                        ⏭ Continue (Продължи)
                                    </span>
                                    <span className="text-muted-foreground text-xs">
                                        Изпълни потоците и продължи да проверяваш.
                                    </span>
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* Description */}
                    <div className="grid grid-cols-6 items-start gap-4">
                        <Label htmlFor="desc" className="text-right pt-2">Бележка</Label>
                        <Textarea
                            id="desc"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="col-span-5 min-h-[60px]"
                            placeholder="Опиши защо е нужен този тригер..."
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Отказ</Button>
                    <Button onClick={handleSave} disabled={conditions.length === 0 || flowIds.length === 0}>
                        {isEditing ? 'Запази' : 'Добави'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
