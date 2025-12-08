import { useState, useEffect } from 'react';
import { format, differenceInMinutes, parse, isValid } from 'date-fns';
import type { IActiveProgram, IActiveScheduleItem } from '../../types/ActiveProgram';
import { activeProgramService } from '../../services/activeProgramService';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { Play, Pause, Square, Edit, Trash2, Plus, Minus, ChevronUp, ChevronDown, CalendarX, RotateCcw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '../ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { TimePicker24 } from '../ui/time-picker-24';
import { Clock, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { LiveExecutionMonitor } from './LiveExecutionMonitor';

interface ActiveProgramManagerProps {
    program: IActiveProgram;
    onUpdate: () => void;
}

export const ActiveProgramManager = ({ program, onUpdate }: ActiveProgramManagerProps) => {
    const [editingItem, setEditingItem] = useState<IActiveScheduleItem | null>(null);
    const [editTime, setEditTime] = useState('');
    const [editOverrides, setEditOverrides] = useState<Record<string, any>>({});
    const [cycleVariables, setCycleVariables] = useState<Record<string, any[]>>({});

    useEffect(() => {
        const loadVars = async () => {
            try {
                const varsMap = await activeProgramService.getVariables();
                setCycleVariables(varsMap);
            } catch (error) {
                console.error('Failed to load variables', error);
            }
        };
        loadVars();
    }, []);

    const [minInterval, setMinInterval] = useState(program.minCycleInterval || 0);

    // Sync local state when program updates
    useEffect(() => {
        setMinInterval(program.minCycleInterval || 0);
    }, [program.minCycleInterval]);

    const handleMinIntervalChange = async (val: number) => {
        setMinInterval(val);
        try {
            await activeProgramService.update({ minCycleInterval: val });
            onUpdate();
        } catch (error) {
            toast.error('Failed to update min interval');
        }
    };

    const getConflicts = (currentSchedule: IActiveScheduleItem[], interval: number) => {
        if (interval <= 0) return new Set<number>();

        const conflicts = new Set<number>();
        const sortedIndices = currentSchedule
            .map((_, index) => index)
            .sort((a, b) => currentSchedule[a].time.localeCompare(currentSchedule[b].time));

        for (let i = 0; i < sortedIndices.length - 1; i++) {
            const idx1 = sortedIndices[i];
            const idx2 = sortedIndices[i + 1];

            const t1 = new Date(`1970-01-01T${currentSchedule[idx1].time}`);
            const t2 = new Date(`1970-01-01T${currentSchedule[idx2].time}`);
            const diffMinutes = (t2.getTime() - t1.getTime()) / 60000;

            if (diffMinutes < interval) {
                conflicts.add(idx2);
            }
        }
        return conflicts;
    };

    const conflicts = getConflicts(program.schedule, minInterval);

    const handleAutoFix = async () => {
        const sortedIndices = program.schedule
            .map((_, index) => index)
            .sort((a, b) => program.schedule[a].time.localeCompare(program.schedule[b].time));

        const newSchedule = [...program.schedule];

        for (let i = 0; i < sortedIndices.length - 1; i++) {
            const idx1 = sortedIndices[i];
            const idx2 = sortedIndices[i + 1];

            const t1 = new Date(`1970-01-01T${newSchedule[idx1].time}`);
            const t2 = new Date(`1970-01-01T${newSchedule[idx2].time}`);
            const diffMinutes = (t2.getTime() - t1.getTime()) / 60000;

            if (diffMinutes < minInterval) {
                const newTime = new Date(t1.getTime() + minInterval * 60000);
                const hours = newTime.getHours().toString().padStart(2, '0');
                const minutes = newTime.getMinutes().toString().padStart(2, '0');

                // We need to update the item in the newSchedule array
                // Since newSchedule is a shallow copy, we should clone the object we are modifying
                newSchedule[idx2] = {
                    ...newSchedule[idx2],
                    time: `${hours}:${minutes}`
                };
            }
        }

        try {
            await activeProgramService.update({ schedule: newSchedule });
            toast.success('Schedule auto-corrected');
            onUpdate();
        } catch (error) {
            toast.error('Failed to auto-fix schedule');
        }
    };

    const handleStop = async () => {
        try {
            await activeProgramService.stop();
            toast.success('Program stopped');
            onUpdate();
        } catch (error) {
            toast.error('Failed to stop program');
        }
    };

    const handlePause = async () => {
        try {
            await activeProgramService.pause();
            toast.success('Program paused');
            onUpdate();
        } catch (error) {
            toast.error('Failed to pause program');
        }
    };

    const handleResume = async () => {
        try {
            await activeProgramService.start();
            toast.success('Program resumed');
            onUpdate();
        } catch (error) {
            toast.error('Failed to resume program');
        }
    };

    const handleSaveEdit = async () => {
        if (!editingItem) return;
        try {
            await activeProgramService.updateScheduleItem(editingItem._id, {
                time: editTime,
                overrides: editOverrides
            });
            toast.success('Schedule updated');
            setEditingItem(null);
            onUpdate();
        } catch (error) {
            toast.error('Failed to update schedule');
        }
    };

    const handleMoveUp = async (index: number) => {
        if (index <= 0) return;
        const currentItem = program.schedule[index];
        const prevItem = program.schedule[index - 1];
        try {
            await activeProgramService.swapCycles(currentItem._id, prevItem._id);
            onUpdate();
        } catch (error) {
            toast.error('Failed to move cycle up');
        }
    };

    const handleMoveDown = async (index: number) => {
        if (index >= program.schedule.length - 1) return;
        const currentItem = program.schedule[index];
        const nextItem = program.schedule[index + 1];
        try {
            await activeProgramService.swapCycles(currentItem._id, nextItem._id);
            onUpdate();
        } catch (error) {
            toast.error('Failed to move cycle down');
        }
    };

    const [skipDays, setSkipDays] = useState(1);
    const [delayedStartTime, setDelayedStartTime] = useState<Date | null>(null);
    const [dateInput, setDateInput] = useState('');
    const [timeInput, setTimeInput] = useState('00:00');
    const [isDelayedStartOpen, setIsDelayedStartOpen] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState<string>('');

    // Initialize delayedStartTime from program
    useEffect(() => {
        if (program?.status === 'scheduled' && program.startTime) {
            const start = new Date(program.startTime);
            setDelayedStartTime(start);
            setDateInput(format(start, 'dd.MM.yyyy'));
            setTimeInput(format(start, 'HH:mm'));
        } else {
            // Default to tomorrow same time if not scheduled
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            setDateInput(format(tomorrow, 'dd.MM.yyyy'));
            setTimeInput(format(tomorrow, 'HH:mm'));
        }
    }, [program]);

    // Update delayedStartTime when inputs change
    useEffect(() => {
        if (!dateInput || !timeInput) {
            setDelayedStartTime(null);
            return;
        }

        const parsedDate = parse(dateInput, 'dd.MM.yyyy', new Date());
        if (isValid(parsedDate)) {
            const [hours, minutes] = timeInput.split(':').map(Number);
            parsedDate.setHours(hours, minutes, 0, 0);
            setDelayedStartTime(parsedDate);
        } else {
            setDelayedStartTime(null);
        }
    }, [dateInput, timeInput]);

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
        const interval = setInterval(updateTimer, 60000); // Update every minute
        return () => clearInterval(interval);
    }, [program]);

    const handleDelayedStart = async () => {
        if (!delayedStartTime) return;
        try {
            await activeProgramService.start(delayedStartTime);
            toast.success(`Program scheduled for ${format(delayedStartTime, 'dd.MM.yyyy HH:mm')}`);
            setIsDelayedStartOpen(false);
            onUpdate();
        } catch (error) {
            toast.error('Failed to schedule program');
        }
    };

    const handleSkipConfirm = async (itemId: string) => {
        try {
            const untilDate = new Date();
            untilDate.setDate(untilDate.getDate() + skipDays);
            await activeProgramService.skipCycle(itemId, 'until', untilDate);
            toast.success(`Cycle skipped for ${skipDays} days`);
            onUpdate();
        } catch (error) {
            toast.error('Failed to skip cycle');
        }
    };

    const handleRestore = async (itemId: string) => {
        try {
            await activeProgramService.restoreCycle(itemId);
            toast.success('Cycle restored');
            onUpdate();
        } catch (error) {
            toast.error('Failed to restore cycle');
        }
    };

    const renderVariableEditor = () => {
        if (!editingItem) return null;
        const vars = cycleVariables[editingItem.cycleId] || [];
        if (vars.length === 0) return null;

        // Group by Flow Name
        const varsByFlow: Record<string, typeof vars> = {};
        vars.forEach(v => {
            const flow = v.flowName || 'Global Variables';
            if (!varsByFlow[flow]) varsByFlow[flow] = [];
            varsByFlow[flow].push(v);
        });

        return (
            <div className="space-y-4 border-t pt-4 mt-4">
                <h4 className="font-medium text-sm text-muted-foreground">Cycle Variables</h4>
                <div className="grid gap-6">
                    {Object.entries(varsByFlow).map(([flowName, flowVars]) => (
                        <div key={flowName} className="space-y-3">
                            <h5 className="text-xs font-semibold text-primary/80 uppercase tracking-wider border-b pb-1">
                                {flowName}
                            </h5>
                            <div className="grid gap-3 pl-2">
                                {flowVars.map(variable => (
                                    <div key={variable.name} className="grid gap-2">
                                        <Label htmlFor={`edit-var-${variable.name}`}>{variable.name}</Label>
                                        {variable.type === 'boolean' ? (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    id={`edit-var-${variable.name}`}
                                                    checked={!!editOverrides[variable.name]}
                                                    onChange={(e) => setEditOverrides(prev => ({ ...prev, [variable.name]: e.target.checked }))}
                                                    className="h-4 w-4"
                                                />
                                                <span className="text-sm text-muted-foreground">{variable.name}</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 min-w-0">
                                                    <Input
                                                        id={`edit-var-${variable.name}`}
                                                        type={variable.type === 'number' ? 'number' : 'text'}
                                                        value={editOverrides[variable.name] ?? ''}
                                                        onChange={(e) => setEditOverrides(prev => ({
                                                            ...prev,
                                                            [variable.name]: variable.type === 'number' ? Number(e.target.value) : e.target.value
                                                        }))}
                                                        placeholder={variable.default !== undefined ? `Default: ${variable.default}` : ''}
                                                    />
                                                </div>
                                                {variable.unit && (
                                                    <span className="text-sm text-muted-foreground whitespace-nowrap min-w-[3ch]">
                                                        {variable.unit}
                                                    </span>
                                                )}
                                                {variable.hasTolerance && (
                                                    <>
                                                        <div className="w-[1px] h-8 bg-border mx-1" />
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-muted-foreground text-sm">±</span>
                                                            <Input
                                                                type="number"
                                                                min={0}
                                                                className="w-20"
                                                                value={editOverrides[variable.name + '_tolerance'] ?? ''}
                                                                onChange={(e) => {
                                                                    const val = Number(e.target.value);
                                                                    if (val >= 0) {
                                                                        setEditOverrides(prev => ({
                                                                            ...prev,
                                                                            [variable.name + '_tolerance']: val
                                                                        }));
                                                                    }
                                                                }}
                                                                placeholder="Tol"
                                                            />
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

    const toggleExpand = (itemId: string) => {
        const newExpanded = new Set(expandedItems);
        if (newExpanded.has(itemId)) {
            newExpanded.delete(itemId);
        } else {
            newExpanded.add(itemId);
        }
        setExpandedItems(newExpanded);
    };

    const renderExpandedDetails = (item: IActiveScheduleItem) => {
        const vars = cycleVariables[item.cycleId] || [];
        if (vars.length === 0) return <div className="p-4 text-sm text-muted-foreground">No variables defined.</div>;

        // Group by Flow Name
        const varsByFlow: Record<string, typeof vars> = {};
        vars.forEach(v => {
            const flow = v.flowName || 'Global Variables';
            if (!varsByFlow[flow]) varsByFlow[flow] = [];
            varsByFlow[flow].push(v);
        });

        return (
            <div className="p-4 bg-muted/30 border-t grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(varsByFlow).map(([flowName, flowVars]) => {
                    const flowDesc = flowVars[0].flowDescription;
                    return (
                        <div key={flowName} className="space-y-2">
                            <div className="border-b pb-1 flex items-center gap-2">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-help flex items-center gap-1">
                                                {flowName}
                                                {flowDesc && <HelpCircle className="h-3 w-3 opacity-50" />}
                                            </h5>
                                        </TooltipTrigger>
                                        {flowDesc && (
                                            <TooltipContent>
                                                <p>{flowDesc}</p>
                                            </TooltipContent>
                                        )}
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                            <div className="grid gap-1">
                                {flowVars.map(variable => {
                                    const val = item.overrides?.[variable.name] ?? variable.default;
                                    return (
                                        <div key={variable.name} className="grid grid-cols-[1fr_5rem_3.5rem] gap-2 text-sm items-center">
                                            <div className="truncate">
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <span className="text-muted-foreground cursor-help border-b border-dotted border-muted-foreground/30 hover:border-muted-foreground">
                                                                {variable.name}:
                                                            </span>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p className="font-semibold mb-1">{variable.name}</p>
                                                            {variable.description && <p className="text-xs text-muted-foreground">{variable.description}</p>}
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>

                                            <div className="text-center font-medium truncate">
                                                {typeof val === 'boolean' ? (val ? 'ON' : 'OFF') : val}
                                                {variable.unit && <span className="text-xs text-muted-foreground ml-1">{variable.unit}</span>}
                                            </div>

                                            <div className="text-left text-xs text-muted-foreground truncate">
                                                {variable.hasTolerance && (
                                                    <span>
                                                        ± {item.overrides?.[variable.name + '_tolerance'] ?? 0}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const handleRetry = async (itemId: string) => {
        try {
            await activeProgramService.retryCycle(itemId);
            toast.success('Cycle retried');
            onUpdate();
        } catch (error) {
            toast.error('Failed to retry cycle');
        }
    };

    const [isStartConfirmOpen, setIsStartConfirmOpen] = useState(false);

    const handleStartRequest = () => {
        const isCycleRunning = program.schedule.some(item => item.status === 'running');
        if (isCycleRunning) {
            setIsStartConfirmOpen(true);
        } else {
            handleResume();
        }
    };

    const handleConfirmStart = async () => {
        try {
            await activeProgramService.stop(); // Stop cycle and program
            await activeProgramService.start(); // Start program immediately
            toast.success('Cycle stopped, Program started');
            setIsStartConfirmOpen(false);
            onUpdate();
        } catch (error) {
            toast.error('Failed to restart program');
        }
    };

    const handleForceStart = async (itemId: string) => {
        try {
            await activeProgramService.forceStartCycle(itemId);
            toast.success('Cycle started immediately');
            onUpdate();
        } catch (error) {
            toast.error('Failed to force start cycle');
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Active Program: {program.name}</CardTitle>
                        <div className="flex items-center gap-4 mt-2">
                            <Badge variant={program?.status === 'running' ? 'default' : 'secondary'}>
                                {(program?.status || 'UNKNOWN').toUpperCase()}
                            </Badge>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">Min Interval (m):</span>
                                <Input
                                    type="number"
                                    value={minInterval}
                                    onChange={(e) => handleMinIntervalChange(Number(e.target.value))}
                                    className="w-20 h-8"
                                />
                                {conflicts.size > 0 && (
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={handleAutoFix}
                                        className="h-8 animate-pulse"
                                    >
                                        Auto-Fix
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
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
                                <Button onClick={handleStartRequest} className="gap-2 bg-green-600 hover:bg-green-700">
                                    <Play className="h-4 w-4" />
                                    Start Program
                                </Button>
                            </>
                        )}
                        {program?.status === 'running' ? (
                            <Button variant="outline" size="icon" onClick={handlePause} title="Pause">
                                <Pause className="h-4 w-4" />
                            </Button>
                        ) : (program?.status === 'paused') && (
                            <Button variant="outline" size="icon" onClick={handleResume} title="Resume">
                                <Play className="h-4 w-4" />
                            </Button>
                        )}
                        <Button variant="destructive" size="icon" onClick={handleStop} title="Stop">
                            <Square className="h-4 w-4" />
                        </Button>

                        {/* REMOVE PROGRAM DIALOG */}
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
                                    <Button variant="destructive" onClick={async () => {
                                        try {
                                            await activeProgramService.unload();
                                            toast.success('Program removed');
                                            onUpdate();
                                        } catch (e) { toast.error('Failed to remove program'); }
                                    }}>Remove</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        {/* START CONFIRMATION DIALOG */}
                        <Dialog open={isStartConfirmOpen} onOpenChange={setIsStartConfirmOpen}>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Cycle in Progress</DialogTitle>
                                    <DialogDescription>
                                        A manual cycle is currently running. Starting the program will stop the active cycle.
                                        <br /><br />
                                        Do you want to stop the cycle and start the program?
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsStartConfirmOpen(false)}>Cancel</Button>
                                    <Button onClick={handleConfirmStart}>Stop Cycle & Start</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {(program?.schedule || []).map((item, index) => {
                            const isConflict = conflicts.has(index);
                            return (
                                <div
                                    key={item._id}
                                    className={`
                                            rounded border overflow-hidden transition-colors
                                            ${item.status === 'running' ? 'bg-green-500/10 border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.2)]' :
                                            item.status === 'completed' ? 'bg-muted opacity-60' :
                                                item.status === 'failed' ? 'bg-red-500/10 border-red-500' :
                                                    item.status === 'skipped' ? 'bg-orange-500/10 border-orange-500/50' :
                                                        'bg-card border-border hover:bg-accent/50'
                                        }
                                        ${isConflict ? 'border-red-500 border-2' : ''}
                                        `}
                                >
                                    <div className="p-3 flex items-center gap-4">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 shrink-0"
                                            onClick={() => toggleExpand(item._id)}
                                        >
                                            {expandedItems.has(item._id) ? (
                                                <Minus className="h-4 w-4" />
                                            ) : (
                                                <Plus className="h-4 w-4" />
                                            )}
                                        </Button>

                                        <div className="font-mono text-lg font-bold w-16">{item.time}</div>

                                        <div className="flex flex-col flex-1">
                                            <div className="flex items-center gap-2">
                                                <div className="font-medium text-lg leading-none">{item.name || item.cycleName || 'Event'}</div>
                                                {(item.description || item.cycleDescription) && (
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <HelpCircle className="h-4 w-4 text-muted-foreground/50 cursor-help hover:text-muted-foreground transition-colors" />
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>{item.description || item.cycleDescription}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                )}
                                            </div>
                                            <div className={`text-xs uppercase font-bold mt-1 ${item.status === 'running' ? 'text-green-500' :
                                                item.status === 'failed' ? 'text-red-500' :
                                                    item.status === 'skipped' ? 'text-orange-500' :
                                                        'text-muted-foreground'
                                                }`}>{item.status}</div>
                                        </div>

                                        <div className="flex gap-2">
                                            {item.status === 'pending' && (
                                                <>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        title="Start Now"
                                                        className="text-green-500 hover:text-green-600 hover:bg-green-50"
                                                        onClick={() => handleForceStart(item._id)}
                                                    >
                                                        <Play className="h-4 w-4" />
                                                    </Button>

                                                    <Dialog open={editingItem?._id === item._id} onOpenChange={(open) => {
                                                        if (open) {
                                                            setEditingItem(item);
                                                            setEditTime(item.time);
                                                            setEditOverrides(item.overrides || {});
                                                        } else {
                                                            setEditingItem(null);
                                                        }
                                                    }}>
                                                        <DialogTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="max-w-[500px] max-h-[80vh] overflow-y-auto">
                                                            <DialogHeader>
                                                                <DialogTitle>Edit Schedule Item</DialogTitle>
                                                            </DialogHeader>
                                                            <div className="grid gap-4 py-4">
                                                                <div className="grid gap-2">
                                                                    <Label htmlFor="time">Start Time</Label>
                                                                    <TimePicker24
                                                                        value={editTime}
                                                                        onChange={setEditTime}
                                                                    />
                                                                </div>
                                                                {renderVariableEditor()}
                                                            </div>
                                                            <div className="flex justify-end">
                                                                <Button onClick={handleSaveEdit}>Save Changes</Button>
                                                            </div>
                                                        </DialogContent>
                                                    </Dialog>

                                                    <div className="flex flex-col gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6"
                                                            onClick={() => handleMoveUp(index)}
                                                            disabled={index === 0}
                                                        >
                                                            <ChevronUp className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6"
                                                            onClick={() => handleMoveDown(index)}
                                                            disabled={index >= program.schedule.length - 1}
                                                        >
                                                            <ChevronDown className="h-4 w-4" />
                                                        </Button>
                                                    </div>

                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <Button variant="ghost" size="icon">
                                                                <CalendarX className="h-4 w-4" />
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-80">
                                                            <div className="grid gap-4">
                                                                <div className="space-y-2">
                                                                    <h4 className="font-medium leading-none">Skip Cycle</h4>
                                                                    <p className="text-sm text-muted-foreground">
                                                                        Skip this cycle for a number of days.
                                                                    </p>
                                                                </div>
                                                                <div className="grid gap-2">
                                                                    <div className="grid grid-cols-3 items-center gap-4">
                                                                        <Label htmlFor="days">Days</Label>
                                                                        <Input
                                                                            id="days"
                                                                            type="number"
                                                                            defaultValue="1"
                                                                            className="col-span-2 h-8"
                                                                            min="1"
                                                                            onChange={(e) => setSkipDays(Number(e.target.value))}
                                                                        />
                                                                    </div>
                                                                    <Button onClick={() => handleSkipConfirm(item._id)}>Confirm Skip</Button>
                                                                </div>
                                                            </div>
                                                        </PopoverContent>
                                                    </Popover>
                                                </>
                                            )}
                                            {item.status === 'failed' && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="gap-2 border-red-500 text-red-500 hover:bg-red-50"
                                                    onClick={() => handleRetry(item._id)}
                                                >
                                                    <RotateCcw className="h-4 w-4" />
                                                    Retry
                                                </Button>
                                            )}
                                            {item.status === 'skipped' && (
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button variant="outline" size="sm" className="h-8 border-orange-500 text-orange-500 hover:text-orange-600 hover:bg-orange-50">
                                                            {item.skipUntil ?
                                                                `Skipped (${Math.ceil((new Date(item.skipUntil).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}d)`
                                                                : 'Skipped'}
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-80">
                                                        <div className="grid gap-4">
                                                            <div className="space-y-2">
                                                                <h4 className="font-medium leading-none">Manage Skipped Cycle</h4>
                                                                <p className="text-sm text-muted-foreground">
                                                                    Update skip duration or restore.
                                                                </p>
                                                                {item.skipUntil && (
                                                                    <p className="text-xs text-muted-foreground">
                                                                        Currently skipped until: {new Date(item.skipUntil).toLocaleDateString()}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <div className="grid gap-2">
                                                                <div className="grid grid-cols-3 items-center gap-4">
                                                                    <Label htmlFor="update-days">Days</Label>
                                                                    <Input
                                                                        id="update-days"
                                                                        type="number"
                                                                        defaultValue={item.skipUntil ? Math.ceil((new Date(item.skipUntil).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 1}
                                                                        className="col-span-2 h-8"
                                                                        min="1"
                                                                        onChange={(e) => setSkipDays(Number(e.target.value))}
                                                                    />
                                                                </div>
                                                                <Button onClick={() => handleSkipConfirm(item._id)}>Update Skip Duration</Button>
                                                                <Button variant="outline" onClick={() => handleRestore(item._id)}>
                                                                    Restore Cycle
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </PopoverContent>
                                                </Popover>
                                            )}
                                        </div>
                                    </div>
                                    {expandedItems.has(item._id) && renderExpandedDetails(item)}
                                </div>
                            );
                        })}
                    </div>

                    {/* Live Execution Monitor */}
                    <LiveExecutionMonitor
                        programId={program._id}
                        isActive={program.status === 'running'}
                    />
                </CardContent>
            </Card>
        </div>
    );
};
