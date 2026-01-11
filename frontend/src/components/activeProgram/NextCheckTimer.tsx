import { useState, useEffect } from 'react';
import { Timer, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { activeProgramService } from '../../services/activeProgramService';
import { toast } from 'sonner';

interface NextCheckTimerProps {
    lastCheck?: Date | string;
    checkInterval?: number; // In minutes
    status?: string; // Window status
    programStatus?: string; // Overall Program Status
    onRefresh?: () => void;
}

export const NextCheckTimer = ({ lastCheck, checkInterval = 1, status, programStatus, onRefresh }: NextCheckTimerProps) => {
    const [timeString, setTimeString] = useState<string>('');
    const [isOverdue, setIsOverdue] = useState(false);
    const [checking, setChecking] = useState(false);

    // Filter visibility driven by props
    const isVisible =
        (programStatus === 'running') && // Global status
        (status === 'active' || status === 'pending') && // Window status
        lastCheck; // Must have a last check time

    useEffect(() => {
        if (!isVisible || !lastCheck) {
            setTimeString('');
            return;
        }

        const tick = () => {
            const last = new Date(lastCheck).getTime();
            const intervalMs = (checkInterval || 1) * 60 * 1000;
            const nextCheck = last + intervalMs;
            const now = Date.now();
            const diff = nextCheck - now;

            if (diff <= 0) {
                setTimeString('Сега');
                setIsOverdue(true);
            } else {
                setIsOverdue(false);
                if (diff > 60000) {
                    setTimeString(`${Math.ceil(diff / 60000)} мин`);
                } else {
                    setTimeString(`${Math.ceil(diff / 1000)} сек`);
                }
            }
        };

        tick();
        const timer = setInterval(tick, 1000);
        return () => clearInterval(timer);
    }, [lastCheck, checkInterval, isVisible]);

    const handleForceCheck = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setChecking(true);
        // Reset message locally to show feedback immediately? 
        // Better to just spin icon.
        try {
            await activeProgramService.forceCheck();
            toast.success('Инициирана е извънредна проверка');
            setTimeout(() => onRefresh?.(), 500);
        } catch (error) {
            toast.error('Грешка при проверка');
        } finally {
            // Keep spinning for a moment or until next update
            setTimeout(() => setChecking(false), 1000);
        }
    };

    if (!isVisible || !timeString) return null;

    return (
        <div
            className={`
                flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border transition-colors
                ${isOverdue
                    ? 'bg-amber-100 text-amber-700 border-amber-200 animate-pulse'
                    : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'}
            `}
        >
            <div className="flex items-center gap-1" title="Време до следваща автоматична проверка">
                <Timer className="h-3 w-3" />
                <span className="text-[10px] uppercase opacity-70">Проверка:</span>
                <span className="font-mono min-w-[30px] text-right">{timeString}</span>
            </div>

            {/* Separator */}
            <div className={`h-3 w-[1px] ${isOverdue ? 'bg-amber-300' : 'bg-slate-300 dark:bg-slate-600'}`} />

            {/* Force Check Button */}
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className={`h-4 w-4 p-0 hover:bg-transparent ${checking ? 'animate-spin' : ''}`}
                            onClick={handleForceCheck}
                        >
                            <RefreshCw className="h-3 w-3" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                        <p>Провери сега (Force Check)</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    );
};
