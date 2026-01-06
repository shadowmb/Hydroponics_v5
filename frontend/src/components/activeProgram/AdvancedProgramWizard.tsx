import { useState, useEffect } from 'react';
import type { IActiveProgram } from '../../types/ActiveProgram';
import { activeProgramService } from '../../services/activeProgramService';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import { Play, Clock, Zap, ArrowRight, ChevronDown, ChevronRight, Sun, Sunrise, Moon, X, Save, HelpCircle, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "../ui/dialog";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "../ui/tooltip";

interface AdvancedProgramWizardProps {
    program: IActiveProgram;
    onStart: () => void;
}

// Variable definition from backend
interface IVariable {
    name: string;
    type: 'string' | 'number' | 'boolean';
    default?: any;
    description?: string;
    unit?: string;
    hasTolerance?: boolean;
    flowId?: string;
    flowName?: string;
    flowDescription?: string;
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

export const AdvancedProgramWizard = ({ program, onStart }: AdvancedProgramWizardProps) => {
    // Wizard step: 1 = Configure Variables, 2 = Preview
    const [step, setStep] = useState(1);

    const [expandedWindows, setExpandedWindows] = useState<Set<string>>(new Set());
    const [starting, setStarting] = useState(false);
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(true);

    // Variables state - keyed by WINDOW ID (from backend update)
    const [windowVariables, setWindowVariables] = useState<Record<string, IVariable[]>>({});

    // Global overrides (legacy/fallback)
    const [globalOverrides, setGlobalOverrides] = useState<Record<string, any>>((program as any).variableOverrides || {});

    // Per-window overrides: Map<WindowId, Map<VarName, Value>>
    const [windowOverrides, setWindowOverrides] = useState<Record<string, Record<string, any>>>((program as any).windowOverrides || {});

    const [flows, setFlows] = useState<any[]>([]);

    const windows = (program as any).windows || [];

    // API base URL
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

    // Load variables
    useEffect(() => {
        const loadData = async () => {
            try {
                setDataLoading(true);
                const [varsMap, flowsRes] = await Promise.all([
                    activeProgramService.getVariables(), // Now returns Record<WindowId, vars[]>
                    fetch(`${API_URL}/flows`).then(r => r.json()).catch(() => [])
                ]);

                console.log('Variables loaded for Advanced program (by Window):', varsMap);
                setWindowVariables(varsMap || {});
                setFlows(Array.isArray(flowsRes) ? flowsRes : []);

                // Initialize Defaults
                const newWindowOverrides = { ...windowOverrides };

                Object.entries(varsMap).forEach(([windowId, vars]: [string, any]) => {
                    if (!newWindowOverrides[windowId]) newWindowOverrides[windowId] = {};

                    vars.forEach((v: IVariable) => {
                        // If no value set for this window, try global default, then var default
                        if (newWindowOverrides[windowId][v.name] === undefined) {
                            if (v.default !== undefined) {
                                newWindowOverrides[windowId][v.name] = v.default;
                            }
                        }

                        // Tolerance handling
                        if (v.hasTolerance) {
                            if (newWindowOverrides[windowId][v.name + '_tolerance_mode'] === undefined) {
                                newWindowOverrides[windowId][v.name + '_tolerance_mode'] = 'symmetric';
                            }
                        }
                    });
                });

                setWindowOverrides(newWindowOverrides);

                // Auto-expand first window if variables exist
                /* 
                if (windows.length > 0) {
                    setExpandedWindows(new Set([windows[0].id]));
                } 
                */

            } catch (error) {
                console.error('Failed to load flow data', error);
            } finally {
                setDataLoading(false);
            }
        };
        loadData();
    }, []);

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

    const updateWindowOverride = (windowId: string, varName: string, value: any) => {
        setWindowOverrides(prev => ({
            ...prev,
            [windowId]: {
                ...(prev[windowId] || {}),
                [varName]: value
            }
        }));
    };

    // Check if a window has any missing required variables
    const getMissingVariablesCount = (windowId: string) => {
        const vars = windowVariables[windowId] || [];
        let missing = 0;
        const currentOverrides = windowOverrides[windowId] || {};

        for (const v of vars) {
            const val = currentOverrides[v.name];
            if (val === undefined || val === '') {
                missing++;
            }
            if (v.hasTolerance) {
                const tol = currentOverrides[v.name + '_tolerance'];
                if (tol === undefined || tol === '') {
                    missing++;
                }
            }
        }
        return missing;
    };

    // Count total missing for validation
    const getTotalMissingCount = () => {
        return windows.reduce((sum: number, w: any) => sum + getMissingVariablesCount(w.id), 0);
    };

    const handleSaveAndContinue = async () => {
        const missingCount = getTotalMissingCount();
        if (missingCount > 0) {
            toast.error(`Моля попълнете всички задължителни полета (${missingCount} липсващи)`);
            return;
        }

        try {
            setLoading(true);
            await activeProgramService.update({
                globalOverrides: globalOverrides, // Still send global if any (legacy support)
                windowOverrides: windowOverrides, // Save per-window
                status: 'ready'
            });
            toast.success('Програмата е готова за стартиране');
            onStart();
        } catch (error) {
            toast.error('Грешка при запазване');
        } finally {
            setLoading(false);
        }
    };

    const handleStart = async () => {
        setStarting(true);
        try {
            // Ensure status is ready validation included?
            await activeProgramService.start();
            toast.success('Advanced програмата е стартирана!');
            onStart();
        } catch (error) {
            console.error(error);
            toast.error('Неуспешен старт на програмата');
        } finally {
            setStarting(false);
        }
    };

    const handleCancelConfirm = async () => {
        try {
            setLoading(true);
            await activeProgramService.unload();
            onStart();
        } catch (error) {
            console.error('Failed to cancel program:', error);
            toast.error('Failed to cancel program. Please try again.');
        } finally {
            setLoading(false);
            setCancelDialogOpen(false);
        }
    };

    const getFlowName = (flowId: string) => {
        const flow = flows.find(f => f.id === flowId);
        return flow?.name || flowId;
    };

    // Toggle logic for tolerance button
    const toggleToleranceMode = (windowId: string, varName: string) => {
        const currentMode = windowOverrides[windowId]?.[varName + '_tolerance_mode'] || 'symmetric';
        // Cycles: symmetric -> lower -> upper -> symmetric
        const modes = ['symmetric', 'lower', 'upper'];
        const nextIndex = (modes.indexOf(currentMode) + 1) % modes.length;
        const nextMode = modes[nextIndex];

        updateWindowOverride(windowId, varName + '_tolerance_mode', nextMode);

        // Reset values if needed? No, keep the value, just change application logic.
        // But UI tooltip should update.
    };

    const getToleranceTooltip = (mode: string) => {
        switch (mode) {
            case 'symmetric': return 'Симетричен: X ± Tol';
            case 'lower': return 'Долна граница: X - Tol';
            case 'upper': return 'Горна граница: X + Tol';
            default: return 'Толеранс';
        }
    };

    const hasVariables = Object.keys(windowVariables).length > 0;

    // Show loading
    if (dataLoading) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <Card>
                    <CardContent className="py-12 text-center">
                        <div className="animate-pulse text-muted-foreground">
                            Зареждане на данни...
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // ========== STEP 1: CONFIGURE VARIABLES ==========
    if (step === 1 && hasVariables) {
        const totalMissing = getTotalMissingCount();

        return (
            <div className="max-w-4xl mx-auto p-6 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Configure Program: {program.name}</CardTitle>
                        <CardDescription>
                            Въведете стойности за променливите във всеки времеви прозорец.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">

                        {/* Windows List */}
                        <div className="space-y-4">
                            {windows.map((window: any) => {
                                const isExpanded = expandedWindows.has(window.id);
                                const vars = windowVariables[window.id] || [];
                                const missingCount = getMissingVariablesCount(window.id);
                                const hasVars = vars.length > 0;

                                // Group vars by flow
                                const varsByFlow: Record<string, IVariable[]> = {};
                                vars.forEach(v => {
                                    const key = v.flowId || 'unknown';
                                    if (!varsByFlow[key]) varsByFlow[key] = [];
                                    varsByFlow[key].push(v);
                                });

                                return (
                                    <div key={window.id} className={cn("border rounded-lg overflow-hidden transition-all shadow-sm",
                                        missingCount > 0 ? "border-red-200 dark:border-red-900/50" : "bg-card"
                                    )}>
                                        {/* Header - Mimicking Basic Mode Event Block */}
                                        <div
                                            className={cn(
                                                "flex items-center justify-between p-4 cursor-pointer transition-colors",
                                                isExpanded ? "bg-muted/30" : "hover:bg-muted/30"
                                            )}
                                            onClick={() => toggleExpand(window.id)}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="flex flex-col items-center justify-center p-2 bg-background border rounded-md shadow-sm min-w-[80px]">
                                                    <span className="text-xs text-muted-foreground uppercase">Start</span>
                                                    <span className="text-xl font-mono font-bold tracking-tight">{window.startTime}</span>
                                                </div>

                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="text-lg font-semibold">{window.name}</h4>
                                                        {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                                                    </div>
                                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                                        {/* Badges for flows in this window */}
                                                        {Object.keys(varsByFlow).map((fid, idx) => {
                                                            const fName = getFlowName(fid);
                                                            const colors = [
                                                                "text-blue-600 bg-blue-500/10 border-blue-500/20",
                                                                "text-green-600 bg-green-500/10 border-green-500/20",
                                                                "text-purple-600 bg-purple-500/10 border-purple-500/20",
                                                                "text-orange-600 bg-orange-500/10 border-orange-500/20"
                                                            ];
                                                            return (
                                                                <span key={fid} className={cn("text-[10px] px-2 py-0.5 rounded-full border border-opacity-30", colors[idx % colors.length])}>
                                                                    {fName}
                                                                </span>
                                                            );
                                                        })}
                                                        <span className="text-[10px] text-muted-foreground px-2 py-0.5 ml-1">
                                                            Stop: {window.endTime}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                {missingCount > 0 && (
                                                    <div className="flex items-center gap-1.5 text-sm font-medium text-red-600 bg-red-100 dark:bg-red-900/30 px-3 py-1.5 rounded-md animate-pulse border border-red-200 dark:border-red-800">
                                                        <AlertTriangle className="h-4 w-4" />
                                                        Variables Required
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Content - Grouped by Flow */}
                                        {isExpanded && hasVars && (
                                            <div className="border-t bg-muted/10 p-4 space-y-6">
                                                {Object.entries(varsByFlow).map(([flowId, flowVars], groupIdx) => {
                                                    const fName = getFlowName(flowId);
                                                    // Distinct border color for each flow group to help visual separation
                                                    const borderColors = ["border-blue-500/30", "border-green-500/30", "border-purple-500/30", "border-orange-500/30"];
                                                    const borderColor = borderColors[groupIdx % borderColors.length];

                                                    return (
                                                        <div key={flowId} className={cn("border rounded-xl p-4 bg-background/50", borderColor)}>
                                                            <h5 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                                                {fName}
                                                                <div className="h-px flex-1 bg-border/50"></div>
                                                            </h5>

                                                            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                                                                {flowVars.map((variable, idx) => {
                                                                    const overrides = windowOverrides[window.id] || {};
                                                                    return (
                                                                        <div key={`${window.id}-${variable.name}-${idx}`} className="flex flex-col gap-1 border rounded-md p-3 bg-card shadow-sm hover:shadow-md transition-shadow">
                                                                            <TooltipProvider>
                                                                                <Tooltip>
                                                                                    <TooltipTrigger asChild>
                                                                                        <div className="flex items-center justify-between border-b pb-1 mb-2">
                                                                                            <Label className="font-medium text-sm cursor-help truncate" title={variable.name}>
                                                                                                {variable.name}
                                                                                            </Label>
                                                                                            {variable.description && <HelpCircle className="h-3 w-3 text-muted-foreground/50" />}
                                                                                        </div>
                                                                                    </TooltipTrigger>
                                                                                    <TooltipContent>
                                                                                        <p className="font-semibold">{variable.name}</p>
                                                                                        {variable.description && <p className="text-xs">{variable.description}</p>}
                                                                                    </TooltipContent>
                                                                                </Tooltip>
                                                                            </TooltipProvider>

                                                                            {variable.type === 'boolean' ? (
                                                                                <div className="flex items-center gap-2 h-10">
                                                                                    <input
                                                                                        type="checkbox"
                                                                                        checked={!!overrides[variable.name]}
                                                                                        onChange={(e) => updateWindowOverride(window.id, variable.name, e.target.checked)}
                                                                                        className="h-4 w-4 rounded border-primary"
                                                                                    />
                                                                                    <span className="text-sm text-muted-foreground">Active</span>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="flex items-center gap-2">
                                                                                    <div className="relative flex-1">
                                                                                        <Input
                                                                                            type={variable.type === 'number' ? 'number' : 'text'}
                                                                                            value={overrides[variable.name] ?? ''}
                                                                                            onChange={(e) => updateWindowOverride(window.id, variable.name, variable.type === 'number' ? Number(e.target.value) : e.target.value)}
                                                                                            placeholder={variable.default !== undefined ? `${variable.default}` : 'Value'}
                                                                                            className={cn("h-9", overrides[variable.name] === undefined || overrides[variable.name] === '' ? "border-red-300 focus-visible:ring-red-500 bg-red-50/10" : "")}
                                                                                        />
                                                                                        {variable.unit && (
                                                                                            <span className="absolute right-3 top-2.5 text-xs text-muted-foreground pointer-events-none font-mono">
                                                                                                {variable.unit}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>

                                                                                    {variable.hasTolerance && (
                                                                                        <div className="flex items-center gap-1">
                                                                                            <TooltipProvider>
                                                                                                <Tooltip>
                                                                                                    <TooltipTrigger asChild>
                                                                                                        <Button
                                                                                                            variant="ghost"
                                                                                                            size="icon"
                                                                                                            className="h-9 w-8 shrink-0 border border-input"
                                                                                                            onClick={() => toggleToleranceMode(window.id, variable.name)}
                                                                                                        >
                                                                                                            <span className="text-sm font-bold text-muted-foreground">
                                                                                                                {(!overrides[variable.name + '_tolerance_mode'] || overrides[variable.name + '_tolerance_mode'] === 'symmetric') && '±'}
                                                                                                                {overrides[variable.name + '_tolerance_mode'] === 'lower' && '≥'}
                                                                                                                {overrides[variable.name + '_tolerance_mode'] === 'upper' && '≤'}
                                                                                                            </span>
                                                                                                        </Button>
                                                                                                    </TooltipTrigger>
                                                                                                    <TooltipContent>
                                                                                                        {getToleranceTooltip(overrides[variable.name + '_tolerance_mode'] || 'symmetric')}
                                                                                                    </TooltipContent>
                                                                                                </Tooltip>
                                                                                            </TooltipProvider>

                                                                                            <Input
                                                                                                type="number"
                                                                                                min={0}
                                                                                                value={overrides[variable.name + '_tolerance'] ?? ''}
                                                                                                onChange={(e) => updateWindowOverride(window.id, variable.name + '_tolerance', Number(e.target.value))}
                                                                                                placeholder="Tol"
                                                                                                className={cn("w-16 h-9", (overrides[variable.name + '_tolerance'] === undefined || overrides[variable.name + '_tolerance'] === '') ? "border-red-300 bg-red-50/10" : "")}
                                                                                            />
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-2 pt-4 border-t">
                            <Button variant="ghost" onClick={() => setCancelDialogOpen(true)}>
                                Cancel
                            </Button>

                            {totalMissing > 0 ? (
                                <Button variant="destructive" className="gap-2 animate-pulse shadow-lg shadow-red-500/20" onClick={handleSaveAndContinue}>
                                    <AlertTriangle className="h-4 w-4" />
                                    Variables & Tolerance Required
                                </Button>
                            ) : (
                                <Button onClick={handleSaveAndContinue} className="gap-2" disabled={loading}>
                                    <Save className="h-4 w-4" />
                                    Save & Continue
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Cancel Dialog */}
                <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Cancel Configuration?</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to cancel? Any unsaved changes will be lost.
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
    }

    // ========== STEP 2: PREVIEW WINDOWS & TRIGGERS (Simple Preview) ==========
    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Program Ready: {program.name}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-6">
                        <div className="text-5xl mb-4">🚀</div>
                        <h3 className="text-xl font-semibold">Everything looks good!</h3>
                        <p className="text-muted-foreground mt-2">
                            All {windows.length} windows are configured.
                            {hasVariables && ` Custom variables have been applied per window.`}
                        </p>
                    </div>
                    <div className="flex justify-center gap-4 mt-6">
                        <Button variant="outline" onClick={() => setStep(1)}>
                            Back to Edit
                        </Button>
                        <Button
                            onClick={handleStart}
                            size="lg"
                            className="bg-green-600 hover:bg-green-700 gap-2"
                            disabled={starting}
                        >
                            {starting ? <Clock className="animate-spin h-5 w-5" /> : <Play className="h-5 w-5" />}
                            Start Program
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
