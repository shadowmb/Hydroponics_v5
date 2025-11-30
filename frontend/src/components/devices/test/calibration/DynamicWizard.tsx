import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { WizardStep } from '../../../../types/Calibration';
import { Play, Check, ArrowRight } from 'lucide-react';

interface DynamicWizardProps {
    config: {
        component: string;
        steps: WizardStep[];
        formula?: string;
    };
    onSave: (data: any) => void;
    onRunCommand?: (cmd: string, params: any) => Promise<void>;
}

export const DynamicWizard: React.FC<DynamicWizardProps> = ({ config, onSave, onRunCommand }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [formData, setFormData] = useState<Record<string, any>>({});

    const step = config.steps[currentStep];
    const isLastStep = currentStep === config.steps.length - 1;

    const handleNext = () => {
        if (isLastStep) {
            onSave(formData);
        } else {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handleInputChange = (key: string, value: any) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleAction = async () => {
        if (step.type === 'action' && step.command && onRunCommand) {
            // Resolve params (e.g. "input_duration" -> formData.duration)
            const resolvedParams: any = {};
            if (step.params) {
                Object.entries(step.params).forEach(([k, v]) => {
                    if (typeof v === 'string' && v.startsWith('input_')) {
                        const inputKey = v.replace('input_', '');
                        resolvedParams[k] = formData[inputKey]; // You might need a previous step to input this
                    } else {
                        resolvedParams[k] = v;
                    }
                });
            }
            await onRunCommand(step.command, resolvedParams);
        }
    };

    const renderStepContent = () => {
        switch (step.type) {
            case 'input':
                return (
                    <div className="space-y-4">
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
                    </div>
                );

            case 'action':
                return (
                    <div className="space-y-4">
                        <div className="p-4 bg-muted rounded-md text-sm">
                            {step.instructions || "Click button to execute action."}
                        </div>
                        {step.params && Object.entries(step.params).map(([k, v]) => {
                            if (typeof v === 'string' && v.startsWith('input_')) {
                                const inputKey = v.replace('input_', '');
                                return (
                                    <div key={k} className="space-y-2">
                                        <label className="text-sm font-medium capitalize">{inputKey}</label>
                                        <Input
                                            type="number"
                                            onChange={(e) => handleInputChange(inputKey, parseFloat(e.target.value))}
                                            placeholder={`Enter ${inputKey}`}
                                        />
                                    </div>
                                );
                            }
                            return null;
                        })}

                        <Button onClick={handleAction} className="w-full">
                            <Play className="mr-2 h-4 w-4" /> {step.label}
                        </Button>
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
        <Card>
            <CardHeader>
                <CardTitle>Step {currentStep + 1}: {step.label}</CardTitle>
                <CardDescription>
                    {step.instructions}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {renderStepContent()}

                <div className="flex justify-end pt-4 border-t">
                    <Button onClick={handleNext}>
                        {isLastStep ? <><Check className="mr-2 h-4 w-4" /> Save Calibration</> : <><ArrowRight className="mr-2 h-4 w-4" /> Next</>}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};
