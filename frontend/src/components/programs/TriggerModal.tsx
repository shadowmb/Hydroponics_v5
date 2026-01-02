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

interface TriggerModalProps {
    open: boolean;
    onClose: () => void;
    onSave: (trigger: ITrigger) => void;
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

    // State for multiple flows
    const [sensorId, setSensorId] = useState('');
    const [operator, setOperator] = useState<TriggerOperator>('>');
    const [value, setValue] = useState(0);
    const [valueMax, setValueMax] = useState(0);
    const [behavior, setBehavior] = useState<TriggerBehavior>('break');

    // State for flows (Multi)
    const [flowIds, setFlowIds] = useState<string[]>([]);

    // Reset form when modal opens
    useEffect(() => {
        if (open) {
            if (editingTrigger) {
                setSensorId(editingTrigger.sensorId);
                setOperator(editingTrigger.operator);
                setValue(editingTrigger.value);
                setValueMax(editingTrigger.valueMax || 0);

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
                setSensorId(sensors[0]?.id || '');
                setOperator('>');
                setValue(0);
                setValueMax(0);
                setFlowIds([]);
                setBehavior('break');
            }
        }
    }, [open, editingTrigger, sensors]);

    const handleSave = () => {
        if (!sensorId || flowIds.length === 0) return;

        const triggerData: ITrigger = {
            id: editingTrigger?.id || generateId(),
            sensorId,
            operator,
            value,
            valueMax: operator === 'between' ? valueMax : undefined,
            flowId: flowIds[0], // Deprecated but kept for compatibility
            flowIds, // New
            behavior
        };
        onSave(triggerData);
        onClose();
    };

    // Add flow to list
    const addFlow = (id: string) => {
        if (!flowIds.includes(id)) {
            setFlowIds([...flowIds, id]);
        }
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

    const selectedSensor = sensors.find(s => s.id === sensorId);

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? '✏️ Редакция на тригер' : '⚡ Нов тригер'}
                    </DialogTitle>
                    <DialogDescription>
                        Тригерът определя условието за активиране на поток.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Sensor Selection */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Сензор</Label>
                        <Select value={sensorId} onValueChange={setSensorId}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Избери сензор" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(groupedSensors).map(([group, groupSensors]) => (
                                    <React.Fragment key={group}>
                                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted">
                                            {group}
                                        </div>
                                        {groupSensors.map(sensor => (
                                            <SelectItem key={sensor.id} value={sensor.id}>
                                                {sensor.name} {sensor.unit && `(${sensor.unit})`}
                                            </SelectItem>
                                        ))}
                                    </React.Fragment>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Operator */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Условие</Label>
                        <Select
                            value={operator}
                            onValueChange={(v) => setOperator(v as TriggerOperator)}
                        >
                            <SelectTrigger className="col-span-3">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {OPERATORS.map(op => (
                                    <SelectItem key={op.value} value={op.value}>
                                        {op.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Value(s) */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Стойност</Label>
                        <div className="col-span-3 flex items-center gap-2">
                            <Input
                                type="number"
                                value={value}
                                onChange={(e) => setValue(Number(e.target.value))}
                                className="w-28"
                            />
                            {operator === 'between' && (
                                <>
                                    <span className="text-muted-foreground">до</span>
                                    <Input
                                        type="number"
                                        value={valueMax}
                                        onChange={(e) => setValueMax(Number(e.target.value))}
                                        className="w-28"
                                    />
                                </>
                            )}
                            {selectedSensor?.unit && (
                                <span className="text-sm text-muted-foreground">
                                    {selectedSensor.unit}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Flows Selection (Multi) */}
                    <div className="grid grid-cols-4 items-start gap-4">
                        <Label className="text-right pt-2">Потоци</Label>
                        <div className="col-span-3 space-y-3">
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
                                <Select onValueChange={addFlow}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="➕ Добави поток..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {flows.map(flow => (
                                            <SelectItem
                                                key={flow.id}
                                                value={flow.id}
                                                disabled={flowIds.includes(flow.id)}
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
                    <div className="grid grid-cols-4 items-start gap-4">
                        <Label className="text-right pt-2">Поведение</Label>
                        <RadioGroup
                            value={behavior}
                            onValueChange={(v) => setBehavior(v as TriggerBehavior)}
                            className="col-span-3 space-y-2"
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
                                <RadioGroupItem value="continue" id="continue" className="mt-1" />
                                <div>
                                    <Label htmlFor="continue" className="font-medium text-green-600">
                                        ⏭️ Continue (Продължи)
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Изпълни потоците и продължи да проверяваш.
                                    </p>
                                </div>
                            </div>
                        </RadioGroup>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Отказ</Button>
                    <Button onClick={handleSave} disabled={!sensorId || flowIds.length === 0}>
                        {isEditing ? 'Запази' : 'Добави'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
