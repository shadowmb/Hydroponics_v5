import React, { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Thermometer, Gauge, Droplets, Activity, Check, RefreshCw, Radio } from 'lucide-react';
import { toast } from 'sonner';

interface OffsetWizardProps {
    onSave: (data: any) => void;
    onRunCommand: (cmd: string, params: any) => Promise<any>;
    role?: string;
    unit?: string;
}

export const OffsetWizard: React.FC<OffsetWizardProps> = ({ onSave, onRunCommand, role, unit }) => {
    const [currentValue, setCurrentValue] = useState<number | null>(null);
    const [targetValue, setTargetValue] = useState<string>('');
    const [isReading, setIsReading] = useState(false);
    const [isLive, setIsLive] = useState(false);

    // Contextual Icon & Color
    const getContext = () => {
        const r = (role || '').toLowerCase();
        const u = (unit || '').toLowerCase();

        if (r.includes('temp') || u.includes('c') || u.includes('f'))
            return { icon: Thermometer, color: 'text-blue-500', glow: 'shadow-blue-500/20' };

        if (r.includes('pressure') || u.includes('bar') || u.includes('psi'))
            return { icon: Gauge, color: 'text-purple-500', glow: 'shadow-purple-500/20' };

        if (r.includes('level') || r.includes('volume') || r.includes('water') || r.includes('humidity') || u.includes('l') || u.includes('ml') || u.includes('%'))
            return { icon: Droplets, color: 'text-cyan-500', glow: 'shadow-cyan-500/20' };

        return { icon: Activity, color: 'text-emerald-500', glow: 'shadow-emerald-500/20' };
    };

    const { icon: Icon, color, glow } = getContext();

    const fetchValue = useCallback(async () => {
        if (isReading) return;
        try {
            setIsReading(true);
            const result = await onRunCommand('READ', {});
            const val = result?.details?.baseValue ?? result?.value ?? result?.raw ?? 0;
            setCurrentValue(val);
        } catch (err) {
            console.error("Failed to read sensor for offset:", err);
            toast.error("Failed to get reading");
        } finally {
            setIsReading(false);
        }
    }, [onRunCommand, isReading]);

    // Polling only if Live
    useEffect(() => {
        let timer: any;
        if (isLive) {
            fetchValue();
            timer = setInterval(fetchValue, 3000); // 3 seconds interval to be safer
        }
        return () => clearInterval(timer);
    }, [isLive, fetchValue]);

    const calculatedOffset = (currentValue !== null && targetValue !== '')
        ? Number(targetValue) - currentValue
        : 0;

    const handleApply = () => {
        if (targetValue === '' || currentValue === null) {
            toast.error("Please enter a target value and capture a reading.");
            return;
        }

        onSave({
            multiplier: 1,
            offset: calculatedOffset,
            _target: Number(targetValue),
            _rawAtCalibration: currentValue,
            timestamp: new Date().toISOString()
        });

        toast.success(`Offset of ${calculatedOffset.toFixed(2)} applied successfully!`);
    };

    return (
        <div className="space-y-6">
            <Card className="overflow-hidden border-none bg-gradient-to-br from-slate-900/50 to-slate-800/50 backdrop-blur-xl shadow-2xl relative">
                <div className={`absolute -top-24 -left-24 w-48 h-48 rounded-full blur-[100px] opacity-20 bg-current ${color}`}></div>

                <CardContent className="p-8 space-y-8 relative z-10">
                    <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="flex w-full justify-between items-center bg-white/5 border border-white/10 rounded-xl p-2">
                            <div className="flex items-center gap-3 px-2">
                                <Switch
                                    checked={isLive}
                                    onCheckedChange={setIsLive}
                                    className="data-[state=checked]:bg-emerald-500"
                                />
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Live Monitor</span>
                                    <span className={`text-[9px] ${isLive ? 'text-emerald-400' : 'text-slate-500'}`}>
                                        {isLive ? 'Polling active' : 'Polling paused'}
                                    </span>
                                </div>
                            </div>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={fetchValue}
                                disabled={isReading}
                                className="h-9 px-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg flex gap-2"
                            >
                                <RefreshCw className={`h-3.5 w-3.5 ${isReading ? 'animate-spin' : ''}`} />
                                <span className="text-xs font-semibold">Refresh</span>
                            </Button>
                        </div>

                        <div className={`p-6 rounded-full bg-white/5 border border-white/10 ${glow} ${isLive ? 'animate-pulse-subtle' : ''} transition-all duration-700`}>
                            <Icon className={`w-16 h-16 ${color}`} />
                        </div>

                        <div className="text-center relative">
                            {isLive && (
                                <div className="absolute -right-8 top-1 flex items-center gap-1.5 translate-x-full">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                                    <span className="text-[9px] font-bold tracking-tighter text-emerald-500/80 uppercase">Live</span>
                                </div>
                            )}
                            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-[0.2em] mb-1">Current Reading</h3>
                            <div className="flex items-baseline justify-center gap-2">
                                <span className="text-6xl font-black tracking-tighter text-white tabular-nums drop-shadow-2xl">
                                    {currentValue !== null ? currentValue.toFixed(1) : '--.-'}
                                </span>
                                <span className="text-2xl font-light text-slate-500">{unit || '°C'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-white/5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Target Reference Value</label>
                            <div className="relative group">
                                <Input
                                    type="number"
                                    placeholder="Enter known actual value..."
                                    value={targetValue}
                                    onChange={(e) => setTargetValue(e.target.value)}
                                    className="h-14 text-xl bg-white/5 border-white/10 focus:border-white/20 transition-all pl-4 pr-12 rounded-2xl"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold opacity-50">
                                    {unit || '°C'}
                                </div>
                            </div>
                        </div>

                        {targetValue !== '' && currentValue !== null && (
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center justify-between animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500">Adjustment Engine</p>
                                    <p className="text-xs font-semibold text-slate-400">
                                        Applying {calculatedOffset > 0 ? 'additive' : 'subtractive'} correction
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className={`text-3xl font-mono font-black ${calculatedOffset >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {calculatedOffset > 0 ? '+' : ''}{calculatedOffset.toFixed(2)}
                                    </div>
                                    <div className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">Delta {unit || '°C'}</div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-2">
                        <Button
                            onClick={handleApply}
                            disabled={currentValue === null || targetValue === ''}
                            className="w-full h-16 text-lg font-black rounded-2xl shadow-2xl transition-all active:scale-[0.98] group disabled:opacity-20 disabled:grayscale overflow-hidden relative"
                            variant="default"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-white/5 to-primary/20 animate-shimmer" />
                            <div className="relative flex items-center justify-center">
                                <Save className="mr-3 h-6 w-6 transition-transform group-hover:scale-110" />
                                COMMIT CALIBRATION
                            </div>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <div className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-xl flex items-start gap-4">
                <div className="p-2.5 rounded-full bg-amber-500/10 shrink-0">
                    <Check className="h-4 w-4 text-amber-500" />
                </div>
                <div className="space-y-1.5">
                    <h5 className="text-[11px] font-black text-amber-500 uppercase tracking-widest">Protocol Tip</h5>
                    <p className="text-xs text-slate-400 leading-relaxed">
                        Ensure the sensor has <strong>stabilized</strong> in the medium before committing. For best results, use a verified laboratory-grade reference instrument.
                    </p>
                </div>
            </div>
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
