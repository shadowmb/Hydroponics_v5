import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

import {
    Play,
    Pause,
    Square,
    Clock,
    Calendar
} from 'lucide-react';
import { useStore } from '../../core/useStore';
import { activeProgramService } from '../../services/activeProgramService';
import type { IActiveProgram } from '../../types/ActiveProgram';
import { toast } from 'sonner';

// Helper for Uptime
const formatUptime = (startTime: string | Date | undefined, pausedDuration: number = 0): string => {
    if (!startTime) return "00:00:00";

    const start = new Date(startTime).getTime();
    const now = Date.now();
    let diff = now - start - (pausedDuration || 0);

    if (diff < 0) diff = 0;

    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const RunningProgramCard: React.FC = () => {
    const { activeSession } = useStore();
    const [fullProgram, setFullProgram] = useState<IActiveProgram | null>(null);
    const [uptime, setUptime] = useState<string>("00:00:00");
    const [isLoading, setIsLoading] = useState(false);
    const [showStopConfirm, setShowStopConfirm] = useState(false);

    // 1. Initial Load of Full Details
    useEffect(() => {
        const fetchDetails = async () => {
            if (activeSession?.programId && !fullProgram) {
                // If we have a session in store but no details locally, fetch them
                try {
                    const data = await activeProgramService.getActive();
                    if (data) setFullProgram(data);
                } catch (err) {
                    console.error("Failed to fetch active program details", err);
                }
            } else if (!activeSession?.programId) {
                // Try fetching even if store is empty
                try {
                    const data = await activeProgramService.getActive();
                    // If backend returns data, it means something is running!
                    if (data && data.status !== 'stopped' && data.status !== 'completed') {
                        setFullProgram(data);
                    }
                } catch (err) {
                    console.error("Failed to fetch active program details", err);
                }
            }
        };

        fetchDetails();
    }, [activeSession?.programId]); // Only retry if ID changes

    // Fallback: If store is empty but we fetched fullProgram successfully, construct a temporary session object
    const sessionToDisplay = activeSession && activeSession.status !== 'idle' ? activeSession : (fullProgram && fullProgram.status !== 'stopped' ? {
        programId: fullProgram._id,
        // @ts-ignore
        programName: fullProgram.name,
        status: fullProgram.status || 'running',
        startTime: fullProgram.startTime || new Date().toISOString(), // Fallback
        currentBlockId: 'unknown',
        // @ts-ignore
        pausedDuration: 0 // Simplification
    } : null);

    // 2. Timer Loop
    useEffect(() => {
        if (!sessionToDisplay || sessionToDisplay.status !== 'running') return;

        const tick = () => {
            // @ts-ignore - pausedDuration might be missing in type
            setUptime(formatUptime(sessionToDisplay.startTime, sessionToDisplay.pausedDuration));
        };

        // Initial tick
        tick();

        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [sessionToDisplay?.status, sessionToDisplay?.startTime]);

    // 3. Handlers
    const handlePauseResume = async () => {
        if (!sessionToDisplay) return;
        setIsLoading(true);
        try {
            if (sessionToDisplay.status === 'running') {
                await activeProgramService.pause();
                toast.success('Program paused');
            } else {
                await activeProgramService.start(); // Resume usually hits start endpoint or specialised resume
                toast.success('Program resumed');
            }
            // Force refresh active session via service to update store
            await activeProgramService.getActive();
            // Note: Store update usually happens via socket, but we can optimistically update or re-fetch
        } catch (error) {
            toast.error('Failed to change status');
        } finally {
            setIsLoading(false);
        }
    };

    const handleStop = async () => {
        setIsLoading(true);
        try {
            await activeProgramService.stop();
            toast.success('Program stopped');
            setShowStopConfirm(false);
            setFullProgram(null);
        } catch (error) {
            toast.error('Failed to stop program');
        } finally {
            setIsLoading(false);
        }
    };

    // 4. Render Logic
    if (!sessionToDisplay || sessionToDisplay.status === 'idle' || sessionToDisplay.status === 'stopped' || sessionToDisplay.status === 'completed') {
        // If we really have no data after attempting fetch, render nothing
        return null;
    }

    // 5. Timeline Logic - Prepare Visual Items based on Program Type

    // Define the structure for our visual list
    interface VisualItem {
        _id: string;
        name: string;
        time: string;
        displayStatus: 'completed' | 'running' | 'next' | 'pending' | 'skipped';
        details?: string; // e.g., "until 19.01"
    }

    let visualItems: VisualItem[] = [];

    // BRANCH A: ADVANCED MODE (Windows)
    // @ts-ignore - windows property might not be in IActiveProgram type definition yet, but comes from backend
    if (fullProgram?.type === 'ADVANCED' || (fullProgram?.windows && fullProgram.windows.length > 0)) {
        // @ts-ignore
        const windows = fullProgram.windows || [];
        // @ts-ignore
        const windowsState = fullProgram.windowsState || [];

        visualItems = windows.map((window: any) => {
            // Find status in state
            const state = windowsState.find((ws: any) => ws.windowId === window.id);
            const statusRaw = state?.status || 'pending';

            let displayStatus: VisualItem['displayStatus'] = 'pending';
            let details = "";

            if (statusRaw === 'active') displayStatus = 'running';
            else if (statusRaw === 'completed') displayStatus = 'completed';
            else if (statusRaw === 'skipped') {
                displayStatus = 'skipped';
                if (state?.skipUntil) {
                    const date = new Date(state.skipUntil);
                    details = `until ${date.toLocaleDateString('bg-BG', { day: '2-digit', month: '2-digit' })}`;
                }
            }
            else displayStatus = 'pending';

            return {
                _id: window.id,
                name: window.name,
                time: `${window.startTime} - ${window.endTime}`,
                displayStatus,
                details
            };
        });

        // BRANCH B: BASIC MODE (Schedule)
    } else {
        const schedule = fullProgram?.schedule || [];
        visualItems = schedule.map((item) => {
            let status: VisualItem['displayStatus'] = 'pending';
            if (item.status === 'completed') status = 'completed';
            else if (item.status === 'skipped') status = 'skipped';
            else if (item.status === 'running') status = 'running';

            return {
                _id: item._id,
                name: item.name,
                time: item.time,
                displayStatus: status
            };
        });
    }

    // Refine 'Next' logic (Common for both types): The first 'pending' item is 'next'
    let foundNext = false;
    visualItems = visualItems.map(item => {
        if (item.displayStatus === 'pending' && !foundNext) {
            foundNext = true;
            return { ...item, displayStatus: 'next' as const };
        }
        return item;
    });
    return (
        <Card className="border-l-4 border-l-blue-500 shadow-md">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            {/* @ts-ignore - programName missing in type */}
                            <CardTitle className="text-xl">{sessionToDisplay.programName || fullProgram?.name || "Unknown Program"}</CardTitle>
                            <Badge variant={sessionToDisplay.status === 'running' ? 'default' : 'secondary'} className={sessionToDisplay.status === 'running' ? 'bg-blue-600 animate-pulse' : 'bg-amber-500'}>
                                {sessionToDisplay.status.toUpperCase()}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground font-mono">
                            <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4 text-blue-400" />
                                {uptime}
                            </span>
                            {(fullProgram || sessionToDisplay.startTime) && (
                                <span className="flex items-center gap-1 text-xs">
                                    <Calendar className="h-4 w-4 opacity-70" />
                                    Started: {new Date(sessionToDisplay.startTime || "").toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePauseResume}
                            disabled={isLoading}
                        >
                            {sessionToDisplay.status === 'running' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>

                        {!showStopConfirm ? (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setShowStopConfirm(true)}
                                disabled={isLoading}
                            >
                                <Square className="h-4 w-4" />
                            </Button>
                        ) : (
                            <div className="flex items-center gap-1 bg-red-950/20 p-1 rounded-md border border-red-500/50 animate-in fade-in zoom-in duration-200">
                                <Button variant="ghost" size="sm" onClick={() => setShowStopConfirm(false)} className="h-7 px-2 text-xs">Cancel</Button>
                                <Button variant="destructive" size="sm" onClick={handleStop} className="h-7 px-2 text-xs">Confirm</Button>
                            </div>
                        )}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="pt-0">
                {/* Timeline List */}
                <div className="mt-2 space-y-1">
                    {visualItems.length > 0 ? (
                        <div className="flex flex-col gap-1">
                            {visualItems.map((item) => {
                                // Dynamic Styles based on status
                                const isRunning = item.displayStatus === 'running';
                                const isCompleted = item.displayStatus === 'completed';
                                const isSkipped = item.displayStatus === 'skipped';
                                const isNext = item.displayStatus === 'next';

                                // Base class
                                let rowClass = "flex items-center justify-between p-2 rounded-md border transition-all duration-300 ease-in-out";
                                let label = "";

                                if (isRunning) {
                                    // ACTIVE: Green theme (Expanded Size & Focus)
                                    rowClass += " bg-green-500/10 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.15)] text-green-100 min-h-[72px] scale-[1.02] mx-1 z-10";
                                    label = "ACTIVE";
                                } else if (isNext) {
                                    // NEXT: Muted theme
                                    rowClass += " bg-muted/30 border-muted-foreground/20 text-foreground min-h-[48px] opacity-90";
                                    label = "NEXT";
                                } else if (isCompleted) {
                                    // DONE: Blue theme (Completed is Blue based on legend)
                                    rowClass += " opacity-60 bg-blue-500/5 border-blue-500/20 text-blue-200 min-h-[48px]";
                                    label = "DONE";
                                } else if (isSkipped) {
                                    // SKIPPED: Purple theme
                                    rowClass += " opacity-70 bg-purple-500/5 border-purple-500/20 text-purple-200 min-h-[48px]";
                                    label = item.details ? `SKIPPED (${item.details})` : "SKIPPED";
                                } else {
                                    rowClass += " opacity-30 border-transparent min-h-[40px]"; // Pending far future
                                }

                                return (
                                    <div key={item._id} className={rowClass}>
                                        <div className="flex items-center gap-4 pl-1">
                                            {/* Status Icon */}
                                            <div className="w-4 flex justify-center items-center">
                                                {isRunning && (
                                                    <span className="relative flex h-3 w-3">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 shadow-[0_0_10px_#22c55e]"></span>
                                                    </span>
                                                )}
                                                {isCompleted && <div className="h-2 w-2 rounded-full bg-blue-500" />}
                                                {isSkipped && <div className="h-2 w-2 rounded-full bg-purple-500" />}
                                                {isNext && <div className="h-2.5 w-2.5 rounded-full border-2 border-slate-400" />}
                                                {item.displayStatus === 'pending' && <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />}
                                            </div>

                                            {/* Time & Name */}
                                            <div className="flex flex-col justify-center">
                                                <span className={`font-medium leading-tight ${isCompleted ? 'line-through decoration-blue-500/50' : ''} ${isRunning ? 'text-lg font-bold tracking-tight text-white' : 'text-sm'}`}>
                                                    {item.name}
                                                </span>
                                                <span className={`font-mono mt-0.5 ${isRunning ? 'text-xs text-green-200/80 font-bold' : 'text-[10px] opacity-70'}`}>
                                                    {item.time || "00:00"}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Status Label (Right Side) */}
                                        {label && (
                                            <div className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded transition-colors ${isRunning ? 'bg-green-500 text-black shadow-sm' :
                                                    isCompleted ? 'text-blue-400 bg-blue-500/10' :
                                                        isSkipped ? 'text-purple-300 bg-purple-500/10' :
                                                            isNext ? 'text-foreground/70 bg-muted' : ''
                                                }`}>
                                                {label}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-4 text-muted-foreground text-xs">
                            Checking schedule details...
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
