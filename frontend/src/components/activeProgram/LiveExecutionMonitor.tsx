import React, { useEffect, useState, useRef } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { socketService } from '@/core/SocketService';
import { ExecutionCard } from './ExecutionCard';
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowDown } from 'lucide-react';

export interface ExecutionStep {
    id: string;             // Unique ID (blockId + timestamp)
    blockId: string;
    type: string;
    label: string;
    duration?: number;      // Total duration in ms (for Delay/RunFor)
    timestamp: number;      // Start time
    params?: any;
    cycleId?: string; // Optional: If backend provides it
}

interface CycleGroup {
    id: string; // Unique group ID (usually timestamp of start)
    label: string;
    startTime: number;
    steps: ExecutionStep[];
    isActive: boolean;
}

interface LiveExecutionMonitorProps {
    programId: string;
    isActive: boolean;
}

export const LiveExecutionMonitor: React.FC<LiveExecutionMonitorProps> = ({ programId, isActive }) => {
    const [cycleGroups, setCycleGroups] = useState<CycleGroup[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new steps arrive
    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [cycleGroups]);

    useEffect(() => {
        if (!isActive) return;

        const handleExecutionStep = (data: any) => {
            const step: ExecutionStep = {
                id: `${data.blockId}_${data.timestamp}`,
                blockId: data.blockId,
                type: data.type,
                label: data.label,
                duration: data.duration,
                timestamp: data.timestamp,
                params: data.params
            };

            setCycleGroups(prevGroups => {
                const newGroups = [...prevGroups];
                let currentGroup = newGroups.length > 0 ? newGroups[newGroups.length - 1] : null;

                // Logic: A "Cycle" usually starts with a "Start" block or "Loop" block
                // For now, if we see a generic 'START' or if there are no groups, we make a new one.
                // NOTE: Ideally backend sends 'cycle_start', but we infer for now.
                // Use a heuristic: If block label contains "Cycle" or name matches program schedule, it's a start.
                // Simple heuristic: If type is 'START', create new group.

                const isStart = step.type === 'START' || step.type === 'program_start';

                if (isStart || !currentGroup) {
                    // Create new group
                    const newGroup: CycleGroup = {
                        id: `group_${step.timestamp}`,
                        label: isStart ? step.label : 'Execution Sequence', // Use step label as group header
                        startTime: step.timestamp,
                        steps: [step],
                        isActive: true
                    };

                    // Mark previous group as inactive
                    if (currentGroup) currentGroup.isActive = false;

                    return [...newGroups, newGroup].slice(-10); // Keep last 10 groups to avoid memory issues
                } else {
                    // Append to current group
                    // Check for duplicates
                    if (currentGroup.steps.some(s => s.id === step.id)) return prevGroups;

                    currentGroup.steps.push(step);
                    return [...newGroups];
                }
            });
        };

        socketService.on('automation:execution_step', handleExecutionStep);

        return () => {
            socketService.off('automation:execution_step', handleExecutionStep);
        };
    }, [programId, isActive]);

    if (!isActive && cycleGroups.length === 0) return null;

    return (
        <div className="mt-6 border-t border-slate-800 pt-6">
            <div className="flex items-center gap-2 mb-4">
                <div className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </div>
                <h3 className="text-sm font-semibold tracking-wide text-slate-400 uppercase">Live Execution Log</h3>
            </div>

            <ScrollArea className="w-full h-[400px] rounded-md border border-slate-800/50 bg-slate-950/50 p-4">
                <div className="space-y-6" ref={scrollRef}>
                    {cycleGroups.map((group) => (
                        <div key={group.id} className="relative pl-6 border-l-2 border-slate-800">
                            {/* Group Header */}
                            <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full border-2 border-slate-800 bg-slate-950 flex items-center justify-center">
                                {group.isActive && <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />}
                            </div>

                            <div className="mb-3 flex items-center justify-between">
                                <h4 className={`text-sm font-bold uppercase tracking-wider ${group.isActive ? 'text-green-400' : 'text-slate-500'}`}>
                                    {group.label}
                                </h4>
                                <span className="text-xs font-mono text-slate-600">
                                    {new Date(group.startTime).toLocaleTimeString()}
                                </span>
                            </div>

                            {/* Steps List */}
                            <div className="space-y-2">
                                {group.steps.map((step) => {
                                    // Don't show the Header step again if it's just a "Start" block with no visual value
                                    if (step.type === 'START') return null;

                                    return (
                                        <div key={step.id} className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                                            <ExecutionCard
                                                step={step}
                                                state={group.isActive && step === group.steps[group.steps.length - 1] ? 'active' : 'history'}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                    <div ref={bottomRef} className="h-4" />
                </div>
            </ScrollArea>
        </div>
    );
};
