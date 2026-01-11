import { useState, useEffect } from 'react';
import { format, differenceInMinutes, parse, isValid } from 'date-fns';
import type { IActiveProgram, IVariable, IContext } from '../../types/ActiveProgram';
import { activeProgramService } from '../../services/activeProgramService';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import {
    Play, Pause, Square, Clock, Zap, CheckCircle2,
    Circle, Timer, ChevronDown, ChevronRight,
    Sun, Sunrise, Moon, RefreshCw, Trash2, ArrowRight, Pencil, Activity, CalendarClock, Settings2
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Progress } from '../ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '../ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { TimePicker24 } from '../ui/time-picker-24';
import { TimeWindowModal } from '../programs/TimeWindowModal';
import { TriggerModal } from '../programs/TriggerModal';
import type { ITimeWindow, ITrigger } from '../programs/types';
import { AdvancedExecutionLog } from './AdvancedExecutionLog';
import { VariableConfigModal } from './VariableConfigModal';
import { NextCheckTimer } from './NextCheckTimer';

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
    skipUntil?: Date;
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

    // Variable Config State
    const [configWindowId, setConfigWindowId] = useState<string | null>(null);
    const [draftContexts, setDraftContexts] = useState<IContext[] | null>(null);
    const [windowVariables, setWindowVariables] = useState<Record<string, IContext[]>>({});

    // Fetch variables on mount and when windows structure changes
    // Use JSON.stringify for deep comparison to avoid refetching on reference changes
    const windowsParams = program.type === 'ADVANCED' ? JSON.stringify((program as any).windows) : null;
    useEffect(() => {
        activeProgramService.getVariables()
            .then(vars => setWindowVariables(vars || {}))
            .catch(err => console.error('Failed to load variables', err));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [windowsParams]);
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

    // Trigger full edit state
    const [editingFullTrigger, setEditingFullTrigger] = useState<ITrigger | null>(null);
    const [isTriggerModalOpen, setIsTriggerModalOpen] = useState(false);
    const [editingTriggerWindowId, setEditingTriggerWindowId] = useState<string | null>(null);


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

    // Check if window is editable (Not Active AND Current Time NOT in window)
    const isWindowEditable = (window: ITimeWindow) => {
        const state = getWindowState(window.id);
        if (!state) return true;

        // 1. Status Check
        if (state.status === 'active') return false;

        // 2. Time Check
        // If program is scheduled/running, we must check if "Now" is potentially inside this window
        // to prevent editing 1 second before start.
        if (program.status === 'running' || program.status === 'scheduled') {
            const now = new Date();
            const [startH, startM] = window.startTime.split(':').map(Number);
            const [endH, endM] = window.endTime.split(':').map(Number);

            const start = new Date(now);
            start.setHours(startH, startM, 0, 0);

            const end = new Date(now);
            end.setHours(endH, endM, 0, 0);

            // Handle overnight windows
            if (end < start) end.setDate(end.getDate() + 1);

            // If we are IN the window (or very close, e.g. < 1 min?), disable edit
            // Simple check: start <= now <= end
            // Actually, if we are in the window, status *should* be active, but might be pending if
            // scheduler hasn't ticked yet or just finished a cycle.
            // Safer to disable if we are strictly inside the time range.
            if (now >= start && now <= end) return false;
        }

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

    // Open Trigger Edit Modal
    const handleEditTrigger = (windowId: string, trigger: ITrigger, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingTriggerWindowId(windowId);
        setEditingFullTrigger(trigger);
        setIsTriggerModalOpen(true);
    };

    // Save Trigger Update
    const handleSaveTrigger = async (updatedTrigger: ITrigger) => {
        if (!editingTriggerWindowId) return;

        // 1. Get current window
        const currentWindow = localWindows.find(w => w.id === editingTriggerWindowId);
        if (!currentWindow) return;

        // 2. Project the window state with the updated trigger
        // Clone window and triggers array
        const tempWindow = { ...currentWindow };
        const tempTriggers = [...(tempWindow.triggers || [])];

        // Find and replace the trigger
        const idx = tempTriggers.findIndex(t => t.id === updatedTrigger.id);
        if (idx >= 0) {
            tempTriggers[idx] = updatedTrigger;
        } else {
            // Should typically not happen here as we are editing an existing trigger
            // But if it were a new trigger being added via this flow:
            tempTriggers.push(updatedTrigger);
        }
        tempWindow.triggers = tempTriggers;

        // 3. VALIDATION: Check for missing variables
        const projectedContexts = getRequiredContexts(tempWindow);
        if (hasMissingVariables(projectedContexts, tempWindow.id)) {
            // Open Configuration Modal
            setDraftContexts(projectedContexts);
            setConfigWindowId(tempWindow.id);
            toast.warning('Configure variables for new flows before saving.');
            return false; // STOP SAVE (Signal to TriggerModal to keep open)
        }

        try {
            setProcessing(true);
            await activeProgramService.updateTrigger(editingTriggerWindowId, updatedTrigger);
            toast.success('Тригерът е обновен успешно');
            onUpdate(); // Refetch
        } catch (error: any) {
            console.error('Failed to update trigger:', error);
            toast.error('Грешка при обновяване на тригера');
        } finally {
            setProcessing(false);
            setIsTriggerModalOpen(false);
            setEditingFullTrigger(null);
            setEditingTriggerWindowId(null);
        }
    };

    // Helper: Get required contexts from a window (projected)
    const getRequiredContexts = (window: ITimeWindow): IContext[] => {
        const contexts: IContext[] = [];

        // Helper to add context
        const addCtx = (flowId: string, contextId: string, labelPrefix: string, description?: string) => {
            // Find flow in the loaded flows list
            // Note: flows contains { id, name, ... }. We assume it also has variables from the fetch.
            // If the fetch in useEffect doesn't return variables, this will fail.
            // We'll rely on the standard /flows endpoint returning full objects.
            const flow = flows.find(f => f.id === flowId || f._id === flowId);
            if (flow && flow.variables) {
                const vars = flow.variables
                    .filter((v: any) => v.scope === 'global')
                    .map((v: any) => ({
                        name: v.name,
                        type: v.type,
                        default: v.value,
                        unit: v.unit,
                        hasTolerance: v.hasTolerance, // Ensure schema has this
                        description: v.description,
                        flowId: flowId,
                        flowName: flow.name
                    })) as IVariable[];

                if (vars.length > 0) {
                    contexts.push({
                        contextId,
                        label: `${labelPrefix}: ${flow.name}`,
                        description,
                        variables: vars
                    });
                }
            }
        };

        // 1. Triggers
        window.triggers?.forEach((t, tIdx) => {
            const tName = `Trigger ${tIdx + 1}`;
            t.flowIds?.forEach((fid, fIdx) => {
                // Pass trigger description to the first flow of the trigger context, or all? 
                // The UI groups by "Trigger 1", so passing it to each flow context is duplicate but safe if UI handles it.
                // Better: The UI groups by label prefix. 
                addCtx(fid, `t_${tIdx}_f_${fIdx}`, tName, t.description);
            });
            // Legacy support if needed? No, assuming new format for edits.
        });

        // 2. Fallbacks
        window.fallbackFlowIds?.forEach((fid, fIdx) => {
            addCtx(fid, `fb_${fIdx}`, `Fallback`, window.description);
        });

        return contexts;
    };

    // Helper: Check for missing variables
    const hasMissingVariables = (contexts: IContext[], winId: string) => {
        const overrides = (program as any).windowOverrides?.[winId] || {};

        for (const ctx of contexts) {
            const ctxOverrides = overrides[ctx.contextId] || {};
            for (const v of ctx.variables) {
                const val = ctxOverrides[v.name];
                if (val === undefined || val === '') return true;
                if (v.hasTolerance) {
                    const tol = ctxOverrides[v.name + '_tolerance'];
                    if (tol === undefined || tol === '') return true;
                }
            }
        }
        return false;
    };

    // Save edited window with auto-overlap adjustment
    const handleWindowSave = async (updatedWindow: ITimeWindow, autoShift: boolean = false) => {
        try {
            // VALIDATION: Check for missing variables
            const projectedContexts = getRequiredContexts(updatedWindow);
            if (hasMissingVariables(projectedContexts, updatedWindow.id)) {
                // Open Configuration Modal
                setDraftContexts(projectedContexts);
                setConfigWindowId(updatedWindow.id);
                toast.warning('Configure variables for new flows before saving.');
                return false; // STOP SAVE (Signal to TimeWindowModal to keep open)
            }

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

                                        {/* Next Check Timer */}
                                        <NextCheckTimer
                                            lastCheck={state?.lastCheck}
                                            checkInterval={window.checkInterval}
                                            status={state?.status}
                                            programStatus={program.status}
                                            onRefresh={onUpdate}
                                        />

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
                                                        state?.status === 'skipped' ? (
                                                            state?.skipUntil ?
                                                                `Пропуснат (до ${new Date(state.skipUntil).toLocaleDateString('bg-BG', { day: '2-digit', month: '2-digit' })})`
                                                                : 'Пропуснат'
                                                        ) :
                                                            'Чакащ'}
                                            </span>

                                            {/* SKIP BUTTON */}
                                            {/* Show SKIP if Pending (and not skipped) OR Active (Force Skip) */}
                                            {(state?.status === 'pending' || state?.status === 'active') && (
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                                            onClick={(e) => e.stopPropagation()}
                                                            title="Пропусни (Skip)"
                                                        >
                                                            <CalendarClock className="h-4 w-4" />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-60" onClick={(e) => e.stopPropagation()}>
                                                        <div className="space-y-3">
                                                            <h4 className="font-medium text-sm">Пропусни прозорец</h4>
                                                            <div className="flex items-center gap-2">
                                                                <Input
                                                                    type="number"
                                                                    min="1"
                                                                    defaultValue="1"
                                                                    className="h-8"
                                                                    id={`skip-input-${window.id}`}
                                                                />
                                                                <span className="text-sm text-muted-foreground">дни</span>
                                                            </div>
                                                            <Button size="sm" className="w-full" onClick={async () => {
                                                                const input = document.getElementById(`skip-input-${window.id}`) as HTMLInputElement;
                                                                const days = parseInt(input.value) || 1;

                                                                // Calculate date: Now + Days (at 00:00 of target day?) 
                                                                // Logic agreed: "2 days" = Skip Today + Skip Tomorrow (Expiring at 00:00 after tomorrow)
                                                                // "1 day" = Skip Today (Expiring at 00:00 tomorrow)
                                                                // So we add 'days' to today, and set time to 00:00:00?
                                                                // Wait, if I add 1 day to today (3rd), result is 4th. 
                                                                // If I set to 4th 00:00:00.
                                                                // Any check on 3rd will be < 4th. Skipped.
                                                                // Any check on 4th (00:01) will be > 4th. Not skipped. Correct.

                                                                const targetDate = new Date();
                                                                targetDate.setDate(targetDate.getDate() + days);
                                                                targetDate.setHours(0, 0, 0, 0);

                                                                try {
                                                                    await activeProgramService.skipWindow(window.id, targetDate);
                                                                    toast.success(`Прозорецът е пропуснат за ${days} дни`);
                                                                    onUpdate();
                                                                } catch (e) {
                                                                    toast.error('Грешка при пропускане');
                                                                }
                                                            }}>
                                                                Пропусни
                                                            </Button>
                                                        </div>
                                                    </PopoverContent>
                                                </Popover>
                                            )}

                                            {/* RESTORE BUTTON */}
                                            {state?.status === 'skipped' && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        try {
                                                            await activeProgramService.restoreWindow(window.id);
                                                            toast.success('Прозорецът е възстановен');
                                                            onUpdate();
                                                        } catch (err) {
                                                            toast.error('Грешка при възстановяване');
                                                        }
                                                    }}
                                                    title="Възстанови (Restore)"
                                                >
                                                    <RefreshCw className="h-4 w-4" />
                                                </Button>
                                            )}



                                            {/* Config Variables Button */}
                                            {isWindowEditable(window) && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setConfigWindowId(window.id);
                                                    }}
                                                    title="Configure Variables"
                                                >
                                                    <Settings2 className="h-3.5 w-3.5" />
                                                </Button>
                                            )}

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

                                                                {/* Display Trigger Condition */}
                                                                <span
                                                                    className={cn(
                                                                        "font-mono text-sm",
                                                                        canEdit && "cursor-pointer hover:bg-muted/50 px-1 rounded"
                                                                    )}
                                                                    onClick={(e) => canEdit && handleEditTrigger(window.id, trigger, e)}
                                                                    title={canEdit ? "Кликнете за пълна редакция" : undefined}
                                                                >
                                                                    {formatOperator(trigger.operator)} {trigger.value}
                                                                    {trigger.operator === 'between' && ` - ${trigger.valueMax}`}
                                                                </span>

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
                                                                {/* Full Edit Button */}
                                                                {canEdit && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-6 w-6"
                                                                        onClick={(e) => handleEditTrigger(window.id, trigger, e)}
                                                                        title="Пълна редакция"
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

            {/* Full Trigger Edit Modal */}
            <TriggerModal
                open={isTriggerModalOpen}
                onClose={() => setIsTriggerModalOpen(false)}
                onSave={handleSaveTrigger}
                trigger={editingFullTrigger}
                sensors={sensors}
                flows={flows}
            />

            {/* Variable Config Modal */}
            <VariableConfigModal
                isOpen={!!configWindowId}
                onClose={() => {
                    setConfigWindowId(null);
                    setDraftContexts(null);
                }}
                windowId={configWindowId}
                windowName={configWindowId ? (localWindows.find((w: any) => w.id === configWindowId)?.name || '') : ''}
                contexts={draftContexts || (configWindowId ? windowVariables[configWindowId] || [] : [])}
                initialOverrides={configWindowId ? ((program as any).windowOverrides?.[configWindowId] || {}) : {}}
                onSave={async (winId, newOverrides) => {
                    const currentOverrides = (program as any).windowOverrides || {};
                    const updatedOverrides = {
                        ...currentOverrides,
                        [winId]: newOverrides
                    };

                    try {
                        await activeProgramService.update({ windowOverrides: updatedOverrides } as any);
                        toast.success('Variables saved');
                        onUpdate();
                    } catch (e) {
                        console.error(e);
                        toast.error('Failed to save variables');
                    }
                }}
            />

        </>
    );
};
