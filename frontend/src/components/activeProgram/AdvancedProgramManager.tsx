import { useState, useEffect } from 'react';
import { format, differenceInMinutes, parse, isValid } from 'date-fns';
import type { IActiveProgram } from '../../types/ActiveProgram';
import { activeProgramService } from '../../services/activeProgramService';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import {
    Play, Pause, Square, Clock, Zap, CheckCircle2,
    Circle, Timer, ChevronDown, ChevronRight,
    Sun, Sunrise, Moon, RefreshCw, Trash2, ArrowRight, Pencil, Activity
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Progress } from '../ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '../ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { TimePicker24 } from '../ui/time-picker-24';
import { TimeWindowModal } from '../programs/TimeWindowModal';
import type { ITimeWindow } from '../programs/types';
import { AdvancedExecutionLog } from './AdvancedExecutionLog';

interface AdvancedProgramManagerProps {
    program: IActiveProgram;
    onUpdate: () => void;
}

// Window state from backend
interface IWindowState {
    windowId: string;
    status: 'pending' | 'active' | 'completed' | 'skipped';
    triggersExecuted: string[];
    lastCheck?: Date;
}

// Helper to get time-of-day icon
const getTimeIcon = (time: string) => {
    const hour = parseInt(time.split(':')[0], 10);
    if (hour >= 6 && hour < 12) return <Sunrise className="h-4 w-4 text-orange-500" />;
    if (hour >= 12 && hour < 18) return <Sun className="h-4 w-4 text-yellow-500" />;
    return <Moon className="h-4 w-4 text-blue-500" />;
};

// Format operator for display
const formatOperator = (op: string): string => {
    const map: Record<string, string> = {
        '>': '>',
        '<': '<',
        '>=': '≥',
        '<=': '≤',
        '=': '=',
        '!=': '≠',
        'between': '↔'
    };
    return map[op] || op;
};

// Get status color for badge
const getStatusColor = (status: string) => {
    switch (status) {
        case 'active': return 'text-green-600 bg-green-500/10';
        case 'completed': return 'text-blue-600 bg-blue-500/10';
        case 'skipped': return 'text-purple-500 bg-purple-500/10';
        case 'pending':
        default: return 'text-gray-500 bg-gray-500/10';
    }
};

// Get border color for window card
const getBorderColor = (status: string) => {
    switch (status) {
        case 'active': return 'border-l-green-500';
        case 'completed': return 'border-l-blue-500';
        case 'skipped': return 'border-l-purple-500';
        case 'pending':
        default: return 'border-l-gray-400';
    }
};

// Get status icon
const getStatusIcon = (status: string) => {
    switch (status) {
        case 'active': return <Play className="h-3 w-3" />;
        case 'completed': return <CheckCircle2 className="h-3 w-3" />;
        case 'skipped': return <ArrowRight className="h-3 w-3" />;
        case 'pending':
        default: return <Circle className="h-3 w-3" />;
    }
};

export const AdvancedProgramManager = ({ program, onUpdate }: AdvancedProgramManagerProps) => {
    const [expandedWindows, setExpandedWindows] = useState<Set<string>>(new Set());
    const [processing, setProcessing] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());

    // Delayed Start state
    const [isDelayedStartOpen, setIsDelayedStartOpen] = useState(false);
    const [dateInput, setDateInput] = useState('');
    const [timeInput, setTimeInput] = useState('00:00');
    const [timeRemaining, setTimeRemaining] = useState<string>('');

    // Lookup maps for names
    const [sensors, setSensors] = useState<any[]>([]);
    const [flows, setFlows] = useState<any[]>([]);

    // Window editing state
    const [editingWindow, setEditingWindow] = useState<ITimeWindow | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [localWindows, setLocalWindows] = useState<ITimeWindow[]>([]);

    // Trigger quick-edit state
    const [editingTriggerId, setEditingTriggerId] = useState<string | null>(null);
    const [editingTriggerValue, setEditingTriggerValue] = useState<string>('');
    const [editingTriggerValueMax, setEditingTriggerValueMax] = useState<string>('');
    const [editingWindowId, setEditingWindowId] = useState<string | null>(null);

    const windows = (program as any).windows || [];
    const windowsState: IWindowState[] = (program as any).windowsState || [];

    // API base URL
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

    // Load sensors and flows for name resolution
    useEffect(() => {
        const loadData = async () => {
            try {
                const [sensorsRes, flowsRes] = await Promise.all([
                    fetch(`${API_URL}/hardware/devices`).then(r => r.json()).catch(() => ({ data: [] })),
                    fetch(`${API_URL}/flows`).then(r => r.json()).catch(() => [])
                ]);

                // Transform sensors - extract data and normalize IDs
                const devices = sensorsRes?.data || sensorsRes || [];
                const sensorDevices = (Array.isArray(devices) ? devices : [])
                    .filter((d: any) => d.type === 'SENSOR' || d.category === 'SENSOR')
                    .map((d: any) => ({
                        id: d.id || d._id?.toString(),
                        _id: d._id?.toString(),
                        name: d.name
                    }));

                console.log('Sensors loaded:', sensorDevices);
                setSensors(sensorDevices);
                setFlows(Array.isArray(flowsRes) ? flowsRes : []);
            } catch (error) {
                console.error('Failed to load sensors/flows:', error);
                setSensors([]);
                setFlows([]);
            }
        };
        loadData();
    }, []);

    // Update current time every second
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Initialize delayed start inputs
    useEffect(() => {
        if (program?.status === 'scheduled' && program.startTime) {
            const start = new Date(program.startTime);
            setDateInput(format(start, 'dd.MM.yyyy'));
            setTimeInput(format(start, 'HH:mm'));
        } else {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            setDateInput(format(tomorrow, 'dd.MM.yyyy'));
            setTimeInput(format(tomorrow, 'HH:mm'));
        }
    }, [program]);

    // Countdown timer
    useEffect(() => {
        if (program?.status !== 'scheduled' || !program.startTime) {
            setTimeRemaining('');
            return;
        }

        const updateTimer = () => {
            const start = new Date(program.startTime!);
            const now = new Date();
            const diffMins = differenceInMinutes(start, now);

            if (diffMins <= 0) {
                setTimeRemaining('Starting...');
            } else {
                const hours = Math.floor(diffMins / 60);
                const mins = diffMins % 60;
                setTimeRemaining(`${hours}h ${mins}m`);
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 60000);
        return () => clearInterval(interval);
    }, [program]);

    // Get state for a window
    const getWindowState = (windowId: string): IWindowState | undefined => {
        return windowsState.find(s => s.windowId === windowId);
    };

    // Get sensor name by ID
    const getSensorName = (sensorId: string): string => {
        const sensor = sensors.find(s => s.id === sensorId || s._id === sensorId);
        return sensor?.name || sensorId;
    };

    // Get flow name by ID
    const getFlowName = (flowId: string): string => {
        const flow = flows.find(f => f.id === flowId || f._id === flowId);
        return flow?.name || flowId;
    };

    const toggleExpand = (windowId: string) => {
        setExpandedWindows(prev => {
            const next = new Set(prev);
            if (next.has(windowId)) {
                next.delete(windowId);
            } else {
                next.add(windowId);
            }
            return next;
        });
    };

    const handleStop = async () => {
        setProcessing(true);
        try {
            await activeProgramService.stop();
            toast.success('Програмата е спряна');
            onUpdate();
        } catch (error) {
            toast.error('Грешка при спиране');
        } finally {
            setProcessing(false);
        }
    };

    const handlePause = async () => {
        setProcessing(true);
        try {
            await activeProgramService.pause();
            toast.success('Програмата е на пауза');
            onUpdate();
        } catch (error) {
            toast.error('Грешка при пауза');
        } finally {
            setProcessing(false);
        }
    };

    const handleResume = async () => {
        setProcessing(true);
        try {
            await activeProgramService.start();
            toast.success('Програмата продължава');
            onUpdate();
        } catch (error) {
            toast.error('Грешка при продължаване');
        } finally {
            setProcessing(false);
        }
    };

    const handleDelayedStart = async () => {
        if (!dateInput || !timeInput) return;

        const parsedDate = parse(dateInput, 'dd.MM.yyyy', new Date());
        if (!isValid(parsedDate)) {
            toast.error('Невалидна дата');
            return;
        }

        const [hours, minutes] = timeInput.split(':').map(Number);
        parsedDate.setHours(hours, minutes, 0, 0);

        try {
            await activeProgramService.start(parsedDate);
            toast.success(`Програмата е насрочена за ${format(parsedDate, 'dd.MM.yyyy HH:mm')}`);
            setIsDelayedStartOpen(false);
            onUpdate();
        } catch (error) {
            toast.error('Грешка при насрочване');
        }
    };

    const handleUnload = async () => {
        try {
            await activeProgramService.unload();
            toast.success('Програмата е премахната');
            onUpdate();
        } catch (error) {
            toast.error('Грешка при премахване');
        }
    };

    // Sync localWindows with program.windows
    useEffect(() => {
        setLocalWindows(windows);
    }, [JSON.stringify(windows)]);

    // Helper to convert time string to minutes for comparison
    const timeToMinutes = (time: string): number => {
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
    };

    // Helper to convert minutes back to time string
    const minutesToTime = (mins: number): string => {
        const h = Math.floor(mins / 60) % 24;
        const m = mins % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };

    // Check if a window is editable (not currently active by time)
    const isWindowEditable = (window: any): boolean => {
        const state = getWindowState(window.id);
        // If status is 'active', window is running - not editable
        if (state?.status === 'active') return false;

        // Also check by current time (in case status hasn't updated yet)
        const nowMins = currentTime.getHours() * 60 + currentTime.getMinutes();
        const startMins = timeToMinutes(window.startTime);
        const endMins = timeToMinutes(window.endTime);

        // If current time is within window range, not editable
        if (nowMins >= startMins && nowMins < endMins) return false;

        return true;
    };

    // Open edit modal for a window
    const handleEditWindow = (window: ITimeWindow, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isWindowEditable(window)) {
            toast.error('Не може да редактирате прозорец докато е активен');
            return;
        }
        setEditingWindow(window);
        setIsEditModalOpen(true);
    };

    // Start editing a trigger value
    const startTriggerEdit = (windowId: string, trigger: any, e: React.MouseEvent) => {
        e.stopPropagation();
        const window = localWindows.find(w => w.id === windowId);
        if (!window || !isWindowEditable(window)) {
            toast.error('Не може да редактирате тригер докато прозорецът е активен');
            return;
        }
        setEditingWindowId(windowId);
        setEditingTriggerId(trigger.id);
        setEditingTriggerValue(String(trigger.value));
        setEditingTriggerValueMax(trigger.valueMax ? String(trigger.valueMax) : '');
    };

    // Cancel trigger editing
    const cancelTriggerEdit = () => {
        setEditingTriggerId(null);
        setEditingTriggerValue('');
        setEditingTriggerValueMax('');
        setEditingWindowId(null);
    };

    // Save trigger value edit
    const saveTriggerEdit = async () => {
        if (!editingWindowId || !editingTriggerId) return;

        const newValue = parseFloat(editingTriggerValue);
        if (isNaN(newValue)) {
            toast.error('Невалидна стойност');
            return;
        }

        try {
            setProcessing(true);

            const newWindows = localWindows.map(w => {
                if (w.id !== editingWindowId) return w;
                return {
                    ...w,
                    triggers: w.triggers.map(t => {
                        if (t.id !== editingTriggerId) return t;
                        return {
                            ...t,
                            value: newValue,
                            ...(editingTriggerValueMax ? { valueMax: parseFloat(editingTriggerValueMax) } : {})
                        };
                    })
                };
            });

            await activeProgramService.update({ windows: newWindows } as any);
            setLocalWindows(newWindows);
            toast.success('Стойността е обновена');
            cancelTriggerEdit();
            onUpdate();
        } catch (error) {
            console.error('Failed to update trigger:', error);
            toast.error('Грешка при запазване');
        } finally {
            setProcessing(false);
        }
    };

    // Save edited window with auto-overlap adjustment
    const handleWindowSave = async (updatedWindow: ITimeWindow, autoShift: boolean = false) => {
        try {
            setProcessing(true);

            // Update the window in the list (preserving original order for logic)
            let newWindows = localWindows.map(w =>
                w.id === updatedWindow.id ? updatedWindow : { ...w }
            );

            if (autoShift) {
                // If Auto-Shift is ON: Enforce sequence based on existing order.
                // Do NOT sort by time yet, as we want W1 to push W2 even if W1 jumps ahead of W2.
                for (let i = 0; i < newWindows.length - 1; i++) {
                    const current = newWindows[i];
                    const next = newWindows[i + 1];

                    const currentEnd = timeToMinutes(current.endTime);
                    const nextStart = timeToMinutes(next.startTime);

                    // If order is violated (Next starts before Current ends), Push Next.
                    // This covers both "Overlap" and "Jump Over".
                    if (nextStart < currentEnd) {
                        const nextDuration = timeToMinutes(next.endTime) - nextStart;
                        next.startTime = current.endTime;
                        next.endTime = minutesToTime(timeToMinutes(current.endTime) + nextDuration);
                    }
                }
            }

            // Now Sort windows by startTime (so they are stored/displayed chronologically)
            // But only after we applied the pushes.
            // Note: If autoShift was FALSE, we do standard sorting first, then overlap check.
            if (!autoShift) {
                newWindows.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

                // Standard Overlap check (if any slipped through validation) - mostly redundant if validation is strict
                for (let i = 0; i < newWindows.length - 1; i++) {
                    const current = newWindows[i];
                    const next = newWindows[i + 1];

                    const currentEnd = timeToMinutes(current.endTime);
                    const nextStart = timeToMinutes(next.startTime);

                    if (currentEnd > nextStart) {
                        // Overlap detected - shift next window
                        const nextDuration = timeToMinutes(next.endTime) - nextStart;
                        next.startTime = current.endTime;
                        next.endTime = minutesToTime(timeToMinutes(current.endTime) + nextDuration);
                    }
                }
            } else {
                // Even after push, we want final sort
                newWindows.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
            }

            // Update via API
            await activeProgramService.update({ windows: newWindows } as any);
            setLocalWindows(newWindows);
            toast.success('Прозорецът е обновен');
            setIsEditModalOpen(false);
            setEditingWindow(null);
            onUpdate();
        } catch (error) {
            console.error('Failed to update window:', error);
            toast.error('Грешка при запазване');
        } finally {
            setProcessing(false);
        }
    };

    // Calculate progress
    const completedCount = windowsState.filter(s => s.status === 'completed').length;
    const skippedCount = windowsState.filter(s => s.status === 'skipped').length;
    const activeCount = windowsState.filter(s => s.status === 'active').length;
    const doneCount = completedCount + skippedCount;  // Both count as done
    const totalCount = localWindows.length;
    const progressPercent = totalCount > 0 ? (doneCount / totalCount) * 100 : 0;

    // Current time string
    const timeString = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}`;

    return (
        <>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                            📅 {program.name}
                            <span className="text-xs px-2 py-1 rounded-full bg-purple-500/10 text-purple-600 font-medium">
                                Advanced
                            </span>
                            <span className={cn(
                                "text-xs px-2 py-1 rounded-full font-medium",
                                program.status === 'running' ? "bg-green-500/10 text-green-600" :
                                    program.status === 'paused' ? "bg-yellow-500/10 text-yellow-600" :
                                        program.status === 'scheduled' ? "bg-blue-500/10 text-blue-600" :
                                            "bg-gray-500/10 text-gray-600"
                            )}>
                                {program.status === 'running' ? '▶️ Running' :
                                    program.status === 'paused' ? '⏸️ Paused' :
                                        program.status === 'scheduled' ? '⏰ Scheduled' :
                                            program.status}
                            </span>
                        </h2>
                        <p className="text-muted-foreground flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Текущо време: {timeString}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {/* Delayed Start / Start Program buttons */}
                        {['ready', 'stopped', 'completed', 'scheduled'].includes(program?.status) && (
                            <>
                                <Popover open={isDelayedStartOpen} onOpenChange={setIsDelayedStartOpen}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" className="gap-2 min-w-[140px]">
                                            <Clock className="h-4 w-4" />
                                            {program?.status === 'scheduled' && timeRemaining ? (
                                                <span>Starts in {timeRemaining}</span>
                                            ) : (
                                                <span>Delayed Start</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <div className="p-4 space-y-4">
                                            <div className="space-y-2">
                                                <h4 className="font-medium leading-none">Schedule Start</h4>
                                                <p className="text-sm text-muted-foreground">
                                                    Pick a date and time to start the program.
                                                </p>
                                            </div>
                                            <div className="grid gap-2">
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="flex flex-col gap-1">
                                                        <Label className="text-xs">Date (DD.MM.YYYY)</Label>
                                                        <Input
                                                            type="text"
                                                            placeholder="DD.MM.YYYY"
                                                            value={dateInput}
                                                            onChange={(e) => setDateInput(e.target.value)}
                                                            className={!isValid(parse(dateInput, 'dd.MM.yyyy', new Date())) && dateInput ? "border-red-500" : ""}
                                                        />
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <Label className="text-xs">Time (24h)</Label>
                                                        <TimePicker24
                                                            value={timeInput}
                                                            onChange={setTimeInput}
                                                        />
                                                    </div>
                                                </div>
                                                <Button onClick={handleDelayedStart}>
                                                    {program?.status === 'scheduled' ? 'Reschedule' : 'Schedule'}
                                                </Button>
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                                <Button
                                    onClick={handleResume}
                                    disabled={processing}
                                    className="gap-2 bg-green-600 hover:bg-green-700"
                                >
                                    <Play className="h-4 w-4" />
                                    Start Program
                                </Button>
                            </>
                        )}

                        {/* Running controls */}
                        {program.status === 'running' && (
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={handlePause}
                                disabled={processing}
                                title="Pause"
                            >
                                <Pause className="h-4 w-4" />
                            </Button>
                        )}

                        {/* Paused controls */}
                        {program.status === 'paused' && (
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={handleResume}
                                disabled={processing}
                                title="Resume"
                            >
                                <Play className="h-4 w-4" />
                            </Button>
                        )}

                        {/* Stop button - always visible when running/paused */}
                        {['running', 'paused'].includes(program.status) && (
                            <Button
                                variant="destructive"
                                size="icon"
                                onClick={handleStop}
                                disabled={processing}
                                title="Stop"
                            >
                                <Square className="h-4 w-4" />
                            </Button>
                        )}

                        {/* Remove button with dialog */}
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="ghost" size="icon" title="Remove">
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Remove Active Program?</DialogTitle>
                                    <DialogDescription>
                                        This will unload the current program. This action cannot be undone.
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                    <DialogTrigger asChild>
                                        <Button variant="outline">Cancel</Button>
                                    </DialogTrigger>
                                    <Button variant="destructive" onClick={handleUnload}>Remove</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        <Button variant="ghost" size="icon" onClick={onUpdate} title="Refresh">
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Progress Card */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Прогрес</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span>{doneCount} от {totalCount} прозорци завършени</span>
                                <span>{Math.round(progressPercent)}%</span>
                            </div>
                            <Progress value={progressPercent} className="h-2" />
                            <div className="flex gap-4 text-sm flex-wrap">
                                <span className="flex items-center gap-1 text-green-600">
                                    <div className="w-2 h-2 rounded-full bg-green-500" />
                                    {activeCount} активни
                                </span>
                                <span className="flex items-center gap-1 text-blue-600">
                                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                                    {completedCount} завършени
                                </span>
                                {skippedCount > 0 && (
                                    <span className="flex items-center gap-1 text-purple-500">
                                        <div className="w-2 h-2 rounded-full bg-purple-500" />
                                        {skippedCount} пропуснати
                                    </span>
                                )}
                                <span className="flex items-center gap-1 text-gray-500">
                                    <div className="w-2 h-2 rounded-full bg-gray-400" />
                                    {totalCount - doneCount - activeCount} чакащи
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Windows Status */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Времеви прозорци</CardTitle>
                        <CardDescription>
                            Live статус на изпълнението
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {localWindows.map((window: any) => {
                            const state = getWindowState(window.id);
                            const isExpanded = expandedWindows.has(window.id);
                            const triggers = window.triggers || [];
                            const executedTriggers = state?.triggersExecuted || [];

                            return (
                                <div
                                    key={window.id}
                                    className={cn(
                                        "border rounded-lg overflow-hidden transition-all border-l-4",
                                        getBorderColor(state?.status || 'pending'),
                                        state?.status === 'active' && "shadow-sm shadow-green-500/20"
                                    )}
                                >
                                    {/* Window Header */}
                                    <div
                                        className={cn(
                                            "flex items-center justify-between p-4 cursor-pointer transition-colors",
                                            state?.status === 'active' ? "bg-green-500/5" : "hover:bg-muted/50"
                                        )}
                                        onClick={() => toggleExpand(window.id)}
                                    >
                                        <div className="flex items-center gap-3">
                                            {isExpanded ? (
                                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                            ) : (
                                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                            )}

                                            <div className="flex items-center gap-2">
                                                {getTimeIcon(window.startTime)}
                                                <span className="font-mono text-sm">
                                                    {window.startTime} - {window.endTime}
                                                </span>
                                            </div>

                                            <span className="font-medium">{window.name}</span>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {/* Executed triggers count */}
                                            <span className="text-xs bg-muted px-2 py-1 rounded">
                                                <Zap className="h-3 w-3 inline mr-1" />
                                                {executedTriggers.length}/{triggers.length}
                                            </span>

                                            {/* Last check */}
                                            {state?.lastCheck && (
                                                <span className="text-xs text-muted-foreground">
                                                    <Timer className="h-3 w-3 inline mr-1" />
                                                    {new Date(state.lastCheck).toLocaleTimeString('bg-BG', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            )}

                                            {/* Status badge */}
                                            <span className={cn(
                                                "text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1",
                                                getStatusColor(state?.status || 'pending')
                                            )}>
                                                {getStatusIcon(state?.status || 'pending')}
                                                {state?.status === 'active' ? 'Активен' :
                                                    state?.status === 'completed' ? 'Завършен' :
                                                        state?.status === 'skipped' ? 'Пропуснат' :
                                                            'Чакащ'}
                                            </span>

                                            {/* Edit button - only when window is not active */}
                                            {isWindowEditable(window) && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7"
                                                    onClick={(e) => handleEditWindow(window as ITimeWindow, e)}
                                                    title="Редактирай прозорец"
                                                >
                                                    <Pencil className="h-3 w-3" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Expanded Content */}
                                    {isExpanded && (
                                        <div className="border-t bg-muted/20 p-4 space-y-3">
                                            {triggers.length === 0 ? (
                                                <div className="text-sm text-muted-foreground text-center py-2">
                                                    Няма тригери в този прозорец
                                                </div>
                                            ) : (
                                                triggers.map((trigger: any, triggerIndex: number) => {
                                                    const isExecuted = executedTriggers.includes(trigger.id);
                                                    const isEditing = editingTriggerId === trigger.id && editingWindowId === window.id;
                                                    const canEdit = isWindowEditable(window) && !isExecuted;

                                                    return (
                                                        <div
                                                            key={trigger.id}
                                                            className={cn(
                                                                "flex items-center justify-between p-3 rounded-md border-l-4 transition-all",
                                                                isExecuted
                                                                    ? "border-l-green-500 bg-green-500/10 opacity-70"
                                                                    : trigger.behavior === 'break'
                                                                        ? "border-l-red-500 bg-red-500/5"
                                                                        : "border-l-orange-500 bg-orange-500/5"
                                                            )}
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                {isExecuted ? (
                                                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                                ) : (
                                                                    <Circle className="h-4 w-4 text-muted-foreground" />
                                                                )}
                                                                <span className="text-xs text-muted-foreground">
                                                                    #{triggerIndex + 1}
                                                                </span>
                                                                <Activity className="h-3.5 w-3.5 text-cyan-500" />
                                                                <span className={cn("font-medium", isExecuted && "line-through")}>
                                                                    {getSensorName(trigger.sensorId)}
                                                                </span>

                                                                {/* Value display or edit mode */}
                                                                {isEditing ? (
                                                                    <div className="flex items-center gap-1">
                                                                        <span className="font-mono text-sm">
                                                                            {formatOperator(trigger.operator)}
                                                                        </span>
                                                                        <Input
                                                                            type="number"
                                                                            value={editingTriggerValue}
                                                                            onChange={(e) => setEditingTriggerValue(e.target.value)}
                                                                            className="w-20 h-7 text-sm"
                                                                            autoFocus
                                                                        />
                                                                        {trigger.operator === 'between' && (
                                                                            <>
                                                                                <span className="text-sm">-</span>
                                                                                <Input
                                                                                    type="number"
                                                                                    value={editingTriggerValueMax}
                                                                                    onChange={(e) => setEditingTriggerValueMax(e.target.value)}
                                                                                    className="w-20 h-7 text-sm"
                                                                                />
                                                                            </>
                                                                        )}
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            className="h-7 px-2"
                                                                            onClick={saveTriggerEdit}
                                                                            disabled={processing}
                                                                        >
                                                                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                                        </Button>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            className="h-7 px-2"
                                                                            onClick={cancelTriggerEdit}
                                                                        >
                                                                            ✕
                                                                        </Button>
                                                                    </div>
                                                                ) : (
                                                                    <span
                                                                        className={cn(
                                                                            "font-mono text-sm",
                                                                            canEdit && "cursor-pointer hover:bg-muted/50 px-1 rounded"
                                                                        )}
                                                                        onClick={(e) => canEdit && startTriggerEdit(window.id, trigger, e)}
                                                                        title={canEdit ? "Кликнете за редакция" : undefined}
                                                                    >
                                                                        {formatOperator(trigger.operator)} {trigger.value}
                                                                        {trigger.operator === 'between' && ` - ${trigger.valueMax}`}
                                                                    </span>
                                                                )}

                                                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                                                <Zap className="h-3.5 w-3.5 text-yellow-500" />
                                                                <span className="text-sm text-primary font-medium">
                                                                    {trigger.flowIds && trigger.flowIds.length > 0
                                                                        ? trigger.flowIds.map((fid: string) => getFlowName(fid)).join(' + ')
                                                                        : getFlowName(trigger.flowId)
                                                                    }
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {isExecuted && (
                                                                    <span className="text-xs text-green-600 font-medium">
                                                                        ✓ Изпълнен
                                                                    </span>
                                                                )}
                                                                {/* Edit button for non-executed triggers in editable windows */}
                                                                {canEdit && !isEditing && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-6 w-6"
                                                                        onClick={(e) => startTriggerEdit(window.id, trigger, e)}
                                                                        title="Редактирай стойност"
                                                                    >
                                                                        <Pencil className="h-3 w-3" />
                                                                    </Button>
                                                                )}
                                                                <span className={cn(
                                                                    "text-xs px-2 py-1 rounded-full font-medium",
                                                                    trigger.behavior === 'break'
                                                                        ? "bg-red-500/10 text-red-600"
                                                                        : "bg-orange-500/10 text-orange-600"
                                                                )}>
                                                                    {trigger.behavior === 'break' ? '🛑 Break' : '⏭️ Continue'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}

                                            {/* Fallback Info */}
                                            {(window.fallbackFlowIds?.length || window.fallbackFlowId) && (
                                                <div className={cn(
                                                    "mt-3 p-3 border rounded-md",
                                                    state?.status === 'completed' && !triggers.some((t: any) =>
                                                        t.behavior === 'break' && executedTriggers.includes(t.id)
                                                    )
                                                        ? "bg-amber-500/20 border-amber-500"
                                                        : "bg-amber-500/10 border-amber-500/20"
                                                )}>
                                                    <span className="text-amber-600 font-medium">
                                                        ⚡ Fallback: {
                                                            window.fallbackFlowIds && window.fallbackFlowIds.length > 0
                                                                ? window.fallbackFlowIds.map((fid: string) => getFlowName(fid)).join(' + ')
                                                                : getFlowName(window.fallbackFlowId)
                                                        }
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>

                {/* Live Execution Log */}
                <AdvancedExecutionLog programId={program.sourceProgramId} />
            </div>

            {/* TimeWindowModal for editing */}
            <TimeWindowModal
                open={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setEditingWindow(null);
                }}
                onSave={handleWindowSave}
                window={editingWindow}
                flows={flows.map(f => ({ id: f.id || f._id, name: f.name }))}
                existingWindows={localWindows}
            />
        </>
    );
};
