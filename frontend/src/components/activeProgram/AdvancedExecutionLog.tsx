/**
 * AdvancedExecutionLog.tsx
 * 
 * Real-time execution log for Advanced Programs.
 * Listens to WebSocket events and displays them grouped by window.
 */

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import {
    Activity, Zap, Play, CheckCircle2, SkipForward,
    Clock, XCircle, ArrowRight, Sparkles, Loader2
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { socketService } from '../../core/SocketService';
import { format } from 'date-fns';

// Log entry types
interface LogEntry {
    id: string;
    type: 'window_active' | 'window_skipped' | 'window_completed' | 'trigger_matched' |
    'trigger_skipped' | 'fallback_executed' | 'block_end' | 'program_day_complete' | 'execution_step';
    windowId?: string;
    windowName?: string;
    timestamp: Date;
    data: any;
}

interface AdvancedExecutionLogProps {
    programId?: string;
    className?: string;
}

// Icon mapping for log entry types
const getIcon = (type: LogEntry['type'], success?: boolean) => {
    switch (type) {
        case 'window_active':
            return <Play className="h-3.5 w-3.5 text-green-500" />;
        case 'window_skipped':
            return <SkipForward className="h-3.5 w-3.5 text-purple-500" />;
        case 'window_completed':
            return <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />;
        case 'trigger_matched':
            return <Zap className="h-3.5 w-3.5 text-yellow-500" />;
        case 'trigger_skipped':
            return <ArrowRight className="h-3.5 w-3.5 text-gray-400" />;
        case 'fallback_executed':
            return <Sparkles className="h-3.5 w-3.5 text-orange-500" />;
        case 'block_end':
            return success
                ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                : <XCircle className="h-3.5 w-3.5 text-red-500" />;
        case 'program_day_complete':
            return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
        case 'execution_step':
            return <Loader2 className="h-3.5 w-3.5 text-blue-500 animate-spin" />;
        default:
            return <Clock className="h-3.5 w-3.5 text-gray-400" />;
    }
};

// Helper to get Block Label safely
const getBlockLabel = (entry: LogEntry) => {
    // 1. Try Notification Config Label (Standard for Block End)
    if (entry.data?.notification?.config?.label) return entry.data.notification.config.label;

    // 2. Try direct label (Standard for Execution Step)
    if (entry.data?.label) return entry.data.label;

    // 3. Fallback to ID
    return entry.data.blockId?.split('_')[0] || entry.data.blockId || 'Block';
};

// Format log entry message
const formatMessage = (entry: LogEntry): string => {
    switch (entry.type) {
        case 'window_active':
            return `Прозорец "${entry.windowName}" - Активен`;
        case 'window_skipped':
            return `Прозорец "${entry.windowName}" - Пропуснат (${entry.data.reason})`;
        case 'window_completed':
            const result = entry.data.result === 'triggered' ? 'чрез тригер'
                : entry.data.result === 'fallback' ? 'с fallback' : 'без действие';
            return `Прозорец "${entry.windowName}" - Завършен ${result}`;
        case 'trigger_matched':
            return `📊 ${entry.data.sensorName} = ${entry.data.sensorValue} → ⚡ ${entry.data.condition} ✓`;
        case 'trigger_skipped':
            return `📊 ${entry.data.sensorName} = ${entry.data.sensorValue} → ${entry.data.condition} ✗`;
        case 'fallback_executed':
            return `Изпълнен fallback поток: ${entry.data.flowName}`;
        case 'block_end':
            const blockLabel = getBlockLabel(entry);
            const blockIdRaw = entry.data.blockId?.split('_')[0];

            if (entry.data.success) {
                let message = `✓ ${blockLabel}`;
                // Show Flow Name for Start Block
                if (blockIdRaw === 'start' && entry.data.programName) {
                    message += `: ${entry.data.programName}`;
                }
                return `${message}${entry.data.summary ? `: ${entry.data.summary}` : ''}`;
            } else {
                return `✗ ${blockLabel}: ${entry.data.error || 'Failed'}`;
            }
        case 'program_day_complete':
            return '🏁 Програмата завърши за днес';
        case 'execution_step':
            const label = getBlockLabel(entry);
            const params = entry.data.params || {};

            let details = '';

            // ACTUATOR_SET Specifics
            if (entry.data.type === 'ACTUATOR_SET') {
                if (params.amountMode === 'DOSES' && params.amount) {
                    details = `(${params.action} ${params.amount} doses)`;
                }
                else if (params.amount && params.action) {
                    details = `(${params.action} ${params.amount}${params.amountUnit || ''})`;
                }
            }
            // WAIT Specifics
            else if (entry.data.type === 'WAIT') {
                if (params.duration) details = `(${params.duration}s)`;
            }
            // Fallback generic info
            else if (params.message) {
                details = `(${params.message})`;
            }

            return `⏳ ${label} ${details} ...`;
        default:
            return JSON.stringify(entry.data);
    }
};

export function AdvancedExecutionLog({ className, programId }: AdvancedExecutionLogProps) {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [autoScroll, setAutoScroll] = useState(true);

    const storageKey = `advanced_logs_${programId || 'default'}`;

    // Load logs from storage
    useEffect(() => {
        try {
            const saved = sessionStorage.getItem(storageKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                // Hydrate dates
                const hydrated = parsed.map((entry: any) => ({
                    ...entry,
                    timestamp: new Date(entry.timestamp)
                }));
                setLogs(hydrated);
            }
        } catch (error) {
            console.error('Failed to load logs from storage:', error);
        }
    }, [storageKey]);

    // Generate unique ID
    const generateId = () => `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Add log entry
    const addLog = (entry: Omit<LogEntry, 'id'>) => {
        setLogs(prev => {
            const newLogs = [...prev, { ...entry, id: generateId() }];
            const sliced = newLogs.slice(-200); // Keep last 200

            // Persist to storage
            sessionStorage.setItem(storageKey, JSON.stringify(sliced));

            return sliced;
        });
    };

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        if (!scrollRef.current) return;

        // Radix UI ScrollArea renders a viewport div inside. We need to scroll THAT.
        const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        } else {
            // Fallback if ref is direct
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    };

    // Scroll on logs update if autoScroll is true
    useEffect(() => {
        if (autoScroll) {
            // Small timeout to ensure DOM update
            setTimeout(scrollToBottom, 50);
        }
    }, [logs, autoScroll]);

    // Scroll on initial mount (with delay for layout)
    useEffect(() => {
        setTimeout(scrollToBottom, 100);
        setTimeout(scrollToBottom, 500); // Verify scroll after everything settles
    }, []);

    // Subscribe to WebSocket events
    useEffect(() => {
        // Window events
        const handleWindowActive = (data: any) => {
            addLog({
                type: 'window_active',
                windowId: data.windowId,
                windowName: data.windowName,
                timestamp: new Date(data.timestamp),
                data
            });
        };

        const handleWindowSkipped = (data: any) => {
            addLog({
                type: 'window_skipped',
                windowId: data.windowId,
                windowName: data.windowName,
                timestamp: new Date(data.timestamp),
                data
            });
        };

        const handleWindowCompleted = (data: any) => {
            addLog({
                type: 'window_completed',
                windowId: data.windowId,
                windowName: data.windowName,
                timestamp: new Date(data.timestamp),
                data
            });
        };

        const handleTriggerMatched = (data: any) => {
            addLog({
                type: 'trigger_matched',
                windowId: data.windowId,
                timestamp: new Date(data.timestamp),
                data
            });
        };

        const handleTriggerSkipped = (data: any) => {
            addLog({
                type: 'trigger_skipped',
                windowId: data.windowId,
                timestamp: new Date(data.timestamp),
                data
            });
        };

        const handleFallbackExecuted = (data: any) => {
            addLog({
                type: 'fallback_executed',
                windowId: data.windowId,
                windowName: data.windowName,
                timestamp: new Date(data.timestamp),
                data
            });
        };

        const handleBlockEnd = (data: any) => {
            setLogs(prev => {
                // Smart Update: Find if there is a pending 'execution_step' for this block
                // We search from the end to find the most recent one
                // FIX: Add sessionId check to prevent cross-flow collision
                const existingIndex = prev.findIndex(l =>
                    l.type === 'execution_step' &&
                    l.data.blockId === data.blockId &&
                    // Match session matches (or ignore if execution_step didn't capture it)
                    (!data.sessionId || !l.data.sessionId || l.data.sessionId === data.sessionId)
                );

                if (existingIndex !== -1) {
                    // Update in place
                    const newLogs = [...prev];
                    newLogs[existingIndex] = {
                        ...newLogs[existingIndex], // Keep original ID/Timestamp or update?
                        type: 'block_end',
                        timestamp: new Date(), // Update timestamp to finish time
                        data: { ...newLogs[existingIndex].data, ...data } // Merge data
                    };
                    const sliced = newLogs.slice(-200);
                    sessionStorage.setItem(storageKey, JSON.stringify(sliced));
                    return sliced;
                }

                // If not found (e.g. joined late), just append
                const newEntry: LogEntry = {
                    id: generateId(),
                    type: 'block_end',
                    timestamp: new Date(),
                    data
                };
                const newLogs = [...prev, newEntry];
                const sliced = newLogs.slice(-200);
                sessionStorage.setItem(storageKey, JSON.stringify(sliced));
                return sliced;
            });
        };

        const handleExecutionStep = (data: any) => {
            setLogs(prev => {
                // RACE CONDITION FIX:
                // Check if we already have a 'block_end' for this blockId (and sessionId)
                // This happens if block_end arrives BEFORE execution_step (network race)
                const alreadyCompleted = prev.some(l =>
                    l.type === 'block_end' &&
                    l.data.blockId === data.blockId &&
                    // Strict session matching if available
                    (!data.sessionId || !l.data.sessionId || l.data.sessionId === data.sessionId)
                );

                if (alreadyCompleted) {
                    console.warn('⚠️ Log Race Condition: Ignoring execution_step because block_end already exists', data);
                    return prev;
                }

                // Check for duplicate execution_step to avoid double spinners
                const isDuplicate = prev.some(l =>
                    l.type === 'execution_step' &&
                    l.data.blockId === data.blockId &&
                    (!data.sessionId || !l.data.sessionId || l.data.sessionId === data.sessionId)
                );

                if (isDuplicate) return prev;

                const newEntry: LogEntry = {
                    id: generateId(),
                    type: 'execution_step',
                    timestamp: new Date(data.timestamp || Date.now()),
                    data
                };
                const newLogs = [...prev, newEntry];
                const sliced = newLogs.slice(-200);
                sessionStorage.setItem(storageKey, JSON.stringify(sliced));
                return sliced;
            });
        };

        const handleDayComplete = (data: any) => {
            addLog({
                type: 'program_day_complete',
                timestamp: new Date(data.timestamp),
                data
            });
        };

        // Register listeners
        socketService.on('advanced:window_active', handleWindowActive);
        socketService.on('advanced:window_skipped', handleWindowSkipped);
        socketService.on('advanced:window_completed', handleWindowCompleted);
        socketService.on('advanced:trigger_matched', handleTriggerMatched);
        socketService.on('advanced:trigger_skipped', handleTriggerSkipped);
        socketService.on('advanced:fallback_executed', handleFallbackExecuted);
        socketService.on('automation:block_end', handleBlockEnd);
        socketService.on('automation:execution_step', handleExecutionStep);
        socketService.on('advanced:program_day_complete', handleDayComplete);

        // Cleanup
        return () => {
            socketService.off('advanced:window_active', handleWindowActive);
            socketService.off('advanced:window_skipped', handleWindowSkipped);
            socketService.off('advanced:window_completed', handleWindowCompleted);
            socketService.off('advanced:trigger_matched', handleTriggerMatched);
            socketService.off('advanced:trigger_skipped', handleTriggerSkipped);
            socketService.off('advanced:fallback_executed', handleFallbackExecuted);
            socketService.off('automation:block_end', handleBlockEnd);
            socketService.off('automation:execution_step', handleExecutionStep);
            socketService.off('advanced:program_day_complete', handleDayComplete);
        };
    }, []);

    // Clear logs at midnight
    // Clear logs at midnight
    useEffect(() => {
        const checkMidnight = () => {
            const now = new Date();
            if (now.getHours() === 0 && now.getMinutes() === 0) {
                setLogs([]);
                sessionStorage.removeItem(storageKey);
            }
        };

        const interval = setInterval(checkMidnight, 60000); // Check every minute
        return () => clearInterval(interval);
    }, [storageKey]);

    return (
        <Card className={cn("mt-6", className)}>
            <CardHeader className="py-3 px-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Лог на изпълнението
                    </CardTitle>
                    <Badge variant="outline" className="text-xs">
                        {logs.length} записа
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <ScrollArea
                    className="h-[300px] px-4 pb-4"
                    ref={scrollRef}
                    onScroll={(e) => {
                        const target = e.target as HTMLDivElement;
                        const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 50;
                        setAutoScroll(isAtBottom);
                    }}
                >
                    {logs.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                            Няма записи. Стартирайте програмата за да видите лога.
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {logs.map((entry) => (
                                <div
                                    key={entry.id}
                                    className={cn(
                                        "flex items-start gap-2 py-1.5 px-2 rounded text-sm",
                                        entry.type === 'block_end' && !entry.data.success && "bg-red-500/10",
                                        entry.type === 'window_completed' && "bg-blue-500/5",
                                        entry.type === 'trigger_matched' && "bg-yellow-500/5",
                                        entry.type === 'program_day_complete' && "bg-emerald-500/10"
                                    )}
                                >
                                    <span className="text-xs text-muted-foreground font-mono shrink-0">
                                        {format(new Date(entry.timestamp), 'HH:mm:ss')}
                                    </span>
                                    <span className="shrink-0">
                                        {getIcon(entry.type, entry.data?.success)}
                                    </span>
                                    <span className={cn(
                                        "flex-1",
                                        entry.type === 'block_end' && !entry.data.success && "text-red-500"
                                    )}>
                                        {formatMessage(entry)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
