import React, { useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LiveExecutionMonitor } from '@/components/activeProgram/LiveExecutionMonitor';
import { StopCircle, Play, Loader2, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import { socketService } from '@/core/SocketService';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface FlowTestDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    flowId: string | null;
    flowName: string;
    isActive: boolean; // System busy status passed from parent
}

interface IVariable {
    id: string;
    name: string;
    type: 'number' | 'string' | 'boolean';
    value?: any;
    scope: 'local' | 'global';
    unit?: string;
    hasTolerance?: boolean;
    description?: string;
}

export const FlowTestDialog: React.FC<FlowTestDialogProps> = ({
    open,
    onOpenChange,
    flowId,
    flowName,
    isActive
}) => {
    // Internal state for the test lifecycle
    const [step, setStep] = useState<'setup' | 'running'>('setup');
    const [loading, setLoading] = useState(false);
    const [starting, setStarting] = useState(false);

    // We maintain a local "running" state that updates instantly via sockets, 
    // instead of waiting for parent polling.
    const [isRunning, setIsRunning] = useState(false);
    const [testFinished, setTestFinished] = useState(false);

    // Config state
    const [variables, setVariables] = useState<IVariable[]>([]);
    const [overrides, setOverrides] = useState<Record<string, any>>({});

    // Reset state when dialog opens/closes or flowId changes
    useEffect(() => {
        if (open && flowId) {
            setStep('setup');
            setIsRunning(false);
            setTestFinished(false);
            setOverrides({});
            fetchFlowDetails(flowId);
        } else {
            setVariables([]);
        }
    }, [open, flowId]);

    // Socket listener for real-time status updates
    useEffect(() => {
        if (!open) return;

        const handleStateChange = (data: any) => {
            // data.state is the XState value
            // 'idle', 'stopped', 'completed', 'failed', 'error' -> Not Running
            if (['idle', 'stopped', 'completed', 'failed', 'error'].includes(data.state)) {
                setIsRunning(false);
                if (step === 'running') {
                    setTestFinished(true);
                }
            } else if (data.state === 'running' || data.state === 'paused') {
                setIsRunning(true);
            }
        };

        socketService.on('automation:state_change', handleStateChange);

        return () => {
            socketService.off('automation:state_change', handleStateChange);
        };
    }, [open, step]);

    const fetchFlowDetails = async (id: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/flows/${id}`);
            if (!res.ok) throw new Error('Failed to load flow details');
            const data = await res.json();

            // Filter for GLOBAL variables/inputs that need value
            const globals = (data.variables || []).filter((v: IVariable) => v.scope === 'global');

            // Initialize defaults
            const newOverrides: Record<string, any> = {};
            globals.forEach((v: IVariable) => {
                if (v.value !== undefined) newOverrides[v.name] = v.value;
            });

            setVariables(globals);
            setOverrides(newOverrides);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load flow details');
        } finally {
            setLoading(false);
        }
    };

    const handleStartTest = async () => {
        if (!flowId) return;

        // Validate variables
        for (const v of variables) {
            if (overrides[v.name] === undefined || overrides[v.name] === '') {
                toast.error(`Please provide a value for ${v.name}`);
                return;
            }
            if (v.type === 'number' && isNaN(Number(overrides[v.name]))) {
                toast.error(`Invalid number for ${v.name}`);
                return;
            }
            if (v.hasTolerance) {
                if (overrides[v.name + '_tolerance'] === undefined || overrides[v.name + '_tolerance'] === '') {
                    toast.error(`Please provide tolerance for ${v.name}`);
                    return;
                }
            }
        }

        setStarting(true);
        try {
            // 1. Load with overrides
            const loadRes = await fetch('/api/automation/load', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    programId: flowId,
                    overrides: overrides
                })
            });

            if (!loadRes.ok) throw new Error((await loadRes.json()).message);

            // 2. Start
            const startRes = await fetch('/api/automation/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });

            if (!startRes.ok) throw new Error((await startRes.json()).message);

            toast.success('Test started');
            setStep('running');
            setIsRunning(true); // Optimistic update
            setTestFinished(false);
        } catch (error: any) {
            console.error(error);
            toast.error(`Failed to start test: ${error.message}`);
        } finally {
            setStarting(false);
        }
    };

    const handleStopInternal = async () => {
        try {
            await fetch('/api/automation/stop', { method: 'POST' });
            toast.success('Stop command sent');
            // Local state update via socket event, or fallback
        } catch (error) {
            console.log(error);
            toast.error('Failed to stop');
        }
    };

    const updateOverride = (name: string, value: any) => {
        setOverrides(prev => ({ ...prev, [name]: value }));
    };

    // Render variables helper
    const renderVariableInput = (v: IVariable) => {
        return (
            <div key={v.id} className="grid gap-1.5 p-3 border rounded-md bg-muted/20">
                <div className="flex items-center justify-between">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="flex items-center gap-2">
                                    <Label htmlFor={v.id} className="cursor-help font-medium">{v.name}</Label>
                                    {v.description && <HelpCircle className="h-3 w-3 text-muted-foreground" />}
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{v.description || v.name}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    {v.type === 'boolean' && (
                        <input
                            id={v.id}
                            type="checkbox"
                            checked={!!overrides[v.name]}
                            onChange={(e) => updateOverride(v.name, e.target.checked)}
                            className="h-4 w-4"
                        />
                    )}
                </div>

                {v.type !== 'boolean' && (
                    <div className="flex items-center gap-2">
                        <Input
                            id={v.id}
                            type={v.type === 'number' ? "number" : "text"}
                            placeholder="Value"
                            value={overrides[v.name] ?? ''}
                            onChange={(e) => updateOverride(v.name, v.type === 'number' ? e.target.value : e.target.value)}
                            onBlur={(e) => v.type === 'number' && updateOverride(v.name, Number(e.target.value))}
                            className="bg-background"
                        />
                        {v.unit && <span className="text-sm text-muted-foreground w-8 shrink-0">{v.unit}</span>}

                        {v.hasTolerance && (
                            <div className="flex items-center gap-1 ml-2">
                                <span className="text-sm text-muted-foreground">±</span>
                                <Input
                                    type="number"
                                    placeholder="Tol"
                                    className="w-20 bg-background"
                                    value={overrides[v.name + '_tolerance'] ?? ''}
                                    onChange={(e) => updateOverride(v.name + '_tolerance', e.target.value)}
                                    onBlur={(e) => updateOverride(v.name + '_tolerance', Number(e.target.value))}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    const handleOpenChange = (val: boolean) => {
        // Prevent closing if running!
        if (!val && isRunning) {
            toast.warning('Test is running. Please Stop it first.');
            return;
        }
        onOpenChange(val);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col [&>button]:hidden">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <DialogTitle>Test Execution: {flowName}</DialogTitle>
                        {isRunning && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 animate-pulse">
                                RUNNING
                            </span>
                        )}
                        {!isRunning && testFinished && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                FINISHED
                            </span>
                        )}
                    </div>
                    <DialogDescription>
                        {step === 'setup' ? 'Configure global variables for this test.' : 'Real-time execution log.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden min-h-[400px] border rounded-md bg-slate-50 dark:bg-slate-950 flex flex-col relative">

                    {/* LOADING STATE */}
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-50">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    )}

                    {/* SETUP VIEW */}
                    {step === 'setup' && flowId && (
                        <div className="p-6 overflow-y-auto">
                            {variables.length > 0 ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 p-3 bg-blue-500/10 text-blue-600 rounded-md text-sm">
                                        <HelpCircle className="h-4 w-4" />
                                        This flow requires global variables to run correctly.
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {variables.map(renderVariableInput)}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full py-12 text-muted-foreground">
                                    <Play className="h-12 w-12 opacity-20 mb-4" />
                                    <p>Ready to start test execution.</p>
                                    <p className="text-sm opacity-70">No global variables required.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* RUNNING VIEW (MONITOR) */}
                    {step === 'running' && flowId && (
                        <LiveExecutionMonitor
                            programId={flowId}
                            isActive={true}
                        />
                    )}
                </div>

                <DialogFooter className="mt-4">
                    {step === 'setup' ? (
                        <>
                            <Button variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleStartTest} disabled={starting || (isActive && !isRunning) || loading}>
                                {starting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                                Start Test
                            </Button>
                        </>
                    ) : (
                        // RUNNING STATE FOOTER - SINGLE ACTION BUTTON + CLOSE
                        <>
                            {isRunning ? (
                                <Button variant="destructive" onClick={handleStopInternal} className="w-full sm:w-auto">
                                    <StopCircle className="mr-2 h-4 w-4" />
                                    Stop Test
                                </Button>
                            ) : (
                                <Button variant="secondary" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
                                    Close
                                </Button>
                            )}
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
