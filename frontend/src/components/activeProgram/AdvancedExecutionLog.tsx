import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';
import {
    Activity, Zap, Play, CheckCircle2, SkipForward,
    Clock, XCircle, Loader2,
    Calendar, Trash2, EyeOff, RefreshCw
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { socketService } from '../../core/SocketService';
import { format, isSameDay } from 'date-fns';
import { activeProgramService } from '../../services/activeProgramService';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar as CalendarComponent } from '../ui/calendar';
import { toast } from 'sonner';

// Log entry types
interface LogEntry {
    id?: string;
    _id?: string;
    type: 'window_active' | 'window_skipped' | 'window_completed' | 'trigger_matched' |
    'trigger_skipped' | 'fallback_executed' | 'block_end' | 'program_day_complete' | 'execution_step' |
    'WINDOW_EVENT' | 'TRIGGER_MATCH' | 'TRIGGER_SKIP' | 'FLOW_EXECUTED' | 'ERROR' | 'INFO' | 'WARNING' |
    'active:program_started' | 'automation:program_start' | 'advanced:program_day_complete' |
    'advanced:window_active' | 'advanced:window_completed' | 'advanced:window_skipped' |
    'advanced:trigger_matched' | 'SENSOR_READ' | 'advanced:fallback_executed' | string; // Allow string fallback
    windowId?: string;
    windowName?: string;
    timestamp: Date | string;
    data?: any; // Frontend format
    message?: string; // Backend format
    metadata?: any; // Backend format
}

interface AdvancedExecutionLogProps {
    programId?: string;
    className?: string;
}

// Icon mapping for log entry types
const getIcon = (type: LogEntry['type']) => {
    switch (type) {
        // High Level Lifecycle
        case 'active:program_started':
        case 'automation:program_start':
            return <Play className="h-4 w-4 text-green-600 dark:text-green-500" />;

        case 'program_day_complete':
        case 'advanced:program_day_complete':
            return <CheckCircle2 className="h-4 w-4 text-purple-600 dark:text-purple-500" />;

        // Window Lifecycle
        case 'window_active':
        case 'advanced:window_active':
        case 'WINDOW_EVENT': // Fallback if sometimes used for start
            return <Activity className="h-4 w-4 text-blue-600 dark:text-blue-500" />;

        case 'window_completed':
        case 'advanced:window_completed':
            return <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-500" />;

        case 'window_skipped':
        case 'advanced:window_skipped':
            return <SkipForward className="h-4 w-4 text-gray-400" />;

        // Flow / Triggers
        case 'trigger_matched':
        case 'advanced:trigger_matched':
        case 'TRIGGER_MATCH':
            return <Zap className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-500" />;

        case 'FLOW_EXECUTED':
            return <Play className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-500" />;

        // Details / Blocks
        case 'block_end':
        case 'SENSOR_READ':
            // Try to infer icon from message content if possible, mainly generic here
            return <Activity className="h-3 w-3 text-gray-400" />;

        // Errors/Warnings
        case 'ERROR':
        case 'fallback_executed':
        case 'advanced:fallback_executed':
            return <XCircle className="h-4 w-4 text-red-600 dark:text-red-500" />;

        case 'WARNING':
            return <Activity className="h-4 w-4 text-orange-500" />;

        case 'INFO':
            return <RefreshCw className="h-3.5 w-3.5 text-slate-500" />;

        default: return <Clock className="h-3 w-3 text-gray-300" />;
    }
};

const formatMessage = (entry: LogEntry): React.ReactNode => {
    // 1. Detailed Trigger Evaluation
    if (entry.message && entry.message.includes('[TriggerEvaluator] Evaluation Result') && entry.metadata) {
        const { conditions, results, isTriggered, logicalOp, triggerIndex } = entry.metadata;

        if (conditions && Array.isArray(conditions)) {
            return (
                <div className="mt-0.5">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-muted-foreground">
                            Evaluation Result {triggerIndex ? `- Trigger #${triggerIndex}` : ''}
                        </span>
                        <span className={cn(
                            "text-xs px-1.5 py-0.5 rounded font-bold uppercase",
                            isTriggered ? "bg-green-500/20 text-green-600" : "bg-gray-500/20 text-gray-500"
                        )}>
                            {isTriggered ? "TRUE" : "FALSE"}
                        </span>
                    </div>
                    <div className="border rounded-md bg-background/50 overflow-hidden text-xs max-w-[500px]">
                        {conditions.map((cond: any, idx: number) => {
                            const result = results?.[idx];
                            const isError = cond.error;

                            return (
                                <div key={idx} className={cn(
                                    "flex items-center gap-2 px-2 py-1.5 border-b last:border-0",
                                    result ? "bg-green-500/5" : "bg-red-500/5"
                                )}>
                                    {isError ? (
                                        <XCircle className="h-3.5 w-3.5 text-red-500" />
                                    ) : result ? (
                                        <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                                    ) : (
                                        <XCircle className="h-3.5 w-3.5 text-red-500/70" />
                                    )}

                                    <div className="flex flex-1 items-baseline gap-2 overflow-hidden">
                                        <span className="font-semibold text-foreground/90 truncate max-w-[150px]" title={cond.sensorName || cond.sensorId}>
                                            {cond.sensorName || cond.sensorId}
                                        </span>

                                        {!isError && (
                                            <span className="font-mono text-muted-foreground">
                                                ({typeof cond.sensorValue === 'number' ? cond.sensorValue.toFixed(1) : cond.sensorValue})
                                            </span>
                                        )}

                                        <span className="font-mono text-xs opacity-80 whitespace-nowrap">
                                            {cond.operator} {cond.value}
                                            {cond.valueMax ? ` - ${cond.valueMax}` : ''}
                                        </span>
                                    </div>

                                    {/* Show Logic Operator between items */}
                                    {idx < conditions.length - 1 && (
                                        <span className={cn(
                                            "ml-auto text-[10px] uppercase font-bold px-1.5 rounded",
                                            logicalOp === 'OR' ? "bg-orange-500/10 text-orange-600" : "bg-blue-500/10 text-blue-600"
                                        )}>
                                            {logicalOp || 'AND'}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        }
    }

    // Backend Format
    if (entry.message) return entry.message;

    // Legacy Frontend Format (fallback)
    return JSON.stringify(entry.data || {});
};

// Style mapping for row container
const getEntryStyle = (entry: LogEntry): string => {
    const type = entry.type;

    // 1. Program/Window Start/End (Top Level)
    if ([
        'active:program_started', 'automation:program_start',
        'window_active', 'advanced:window_active', 'WINDOW_EVENT',
        'program_day_complete', 'advanced:program_day_complete'
    ].includes(type)) {
        return "bg-blue-500/5 border-l-2 border-blue-500 pl-3 font-medium text-foreground";
    }

    if (['window_completed', 'advanced:window_completed'].includes(type)) {
        return "bg-blue-500/5 border-l-2 border-blue-500/50 pl-3 text-muted-foreground";
    }

    // 2. Flow / Trigger (Mid Level)
    if (['trigger_matched', 'advanced:trigger_matched', 'TRIGGER_MATCH', 'FLOW_EXECUTED'].includes(type)) {
        return "ml-4 border-l-2 border-transparent pl-2 text-foreground/90";
    }

    // 3. Errors (Highlight)
    if (['ERROR', 'fallback_executed', 'advanced:fallback_executed'].includes(type)) {
        return "bg-red-500/5 border-l-2 border-red-500 pl-3 text-red-600 dark:text-red-400 font-medium";
    }

    // 4. Low Level Details (Default - Indented)
    return "ml-8 border-l border-border/50 pl-2 text-sm text-muted-foreground";
};

// Helper to check if entry is "significant" enough to show time clearly
// or if it should fade the time out to reduce noise
const shouldDimTimestamp = (type: LogEntry['type']) => {
    return !['active:program_started', 'window_active', 'advanced:window_active', 'ERROR'].includes(type);
};


export function AdvancedExecutionLog({ className, programId }: AdvancedExecutionLogProps) {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [autoScroll, setAutoScroll] = useState(true);

    // Pending actuators (temporary UI state, not in DB)
    const [pendingActuators, setPendingActuators] = useState<Map<string, {
        blockId: string;
        label: string;
        expectedDuration: number;
        startTime: number;
    }>>(new Map());

    // Date Selection
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);

    // Initial Load
    useEffect(() => {
        if (programId) {
            fetchLogs();
        }
    }, [programId, selectedDate]);

    const fetchLogs = async () => {
        if (!programId) return;
        setLoading(true);
        try {
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            const response = await activeProgramService.getLogs(programId, dateStr);

            if (response.success && response.data && response.data.length > 0) {
                // If backend returns Daily Log document directly
                // It might return [ { events: [...] } ] or just the events?
                // The repo returns array of ProgramDailyLog documents (usually 1 per day).
                // Let's assume we get the document and take its events.

                const combinedEvents = response.data.flatMap((doc: any) => doc.events || []);

                // Sort by timestamp to ensure correct chronological order (async race condition fix)
                combinedEvents.sort((a: any, b: any) =>
                    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                );

                setLogs(combinedEvents);
            } else {
                setLogs([]);
            }
        } catch (error) {
            console.error('Failed to fetch logs:', error);
            // Fallback to empty if not found
            setLogs([]);
        } finally {
            setLoading(false);
        }
    };

    // Auto-scroll logic
    const scrollToBottom = () => {
        if (!scrollRef.current) return;
        const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    };

    useEffect(() => {
        if (autoScroll) {
            setTimeout(scrollToBottom, 50);
        }
    }, [logs, autoScroll]);

    // WebSocket Listeners (Only active for TODAY)
    const isToday = isSameDay(selectedDate, new Date());

    useEffect(() => {
        if (!isToday || !programId) return;

        let refetchTimeout: ReturnType<typeof setTimeout> | null = null;

        const handleRealtimeEvent = () => {
            // Debounce refetch to allow DB write to complete and batch rapid events
            if (refetchTimeout) clearTimeout(refetchTimeout);
            refetchTimeout = setTimeout(() => {
                fetchLogs();
            }, 300); // 300ms delay to ensure DB write completes
        };

        // Handle actuator start - show pending state
        const handleBlockStart = (data: any) => {
            if (data.type === 'ACTUATOR_SET' && data.activeProgramId === programId) {
                setPendingActuators(prev => {
                    const updated = new Map(prev);
                    updated.set(data.blockId, {
                        blockId: data.blockId,
                        label: data.blockLabel || 'Актуатор',
                        expectedDuration: data.expectedDuration || 0,
                        startTime: Date.now()
                    });
                    return updated;
                });
            }
        };

        // Handle actuator end - remove pending state and refetch
        const handleBlockEnd = (data: any) => {
            // Remove from pending if it was an actuator
            setPendingActuators(prev => {
                if (prev.has(data.blockId)) {
                    const updated = new Map(prev);
                    updated.delete(data.blockId);
                    return updated;
                }
                return prev;
            });
            // Refetch logs to get the actual result
            handleRealtimeEvent();
        };

        // Listen to all relevant events
        const events = [
            'advanced:window_active',
            'advanced:window_completed',
            'advanced:window_skipped',
            'advanced:trigger_matched',
            'advanced:trigger_skipped',
            'advanced:trigger_evaluation', // <-- Add this
            'advanced:fallback_executed',
            'advanced:program_day_complete',
            'active:program_started',
            'automation:program_start'
        ];

        events.forEach(event => socketService.on(event, handleRealtimeEvent));
        socketService.on('automation:block_start', handleBlockStart);
        socketService.on('automation:block_end', handleBlockEnd);

        return () => {
            if (refetchTimeout) clearTimeout(refetchTimeout);
            events.forEach(event => socketService.off(event, handleRealtimeEvent));
            socketService.off('automation:block_start', handleBlockStart);
            socketService.off('automation:block_end', handleBlockEnd);
        };
    }, [isToday, programId]);


    // Actions
    const handleClear = async (type: 'visual' | 'permanent') => {
        if (!programId) return;
        try {
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            await activeProgramService.clearLogs(programId, dateStr, type);
            if (type === 'visual') {
                // Visual clear: empty the local list
                setLogs([]);
                toast.success('Логът е изчистен (визуално)');
            } else {
                setLogs([]);
                toast.success('Логът е изтрит перманентно');
            }
        } catch (error) {
            toast.error('Грешка при изчистване');
        }
    };

    return (
        <Card className={cn("mt-6", className)}>
            <CardHeader className="py-3 px-4 border-b bg-muted/20">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        История на изпълнението
                    </CardTitle>

                    <div className="flex items-center gap-2">
                        {/* Date Picker */}
                        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className="h-8 gap-2">
                                    <Calendar className="h-3.5 w-3.5" />
                                    {isToday ? 'Днес' : format(selectedDate, 'dd.MM.yyyy')}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                                <CalendarComponent
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={(date: Date | undefined) => {
                                        if (date) {
                                            setSelectedDate(date);
                                            setIsCalendarOpen(false);
                                        }
                                    }}
                                />
                            </PopoverContent>
                        </Popover>

                        <div className="h-4 w-px bg-border mx-1" />

                        {/* Actions */}
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fetchLogs} title="Refresh">
                            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
                        </Button>

                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive">
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-56" align="end">
                                <div className="space-y-2">
                                    <h4 className="font-medium text-xs text-muted-foreground uppercase">Изчистване на лога</h4>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full justify-start gap-2"
                                        onClick={() => handleClear('visual')}
                                    >
                                        <EyeOff className="h-3.5 w-3.5" />
                                        Визуално (Покажи нови)
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        className="w-full justify-start gap-2"
                                        onClick={() => handleClear('permanent')}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                        Перманентно изтриване
                                    </Button>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <ScrollArea
                    className="h-[300px] px-4 py-2"
                    ref={scrollRef}
                    onScroll={(e) => {
                        const target = e.target as HTMLDivElement;
                        const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 50;
                        setAutoScroll(isAtBottom);
                    }}
                >
                    {logs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground text-sm gap-2">
                            <div className="p-3 bg-muted rounded-full">
                                <Activity className="h-6 w-6 opacity-50" />
                            </div>
                            <p>Няма записи за избраната дата.</p>
                        </div>
                    ) : (
                        <div className="space-y-1 py-2">
                            {logs.map((entry, idx) => (
                                <div
                                    key={entry.id || entry._id || idx}
                                    className={cn(
                                        "flex items-start gap-3 py-1.5 pr-2 rounded-r-md transition-colors text-sm group select-text",
                                        getEntryStyle(entry)
                                    )}
                                >
                                    <span className={cn(
                                        "text-xs font-mono shrink-0 pt-0.5 w-[50px]",
                                        shouldDimTimestamp(entry.type) ? "text-muted-foreground/40" : "text-muted-foreground"
                                    )}>
                                        {format(new Date(entry.timestamp), 'HH:mm:ss')}
                                    </span>
                                    <span className="shrink-0 mt-0.5">
                                        {getIcon(entry.type)}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="leading-snug break-words">
                                            {formatMessage(entry)}
                                        </p>
                                    </div>
                                </div>
                            ))}

                            {/* Pending Actuators - Indented like Flow Events */}
                            {Array.from(pendingActuators.values()).map((pending) => (
                                <div
                                    key={`pending-${pending.blockId}`}
                                    className="flex items-start gap-3 py-2 pr-2 ml-8 rounded-md bg-yellow-500/5 border-l-2 border-yellow-500 pl-2 text-sm animate-pulse"
                                >
                                    <span className="text-xs text-muted-foreground/60 font-mono shrink-0 pt-0.5 w-[50px]">
                                        {format(new Date(pending.startTime), 'HH:mm:ss')}
                                    </span>
                                    <span className="shrink-0 mt-0.5">
                                        <Loader2 className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-500 animate-spin" />
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="leading-snug text-yellow-700 dark:text-yellow-400 font-medium">
                                            ⚡ {pending.label}: Работи...
                                            {pending.expectedDuration > 0 && (
                                                <span className="text-muted-foreground ml-1 font-normal">
                                                    (~{(pending.expectedDuration / 1000).toFixed(1)}s)
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            ))}

                            <div className="h-px bg-transparent" /> {/* Bottom spacer */}
                        </div>
                    )}
                </ScrollArea>

                {/* Footer / Status */}
                <div className="border-t bg-muted/10 px-4 py-2 text-xs text-muted-foreground flex justify-between">
                    <span>{logs.length} събития</span>
                    {loading && <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Updating...</span>}
                </div>
            </CardContent>
        </Card>
    );
}
