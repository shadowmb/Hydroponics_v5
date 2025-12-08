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
    cycleId?: string;
    output?: any;           // Result of execution (e.g. sensor value)
    error?: string;
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

                const isStart = step.type === 'START' || step.type === 'program_start';

                if (isStart || !currentGroup) {
                    const newGroup: CycleGroup = {
                        id: `group_${step.timestamp}`,
                        label: isStart ? step.label : 'Execution Sequence',
                        startTime: step.timestamp,
                        steps: [step],
                        isActive: true
                    };
                    if (currentGroup) currentGroup.isActive = false;
                    return [...newGroups, newGroup].slice(-10);
                } else {
                    if (currentGroup.steps.some(s => s.id === step.id)) return prevGroups;
                    currentGroup.steps.push(step);
                    return [...newGroups];
                }
            });
        };

        const handleBlockEnd = (data: any) => {
            // Find the most recent step with matching blockId and update it
            setCycleGroups(prevGroups => {
                // Clone groups deeply enough to mutate check
                const newGroups = [...prevGroups];
                const currentGroup = newGroups.length > 0 ? newGroups[newGroups.length - 1] : null;

                if (currentGroup) {
                    // Search backwards in the current group
                    for (let i = currentGroup.steps.length - 1; i >= 0; i--) {
                        if (currentGroup.steps[i].blockId === data.blockId && !currentGroup.steps[i].output && !currentGroup.steps[i].error) {
                            // Update this step
                            currentGroup.steps[i] = {
                                ...currentGroup.steps[i],
                                output: data.output,
                                error: data.success ? undefined : (data.error || 'Failed')
                            };
                            return newGroups; // Return updated state
                        }
                    }
                }
                return prevGroups; // No match found
            });
        };

        socketService.on('automation:execution_step', handleExecutionStep);
        socketService.on('automation:block_end', handleBlockEnd);

        return () => {
            socketService.off('automation:execution_step', handleExecutionStep);
            socketService.off('automation:block_end', handleBlockEnd);
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
                                    if (step.type === 'START') return null;

                                    return (
                                        <div key={step.id} className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                                            <ExecutionCard
                                                step={step}
                                                state={group.isActive && step === group.steps[group.steps.length - 1] && !step.output ? 'active' : 'history'}
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
