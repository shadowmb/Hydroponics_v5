import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { ChevronDown, ChevronRight, Pencil, Trash2, Sunrise, Sun, Moon } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import type { ITimeWindow } from './types';
import { cn } from '../../lib/utils';

interface TimeWindowCardProps {
    window: ITimeWindow;
    isExpanded: boolean;
    onToggleExpand: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onAddTrigger: () => void;
    onEditTrigger: (triggerId: string) => void;
    onDeleteTrigger: (triggerId: string) => void;
    onUpdateWindow: (window: ITimeWindow) => void; // New callback
    flowsMap: Record<string, string>;  // flowId -> flowName
    sensorsMap: Record<string, string>;  // sensorId -> sensorName
}

// Get icon based on time of day
const getTimeIcon = (startTime: string) => {
    const hour = parseInt(startTime.split(':')[0]);
    if (hour >= 5 && hour < 12) return <Sunrise className="h-4 w-4 text-orange-400" />;
    if (hour >= 12 && hour < 18) return <Sun className="h-4 w-4 text-yellow-400" />;
    return <Moon className="h-4 w-4 text-blue-400" />;
};

// Format operator for display
const formatOperator = (op: string): string => {
    switch (op) {
        case 'between': return 'между';
        case '>': return '>';
        case '<': return '<';
        case '>=': return '≥';
        case '<=': return '≤';
        case '=': return '=';
        case '!=': return '≠';
        default: return op;
    }
};

export const TimeWindowCard: React.FC<TimeWindowCardProps> = ({
    window,
    isExpanded,
    onToggleExpand,
    onEdit,
    onDelete,
    onAddTrigger,
    onEditTrigger,
    onDeleteTrigger,
    onUpdateWindow,
    flowsMap,
    sensorsMap
}) => {
    const isManualFallback = (window.fallbackFlowIds && window.fallbackFlowIds.length > 0) || !!window.fallbackFlowId;

    const handleLinkTrigger = (triggerId: string) => {
        const updatedWindow = { ...window, fallbackTriggerId: triggerId === 'none' ? undefined : triggerId };
        onUpdateWindow(updatedWindow);
    };

    return (
        <Card className="overflow-hidden">
            {/* Header - Always visible */}
            <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={onToggleExpand}
            >
                <div className="flex items-center gap-3">
                    {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="text-sm font-mono text-muted-foreground">
                        {window.startTime} - {window.endTime}
                    </span>
                    <TooltipProvider>
                        <Tooltip delayDuration={300}>
                            <TooltipTrigger asChild>
                                <div className="cursor-help">
                                    {getTimeIcon(window.startTime)}
                                </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[300px] text-center">
                                <p>Този прозорец дефинира период от денонощието, в който се следят специфични условия и се изпълняват определени действия.</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <span className="font-medium">{window.name}</span>
                    {!isExpanded && (
                        <span className="text-xs text-muted-foreground">
                            ({window.triggers.length} тригер{window.triggers.length !== 1 ? 'а' : ''})
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" onClick={onEdit}>
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={onDelete}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <CardContent className="pt-0 pb-4">
                    <div className="border-t pt-4">
                        {/* Triggers List */}
                        <div className="space-y-2">
                            {window.triggers.map((trigger, triggerIndex) => {
                                // Normalize conditions (handle legacy)
                                const conditions = trigger.conditions?.length
                                    ? trigger.conditions
                                    : [{ sensorId: trigger.sensorId, operator: trigger.operator, value: trigger.value, valueMax: trigger.valueMax }];

                                return (
                                    <div
                                        key={trigger.id}
                                        className={cn(
                                            "flex items-center justify-between p-3 rounded-md border-l-4",
                                            trigger.behavior === 'break'
                                                ? "border-l-red-500 bg-red-500/5"
                                                : "border-l-green-500 bg-green-500/5"
                                        )}
                                    >
                                        <div className="flex items-center gap-4 text-sm flex-1">
                                            <span className="text-muted-foreground font-mono w-4">{triggerIndex + 1}.</span>

                                            {/* Conditions Stack */}
                                            <div className="flex flex-col">
                                                {conditions.map((cond, cIndex) => (
                                                    <React.Fragment key={cIndex}>
                                                        {cIndex > 0 && (
                                                            <div className="flex items-center gap-2 my-0.5">
                                                                <div className="h-4 w-0.5 bg-muted-foreground/30 mx-2"></div>
                                                                <span className={cn(
                                                                    "text-[10px] uppercase font-bold px-1.5 py-0.5 rounded",
                                                                    trigger.logicalOperator === 'OR'
                                                                        ? "bg-orange-500/20 text-orange-600"
                                                                        : "bg-blue-500/20 text-blue-600"
                                                                )}>
                                                                    {trigger.logicalOperator || 'AND'}
                                                                </span>
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium">
                                                                {sensorsMap[cond.sensorId || ''] || cond.sensorId}
                                                            </span>
                                                            <span className="text-muted-foreground">
                                                                {formatOperator(cond.operator!)}
                                                            </span>
                                                            <span className="font-mono">
                                                                {cond.value}
                                                                {cond.operator === 'between' && cond.valueMax && ` - ${cond.valueMax}`}
                                                            </span>
                                                        </div>
                                                    </React.Fragment>
                                                ))}
                                            </div>

                                            <span className="text-muted-foreground px-2">→</span>

                                            <div className="flex flex-col gap-1">
                                                <span className="text-primary font-medium">
                                                    {trigger.flowIds && trigger.flowIds.length > 0 ? (
                                                        trigger.flowIds.map(fid => flowsMap[fid] || fid).join(' + ')
                                                    ) : (
                                                        flowsMap[trigger.flowId!] || trigger.flowId
                                                    )}
                                                </span>
                                            </div>

                                            <span className={cn(
                                                "text-xs px-2 py-0.5 rounded ml-auto mr-2",
                                                trigger.behavior === 'break'
                                                    ? "bg-red-500/20 text-red-600"
                                                    : "bg-green-500/20 text-green-600"
                                            )}>
                                                {trigger.behavior === 'break' ? '🛑 Break' : '⏭️ Continue'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => onEditTrigger(trigger.id)}
                                            >
                                                <Pencil className="h-3 w-3" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive"
                                                onClick={() => onDeleteTrigger(trigger.id)}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}

                            {window.triggers.length === 0 && (
                                <div className="text-center py-4 text-muted-foreground text-sm">
                                    Няма тригери. Добавете условия за активиране.
                                </div>
                            )}
                        </div>

                        {/* Add Trigger Button */}
                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-3 w-full"
                            onClick={onAddTrigger}
                        >
                            + Добави тригер
                        </Button>

                        {/* Fallback Info */}
                        <div className={cn(
                            "mt-4 p-3 rounded-md flex items-center justify-center gap-4 text-sm border mx-auto w-fit min-w-[50%]", // Centered, fit content but min width
                            "bg-muted/5 border-white/10 shadow-sm"
                        )}>
                            <TooltipProvider>
                                <Tooltip delayDuration={300}>
                                    <TooltipTrigger asChild>
                                        <div className="flex items-center gap-1 cursor-help hover:text-primary transition-colors">
                                            <span>🛡️</span>
                                            <span className="text-muted-foreground whitespace-nowrap font-medium">Fallback:</span>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-[300px] text-center">
                                        <p>Fallback дефинира действията, които ще се изпълнят, ако <b>НИТО ЕДИН</b> от тригърите в този прозорец не е активен.</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            {isManualFallback ? (
                                <>
                                    <span className="font-medium">
                                        {window.fallbackFlowIds && window.fallbackFlowIds.length > 0 ? (
                                            window.fallbackFlowIds.map(fid => flowsMap[fid] || fid).join(' + ')
                                        ) : (
                                            flowsMap[window.fallbackFlowId!] || window.fallbackFlowId
                                        )}
                                    </span>
                                    <span className="text-xs text-muted-foreground ml-auto pl-4">
                                        (в {window.endTime} ако няма Break)
                                    </span>
                                </>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <Select
                                        value={window.fallbackTriggerId || 'none'}
                                        onValueChange={handleLinkTrigger}
                                    >
                                        <SelectTrigger className="h-8 w-[300px]">
                                            <SelectValue placeholder="Избери тригър..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">-- Няма (No Fallback) --</SelectItem>
                                            {window.triggers.map((t, idx) => {
                                                // Generate readable label: "NO3 < 50 & PH > 6"
                                                const label = t.conditions?.map(c => {
                                                    const sName = sensorsMap[c.sensorId || ''] || c.sensorId || 'Sensor';
                                                    return `${sName} ${c.operator} ${c.value}`;
                                                }).join(' & ');

                                                return (
                                                    <SelectItem key={t.id} value={t.id}>
                                                        <span className="font-mono text-muted-foreground mr-2">{idx + 1}.</span>
                                                        {label || `Trigger #${idx + 1}`}
                                                    </SelectItem>
                                                );
                                            })}
                                        </SelectContent>
                                    </Select>

                                    {window.fallbackTriggerId && (
                                        <span className="text-xs text-muted-foreground hidden sm:inline-block">
                                            (Linked Trigger)
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            )}
        </Card>
    );
};
