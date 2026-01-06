import { useState, useEffect } from 'react';
import type { IActiveProgram, IVariable, IContext } from '../../types/ActiveProgram';
import { activeProgramService } from '../../services/activeProgramService';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';

import { Input } from '../ui/input';
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

import { toast } from 'sonner';
import { Play, Clock, Zap, ArrowRight, Sun, Sunrise, Moon, Save, HelpCircle, AlertTriangle, Settings2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Progress } from '../ui/progress';
import { VariableConfigModal } from './VariableConfigModal';


interface AdvancedProgramWizardProps {
    program: IActiveProgram;
    onStart: () => void;
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

    const [starting, setStarting] = useState(false);
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(true);

    // Variables state - keyed by WINDOW ID (from backend update)
    const [windowVariables, setWindowVariables] = useState<Record<string, IContext[]>>({});

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

    const [editingWindowId, setEditingWindowId] = useState<string | null>(null);

    // Initial open handler
    // Initial open handler
    const handleOpenConfig = (windowId: string) => {
        setEditingWindowId(windowId);
    };



    // Check if a specific context has missing variables
    const getContextMissingCount = (windowId: string, context: any) => {
        let missing = 0;
        const currentOverrides = windowOverrides[windowId]?.[context.contextId] || {};

        for (const v of context.variables) {
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

    // Check if a window has any missing required variables
    const getMissingVariablesCount = (windowId: string) => {
        // windowVariables are now Contexts
        const contexts = windowVariables[windowId] || [];
        return contexts.reduce((sum, ctx) => sum + getContextMissingCount(windowId, ctx), 0);
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
                                const contexts = windowVariables[window.id] || [];
                                const missingCount = getMissingVariablesCount(window.id);

                                return (
                                    <div key={window.id} className={cn("border rounded-lg overflow-hidden transition-all shadow-sm",
                                        missingCount > 0 ? "border-red-200 dark:border-red-900/50" : "bg-card"
                                    )}>
                                        {/* Header - Compact View */}
                                        <div className="flex flex-col md:flex-row md:items-center justify-between p-4 gap-4">

                                            {/* Left: Window Info */}
                                            <div className="flex items-center gap-4">
                                                <div className="flex flex-col items-center justify-center p-2 bg-background border rounded-md shadow-sm min-w-[80px]">
                                                    <span className="text-xs text-muted-foreground uppercase">Start</span>
                                                    <span className="text-xl font-mono font-bold tracking-tight">{window.startTime}</span>
                                                </div>

                                                <div>
                                                    <h4 className="text-lg font-semibold">{window.name}</h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                                        <span className="text-xs text-muted-foreground">
                                                            {window.startTime} - {window.endTime}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Mid: Status & Progress */}
                                            <div className="flex-1 md:px-8">
                                                <div className="flex justify-between items-center mb-1.5">
                                                    <span className="text-xs font-medium text-muted-foreground">Status</span>
                                                    <span className={cn("text-xs font-bold", missingCount > 0 ? "text-red-500" : "text-green-500")}>
                                                        {missingCount === 0 ? "Ready" : `${missingCount} Variables Missing`}
                                                    </span>
                                                </div>
                                                {/* Calculate progress based on configured vs total variables */}
                                                {(() => {
                                                    const totalVars = contexts.reduce((sum, c) => sum + c.variables.length, 0);
                                                    const missingVars = getMissingVariablesCount(window.id);
                                                    const completedVars = totalVars - missingVars;
                                                    const progress = totalVars > 0 ? (completedVars / totalVars) * 100 : 100;

                                                    return (
                                                        <Progress value={progress} className={cn("h-2", missingCount > 0 ? "bg-red-100 dark:bg-red-950 [&>div]:bg-red-500" : "bg-green-100 dark:bg-green-950 [&>div]:bg-green-500")} />
                                                    );
                                                })()}
                                            </div>

                                            {/* Right: Action Button */}
                                            <div>
                                                <Button
                                                    onClick={() => handleOpenConfig(window.id)}
                                                    className={cn(
                                                        "min-w-[140px] gap-2 transition-all",
                                                        missingCount > 0 ? "animate-pulse" : ""
                                                    )}
                                                    variant={missingCount > 0 ? "destructive" : "secondary"}
                                                >
                                                    <Settings2 className="h-4 w-4" />
                                                    {missingCount > 0 ? "Fix Issues" : "Configure"}
                                                </Button>
                                            </div>
                                        </div>
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


                {/* Unified Master-Detail Configuration Dialog */}
                <VariableConfigModal
                    isOpen={!!editingWindowId}
                    onClose={() => setEditingWindowId(null)}
                    windowId={editingWindowId}
                    windowName={editingWindowId ? windows.find((w: any) => w.id === editingWindowId)?.name : ''}
                    contexts={editingWindowId ? windowVariables[editingWindowId] || [] : []}
                    initialOverrides={editingWindowId ? windowOverrides[editingWindowId] || {} : {}}
                    onSave={(winId, newOverrides) => {
                        setWindowOverrides(prev => ({
                            ...prev,
                            [winId]: newOverrides
                        }));
                    }}
                />

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
        </div >
    );
};
