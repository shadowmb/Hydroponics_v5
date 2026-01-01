import { useState, useEffect } from 'react';
import type { IActiveProgram } from '../../types/ActiveProgram';
import { activeProgramService } from '../../services/activeProgramService';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import { Play, Clock, Zap, ArrowRight, ChevronDown, ChevronRight, Sun, Sunrise, Moon, X, Save, HelpCircle } from 'lucide-react';
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

    // Variables state - keyed by flowId (from backend)
    const [flowVariables, setFlowVariables] = useState<Record<string, IVariable[]>>({});
    const [overrides, setOverrides] = useState<Record<string, any>>((program as any).variableOverrides || {});
    const [flows, setFlows] = useState<any[]>([]);

    const windows = (program as any).windows || [];

    // API base URL
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

    // Load variables using the same API as Basic mode
    useEffect(() => {
        const loadData = async () => {
            try {
                setDataLoading(true);
                const [varsMap, flowsRes] = await Promise.all([
                    activeProgramService.getVariables(), // Uses /api/active-program/variables
                    fetch(`${API_URL}/flows`).then(r => r.json()).catch(() => [])
                ]);

                console.log('Variables loaded for Advanced program:', varsMap);
                setFlowVariables(varsMap || {});
                setFlows(Array.isArray(flowsRes) ? flowsRes : []);

                // Initialize overrides with defaults if not set
                const newOverrides = { ...overrides };
                Object.values(varsMap).flat().forEach((v: any) => {
                    if (newOverrides[v.name] === undefined && v.default !== undefined) {
                        newOverrides[v.name] = v.default;
                    }
                });
                setOverrides(newOverrides);

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

    const updateOverride = (varName: string, value: any) => {
        setOverrides(prev => ({ ...prev, [varName]: value }));
    };

    const handleSaveAndContinue = async () => {
        // Validate
        const allVars = Object.values(flowVariables).flat();
        for (const v of allVars) {
            const val = overrides[v.name];
            if (val === undefined || val === '') {
                toast.error(`Моля въведете стойност за "${v.name}"`);
                return;
            }
            if (v.hasTolerance) {
                const tol = overrides[v.name + '_tolerance'];
                if (tol === undefined || tol === '') {
                    toast.error(`Моля въведете толеранс за "${v.name}"`);
                    return;
                }
            }
        }

        try {
            setLoading(true);
            await activeProgramService.update({
                globalOverrides: overrides,
                status: 'ready'
            });
            toast.success('Програмата е готова за стартиране');
            onStart(); // Go back to refresh page - will show Manager or list
        } catch (error) {
            toast.error('Грешка при запазване');
        } finally {
            setLoading(false);
        }
    };

    const handleStart = async () => {
        setStarting(true);
        try {
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

    const hasVariables = Object.keys(flowVariables).length > 0;
    const allVars = Object.values(flowVariables).flat();

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
        return (
            <div className="max-w-4xl mx-auto p-6 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Configure Program: {program.name}</CardTitle>
                        <CardDescription>
                            Въведете стойности за глобалните променливи на потоците
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Group variables by flow */}
                        <div className="border rounded-lg p-4">
                            <h3 className="font-semibold mb-4">Flow Variables</h3>
                            <div className="space-y-6">
                                {Object.entries(flowVariables).map(([flowId, vars]) => {
                                    // Get flow name from first variable or from flows lookup
                                    const flowName = vars[0]?.flowName || getFlowName(flowId);
                                    const flowDesc = vars[0]?.flowDescription;

                                    return (
                                        <div key={flowId} className="border rounded-lg p-4 bg-muted/20">
                                            <div className="flex items-center gap-2 mb-4 border-b pb-2">
                                                <h4 className="font-medium text-primary uppercase tracking-wider text-sm">
                                                    {flowName}
                                                </h4>
                                                {flowDesc && (
                                                    <span className="text-xs text-muted-foreground italic">
                                                        - {flowDesc}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                                                {vars.map(variable => (
                                                    <div key={variable.name} className="flex flex-col gap-1 border rounded-md p-3 bg-background shadow-sm">
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <div className="flex items-center gap-2 border-b pb-1 mb-2">
                                                                        <Label className="font-medium text-sm cursor-help">
                                                                            {variable.name}
                                                                        </Label>
                                                                        {variable.hasTolerance && <HelpCircle className="h-3 w-3 text-muted-foreground" />}
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p className="font-semibold">{variable.name}</p>
                                                                    {variable.description && <p className="text-xs">{variable.description}</p>}
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>

                                                        {variable.type === 'boolean' ? (
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={!!overrides[variable.name]}
                                                                    onChange={(e) => updateOverride(variable.name, e.target.checked)}
                                                                    className="h-4 w-4"
                                                                />
                                                                <span className="text-sm text-muted-foreground">Enabled</span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2">
                                                                <Input
                                                                    type={variable.type === 'number' ? 'number' : 'text'}
                                                                    value={overrides[variable.name] ?? ''}
                                                                    onChange={(e) => updateOverride(variable.name, variable.type === 'number' ? Number(e.target.value) : e.target.value)}
                                                                    placeholder={variable.default !== undefined ? `${variable.default}` : 'Value'}
                                                                    className="flex-1 h-8"
                                                                />
                                                                {variable.unit && (
                                                                    <span className="text-xs text-muted-foreground">{variable.unit}</span>
                                                                )}

                                                                {variable.hasTolerance && (
                                                                    <>
                                                                        <span className="text-muted-foreground">±</span>
                                                                        <Input
                                                                            type="number"
                                                                            min={0}
                                                                            value={overrides[variable.name + '_tolerance'] ?? ''}
                                                                            onChange={(e) => updateOverride(variable.name + '_tolerance', Number(e.target.value))}
                                                                            placeholder="Tol"
                                                                            className="w-16 h-8"
                                                                        />
                                                                    </>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
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

                {/* Cancel Dialog */}
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
    }

    // ========== STEP 2: PREVIEW WINDOWS & TRIGGERS (or Step 1 if no variables) ==========
    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                📅 {program.name}
                                <span className="text-xs px-2 py-1 rounded-full bg-purple-500/10 text-purple-600 font-medium">
                                    Advanced
                                </span>
                            </CardTitle>
                            <CardDescription className="mt-1">
                                Преглед на времеви прозорци и тригери преди стартиране
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="p-4 bg-muted/50 rounded-lg">
                            <div className="text-3xl font-bold text-purple-600">{windows.length}</div>
                            <div className="text-sm text-muted-foreground">Времеви прозорци</div>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg">
                            <div className="text-3xl font-bold text-orange-600">
                                {windows.reduce((sum: number, w: any) => sum + (w.triggers?.length || 0), 0)}
                            </div>
                            <div className="text-sm text-muted-foreground">Общо тригери</div>
                        </div>
                        <div className="p-4 bg-muted/50 rounded-lg">
                            <div className="text-3xl font-bold text-blue-600">
                                {windows.filter((w: any) => w.fallbackFlowId).length}
                            </div>
                            <div className="text-sm text-muted-foreground">С Fallback</div>
                        </div>
                    </div>

                    {/* Variables Summary (if any) */}
                    {hasVariables && (
                        <div className="border rounded-lg p-4 bg-green-500/5 border-green-500/20">
                            <h3 className="font-semibold mb-2 text-green-700 dark:text-green-400">✓ Конфигурирани променливи</h3>
                            <div className="grid gap-2 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 text-sm">
                                {allVars.map(v => (
                                    <div key={v.name} className="flex justify-between gap-2 p-2 bg-background rounded">
                                        <span className="text-muted-foreground truncate">{v.name}:</span>
                                        <span className="font-medium">
                                            {overrides[v.name]}
                                            {v.hasTolerance && <span className="text-muted-foreground ml-1">±{overrides[v.name + '_tolerance']}</span>}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <Button variant="link" size="sm" className="mt-2 p-0 h-auto" onClick={() => setStep(1)}>
                                ← Редактирай променливите
                            </Button>
                        </div>
                    )}

                    {/* Windows List */}
                    <div className="border rounded-lg p-4">
                        <h3 className="font-semibold mb-4">Времеви прозорци</h3>
                        <div className="space-y-2">
                            {windows.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    Няма дефинирани времеви прозорци. Редактирайте програмата, за да добавите.
                                </div>
                            ) : (
                                windows.map((window: any) => {
                                    const isExpanded = expandedWindows.has(window.id);
                                    const triggers = window.triggers || [];

                                    return (
                                        <div
                                            key={window.id}
                                            className="border rounded-lg overflow-hidden"
                                        >
                                            {/* Window Header */}
                                            <div
                                                className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
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
                                                    <span className="text-xs bg-muted px-2 py-1 rounded">
                                                        <Zap className="h-3 w-3 inline mr-1" />
                                                        {triggers.length} тригер{triggers.length !== 1 ? 'а' : ''}
                                                    </span>
                                                    <span className="text-xs bg-muted px-2 py-1 rounded">
                                                        <Clock className="h-3 w-3 inline mr-1" />
                                                        на всеки {window.checkInterval} мин
                                                    </span>
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
                                                        triggers.map((trigger: any, triggerIndex: number) => (
                                                            <div
                                                                key={trigger.id}
                                                                className={cn(
                                                                    "flex items-center justify-between p-3 rounded-md border-l-4",
                                                                    trigger.behavior === 'break'
                                                                        ? "border-l-red-500 bg-red-500/5"
                                                                        : "border-l-green-500 bg-green-500/5"
                                                                )}
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs text-muted-foreground">
                                                                        #{triggerIndex + 1}
                                                                    </span>
                                                                    <span className="font-medium">
                                                                        {trigger.sensorId}
                                                                    </span>
                                                                    <span className="font-mono text-sm">
                                                                        {formatOperator(trigger.operator)} {trigger.value}
                                                                        {trigger.operator === 'between' && ` - ${trigger.valueMax}`}
                                                                    </span>
                                                                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                                                    <span className="text-sm text-primary">
                                                                        {getFlowName(trigger.flowId)}
                                                                    </span>
                                                                </div>
                                                                <span className={cn(
                                                                    "text-xs px-2 py-1 rounded-full font-medium",
                                                                    trigger.behavior === 'break'
                                                                        ? "bg-red-500/10 text-red-600"
                                                                        : "bg-green-500/10 text-green-600"
                                                                )}>
                                                                    {trigger.behavior === 'break' ? '🛑 Break' : '⏭️ Continue'}
                                                                </span>
                                                            </div>
                                                        ))
                                                    )}

                                                    {/* Fallback Info */}
                                                    {window.fallbackFlowId && (
                                                        <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-md">
                                                            <span className="text-amber-600 font-medium">
                                                                ⚡ Fallback: {getFlowName(window.fallbackFlowId)}
                                                            </span>
                                                            <p className="text-xs text-muted-foreground mt-1">
                                                                Изпълнява се ако нито един "Break" тригер не се активира преди края на прозореца
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="border border-blue-200 bg-blue-50/30 dark:bg-blue-950/20 rounded-lg p-4">
                        <div className="flex gap-3">
                            <div className="text-2xl">💡</div>
                            <div>
                                <h4 className="font-medium">Как работи Advanced режимът?</h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                    След стартиране, системата ще проверява условията на тригерите в рамките на всеки времеви прозорец.
                                    Когато условие се изпълни, съответният поток ще се стартира автоматично.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="ghost" onClick={() => setCancelDialogOpen(true)}>
                            <X className="mr-2 h-4 w-4" />
                            Cancel
                        </Button>
                        <Button
                            onClick={handleStart}
                            className="gap-2 bg-green-600 hover:bg-green-700"
                            disabled={starting || windows.length === 0}
                        >
                            <Play className="h-4 w-4" />
                            {starting ? 'Стартиране...' : 'Start Program'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Cancel Confirmation Dialog */}
            <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cancel Configuration?</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to cancel? The program will be unloaded and you'll need to load it again.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
                            Continue
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
