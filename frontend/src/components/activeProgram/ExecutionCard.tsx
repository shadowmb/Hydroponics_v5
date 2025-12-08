import React, { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    Activity,
    Droplet,
    Thermometer,
    Clock,
    ToggleRight,
    AlertCircle,
    CheckCircle2,
    PlayCircle,
    Power,
    Wind,
    Sun,
    Search
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ExecutionStep {
    id: string;             // Unique ID (blockId + timestamp)
    blockId: string;
    type: string;
    label: string;
    duration?: number;      // Total duration in ms (for Delay/RunFor)
    timestamp: number;      // Start time
    params?: any;
}

interface ExecutionCardProps {
    step: ExecutionStep;
    state: 'active' | 'history' | 'next';
}

export const ExecutionCard: React.FC<ExecutionCardProps> = ({ step, state }) => {
    const [progress, setProgress] = useState(0);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);

    // Dynamic Progress Logic
    useEffect(() => {
        if (state !== 'active' || !step.duration) {
            if (state === 'history') setProgress(100);
            return;
        }

        const interval = setInterval(() => {
            const elapsed = Date.now() - step.timestamp;
            const p = Math.min((elapsed / step.duration!) * 100, 100);
            setProgress(p);

            const remaining = Math.max(0, Math.ceil((step.duration! - elapsed) / 1000));
            setTimeLeft(remaining);

            if (p >= 100) clearInterval(interval);
        }, 100);

        return () => clearInterval(interval);
    }, [step, state]);

    const getIcon = () => {
        switch (step.type) {
            case 'WAIT': return <Clock className="h-5 w-5 text-blue-400" />;
            case 'DIGITAL_WRITE': return <ToggleRight className="h-5 w-5 text-green-400" />;
            case 'SENSOR_READ': return <Search className="h-5 w-5 text-yellow-400" />;
            case 'LOG': return <Activity className="h-5 w-5 text-slate-400" />;
            case 'IF': return <AlertCircle className="h-5 w-5 text-purple-400" />;
            default: return <Activity className="h-5 w-5 text-gray-400" />;
        }
    };

    const isHistory = state === 'history';
    const isActive = state === 'active';

    return (
        <Card className={cn(
            "relative flex items-center gap-3 p-3 transition-all duration-500 min-w-[220px]",
            isActive ? "bg-slate-900/80 border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.15)] scale-105 z-10" : "bg-muted/40 border-transparent opacity-60 scale-95 grayscale-[0.8]",
            isActive && "min-w-[300px]" // Make active card wider
        )}>
            {/* Status Pulse */}
            {isActive && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
            )}

            <div className={cn("p-2 rounded-full", isActive ? "bg-slate-800" : "bg-transparent")}>
                {getIcon()}
            </div>

            <div className="flex-1 overflow-hidden">
                <div className="flex justify-between items-center mb-1">
                    <h4 className={cn("font-medium text-sm truncate", isActive ? "text-white" : "text-muted-foreground")}>
                        {step.label}
                    </h4>
                    {isActive && timeLeft !== null && (
                        <span className="text-xs font-mono text-blue-300">{timeLeft}s</span>
                    )}
                </div>

                {/* Subtext or params */}
                {isActive && step.type === 'LOG' && (
                    <p className="text-xs text-slate-400 truncate">{step.params?.message}</p>
                )}

                {/* Progress Bar */}
                {(isActive || isHistory) && step.duration ? (
                    <Progress value={progress} className="h-1.5 bg-slate-800" indicatorClassName={isActive ? "bg-green-500" : "bg-slate-600"} />
                ) : (
                    <div className="h-1.5" /> // Spacer
                )}
            </div>
        </Card>
    );
};
