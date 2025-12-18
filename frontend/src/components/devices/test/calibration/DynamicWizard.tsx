import React, { useState } from 'react';
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PhSmartWizard } from './PhSmartWizard';
import { EcSmartWizard } from './EcSmartWizard';
import { OffsetWizard } from './OffsetWizard';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import type { WizardStep } from '../../../../types/Calibration';
import { Play, Check, ArrowRight } from 'lucide-react';

import { StrategyRegistry } from '../../../../../../shared/strategies/StrategyRegistry';

interface DynamicWizardProps {
    strategyId: string;
    onSave: (data: any) => void;
    onRunCommand?: (cmd: string, params: any) => Promise<any>;
    baseUnit?: string;
    targetUnit?: string;
    device?: any;
    template?: any;
}

// Helper to generate steps based on Strategy Calibration Config
// TODO: This could be moved to a separate file or within StrategyRegistry if it gets too large
const generateSteps = (strategyId: string, baseUnit?: string, targetUnit?: string): { steps: WizardStep[], formula?: string } | null => {
    const strategy = StrategyRegistry.get(strategyId);
    if (!strategy || !strategy.calibration) return null;

    const { component, xLabel, yLabel } = strategy.calibration;

    // Use units if provided, otherwise fallback to labels
    // FIX: Avoid duplicate units - check if label already contains unit in parentheses
    const hasUnitInLabel = (label: string, unit: string) => label?.includes(`(${unit})`);

    const displayXLabel = baseUnit && !hasUnitInLabel(xLabel || '', baseUnit)
        ? `${xLabel || 'Raw Input'} (${baseUnit})`
        : (xLabel || 'Raw Input');
    const displayYLabel = targetUnit && !hasUnitInLabel(yLabel || '', targetUnit)
        ? `${yLabel || 'Calibrated Value'} (${targetUnit})`
        : (yLabel || 'Calibrated Value');

    // Template: Multi-Point Table (e.g. Tank Volume)
    if (component === 'MultiPointTable') {
        return {
            steps: [
                {
                    label: 'Multi-Point Calibration',
                    instructions: `Add points to map ${displayXLabel} to ${displayYLabel}.`,
                    type: 'points_table',
                    key: 'data', // Standard key for table data
                    headers: [
                        { label: displayXLabel, key: 'raw' },
                        { label: displayYLabel, key: 'value' }
                    ]
                }
            ]
        };
    }

    if (component === 'TwoPointLinear') {
        return {
            steps: [
                {
                    label: 'Test Parameters',
                    instructions: 'Enter the duration to run the pump for calibration.',
                    type: 'input',
                    key: 'duration',
                    unit: 'seconds',
                    default: 10
                },
                {
                    label: 'Run Pump',
                    instructions: 'Run the pump for the specified duration to measure output.',
                    type: 'action',
                    command: 'TEST_DOSING',
                    params: { duration: 'input_duration' }
                },
                {
                    label: 'Enter Measurement',
                    instructions: `Enter the volume (${yLabel || 'ml'}) dispensed during the test.`,
                    type: 'input',
                    key: 'measuredValue',
                    unit: yLabel || 'ml'
                }
            ]
        };
    }

    return null;
};

export const DynamicWizard: React.FC<DynamicWizardProps> = ({ strategyId, onSave, onRunCommand, baseUnit, targetUnit, device, template }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [errorDialogOpen, setErrorDialogOpen] = useState(false);
    const [errorDialogMessage, setErrorDialogMessage] = useState("");

    const config = generateSteps(strategyId, baseUnit, targetUnit);

    // Specialized Wizards
    const strategy = StrategyRegistry.get(strategyId);
    if (strategy?.calibration?.component === 'PhSmartWizard' && onRunCommand) {
        return <PhSmartWizard onSave={onSave} onRunCommand={onRunCommand} />;
    }

    if (strategy?.calibration?.component === 'EcSmartWizard' && onRunCommand) {
        return <EcSmartWizard onSave={onSave} onRunCommand={onRunCommand} />;
    }

    if (strategy?.calibration?.component === 'OffsetWizard' && onRunCommand) {
        return (
            <OffsetWizard
                onSave={onSave}
                onRunCommand={onRunCommand}
                role={template?.roles?.[device?.config?.activeRole]?.label || Object.values(template?.roles || {})[0]?.label || 'Generic'}
                unit={targetUnit || baseUnit}
            />
        );
    }


    if (!config || !config.steps || config.steps.length === 0) {

        return <div className="p-4 text-red-500">Error: No wizard configuration found for strategy '{strategyId}'</div>;
    }

    const step = config.steps[currentStep];
    const isLastStep = currentStep === config.steps.length - 1;

    const handleNext = () => {
        if (isLastStep) {
            onSave(formData);
        } else {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleInputChange = (key: string, value: any) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const renderActionUI = (actionStep: any) => {
        // Determine if THIS specific action is running
        const isRunning = formData._isRunning && (formData._runningCommand === actionStep.command || (!formData._runningCommand && actionStep.command === 'TEST_DOSING'));
        const countdown = formData._countdown || 0;
        const isStopwatch = !!actionStep.writeToField;

        const handleStop = async () => {
            if (onRunCommand) {
                await onRunCommand('STOP', {}); // Send generic STOP or specific OFF

                // If in stopwatch mode, capture the duration
                if (isStopwatch && formData._startTime) {
                    const elapsed = Date.now() - formData._startTime;
                    handleInputChange(actionStep.writeToField, elapsed);
                }

                setFormData(prev => ({ ...prev, _isRunning: false, _countdown: 0, _runningCommand: null, _startTime: null }));
            }
        };

        const handleRunTest = async () => {
            if (actionStep.command && onRunCommand) {
                const resolvedParams: any = {};
                let duration = 0;

                // Resolve params
                if (actionStep.params) {
                    Object.entries(actionStep.params).forEach(([k, v]) => {
                        if (typeof v === 'string' && v.startsWith('input_')) {
                            const inputKey = v.replace('input_', '');
                            resolvedParams[k] = formData[inputKey];
                            if (k === 'duration') duration = Number(formData[inputKey]);
                        } else {
                            resolvedParams[k] = v;
                        }
                    });
                }

                // Validation (only if NOT stopwatch mode, as stopwatch implies manual duration)
                if (actionStep.command === 'TEST_DOSING' && !isStopwatch) {
                    if (actionStep.params && actionStep.params.duration && (isNaN(duration) || duration <= 0)) {
                        setErrorDialogMessage("Please enter a valid duration in seconds.");
                        setErrorDialogOpen(true);
                        return;
                    }
                    // ... (Safety check logic omitted for brevity, can be kept if needed but simplified here for generic actions)
                }

                setFormData(prev => ({
                    ...prev,
                    _isRunning: true,
                    _runningCommand: actionStep.command,
                    _countdown: isStopwatch ? 0 : duration,
                    _startTime: isStopwatch ? Date.now() : null
                }));

                // Timer Logic
                const interval = setInterval(() => {
                    setFormData(prev => {
                        if (!prev._isRunning) {
                            clearInterval(interval);
                            return prev;
                        }

                        if (isStopwatch) {
                            // Count UP
                            return { ...prev, _countdown: Date.now() - (prev._startTime || Date.now()) };
                        } else {
                            // Count DOWN
                            const newCount = (prev._countdown || 0) - 1;
                            if (newCount <= 0) {
                                clearInterval(interval);
                                return { ...prev, _isRunning: false, _countdown: 0, _runningCommand: null };
                            }
                            return { ...prev, _countdown: newCount };
                        }
                    });
                }, isStopwatch ? 100 : 1000); // Faster update for stopwatch

                try {
                    await onRunCommand(actionStep.command, resolvedParams);
                } catch (e) {
                    clearInterval(interval);
                    setFormData(prev => ({ ...prev, _isRunning: false, _countdown: 0, _runningCommand: null, _startTime: null }));
                }
            }
        };

        return (
            <div className="space-y-4">
                {isRunning && (
                    <div className="flex items-center justify-center p-4 bg-green-100 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-900">
                        <div className="flex flex-col items-center gap-2">
                            <div className="flex items-center gap-2">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                </span>
                                <span className="font-bold text-green-700 dark:text-green-400">RUNNING</span>
                            </div>
                            <span className="text-2xl font-mono font-bold">
                                {isStopwatch ? `${(countdown / 1000).toFixed(1)}s` : `${countdown}s`}
                            </span>
                        </div>
                    </div>
                )}

                <div className="flex gap-2">
                    {!isRunning ? (
                        <Button onClick={handleRunTest} className="w-full" variant="secondary">
                            <Play className="mr-2 h-4 w-4" /> {actionStep.label || "Start Test"}
                        </Button>
                    ) : (
                        <Button onClick={handleStop} variant="destructive" className="w-full animate-pulse">
                            STOP {isStopwatch ? "(Save Duration)" : ""}
                        </Button>
                    )}
                </div>
            </div>
        );
    };

    const renderStepContent = () => {
        switch (step.type) {
            case 'input':
                return (
                    <div className="space-y-6">
                        <div className="space-y-4">
                            {step.fields ? (
                                step.fields.map((field: any) => (
                                    <div key={field.key} className="space-y-2">
                                        <label className="text-sm font-medium">{field.label}</label>
                                        <div className="flex gap-2">
                                            <Input
                                                type="number"
                                                value={formData[field.key] || field.default || ''}
                                                onChange={(e) => handleInputChange(field.key, parseFloat(e.target.value))}
                                                placeholder="Enter value"
                                            />
                                            {field.unit && <span className="flex items-center text-sm text-muted-foreground">{field.unit}</span>}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">{step.label}</label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="number"
                                            value={formData[step.key!] || step.default || ''}
                                            onChange={(e) => handleInputChange(step.key!, parseFloat(e.target.value))}
                                            placeholder="Enter value"
                                        />
                                        {step.unit && <span className="flex items-center text-sm text-muted-foreground">{step.unit}</span>}
                                    </div>
                                </div>
                            )}
                        </div>

                        {step.optionalAction && (
                            <div className="border rounded-md p-4 bg-muted/20">
                                <div className="flex items-center justify-between mb-4 cursor-pointer" onClick={() => setFormData(prev => ({ ...prev, _showOptionalTest: !prev._showOptionalTest }))}>
                                    <div className="flex items-center gap-2 font-medium">
                                        <Play className="h-4 w-4" />
                                        {step.optionalAction.label}
                                    </div>
                                    <Button variant="ghost" size="sm">
                                        {formData._showOptionalTest ? 'Hide' : 'Show'}
                                    </Button>
                                </div>

                                {formData._showOptionalTest && (
                                    <div className="space-y-4 pt-2 border-t">
                                        <p className="text-sm text-muted-foreground">{step.optionalAction.description}</p>
                                        <p className="text-sm bg-muted p-2 rounded">{step.optionalAction.instructions}</p>
                                        {renderActionUI(step.optionalAction)}
                                    </div>
                                )}
                            </div>
                        )}

                        {step.actions && (
                            <div className="space-y-4 pt-4 border-t">
                                <label className="text-sm font-medium">Test Actions</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {step.actions.map((action: any, idx: number) => (
                                        <div key={idx} className="border rounded-md p-4 bg-muted/20 space-y-3">
                                            <div className="font-medium flex items-center gap-2">
                                                <Play className="h-4 w-4" />
                                                {action.label}
                                            </div>
                                            <p className="text-xs text-muted-foreground">{action.instructions}</p>
                                            {renderActionUI(action)}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                );


            case 'action':
                const isRunning = step.command === 'TEST_DOSING' && !!formData._isRunning;
                const countdown = formData._countdown || 0;

                const handleStop = async () => {
                    if (onRunCommand) {
                        await onRunCommand('OFF', {}); // Emergency Stop
                        setFormData(prev => ({ ...prev, _isRunning: false, _countdown: 0 }));
                    }
                };

                const handleRunTest = async () => {
                    if (step.command && onRunCommand) {
                        // Resolve params
                        const resolvedParams: any = {};
                        let duration = 0;
                        if (step.params) {
                            Object.entries(step.params).forEach(([k, v]) => {
                                if (typeof v === 'string' && v.startsWith('input_')) {
                                    const inputKey = v.replace('input_', '');
                                    resolvedParams[k] = formData[inputKey];
                                    if (k === 'duration') duration = Number(formData[inputKey]);
                                } else {
                                    resolvedParams[k] = v;
                                }
                            });
                        }

                        // Validation: Check if duration is required and valid
                        if (step.params && step.params.duration && (isNaN(duration) || duration <= 0)) {
                            setErrorDialogMessage("Please enter a valid duration in seconds.");
                            setErrorDialogOpen(true);
                            return;
                        }

                        // Pre-flight Safety Check for TEST_DOSING
                        if (step.command === 'TEST_DOSING') {
                            try {
                                console.log('🔍 [DynamicWizard] Running Safety Check (READ)...');
                                const status = await onRunCommand('READ', {});
                                console.log('🔍 [DynamicWizard] READ Result:', status);

                                // Check for various common state properties
                                const state = status?.state ?? status?.value ?? status?.val;
                                console.log('🔍 [DynamicWizard] Extracted State:', state);

                                // Loose equality check for 1/"1"/true/"ON"
                                if (state == 1 || state === true || state === 'ON' || state === 'on') {
                                    console.warn('⚠️ [DynamicWizard] Pump is ON. Aborting.');
                                    throw new Error('Pump is already ON! Please turn it OFF before running the test.');
                                }
                            } catch (err: any) {
                                console.error('❌ [DynamicWizard] Safety Check Failed:', err);

                                if (err.message === 'Pump is already ON! Please turn it OFF before running the test.') {
                                    setErrorDialogMessage(err.message);
                                    setErrorDialogOpen(true);
                                    return;
                                }
                                // If READ failed, the parent probably already toasted.
                                return;
                            }
                        }

                        // Start UI Timer
                        setFormData(prev => ({ ...prev, _isRunning: true, _countdown: duration }));

                        // Start Countdown Interval
                        const interval = setInterval(() => {
                            setFormData(prev => {
                                const newCount = (prev._countdown || 0) - 1;
                                if (newCount <= 0) {
                                    clearInterval(interval);
                                    return { ...prev, _isRunning: false, _countdown: 0 };
                                }
                                return { ...prev, _countdown: newCount };
                            });
                        }, 1000);

                        try {
                            await onRunCommand(step.command, resolvedParams);
                        } catch (e) {
                            clearInterval(interval);
                            setFormData(prev => ({ ...prev, _isRunning: false, _countdown: 0 }));
                        }
                    }
                };

                return (
                    <div className="space-y-4">
                        <div className="p-4 bg-muted rounded-md text-sm">
                            {step.instructions || "Click button to execute action."}
                        </div>

                        {/* Input Fields for Params */}
                        {step.params && Object.entries(step.params).map(([k, v]) => {
                            if (typeof v === 'string' && v.startsWith('input_')) {
                                const inputKey = v.replace('input_', '');
                                return (
                                    <div key={k} className="space-y-2">
                                        <label className="text-sm font-medium capitalize">{inputKey}</label>
                                        <Input
                                            type="number"
                                            disabled={isRunning}
                                            value={formData[inputKey] || ''}
                                            onChange={(e) => handleInputChange(inputKey, parseFloat(e.target.value))}
                                            placeholder={`Enter ${inputKey}`}
                                        />
                                    </div>
                                );
                            }
                            return null;
                        })}

                        {/* Status Indicator */}
                        {isRunning && (
                            <div className="flex items-center justify-center p-4 bg-green-100 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-900">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className="relative flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                        </span>
                                        <span className="font-bold text-green-700 dark:text-green-400">PUMP RUNNING</span>
                                    </div>
                                    <span className="text-2xl font-mono font-bold">{countdown}s</span>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                            {!isRunning ? (
                                <Button onClick={handleRunTest} className="w-full">
                                    <Play className="mr-2 h-4 w-4" /> {step.label}
                                </Button>
                            ) : (
                                <Button onClick={handleStop} variant="destructive" className="w-full animate-pulse">
                                    STOP (EMERGENCY)
                                </Button>
                            )}
                        </div>
                    </div>
                );

            case 'measure':
                return (
                    <div className="space-y-4">
                        <div className="p-4 bg-muted rounded-md text-sm">
                            {step.instructions}
                        </div>
                        <div className="flex items-center justify-between p-4 border rounded-md">
                            <span className="text-sm font-medium">Current Reading:</span>
                            <span className="text-xl font-mono">--</span> {/* Needs live value prop */}
                        </div>
                        <Button onClick={() => handleInputChange(step.refKey!, 123 /* Mock Reading */)} variant="outline" className="w-full">
                            Capture Value
                        </Button>
                    </div>
                );

            case 'set_limit':
                return (
                    <div className="space-y-6">
                        <div className="p-4 bg-muted rounded-md text-sm">
                            {step.instructions}
                        </div>

                        {/* Simulation Mode Toggle */}
                        <div className="flex items-center justify-between p-2 border rounded bg-muted/10">
                            <span className="text-sm font-medium">Simulation Mode</span>
                            <Button
                                variant={formData._simulationMode ? "default" : "outline"}
                                size="sm"
                                onClick={() => setFormData(prev => ({ ...prev, _simulationMode: !prev._simulationMode }))}
                            >
                                {formData._simulationMode ? "ON" : "OFF"}
                            </Button>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <label className="text-sm font-medium">{step.label}</label>
                                <span className="text-sm text-muted-foreground">{formData[step.key!] || 0}</span>
                            </div>
                            <Slider
                                value={[formData[step.key!] || 0]}
                                // Ideally, we should read the max from the driver or template, but for now let's assume 0-100 or 0-255 based on context?
                                // The strategy says "Map 0-100% UI range to specific hardware limits". 
                                // So here we are setting the RAW limits. 
                                // If it's a servo, we might want 0-180. If it's PWM, 0-255.
                                // Let's assume 255 for now as a safe default for "Raw", or add a max prop to the step config later.
                                max={255}
                                step={1}
                                onValueChange={(vals: number[]) => {
                                    const val = vals[0];
                                    handleInputChange(step.key!, val);

                                    // Live Test Logic
                                    if (formData._simulationMode) {
                                        // Update simulated position immediately
                                        setFormData(prev => ({ ...prev, _simulatedPosition: val }));
                                    } else {
                                        // Send command to hardware (Throttled)
                                        // We need a ref for throttling, but for simplicity in this wizard we can just fire it.
                                        // Ideally use lodash.debounce or similar, but let's try direct first.
                                        if (onRunCommand) {
                                            onRunCommand('WRITE', { value: val }).catch(err => console.error("Live test failed", err));
                                        }
                                    }
                                }}
                            />
                        </div>

                        {/* Simulation Feedback */}
                        {formData._simulationMode && (
                            <div className="space-y-2 p-4 border border-dashed rounded-md">
                                <p className="text-xs font-mono text-muted-foreground uppercase">Simulated Device Output</p>
                                <div className="h-4 w-full bg-secondary rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary transition-all duration-75"
                                        style={{ width: `${((formData._simulatedPosition || 0) / 255) * 100}%` }}
                                    />
                                </div>
                                <p className="text-center text-xs">{formData._simulatedPosition || 0} / 255</p>
                            </div>
                        )}
                    </div>
                );

            case 'points_table':
                const points = (formData[step.key!] as any[]) || [];

                const addPoint = () => {
                    // Sort by raw (distance) automatically? Or just append.
                    // Let's just append for now.
                    const newPoint = { raw: 0, value: 0 };
                    handleInputChange(step.key!, [...points, newPoint]);
                };

                const updatePoint = (index: number, field: string, value: number) => {
                    const newPoints = [...points];
                    newPoints[index] = { ...newPoints[index], [field]: value };
                    handleInputChange(step.key!, newPoints);
                };

                const removePoint = (index: number) => {
                    const newPoints = points.filter((_, i) => i !== index);
                    handleInputChange(step.key!, newPoints);
                };

                const captureReading = async (index: number) => {
                    if (onRunCommand) {
                        try {
                            const result = await onRunCommand('READ', {});

                            // IMPORTANT: For calibration, we need the BASE VALUE (normalized to mm)
                            // Backend returns: { raw, value, unit, details: { baseValue, baseUnit } }
                            let reading = 0;

                            // Priority: details.baseValue > baseValue > raw > value > raw number
                            if (result?.details?.baseValue !== undefined) {
                                reading = result.details.baseValue;
                                console.log('[DynamicWizard] Using details.baseValue:', reading);
                            } else if (result && typeof result.baseValue === 'number') {
                                reading = result.baseValue;
                                console.log('[DynamicWizard] Using baseValue:', reading);
                            } else if (result && typeof result.raw === 'number') {
                                reading = result.raw;
                                console.log('[DynamicWizard] FALLBACK to raw:', reading, '- baseValue not found!');
                            } else if (result && typeof result.value === 'number') {
                                reading = result.value;
                                console.log('[DynamicWizard] FALLBACK to value:', reading);
                            } else if (typeof result === 'number') {
                                reading = result;
                                console.log('[DynamicWizard] FALLBACK to result number:', reading);
                            }

                            console.log('[DynamicWizard] Full result object:', result);

                            updatePoint(index, 'raw', reading);
                        } catch (err) {
                            console.error("[DynamicWizard] Failed to capture reading:", err);
                            setErrorDialogMessage("Failed to read sensor value.");
                            setErrorDialogOpen(true);
                        }
                    } else {
                        console.warn('[DynamicWizard] onRunCommand not available');
                    }
                };

                return (
                    <div className="space-y-4">
                        <div className="p-4 bg-muted rounded-md text-sm">
                            {step.instructions}
                        </div>

                        <div className="border rounded-md overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-muted">
                                    <tr>
                                        {step.headers?.map((h: any) => (
                                            <th key={h.label} className="p-2 text-left font-medium">{h.label}</th>
                                        ))}
                                        <th className="p-2 w-[50px]"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {points.map((point: any, idx: number) => (
                                        <tr key={idx} className="border-t">
                                            <td className="p-2">
                                                <div className="flex gap-2">
                                                    <Input
                                                        type="number"
                                                        value={point.raw}
                                                        onChange={(e) => updatePoint(idx, 'raw', parseFloat(e.target.value))}
                                                        className="w-full"
                                                    />
                                                    <Button variant="outline" size="icon" onClick={() => captureReading(idx)} title="Get Reading">
                                                        <ArrowRight className="h-3 w-3" /> {/* Reusing icon for 'Fetch' */}
                                                    </Button>
                                                </div>
                                            </td>
                                            <td className="p-2">
                                                <Input
                                                    type="number"
                                                    value={point.value}
                                                    onChange={(e) => updatePoint(idx, 'value', parseFloat(e.target.value))}
                                                />
                                            </td>
                                            <td className="p-2 text-right">
                                                <Button variant="ghost" size="icon" onClick={() => removePoint(idx)} className="text-destructive hover:text-destructive">
                                                    <span className="sr-only">Delete</span>
                                                    &times;
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                    {points.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="p-4 text-center text-muted-foreground">
                                                No points defined. Click "Add Point" to start.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <Button onClick={addPoint} variant="secondary" className="w-full">
                            + Add Point
                        </Button>
                    </div>
                );
        }
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Step {currentStep + 1}: {step.label}</CardTitle>
                    <CardDescription>
                        {step.instructions}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {renderStepContent()}

                    <div className="flex justify-between pt-4 border-t">
                        <Button variant="outline" onClick={handleBack} disabled={currentStep === 0}>
                            Back
                        </Button>
                        <Button onClick={handleNext}>
                            {isLastStep ? <><Check className="mr-2 h-4 w-4" /> Save Calibration</> : <><ArrowRight className="mr-2 h-4 w-4" /> Next</>}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-destructive">Safety Warning</DialogTitle>
                        <DialogDescription>
                            {errorDialogMessage}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button onClick={() => setErrorDialogOpen(false)}>OK</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};
