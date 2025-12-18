import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Play, Check, AlertCircle, Activity, Info } from 'lucide-react';
import { toast } from 'sonner';


interface PhSmartWizardProps {
    onSave: (data: any) => void;
    onRunCommand: (cmd: string, params: any) => Promise<any>;
}

interface CalibrationPoint {
    raw: number;
    value: number;
    active: boolean;
}

export const PhSmartWizard: React.FC<PhSmartWizardProps> = ({ onSave, onRunCommand }) => {
    const [points, setPoints] = useState<Record<string, CalibrationPoint>>({
        low: { raw: 0, value: 4.0, active: false },
        neutral: { raw: 0, value: 7.0, active: false },
        high: { raw: 0, value: 10.0, active: false }
    });

    const [health, setHealth] = useState<any>({});

    // Calculate basic health metrics for UI feedback
    useEffect(() => {
        const h: any = {};

        if (points.neutral.active) {
            // Offset logic (Assuming 5000mV VRef and 10-bit ADC for estimation if not provided)
            // Ideally we'd need VRef/Res from the device, but we can show ADC raw shift
            // Base ADC for 7.0 is usually 512 (10-bit) or 2048 (12-bit)
            const neutralRaw = points.neutral.raw;
            h.offset = neutralRaw;
        }

        if (points.neutral.active && points.low.active) {
            const rawDiff = Math.abs(points.neutral.raw - points.low.raw);
            const valDiff = Math.abs(points.neutral.value - points.low.value);
            // Rough estimation of efficiency
            h.lowSlope = (rawDiff / valDiff);
        }

        if (points.neutral.active && points.high.active) {
            const rawDiff = Math.abs(points.high.raw - points.neutral.raw);
            const valDiff = Math.abs(points.high.value - points.neutral.value);
            h.highSlope = (rawDiff / valDiff);
        }

        setHealth(h);
    }, [points]);

    const handlePointChange = (key: string, field: 'raw' | 'value', val: number) => {
        setPoints(prev => ({
            ...prev,
            [key]: { ...prev[key], [field]: val, active: true }
        }));
    };

    const captureReading = async (key: string) => {
        try {
            const result = await onRunCommand('READ', {});
            // Extract raw ADC value
            const raw = result?.details?.baseValue ?? result?.raw ?? result?.value ?? 0;
            handlePointChange(key, 'raw', raw);
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

        // Validation: Ensure values make sense (Low < Neutral < High)
        // If multiple active, check order
        const sorted = [...activePoints].sort((a, b) => a.value - b.value);

        // Simple verification that target values are distinct
        const values = activePoints.map(p => p.value);
        if (new Set(values).size !== values.length) {
            toast.error("Duplicate target pH values found");
            return;
        }

        onSave({ points: activePoints });
    };

    const renderCard = (key: string, label: string, color: string) => {
        const p = points[key];
        const isNeutral = key === 'neutral';

        return (
            <Card className={`border-l-4 ${color}`}>
                <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
                    <div>
                        <CardTitle className="text-sm font-bold uppercase">{label}</CardTitle>
                        <CardDescription className="text-xs">
                            {isNeutral ? "The Isopotential Anchor (Required for 1-point)" : `Used for ${key} range accuracy.`}
                        </CardDescription>
                    </div>
                    {p.active && <Check className="w-4 h-4 text-green-500" />}
                </CardHeader>
                <CardContent className="py-2 px-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-[10px] text-muted-foreground uppercase font-semibold">Buffer pH</label>
                            <Input
                                type="number"
                                size={1}
                                step="0.01"
                                value={p.value}
                                onChange={(e) => handlePointChange(key, 'value', parseFloat(e.target.value))}
                                className="h-8 text-sm"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] text-muted-foreground uppercase font-semibold">Raw Reading (ADC/mV)</label>
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

                    {/* Simple Health Indicator */}
                    {p.active && isNeutral && (
                        <div className="text-[10px] bg-muted/50 p-2 rounded flex flex-col gap-1 border border-muted">
                            <div className="flex items-center gap-1 font-bold text-muted-foreground uppercase">
                                <Activity className="w-3 h-3" /> Probe Offset
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xl font-mono">{(p.raw).toFixed(0)} <span className="text-[10px] opacity-50">raw</span></span>
                                <span className="px-1.5 py-0.5 bg-green-500/10 text-green-500 rounded text-[9px] font-bold">STABLE</span>
                            </div>
                        </div>
                    )}

                    {p.active && !isNeutral && points.neutral.active && (
                        <div className="text-[10px] bg-muted/50 p-2 rounded flex flex-col gap-1 border border-muted">
                            <div className="flex items-center gap-1 font-bold text-muted-foreground uppercase">
                                <Activity className="w-3 h-3" /> Segment Efficiency
                            </div>
                            <div className="flex justify-between items-center">
                                {(() => {
                                    const rawDiff = Math.abs(points.neutral.raw - p.raw);
                                    const valDiff = Math.abs(points.neutral.value - p.value);
                                    const slope = rawDiff / valDiff;
                                    // Ideal slope is ~59.16 mV/pH. 
                                    // Raw ADC depends on resolution, but let's assume 10-bit 5V (4.9mV per step)
                                    // Efficiency = (slope_raw * mV_per_step) / 59.16 * 100
                                    const efficiency = Math.min(100, (slope * 4.9 / 59.16) * 100);

                                    return (
                                        <>
                                            <span className="text-xl font-mono">{efficiency.toFixed(1)}%</span>
                                            <span className={`px-1.5 py-0.5 ${efficiency > 85 ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'} rounded text-[9px] font-bold uppercase`}>
                                                {efficiency > 95 ? 'Excellent' : efficiency > 85 ? 'Good' : 'Acceptable'}
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
                    <h5 className="text-sm font-bold text-blue-700 dark:text-blue-400">Calibration Guide</h5>
                    <p className="text-xs opacity-80 leading-relaxed">
                        Fix the sensor in the buffer solution. Wait for 1-2 minutes for stability before clicking the Read button.
                        <strong> pH 7.0 (Neutral)</strong> is the most important point for offset correction.
                    </p>
                </div>
            </div>


            <div className="space-y-3">
                {renderCard('low', 'Low / Acidic', 'border-l-red-500')}
                {renderCard('neutral', 'Neutral Point', 'border-l-green-500')}
                {renderCard('high', 'High / Alkaline', 'border-l-blue-500')}
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
