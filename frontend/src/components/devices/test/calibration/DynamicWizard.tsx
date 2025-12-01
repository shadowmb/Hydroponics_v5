import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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

interface DynamicWizardProps {
    config: {
        component: string;
        steps: WizardStep[];
        formula?: string;
    };
    onSave: (data: any) => void;
    onRunCommand?: (cmd: string, params: any) => Promise<any>;
}

export const DynamicWizard: React.FC<DynamicWizardProps> = ({ config, onSave, onRunCommand }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [errorDialogOpen, setErrorDialogOpen] = useState(false);
    const [errorDialogMessage, setErrorDialogMessage] = useState("");

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

    const renderStepContent = () => {
        switch (step.type) {
            case 'input':
                return (
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
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <label className="text-sm font-medium">{step.label}</label>
                                <span className="text-sm text-muted-foreground">{formData[step.key!] || 0}</span>
                            </div>
                            <Slider
                                value={[formData[step.key!] || 0]}
                                max={100}
                                step={1}
                                onValueChange={(vals: number[]) => handleInputChange(step.key!, vals[0])}
                            />
                        </div>
                    </div>
                );

            default:
                return <div>Unknown step type: {step.type}</div>;
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
