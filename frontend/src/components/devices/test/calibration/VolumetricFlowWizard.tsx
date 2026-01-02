import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Play, Check, AlertCircle, Droplets, Clock, Beaker } from 'lucide-react';
import { toast } from 'sonner';

interface VolumetricFlowWizardProps {
    onSave: (data: any) => void;
    onRunCommand: (cmd: string, params: any) => Promise<any>;
}

// Volume units available
const VOLUME_UNITS = [
    { value: 'ml', label: 'Milliliters (ml)' },
    { value: 'l', label: 'Liters (l)' },
    { value: 'gal', label: 'Gallons (gal)' }
];

// Helper to convert to ml (base unit)
const convertToMl = (value: number, unit: string): number => {
    switch (unit) {
        case 'l': return value * 1000;
        case 'gal': return value * 3785.41;
        default: return value;
    }
};

export const VolumetricFlowWizard: React.FC<VolumetricFlowWizardProps> = ({ onSave, onRunCommand }) => {
    // Form State
    const [duration, setDuration] = useState<number>(10);
    const [measuredValue, setMeasuredValue] = useState<number>(0);
    const [measuredUnit, setMeasuredUnit] = useState<string>('ml');
    const [doseSize, setDoseSize] = useState<number>(10);
    const [doseUnit, setDoseUnit] = useState<string>('ml');

    // Running State
    const [isRunning, setIsRunning] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [testCompleted, setTestCompleted] = useState(false);

    // Calculated Values
    const calculatedFlowRate = testCompleted && duration > 0
        ? convertToMl(measuredValue, measuredUnit) / duration
        : 0;

    const doseSizeInMl = convertToMl(doseSize, doseUnit);
    const doseTimeSeconds = calculatedFlowRate > 0 ? doseSizeInMl / calculatedFlowRate : 0;

    // Validation
    const isValid = duration > 0 && measuredValue > 0 && doseSize > 0 && testCompleted;

    const handleRunPump = async () => {
        if (duration <= 0) {
            toast.error('Please enter a valid duration');
            return;
        }

        // Safety Check - verify pump is OFF
        try {
            const status = await onRunCommand('READ', {});
            const state = status?.state ?? status?.value ?? status?.val;
            if (state == 1 || state === true || state === 'ON') {
                toast.error('Pump is already ON! Please turn it OFF before testing.');
                return;
            }
        } catch (err) {
            // If READ fails, proceed with caution
            console.warn('Could not verify pump state:', err);
        }

        setIsRunning(true);
        setCountdown(duration);
        setTestCompleted(false);

        // Start countdown
        const interval = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    setIsRunning(false);
                    setTestCompleted(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        // Run the pump
        try {
            await onRunCommand('TEST_DOSING', { duration });
        } catch (e) {
            clearInterval(interval);
            setIsRunning(false);
            setCountdown(0);
            toast.error('Failed to run pump');
        }
    };

    const handleStop = async () => {
        try {
            await onRunCommand('OFF', {});
            setIsRunning(false);
            setCountdown(0);
            toast.warning('Pump stopped');
        } catch (e) {
            console.error('Failed to stop pump:', e);
        }
    };

    const handleSave = () => {
        if (!isValid) {
            toast.error('Please complete the pump test and enter all values');
            return;
        }

        const data = {
            // Test Results
            duration_seconds: duration,
            measuredValue: measuredValue,
            measuredUnit: measuredUnit,

            // Calculated (stored in base unit: ml)
            flowRate: calculatedFlowRate,
            flowRateUnit: 'ml/sec',

            // Dose Definition (REQUIRED)
            doseSize: doseSizeInMl, // Always stored in ml
            doseSizeDisplay: doseSize, // Original input for display
            doseUnit: doseUnit
        };

        onSave(data);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Droplets className="h-5 w-5 text-cyan-500" />
                    Volumetric Flow Calibration
                </CardTitle>
                <CardDescription>
                    Calibrate the pump flow rate and define dose size
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Section 1: Flow Rate Test */}
                <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                    <div className="flex items-center gap-2 text-sm font-semibold uppercase text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        1. Flow Rate Test
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Duration Input */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Test Duration</label>
                            <div className="flex gap-2">
                                <Input
                                    type="number"
                                    value={duration}
                                    onChange={(e) => setDuration(parseFloat(e.target.value) || 0)}
                                    disabled={isRunning}
                                    min={1}
                                    max={120}
                                />
                                <span className="flex items-center text-sm text-muted-foreground">sec</span>
                            </div>
                        </div>

                        {/* Run Button / Status */}
                        <div className="flex items-end">
                            {!isRunning ? (
                                <Button onClick={handleRunPump} className="w-full" disabled={!duration}>
                                    <Play className="mr-2 h-4 w-4" />
                                    Run Pump
                                </Button>
                            ) : (
                                <div className="w-full space-y-2">
                                    <div className="flex items-center justify-center gap-2 p-2 bg-green-100 dark:bg-green-900/30 rounded-md">
                                        <span className="relative flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                        </span>
                                        <span className="font-bold text-green-700 dark:text-green-400">
                                            {countdown}s
                                        </span>
                                    </div>
                                    <Button onClick={handleStop} variant="destructive" className="w-full" size="sm">
                                        STOP
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Measured Volume Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Measured Volume</label>
                        <div className="flex gap-2">
                            <Input
                                type="number"
                                value={measuredValue || ''}
                                onChange={(e) => {
                                    setMeasuredValue(parseFloat(e.target.value) || 0);
                                    if (testCompleted) {
                                        // Allow re-entry without re-running test
                                    }
                                }}
                                placeholder="Enter measured volume"
                                disabled={!testCompleted}
                            />
                            <Select value={measuredUnit} onValueChange={setMeasuredUnit} disabled={!testCompleted}>
                                <SelectTrigger className="w-[120px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {VOLUME_UNITS.map(u => (
                                        <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Flow Rate Result */}
                    {testCompleted && calculatedFlowRate > 0 && (
                        <div className="flex items-center justify-between p-3 bg-cyan-100 dark:bg-cyan-900/30 rounded-md">
                            <span className="text-sm font-medium">Calculated Flow Rate:</span>
                            <span className="text-lg font-bold text-cyan-600 dark:text-cyan-400">
                                {calculatedFlowRate.toFixed(2)} ml/sec
                            </span>
                        </div>
                    )}
                </div>

                {/* Section 2: Dose Definition */}
                <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                    <div className="flex items-center gap-2 text-sm font-semibold uppercase text-muted-foreground">
                        <Beaker className="h-4 w-4" />
                        2. Dose Definition (Required)
                    </div>

                    <p className="text-sm text-muted-foreground">
                        Define the volume for 1 standard dose. This allows using "doses" in automation blocks.
                    </p>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">1 Dose =</label>
                        <div className="flex gap-2">
                            <Input
                                type="number"
                                value={doseSize || ''}
                                onChange={(e) => setDoseSize(parseFloat(e.target.value) || 0)}
                                placeholder="e.g. 10"
                                min={0.1}
                            />
                            <Select value={doseUnit} onValueChange={setDoseUnit}>
                                <SelectTrigger className="w-[120px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {VOLUME_UNITS.map(u => (
                                        <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Dose Time Preview */}
                    {calculatedFlowRate > 0 && doseSize > 0 && (
                        <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                            💡 1 dose ({doseSize} {doseUnit}) = {doseTimeSeconds.toFixed(1)}s pump time
                        </div>
                    )}
                </div>

                {/* Validation Warning */}
                {!isValid && (
                    <div className="flex items-center gap-2 p-3 text-sm border border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 rounded-md text-yellow-700 dark:text-yellow-400">
                        <AlertCircle className="h-4 w-4" />
                        Complete the pump test and enter all values to save.
                    </div>
                )}

                {/* Save Button */}
                <Button onClick={handleSave} className="w-full" disabled={!isValid}>
                    <Check className="mr-2 h-4 w-4" />
                    Save Calibration
                </Button>
            </CardContent>
        </Card>
    );
};
