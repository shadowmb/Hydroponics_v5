import React, { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    Activity,
    Clock,
    ToggleRight,
    AlertCircle,
    Search,
    XCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

// Re-using the same interface from parent (or exporting it from here)
export interface ExecutionStep {
    id: string;
    blockId: string;
    type: string;
    label: string;
    duration?: number;
    timestamp: number;
    params?: any;
    output?: any;
    error?: string;
    summary?: string;
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
            if (state === 'history' || step.output) setProgress(100);
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
        if (step.error) return <XCircle className="h-5 w-5 text-red-500" />;

        switch (step.type) {
            case 'WAIT': return <Clock className="h-5 w-5 text-blue-400" />;
            case 'DIGITAL_WRITE': return <ToggleRight className="h-5 w-5 text-green-400" />;
            case 'SENSOR_READ': return <Search className="h-5 w-5 text-yellow-400" />;
            case 'LOG': return <Activity className="h-5 w-5 text-slate-400" />;
            case 'IF': return <AlertCircle className="h-5 w-5 text-purple-400" />;
            default: return <Activity className="h-5 w-5 text-gray-400" />;
        }
    };

    const isActive = state === 'active';

    // Format Result for Display
    const renderResult = () => {
        if (step.error) return <span className="text-red-400 text-xs font-mono">{step.error}</span>;

        // PRIORITIZE SUMMARY (Rich Result)
        if (step.summary) {
            return <Badge variant="outline" className={cn(
                "font-mono text-xs",
                step.error ? "border-red-500/50 text-red-500" : "border-slate-700 text-slate-300 bg-slate-900/50"
            )}>
                {step.summary}
            </Badge>;
        }

        if (step.type === 'SENSOR_READ' && step.output !== undefined) {
            // Try to format based on value
            let formatted = step.output;
            if (typeof step.output === 'number') {
                formatted = step.output.toFixed(2);
            }
            return <Badge variant="outline" className="border-yellow-500/50 text-yellow-500 bg-yellow-500/10 font-mono text-xs">{formatted}</Badge>;
        }

        if (step.type === 'WAIT' && step.duration) {
            return <Badge variant="outline" className="border-blue-500/50 text-blue-500 bg-blue-500/10 font-mono text-xs">{(step.duration / 1000)}s</Badge>;
        }

        if (step.type === 'LOG' && step.params?.message) {
            return <span className="text-slate-400 text-xs italic truncate max-w-[200px]">{step.params.message}</span>
        }

        if (step.output !== undefined && typeof step.output !== 'object') {
            return <span className="text-slate-400 text-xs font-mono">➡ {String(step.output)}</span>
        }

        return null;
    };

    return (
        <Card className={cn(
            "relative flex items-center gap-3 p-3 transition-all duration-300 w-full hover:bg-slate-900/50",
            isActive ? "bg-slate-900/80 border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.15)]" : "bg-transparent border-slate-800/50 opacity-80 hover:opacity-100",
            step.error && "border-red-500/50 bg-red-950/10"
        )}>
            {/* Active Indictor Line */}
            {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500 rounded-l-md" />}

            <div className={cn("p-2 rounded-full shrink-0", isActive ? "bg-slate-800" : "bg-slate-950/50")}>
                {getIcon()}
            </div>

            <div className="flex-1 overflow-hidden flex items-center justify-between">
                <div className="flex flex-col min-w-0">
                    <h4 className={cn("font-medium text-sm truncate", isActive ? "text-white" : "text-slate-300")}>
                        {step.label}
                    </h4>
                    {/* Progress Bar for Active steps */}
                    {isActive && step.duration ? (
                        <div className="flex items-center gap-2 mt-1">
                            <Progress value={progress} className="h-1 w-24 bg-slate-800" indicatorClassName="bg-green-500" />
                            <span className="text-[10px] font-mono text-slate-500">{timeLeft}s</span>
                        </div>
                    ) : null}
                </div>

                {/* Right Side: Results & Timestamp */}
                <div className="flex items-center gap-3 pl-4 shrink-0">
                    {renderResult()}
                    <span className="text-[10px] text-slate-600 font-mono tabular-nums">
                        {new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                </div>
            </div>
        </Card>
    );
};
