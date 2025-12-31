import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { ChevronDown, ChevronRight, Pencil, Trash2, Sunrise, Sun, Moon } from 'lucide-react';
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
    flowsMap,
    sensorsMap
}) => {
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
                    {getTimeIcon(window.startTime)}
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
                            {window.triggers.map((trigger, triggerIndex) => (
                                <div
                                    key={trigger.id}
                                    className={cn(
                                        "flex items-center justify-between p-3 rounded-md border-l-4",
                                        trigger.behavior === 'break'
                                            ? "border-l-red-500 bg-red-500/5"
                                            : "border-l-green-500 bg-green-500/5"
                                    )}
                                >
                                    <div className="flex items-center gap-2 text-sm">
                                        <span className="text-muted-foreground">{triggerIndex + 1}.</span>
                                        <span className="font-medium">
                                            {sensorsMap[trigger.sensorId] || trigger.sensorId}
                                        </span>
                                        <span className="text-muted-foreground">
                                            {formatOperator(trigger.operator)}
                                        </span>
                                        <span className="font-mono">
                                            {trigger.value}
                                            {trigger.operator === 'between' && trigger.valueMax && ` - ${trigger.valueMax}`}
                                        </span>
                                        <span className="text-muted-foreground">→</span>
                                        <span className="text-primary">
                                            {flowsMap[trigger.flowId] || trigger.flowId}
                                        </span>
                                        <span className={cn(
                                            "text-xs px-2 py-0.5 rounded",
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
                            ))}

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
                        {window.fallbackFlowId && (
                            <div className="mt-4 p-3 bg-muted/50 rounded-md flex items-center gap-2 text-sm">
                                <span className="text-muted-foreground">🛡️ Fallback:</span>
                                <span className="font-medium">
                                    {flowsMap[window.fallbackFlowId] || window.fallbackFlowId}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    (в {window.endTime} ако няма Break)
                                </span>
                            </div>
                        )}
                    </div>
                </CardContent>
            )}
        </Card>
    );
};
