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

    // Form state
    const [sensorId, setSensorId] = useState('');
    const [operator, setOperator] = useState<TriggerOperator>('>');
    const [value, setValue] = useState(0);
    const [valueMax, setValueMax] = useState(0);
    const [flowId, setFlowId] = useState('');
    const [behavior, setBehavior] = useState<TriggerBehavior>('break');

    // Reset form when modal opens
    useEffect(() => {
        if (open) {
            if (editingTrigger) {
                setSensorId(editingTrigger.sensorId);
                setOperator(editingTrigger.operator);
                setValue(editingTrigger.value);
                setValueMax(editingTrigger.valueMax || 0);
                setFlowId(editingTrigger.flowId);
                setBehavior(editingTrigger.behavior);
            } else {
                setSensorId(sensors[0]?.id || '');
                setOperator('>');
                setValue(0);
                setValueMax(0);
                setFlowId('');
                setBehavior('break');
            }
        }
    }, [open, editingTrigger, sensors]);

    const handleSave = () => {
        if (!sensorId || !flowId) return;

        const triggerData: ITrigger = {
            id: editingTrigger?.id || generateId(),
            sensorId,
            operator,
            value,
            valueMax: operator === 'between' ? valueMax : undefined,
            flowId,
            behavior
        };
        onSave(triggerData);
        onClose();
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

                    {/* Flow Selection */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Поток</Label>
                        <Select value={flowId} onValueChange={setFlowId}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Избери поток за изпълнение" />
                            </SelectTrigger>
                            <SelectContent>
                                {flows.map(flow => (
                                    <SelectItem key={flow.id} value={flow.id}>
                                        {flow.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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
                                        Изпълни потока и затвори прозореца. Подходящо за основни задачи.
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
                                        Изпълни потока и продължи да проверяваш. За допълнителни действия.
                                    </p>
                                </div>
                            </div>
                        </RadioGroup>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Отказ</Button>
                    <Button onClick={handleSave} disabled={!sensorId || !flowId}>
                        {isEditing ? 'Запази' : 'Добави'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
