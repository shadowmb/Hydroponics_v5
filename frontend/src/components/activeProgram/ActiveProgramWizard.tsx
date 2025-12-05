import { useState, useEffect } from 'react';
import type { IActiveProgram, IActiveScheduleItem } from '../../types/ActiveProgram';
import { activeProgramService } from '../../services/activeProgramService';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { toast } from 'sonner';
import { Save, ArrowUp, ArrowDown, HelpCircle } from 'lucide-react';
import { TimePicker24 } from '../ui/time-picker-24';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "../ui/tooltip";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "../ui/dialog";

interface ActiveProgramWizardProps {
    program: IActiveProgram;
    onStart: () => void;
}

export const ActiveProgramWizard = ({ program, onStart }: ActiveProgramWizardProps) => {
    const [minInterval, setMinInterval] = useState(program.minCycleInterval ?? 60);
    const [schedule, setSchedule] = useState<IActiveScheduleItem[]>(program.schedule || []);
    const [loading, setLoading] = useState(false);
    const [cycleVariables, setCycleVariables] = useState<Record<string, any[]>>({});
    const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

    const [flows, setFlows] = useState<any[]>([]);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [varsMap, flowsRes] = await Promise.all([
                    activeProgramService.getVariables(),
                    fetch('/api/flows').then(res => res.json())
                ]);

                setCycleVariables(varsMap);
                setFlows(flowsRes);

                // Initialize overrides if missing
                setSchedule(prev => prev.map(item => {
                    const vars = varsMap[item.cycleId];
                    if (!vars) return item;

                    const currentOverrides = item.overrides || {};
                    const newOverrides = { ...currentOverrides };
                    let hasChanges = false;

                    vars.forEach(v => {
                        if (newOverrides[v.name] === undefined && v.default !== undefined) {
                            newOverrides[v.name] = v.default;
                            hasChanges = true;
                        }
                    });

                    return hasChanges ? { ...item, overrides: newOverrides } : item;
                }));

            } catch (error) {
                console.error('Failed to load data', error);
            }
        };
        loadData();
    }, []);

    const toggleExpand = (index: number) => {
        const newExpanded = new Set(expandedItems);
        if (newExpanded.has(index)) {
            newExpanded.delete(index);
        } else {
            newExpanded.add(index);
        }
        setExpandedItems(newExpanded);
    };

    const updateItemOverride = (index: number, varName: string, value: any) => {
        const newSchedule = [...schedule];
        const item = newSchedule[index];
        newSchedule[index] = {
            ...item,
            overrides: {
                ...item.overrides,
                [varName]: value
            }
        };
        setSchedule(newSchedule);
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

    const conflicts = getConflicts(schedule, minInterval);

    const handleAutoFix = () => {
        const sortedIndices = schedule
            .map((_, index) => index)
            .sort((a, b) => schedule[a].time.localeCompare(schedule[b].time));

        const newSchedule = [...schedule];

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
                newSchedule[idx2] = {
                    ...newSchedule[idx2],
                    time: `${hours}:${minutes}`
                };
            }
        }

        setSchedule(newSchedule);
        toast.success('Schedule auto-corrected');
    };

    const handleSaveAndContinue = async () => {
        if (conflicts.size > 0) {
            toast.error(`Please resolve schedule conflicts (marked in red) or use Auto-Fix.`);
            return;
        }

        // Validate required variables
        for (let i = 0; i < schedule.length; i++) {
            const item = schedule[i];
            const vars = cycleVariables[item.cycleId];
            if (vars) {
                for (const v of vars) {
                    const val = item.overrides?.[v.name];
                    if (val === undefined || val === '') {
                        toast.error(`Missing value for "${v.name}" in cycle "${item.cycleName}" (Start Time: ${item.time})`);
                        return;
                    }

                    // Validate Tolerance if enabled
                    if (v.hasTolerance) {
                        const tol = item.overrides?.[v.name + '_tolerance'];
                        if (tol === undefined || tol === '') {
                            toast.error(`Missing tolerance for "${v.name}" in cycle "${item.cycleName}"`);
                            return;
                        }
                    }
                }
            }
        }

        try {
            setLoading(true);
            await activeProgramService.update({
                minCycleInterval: minInterval,
                schedule: schedule,
                status: 'ready'
            });
            toast.success('Program saved and ready');
            onStart();
        } catch (error) {
            toast.error('Failed to save program');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const updateScheduleItemTime = (index: number, newTime: string) => {
        const newSchedule = [...schedule];
        newSchedule[index] = { ...newSchedule[index], time: newTime };
        setSchedule(newSchedule);
    };

    const moveItem = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === schedule.length - 1) return;

        const newSchedule = [...schedule];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        const itemA = newSchedule[index];
        const itemB = newSchedule[targetIndex];

        newSchedule[index] = {
            ...itemA,
            cycleId: itemB.cycleId,
            cycleName: itemB.cycleName,
            cycleDescription: itemB.cycleDescription,
            overrides: itemB.overrides
        };

        newSchedule[targetIndex] = {
            ...itemB,
            cycleId: itemA.cycleId,
            cycleName: itemA.cycleName,
            cycleDescription: itemA.cycleDescription,
            overrides: itemA.overrides
        };

        setSchedule(newSchedule);
    };

    const handleCancelConfirm = async () => {
        try {
            setLoading(true);
            await activeProgramService.unload();
            onStart(); // Go back using the provided callback
        } catch (error) {
            console.error('Failed to cancel program:', error);
            toast.error('Failed to cancel program. Please try again.');
        } finally {
            setLoading(false);
            setCancelDialogOpen(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Configure Program: {program.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Settings Section */}
                    <div className="grid gap-2">
                        <Label htmlFor="minInterval">Minimum Cycle Interval (minutes)</Label>
                        <div className="flex items-center gap-4">
                            <Input
                                id="minInterval"
                                type="number"
                                value={minInterval}
                                onChange={(e) => setMinInterval(Number(e.target.value))}
                                className="w-32"
                            />
                            {conflicts.size > 0 && (
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={handleAutoFix}
                                    className="animate-pulse"
                                >
                                    Auto-Fix Schedule
                                </Button>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Minimum time required between the end of one cycle and the start of the next.
                        </p>
                    </div>

                    {/* Schedule Section */}
                    <div className="border rounded-lg p-4">
                        <h3 className="font-semibold mb-4">Schedule Configuration</h3>
                        <div className="space-y-2">
                            {schedule.map((item, index) => {
                                const isConflict = conflicts.has(index);
                                const vars = cycleVariables[item.cycleId] || [];
                                const hasVars = vars.length > 0;
                                const isExpanded = expandedItems.has(index);

                                // Check for missing values
                                const missingVars = vars.some(v => {
                                    const valMissing = item.overrides?.[v.name] === undefined || item.overrides?.[v.name] === '';
                                    if (valMissing) return true;
                                    if (v.hasTolerance) {
                                        const tolMissing = item.overrides?.[v.name + '_tolerance'] === undefined || item.overrides?.[v.name + '_tolerance'] === '';
                                        return tolMissing;
                                    }
                                    return false;
                                });

                                return (
                                    <div key={item._id || index} className={`flex flex-col gap-2 p-3 rounded border ${isConflict ? 'border-red-500 bg-red-50' : 'bg-muted/50'}`}>
                                        <div className="flex items-center gap-4">
                                            <div className="flex flex-col gap-1">
                                                <Button variant="ghost" size="icon" className="h-6 w-6"
                                                    onClick={() => moveItem(index, 'up')} disabled={index === 0}>
                                                    <ArrowUp className="h-3 w-3" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-6 w-6"
                                                    onClick={() => moveItem(index, 'down')} disabled={index === schedule.length - 1}>
                                                    <ArrowDown className="h-3 w-3" />
                                                </Button>
                                            </div>

                                            <div className="grid gap-1">
                                                <Label className={`text-xs ${isConflict ? 'text-red-600 font-bold' : ''}`}>
                                                    {isConflict ? 'Too Close!' : 'Start Time'}
                                                </Label>
                                                <TimePicker24
                                                    value={item.time}
                                                    onChange={(val) => updateScheduleItemTime(index, val)}
                                                    className={isConflict ? 'border-red-500 ring-1 ring-red-500 rounded' : ''}
                                                />
                                            </div>

                                            <div className="flex-1">
                                                <div className="font-medium text-lg">{item.name || item.cycleName || 'Event'}</div>
                                                {(item.description || item.cycleDescription) && (
                                                    <div className="text-sm text-muted-foreground">{item.description || item.cycleDescription}</div>
                                                )}

                                                {/* Display Flows instead of ID */}
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {(() => {
                                                        const flowColors = [
                                                            'border-blue-500/50 text-blue-600 dark:text-blue-400 bg-blue-500/10',
                                                            'border-green-500/50 text-green-600 dark:text-green-400 bg-green-500/10',
                                                            'border-purple-500/50 text-purple-600 dark:text-purple-400 bg-purple-500/10',
                                                            'border-orange-500/50 text-orange-600 dark:text-orange-400 bg-orange-500/10',
                                                            'border-pink-500/50 text-pink-600 dark:text-pink-400 bg-pink-500/10',
                                                            'border-cyan-500/50 text-cyan-600 dark:text-cyan-400 bg-cyan-500/10',
                                                        ];

                                                        // Re-calculate map for badges (should ideally be shared but this is safer for now)
                                                        const uniqueFlowIds = Array.from(new Set(item.steps?.map(s => s.flowId) || []));
                                                        const flowColorMap: Record<string, string> = {};
                                                        uniqueFlowIds.forEach((fid, idx) => {
                                                            flowColorMap[fid] = flowColors[idx % flowColors.length];
                                                        });

                                                        return item.steps?.map((step, i) => {
                                                            const flow = flows.find(f => f.id === step.flowId);
                                                            const colorClass = flowColorMap[step.flowId] || 'bg-secondary text-secondary-foreground';

                                                            return (
                                                                <span key={i} className={`text-xs px-2 py-0.5 rounded border ${colorClass}`}>
                                                                    {flow ? flow.name : step.flowId}
                                                                </span>
                                                            );
                                                        });
                                                    })()}
                                                    {(!item.steps || item.steps.length === 0) && (
                                                        <span className="text-xs text-muted-foreground italic">No flows</span>
                                                    )}
                                                </div>
                                            </div>

                                            {hasVars && (
                                                <Button
                                                    variant={missingVars ? "destructive" : "outline"}
                                                    size="sm"
                                                    onClick={() => toggleExpand(index)}
                                                    className="gap-2"
                                                >
                                                    {missingVars ? 'Variables & Tolerance Required' : 'Variables'}
                                                    {isExpanded ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                                                </Button>
                                            )}
                                        </div>

                                        {/* Expanded Variables Section */}
                                        {isExpanded && hasVars && (
                                            <div className="mt-2 space-y-4">
                                                {(() => {
                                                    // Group variables by flowId
                                                    const varsByFlow: Record<string, typeof vars> = {};
                                                    vars.forEach(v => {
                                                        const fid = v.flowId || 'unknown';
                                                        if (!varsByFlow[fid]) varsByFlow[fid] = [];
                                                        varsByFlow[fid].push(v);
                                                    });

                                                    // Assign colors to flows found in this schedule item
                                                    const flowColors = [
                                                        'border-blue-500/50 text-blue-600 dark:text-blue-400 bg-blue-500/10',
                                                        'border-green-500/50 text-green-600 dark:text-green-400 bg-green-500/10',
                                                        'border-purple-500/50 text-purple-600 dark:text-purple-400 bg-purple-500/10',
                                                        'border-orange-500/50 text-orange-600 dark:text-orange-400 bg-orange-500/10',
                                                        'border-pink-500/50 text-pink-600 dark:text-pink-400 bg-pink-500/10',
                                                        'border-cyan-500/50 text-cyan-600 dark:text-cyan-400 bg-cyan-500/10',
                                                    ];

                                                    // Map flowId to Color
                                                    const flowColorMap: Record<string, string> = {};
                                                    let colorIndex = 0;

                                                    // Get unique flow IDs from steps to ensure consistent ordering
                                                    const uniqueFlowIds = Array.from(new Set(item.steps?.map(s => s.flowId) || []));

                                                    uniqueFlowIds.forEach(fid => {
                                                        flowColorMap[fid] = flowColors[colorIndex % flowColors.length];
                                                        colorIndex++;
                                                    });

                                                    // Handle variables that might belong to flows not in steps (edge case) or unknown
                                                    Object.keys(varsByFlow).forEach(fid => {
                                                        if (!flowColorMap[fid] && fid !== 'unknown') {
                                                            flowColorMap[fid] = flowColors[colorIndex % flowColors.length];
                                                            colorIndex++;
                                                        }
                                                    });

                                                    return Object.entries(varsByFlow).map(([flowId, flowVars]) => {
                                                        const colorClass = flowColorMap[flowId] || 'border-border text-muted-foreground bg-muted/20';
                                                        const flowName = flowVars[0].flowName || 'Global Variables';
                                                        const flowDescription = flowVars[0].flowDescription;

                                                        return (
                                                            <div key={flowId} className={`rounded-md border-2 p-3 ${colorClass.split(' ')[0]} ${colorClass.split(' ')[2]}`}>
                                                                <div className={`flex items-baseline gap-2 mb-2 ${colorClass.split(' ')[1]}`}>
                                                                    <div className="text-xs font-bold uppercase tracking-wider">
                                                                        {flowName}
                                                                    </div>
                                                                    {flowDescription && (
                                                                        <div className="text-xs opacity-75 font-normal italic truncate max-w-[300px]">
                                                                            - {flowDescription}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                                                                    {flowVars.map(variable => (
                                                                        <div key={variable.name} className="flex flex-col gap-0.5 border border-primary/10 rounded-md p-2 bg-background/80 shadow-sm">
                                                                            <TooltipProvider>
                                                                                <Tooltip>
                                                                                    <TooltipTrigger asChild>
                                                                                        <div className="w-full text-center border-b border-border/30 flex items-center justify-center gap-2 pb-1 mb-1">
                                                                                            <Label
                                                                                                htmlFor={`var-${index}-${variable.name}`}
                                                                                                className="truncate cursor-help font-medium text-center text-xs"
                                                                                            >
                                                                                                {variable.name}
                                                                                            </Label>
                                                                                            {variable.hasTolerance && <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />}
                                                                                        </div>
                                                                                    </TooltipTrigger>
                                                                                    <TooltipContent>
                                                                                        <p className="font-semibold mb-1">{variable.name}</p>
                                                                                        {variable.description && <p className="text-xs text-muted-foreground mb-2">{variable.description}</p>}
                                                                                        <p className="text-xs text-muted-foreground">Flow: {flowName}</p>
                                                                                    </TooltipContent>
                                                                                </Tooltip>
                                                                            </TooltipProvider>

                                                                            {variable.type === 'boolean' ? (
                                                                                <div className="flex items-center gap-2 h-8 justify-center">
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        id={`var-${index}-${variable.name}`}
                                                                                        checked={!!item.overrides?.[variable.name]}
                                                                                        onChange={(e) => updateItemOverride(index, variable.name, e.target.checked)}
                                                                                        className="h-4 w-4"
                                                                                    />
                                                                                    <span className="text-xs text-muted-foreground">Enabled</span>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="flex items-end gap-2">
                                                                                    <div className="flex-1 flex items-center gap-2 min-w-0">
                                                                                        <Input
                                                                                            id={`var-${index}-${variable.name}`}
                                                                                            type={variable.type === 'number' ? 'number' : 'text'}
                                                                                            value={item.overrides?.[variable.name] ?? ''}
                                                                                            onChange={(e) => updateItemOverride(index, variable.name, variable.type === 'number' ? Number(e.target.value) : e.target.value)}
                                                                                            placeholder={variable.default !== undefined ? `${variable.default}` : 'Value'}
                                                                                            className="w-20 h-8 text-xs placeholder:text-muted-foreground/30"
                                                                                        />
                                                                                        {variable.unit && (
                                                                                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                                                                {variable.unit}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>

                                                                                    {variable.hasTolerance && (
                                                                                        <>
                                                                                            <div className="w-[1px] h-5 bg-border/40 mx-0.5" />
                                                                                            <div className="flex items-center gap-1">
                                                                                                <span className="text-muted-foreground text-xs">±</span>
                                                                                                <Input
                                                                                                    type="number"
                                                                                                    min={0}
                                                                                                    value={item.overrides?.[variable.name + '_tolerance'] ?? ''}
                                                                                                    onChange={(e) => {
                                                                                                        const val = Number(e.target.value);
                                                                                                        if (val >= 0) {
                                                                                                            updateItemOverride(index, variable.name + '_tolerance', val);
                                                                                                        }
                                                                                                    }}
                                                                                                    placeholder="Tol"
                                                                                                    className="w-20 h-8 text-xs placeholder:text-muted-foreground/30"
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
                                                        );
                                                    });
                                                })()}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="ghost" onClick={() => setCancelDialogOpen(true)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveAndContinue} className="gap-2" disabled={loading}>
                            <Save className="h-4 w-4" />
                            Save & Continue
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cancel Configuration?</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to cancel? Any unsaved changes will be lost and the program setup will be reset.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
                            Continue Configuration
                        </Button>
                        <Button variant="destructive" onClick={handleCancelConfirm} disabled={loading}>
                            Yes, Cancel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
