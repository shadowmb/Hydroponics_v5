import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Play, Check, AlertCircle, Activity, Info, Wind, Droplets } from 'lucide-react';
import { toast } from 'sonner';

interface EcSmartWizardProps {
    onSave: (data: any) => void;
    onRunCommand: (cmd: string, params: any) => Promise<any>;
}

interface CalibrationPoint {
    raw: number;
    value: number; // in uS/cm
    active: boolean;
}

export const EcSmartWizard: React.FC<EcSmartWizardProps> = ({ onSave, onRunCommand }) => {
    const [points, setPoints] = useState<Record<string, CalibrationPoint>>({
        air: { raw: 0, value: 0, active: false },
        low: { raw: 0, value: 1413, active: false },
        high: { raw: 0, value: 12880, active: false }
    });

    const [health, setHealth] = useState<any>({});
    const [temperature, setTemperature] = useState<number>(25.0);

    // Capture current temperature for UI adjustments
    useEffect(() => {
        const fetchTemp = async () => {
            try {
                // We use a small hack: read the sensor to get the context including resolved temp
                const result = await onRunCommand('READ', {});
                if (result?.details?.temperature !== undefined) {
                    setTemperature(result.details.temperature);
                }
            } catch (e) {
                // Ignore
            }
        };
        fetchTemp();
    }, []);

    const handlePointChange = (key: string, field: 'raw' | 'value', val: number) => {
        setPoints(prev => ({
            ...prev,
            [key]: { ...prev[key], [field]: val, active: true }
        }));
    };

    const captureReading = async (key: string) => {
        try {
            const result = await onRunCommand('READ', { strategy: 'linear' }); // Read raw for calibration
            const raw = result?.details?.baseHwValue ?? result?.raw ?? result?.value ?? 0;
            handlePointChange(key, 'raw', raw);

            if (result?.details?.temperature !== undefined) {
                setTemperature(result.details.temperature);
            }

            toast.success(`Captured ${key} point`);
        } catch (err) {
            toast.error("Failed to read sensor");
        }
    };

    const handleSave = () => {
        const activePoints = Object.values(points)
            .filter(p => p.active)
            .map(p => ({ raw: p.raw, value: p.value }));

        if (activePoints.length === 0) {
            toast.error("Add at least one calibration point");
            return;
        }

        // Sort by value
        const sorted = [...activePoints].sort((a, b) => a.value - b.value);

        // Basic validation
        const values = activePoints.map(p => p.value);
        if (new Set(values).size !== values.length) {
            toast.error("Duplicate target values found");
            return;
        }

        onSave({ points: activePoints });
    };

    const renderCard = (key: string, label: string, color: string, icon: any) => {
        const p = points[key];
        const Icon = icon;

        // Buffer temp adjustment (simplified for UI feedback)
        // Standard buffers have specific tables, but 2.1%/C is a good enough estimate for 1413/12880
        const adjustedTarget = key === 'air' ? 0 : p.value * (1 + 0.021 * (temperature - 25));

        return (
            <Card className={`border-l-4 ${color}`}>
                <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${color.replace('border-l-', 'bg-').replace('500', '500/10')}`}>
                            <Icon className={`w-4 h-4 ${color.replace('border-l-', 'text-')}`} />
                        </div>
                        <div>
                            <CardTitle className="text-sm font-bold uppercase">{label}</CardTitle>
                            <CardDescription className="text-xs">
                                {key === 'air' ? "Zeroing Offset (Dry Probe)" : `Standard: ${p.value} µS/cm`}
                            </CardDescription>
                        </div>
                    </div>
                    {p.active && <Check className="w-4 h-4 text-green-500" />}
                </CardHeader>
                <CardContent className="py-2 px-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-[10px] text-muted-foreground uppercase font-semibold">Target (µS/cm)</label>
                            <div className="relative">
                                <Input
                                    type="number"
                                    size={1}
                                    value={p.value}
                                    onChange={(e) => handlePointChange(key, 'value', parseFloat(e.target.value))}
                                    className="h-8 text-sm"
                                    disabled={key === 'air'}
                                />
                                {key !== 'air' && temperature !== 25 && (
                                    <div className="absolute -bottom-4 left-0 text-[9px] text-blue-500 whitespace-nowrap">
                                        Adjusted: {adjustedTarget.toFixed(0)} µS @ {temperature.toFixed(1)}°C
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] text-muted-foreground uppercase font-semibold">Raw Reading</label>
                            <div className="flex gap-1">
                                <Input
                                    type="number"
                                    value={p.raw}
                                    onChange={(e) => handlePointChange(key, 'raw', parseFloat(e.target.value))}
                                    className="h-8 text-sm font-mono"
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 px-2"
                                    onClick={() => captureReading(key)}
                                >
                                    <Activity className="w-3 h-3" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Diagnostics */}
                    {p.active && key !== 'air' && (
                        <div className="text-[10px] bg-muted/50 p-2 rounded flex flex-col gap-1 border border-muted mt-2">
                            <div className="flex items-center gap-1 font-bold text-muted-foreground uppercase">
                                <Activity className="w-3 h-3" /> Cell Quality (K-Factor)
                            </div>
                            <div className="flex justify-between items-center">
                                {(() => {
                                    // Simplified K-Factor Estimate:
                                    // Target_at_T / (Raw_ADC / Max_ADC * 5.0 / 1000)
                                    // Let's assume 10-bit 5V for visual feedback
                                    const theorMs = (p.raw / 1024) * 5.0;
                                    const k = (adjustedTarget / 1000) / theorMs;
                                    const efficiency = Math.min(150, Math.max(50, (1 / k) * 100));

                                    return (
                                        <>
                                            <span className="text-xl font-mono">{k.toFixed(3)} <span className="text-[10px] opacity-50">K</span></span>
                                            <span className={`px-1.5 py-0.5 ${efficiency > 80 && efficiency < 120 ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'} rounded text-[9px] font-bold uppercase`}>
                                                {efficiency > 90 && efficiency < 110 ? 'Healthy' : 'Needs Cleaning'}
                                            </span>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="space-y-6">
            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                    <h5 className="text-sm font-bold text-blue-700 dark:text-blue-400">EC Calibration Guide</h5>
                    <p className="text-xs opacity-80 leading-relaxed">
                        1. <strong>Air</strong>: Wipe probe dry and capture zero.<br />
                        2. <strong>Buffer</strong>: Submerge in solution, stir gently, wait for stabilization.<br />
                        Current Temp: <strong>{temperature.toFixed(1)}°C</strong> (compensation active).
                    </p>
                </div>
            </div>

            <div className="space-y-3">
                {renderCard('air', 'Zero Point (Air)', 'border-l-slate-400', Wind)}
                {renderCard('low', 'Low Standard', 'border-l-blue-400', Droplets)}
                {renderCard('high', 'High Standard', 'border-l-blue-600', Droplets)}
            </div>

            <Button onClick={handleSave} className="w-full h-11 text-lg font-bold" variant="default">
                <Save className="mr-2 h-5 w-5" /> Finish & Save Calibration
            </Button>
        </div>
    );
};

const Save = ({ className, ...props }: any) => (
    <svg
        {...props}
        className={className}
        xmlns="http://www.w3.org/2000/svg"
        width="24" height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
    >
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
        <polyline points="17 21 17 13 7 13 7 21" />
        <polyline points="7 3 7 8 15 8" />
    </svg>
);
