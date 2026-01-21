
import React, { useEffect, useState } from 'react';
import { differenceInSeconds } from 'date-fns';
import { PauseCircle } from 'lucide-react';
import { socketService } from '../../core/SocketService';
import { activeProgramService } from '../../services/activeProgramService';
import type { IActiveProgram } from '../../types/ActiveProgram';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

export const GlobalPauseTimer: React.FC = () => {
    const [program, setProgram] = useState<IActiveProgram | null>(null);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const navigate = useNavigate();

    // Fetch initial state
    const fetchProgram = async () => {
        try {
            const active = await activeProgramService.getActive();
            setProgram(active);
        } catch (error) {
            console.error("Failed to fetch active program", error);
        }
    };

    // Force re-fetch on mount and listen aggressively
    useEffect(() => {
        fetchProgram();

        const handleUpdate = (updated: any) => {
            if (updated && updated.status) {
                setProgram(updated as IActiveProgram);
            } else {
                fetchProgram();
            }
        };

        const handleRefresh = (e: any) => {
            // Optimistic update: If we know it's resuming, hide timer immediately
            if (e?.detail?.data?.state === 'running' || e?.detail?.event === 'program:resumed') {
                // Force hidden state
                setTimeLeft(null);
                setProgram((prev) => prev ? { ...prev, status: 'running' } as IActiveProgram : null);
            }
            fetchProgram();
        };

        socketService.on('active:program_updated', handleUpdate);
        socketService.on('program:paused', handleRefresh); // Backend specific event
        socketService.on('program:resumed', handleRefresh); // We need to catch resume
        socketService.on('active:program_started', handleRefresh);
        socketService.on('active:program_stopped', handleRefresh);

        // Listen via window for generalized refresh events from SocketService
        window.addEventListener('program:refresh', handleRefresh);

        return () => {
            socketService.off('active:program_updated', handleUpdate);
            socketService.off('program:paused', handleRefresh);
            socketService.off('program:resumed', handleRefresh);
            socketService.off('active:program_started', handleRefresh);
            socketService.off('active:program_stopped', handleRefresh);
            window.removeEventListener('program:refresh', handleRefresh);
        };
    }, []);

    // Timer Logic
    useEffect(() => {
        // Safety check - if we have stale state saying paused but time is up or invalid
        if (program?.status !== 'paused') {
            if (timeLeft !== null) setTimeLeft(null); // Clear timer if not paused
            return;
        }

        if (!program.pausedAt || !program.pauseTimeout) {
            setTimeLeft(null);
            return;
        }

        const tick = () => {
            const now = new Date();
            const pausedAt = new Date(program.pausedAt!);
            const elapsed = differenceInSeconds(now, pausedAt);
            const remaining = Math.max(0, (program.pauseTimeout!) - elapsed);

            setTimeLeft(remaining);
        };

        tick();
        const interval = setInterval(tick, 1000);

        return () => clearInterval(interval);
    }, [program]);

    if (!program || program.status !== 'paused' || timeLeft === null) {
        return null;
    }

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // Styling based on urgency
    const isUrgent = timeLeft < 60; // Less than 1 minute

    return (
        <div
            className={cn(
                "hidden md:flex items-center gap-2 px-3 py-1 rounded-full border cursor-pointer transition-colors",
                isUrgent ? "bg-red-500/10 border-red-500 text-red-600 animate-pulse" : "bg-yellow-500/10 border-yellow-500 text-yellow-600"
            )}
            onClick={() => navigate('/active-program')}
            title="Click to view Active Program"
        >
            <PauseCircle className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Paused</span>
            <span className="font-mono text-sm font-semibold border-l pl-2 ml-1 border-current opacity-80">
                {formatTime(timeLeft)}
            </span>
        </div>
    );
};
