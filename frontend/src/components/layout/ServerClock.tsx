
import React from 'react';
import { Clock } from 'lucide-react';
import { useSimulation } from '@/context/SimulationContext';
import { cn } from "@/lib/utils";

export const ServerClock: React.FC = () => {
    const { virtualTime, isSimulating } = useSimulation();

    return (
        <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors duration-500",
            isSimulating ? "bg-amber-500/10 border border-amber-500/30" : "bg-muted/50"
        )}>
            <Clock className={cn(
                "h-4 w-4",
                isSimulating ? "text-amber-500" : "text-muted-foreground"
            )} />
            <span className={cn(
                "text-sm font-mono font-bold",
                isSimulating ? "text-amber-500" : ""
            )}>
                {virtualTime ? virtualTime.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--:--'}
            </span>
        </div>
    );
};
