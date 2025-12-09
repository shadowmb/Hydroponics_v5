import React, { useEffect, useState, useRef } from 'react';
import { socketService } from '@/core/SocketService';
import { ExecutionCard } from './ExecutionCard';
import { ScrollArea } from "@/components/ui/scroll-area";

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
    summary?: string;       // Rich result text
}

interface CycleIteration {
    id: string;
    headerStep: ExecutionStep;
    steps: ExecutionStep[];
}

interface CycleGroup {
    id: string;
    blockId: string; // To identify if we are in the same loop node
    label: string;
    startTime: number;
    type: 'LOOP' | 'SEQUENCE';
    iterations: CycleIteration[];
    isActive: boolean;
}

interface LiveExecutionMonitorProps {
    programId: string;
    isActive: boolean;
}

const CycleIterationItem: React.FC<{ iteration: CycleIteration; isLast: boolean; parentActive: boolean }> = ({ iteration, isLast, parentActive }) => {
    // Auto-open if it's the active iteration in an active group
    const [isOpen, setIsOpen] = useState(isLast && parentActive);

    useEffect(() => {
        if (isLast && parentActive) setIsOpen(true);
        else if (!isLast) setIsOpen(false); // Auto-collapse history
    }, [isLast, parentActive]);

    const headerStep = iteration.headerStep;

    return (
        <div className="relative pl-4 border-l border-slate-800/50 mt-2">
            {/* Iteration Header */}
            <div
                className="flex items-center gap-2 mb-2 cursor-pointer hover:bg-slate-900/50 p-1 rounded transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className={`h-1.5 w-1.5 rounded-full ${isLast && parentActive ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`} />

                <div className="flex-1 flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-300">
                        {headerStep.summary || headerStep.label}
                    </span>
                    {!isOpen && iteration.steps.length > 0 && (
                        <span className="text-[10px] text-slate-500 bg-slate-900 px-1 rounded">
                            {iteration.steps.length} ops
                        </span>
                    )}
                </div>
            </div>

            {/* Nested Steps */}
            {isOpen && (
                <div className="space-y-2 pl-2">
                    {iteration.steps.map((step) => (
                        <div key={step.id} className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                            <ExecutionCard
                                step={step}
                                state={parentActive && isLast && step === iteration.steps[iteration.steps.length - 1] && !step.output ? 'active' : 'history'}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const CycleGroupItem: React.FC<{ group: CycleGroup; isLast: boolean }> = ({ group, isLast }) => {
    const [isOpen, setIsOpen] = useState(isLast);

    useEffect(() => {
        if (isLast) setIsOpen(true);
        else setIsOpen(false);
    }, [isLast]);

    // Dynamic Header Logic: Use the latest iteration's summary/label
    const iterations = group.iterations;
    const lastIteration = iterations[iterations.length - 1];

    let summaryText = lastIteration?.headerStep.summary;

    // STRICT PERSISTENCE: If current summary is missing, look back until we find one
    if (!summaryText && iterations.length > 1) {
        // Look back through the last few iterations to find non-empty summary
        for (let i = iterations.length - 2; i >= 0; i--) {
            if (iterations[i].headerStep.summary) {
                summaryText = iterations[i].headerStep.summary;
                break;
            }
        }
    }

    // Clean up summary text
    if (summaryText) {
        if (summaryText.startsWith(`Iteration ${iterations.length}`)) {
            summaryText = summaryText.replace(`Iteration ${iterations.length}`, '').trim();
        }
        // Also clean up previous iteration number if present from fallback
        const match = summaryText.match(/Iteration \d+/);
        if (match) {
            summaryText = summaryText.replace(match[0], '').trim();
        }

        summaryText = summaryText.replace(' (Continuing)', '').replace(' (Done)', '').trim();
        // Remove leading/trailing colons or dashes from cleanup
        summaryText = summaryText.replace(/^[:\-\s]+|[:\-\s]+$/g, '');
    }

    return (
        <div className="relative pl-6 border-l-2 border-slate-800">
            {/* Group Header */}
            <div
                className="absolute -left-[9px] top-0 h-4 w-4 rounded-full border-2 border-slate-800 bg-slate-950 flex items-center justify-center z-10"
            >
                {group.isActive ? (
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                ) : (
                    <div className="h-2 w-2 rounded-full bg-slate-700" />
                )}
            </div>

            <div className="mb-2 flex items-center justify-between group/header bg-slate-900/40 p-2 rounded-md border border-slate-800/50">
                <div className="flex items-center gap-3 overflow-hidden">
                    <h4 className={`text-sm font-bold uppercase tracking-wider whitespace-nowrap ${group.isActive ? 'text-green-400' : 'text-slate-500'}`}>
                        {group.label} (ITERATION {iterations.length})
                    </h4>

                    {/* Vertical separator */}
                    <div className="h-4 w-px bg-slate-700/50" />

                    {/* Live Summary on the Right - Persistent */}
                    <span className="text-xs font-mono text-cyan-300 truncate">
                        {summaryText || ''}
                    </span>
                </div>

                <span className="text-xs font-mono text-slate-600 ml-2 whitespace-nowrap">
                    {new Date(group.startTime).toLocaleTimeString()}
                </span>
            </div>

            {/* Body: Dashboard View of Children
                Calculated using persistence: Show steps from the latest iteration that HAS steps.
                This prevents the "empty box" effect when a new iteration starts but hasn't finished steps yet.
            */}
            {(() => {
                let displaySteps = lastIteration?.steps || [];

                // Persistence Logic for Children
                if (displaySteps.length === 0 && iterations.length > 1) {
                    for (let i = iterations.length - 2; i >= 0; i--) {
                        if (iterations[i].steps.length > 0) {
                            displaySteps = iterations[i].steps;
                            break;
                        }
                    }
                }

                if (displaySteps.length === 0) return null;

                return (
                    <div className="pl-2 space-y-1 mb-4 border-l-2 border-slate-800/30 ml-2">
                        {displaySteps.map((step) => (
                            <div key={step.id + '_dash'} className="animate-in fade-in duration-300">
                                <ExecutionCard
                                    step={step}
                                    // If this is the VERY latest iteration, it's active. If we fell back to history, it's technically 'history' but we show it as 'active' context for the dashboard.
                                    // Actually, let's keep it 'history' style if it's old, or 'active' if it's current?
                                    // User wants "Dashboard". Dashboards usually look "Active".
                                    // Let's pass a special "dashboard" state or just rely on 'active' styling but maybe tone it down?
                                    // For now, use 'active' if group is active, otherwise history.
                                    state={group.isActive ? 'active' : 'history'}
                                />
                            </div>
                        ))}
                    </div>
                );
            })()}
        </div>
    );
};

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
                const isLoopHeader = step.type === 'LOOP';

                // Check if we are continuing the SAME loop (Nested Iteration Logic)
                if (currentGroup && currentGroup.type === 'LOOP' && isLoopHeader && currentGroup.blockId === step.blockId) {
                    // DEDUPLICATION: Check if this iteration ID already exists in the group
                    const exists = currentGroup.iterations.some(iter => iter.id === `iter_${step.timestamp}`);
                    if (exists) return prevGroups;

                    // APPEND NEW ITERATION TO EXISTING GROUP
                    currentGroup.iterations.push({
                        id: `iter_${step.timestamp}`,
                        headerStep: step,
                        steps: []
                    });
                    return newGroups; // Mutated in place (Vue-style habit, but safe here since we cloned array) 
                }

                if (isStart || isLoopHeader || !currentGroup || !currentGroup.isActive) {
                    // NEW GROUP
                    const newGroup: CycleGroup = {
                        id: `group_${step.timestamp}`,
                        blockId: step.blockId,
                        label: isStart ? (step.label || 'Start') : step.label,
                        startTime: step.timestamp,
                        type: isLoopHeader ? 'LOOP' : 'SEQUENCE',
                        iterations: [{
                            id: `iter_${step.timestamp}`,
                            headerStep: step,
                            steps: isStart ? [] : [step] // Start is weird, usually has no steps until next one?
                        }],
                        isActive: true
                    };

                    if (currentGroup) currentGroup.isActive = false;
                    return [...newGroups, newGroup].slice(-20);
                } else {
                    // REGULAR STEP -> Append to Current Group's LAST Iteration
                    const lastIteration = currentGroup.iterations[currentGroup.iterations.length - 1];
                    if (lastIteration.steps.some(s => s.id === step.id)) return prevGroups; // Dedup

                    lastIteration.steps.push(step);
                    return [...newGroups];
                }
            });
        };

        const handleBlockEnd = (data: any) => {
            setCycleGroups(prevGroups => {
                const newGroups = [...prevGroups];
                const currentGroup = newGroups.length > 0 ? newGroups[newGroups.length - 1] : null;

                if (currentGroup) {
                    const currentIteration = currentGroup.iterations[currentGroup.iterations.length - 1];

                    // Check Header Step (for Loop Summary)
                    if (currentIteration.headerStep.blockId === data.blockId) {
                        currentIteration.headerStep = {
                            ...currentIteration.headerStep,
                            output: data.output,
                            error: data.success ? undefined : (data.error || 'Failed'),
                            summary: data.summary
                        };
                        // Do NOT return here. For SEQUENCE groups, the headerStep is often also in the steps array.
                        // We must continue to update the body steps below so the UI (which renders steps) updates.
                        // If Loop Condition is FALSE (Loop Finished) or explicitly stopped, mark group as inactive
                        // This ensures subsequent blocks (like END or what follows) start a NEW group instead of nesting inside.
                        if (data.output === false || (data.output && data.output.status === 'MAX_ITERATIONS')) {
                            currentGroup.isActive = false;
                        }
                    }

                    // Check Body Steps
                    for (let i = currentIteration.steps.length - 1; i >= 0; i--) {
                        if (currentIteration.steps[i].blockId === data.blockId && !currentIteration.steps[i].output && !currentIteration.steps[i].error) {
                            currentIteration.steps[i] = {
                                ...currentIteration.steps[i],
                                output: data.output,
                                error: data.success ? undefined : (data.error || 'Failed'),
                                summary: data.summary
                            };
                            return newGroups; // Now we can return after updating the body step
                        }
                    }
                }
                return prevGroups;
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
                    {cycleGroups.map((group, index) => {
                        if (group.type === 'SEQUENCE') {
                            // Render SEQUENCE flat, no group UI
                            return (
                                <div key={group.id} className="space-y-2">
                                    {group.iterations[0].steps.map((step) => {
                                        if (step.type === 'START') return null;
                                        return (
                                            <div key={step.id} className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                                                <ExecutionCard
                                                    step={step}
                                                    state={group.isActive && step === group.iterations[0].steps[group.iterations[0].steps.length - 1] && !step.output ? 'active' : 'history'}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        }

                        // Render LOOP as Collapsible Group
                        return (
                            <CycleGroupItem
                                key={group.id}
                                group={group}
                                isLast={index === cycleGroups.length - 1}
                            />
                        );
                    })}
                    <div ref={bottomRef} className="h-4" />
                </div>
            </ScrollArea>
        </div>
    );
};
