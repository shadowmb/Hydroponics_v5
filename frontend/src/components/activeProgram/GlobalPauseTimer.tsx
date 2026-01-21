
import React, { useEffect, useState } from 'react';
import { differenceInSeconds } from 'date-fns';
import { PauseCircle } from 'lucide-react';
import { useStore } from '../../core/useStore';
import { cn } from '../../lib/utils';
import { useNavigate } from 'react-router-dom';

export const GlobalPauseTimer: React.FC = () => {
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const navigate = useNavigate();

    // Use selector for performance (only re-render when activeProgram changes)
    const activeProgram = useStore((state) => state.activeProgram);

    // Timer Logic
    useEffect(() => {
        // Safety check - if we have stale state saying paused but time is up or invalid
        if (activeProgram?.status !== 'paused') {
            if (timeLeft !== null) setTimeLeft(null); // Clear timer if not paused
            return;
        }

        if (!activeProgram.pausedAt || !activeProgram.pauseTimeout) {
            setTimeLeft(null);
            return;
        }

        const tick = () => {
            const now = new Date();
            const pausedAt = new Date(activeProgram.pausedAt!);
            const elapsed = differenceInSeconds(now, pausedAt);
            const remaining = Math.max(0, (activeProgram.pauseTimeout!) - elapsed);

            setTimeLeft(remaining);
        };

        tick();
        const interval = setInterval(tick, 1000);

        return () => clearInterval(interval);
    }, [activeProgram, timeLeft]);

    if (!activeProgram || activeProgram.status !== 'paused' || timeLeft === null) {
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
