import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, Play, SkipForward, Square, Activity } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";

export interface ResumeContext {
    type: 'active_flow' | 'active_with_expired' | 'expired' | 'clean';
    activeWindows: Array<{ id: string, name: string }>;
    expiredWindows: Array<{ id: string, name: string }>;
}

interface ResumeProgramDialogProps {
    open: boolean;
    context: ResumeContext | null;
    onConfirm: (strategy: 'resume_flow' | 'skip_active' | 'stop_program' | 'run_expired' | 'skip_expired') => void;
    onCancel: () => void;
}

const TIMEOUT_SECONDS = 60;

export const ResumeProgramDialog: React.FC<ResumeProgramDialogProps> = ({
    open,
    context,
    onConfirm,
    onCancel
}) => {
    const [timeLeft, setTimeLeft] = useState(TIMEOUT_SECONDS);
    const [progress, setProgress] = useState(100);
    const timerRef = useRef<number | null>(null);
    const hasTriggeredRef = useRef(false);

    // Determines default action based on context type
    const getDefaultAction = useCallback((): 'stop_program' | 'skip_expired' => {
        if (!context) return 'stop_program';
        if (context.type === 'expired') return 'skip_expired';
        return 'stop_program'; // Default safety for active flows
    }, [context]);

    const handleTimeout = useCallback(() => {
        if (hasTriggeredRef.current) {
            console.log('[ResumeProgramDialog] Timeout already triggered, ignoring duplicate call');
            return;
        }

        hasTriggeredRef.current = true;
        const action = getDefaultAction();
        console.log('[ResumeProgramDialog] ⏰ TIMEOUT TRIGGERED - Executing default action:', action);
        onConfirm(action);
    }, [getDefaultAction, onConfirm]);

    useEffect(() => {
        // Reset state when dialog opens/closes
        if (!open || !context) {
            console.log('[ResumeProgramDialog] Dialog closed or no context, resetting timer');
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            setTimeLeft(TIMEOUT_SECONDS);
            setProgress(100);
            hasTriggeredRef.current = false;
            return;
        }

        console.log('[ResumeProgramDialog] Starting countdown timer for context:', context.type);
        hasTriggeredRef.current = false;

        timerRef.current = setInterval(() => {
            setTimeLeft((prev) => {
                const newTime = prev - 1;

                if (newTime <= 0) {
                    console.log('[ResumeProgramDialog] Timer reached 0, triggering timeout handler');
                    if (timerRef.current) {
                        clearInterval(timerRef.current);
                        timerRef.current = null;
                    }
                    // Use setTimeout to ensure state updates complete before calling onConfirm
                    setTimeout(() => handleTimeout(), 0);
                    return 0;
                }

                setProgress((newTime / TIMEOUT_SECONDS) * 100);
                return newTime;
            });
        }, 1000);

        return () => {
            console.log('[ResumeProgramDialog] Cleanup: clearing timer');
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [open, context, handleTimeout]);

    if (!context) return null;

    const renderContent = () => {
        switch (context.type) {
            case 'active_flow':
                return (
                    <>
                        <DialogDescription className="text-gray-300">
                            Има активен процес (помпа/цикъл), който беше прекъснат.
                            Как искате да продължите?
                        </DialogDescription>
                        <div className="bg-blue-900/20 border border-blue-800 p-4 rounded-md my-4 flex items-center gap-3">
                            <Activity className="h-5 w-5 text-blue-400 animate-pulse" />
                            <div>
                                <p className="text-sm font-medium text-blue-200">Активен прозорец:</p>
                                <p className="text-sm text-gray-400">{context.activeWindows.map(w => w.name).join(', ')}</p>
                            </div>
                        </div>
                    </>
                );
            case 'active_with_expired':
                return (
                    <>
                        <DialogDescription className="text-gray-300">
                            Системата е в <strong>смесен режим</strong>: има прекъснат активен процес И пропуснати прозорци.
                        </DialogDescription>

                        <div className="space-y-4 my-4">
                            <div className="bg-blue-900/20 border border-blue-800 p-3 rounded-md flex items-center gap-3">
                                <Activity className="h-4 w-4 text-blue-400" />
                                <div>
                                    <p className="text-xs font-medium text-blue-200 uppercase">Активен</p>
                                    <p className="text-sm text-gray-300">{context.activeWindows.map(w => w.name).join(', ')}</p>
                                </div>
                            </div>

                            <div className="bg-amber-900/20 border border-amber-800 p-3 rounded-md">
                                <div className="flex items-center gap-2 mb-2">
                                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                                    <p className="text-xs font-medium text-amber-200 uppercase">Пропуснати (Expired)</p>
                                </div>
                                <ul className="text-sm text-gray-400 pl-6 list-disc">
                                    {context.expiredWindows.map(w => (
                                        <li key={w.id}>{w.name}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </>
                );
            case 'expired':
                return (
                    <>
                        <DialogDescription className="text-gray-300">
                            Времето на следните прозорци изтече докато програмата беше спряна.
                        </DialogDescription>
                        <ScrollArea className="h-[100px] w-full rounded-md border border-gray-800 bg-gray-900/50 p-4 my-4">
                            <ul className="space-y-2">
                                {context.expiredWindows.map((w) => (
                                    <li key={w.id} className="text-sm font-medium text-gray-200 flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-amber-500/50" />
                                        {w.name}
                                    </li>
                                ))}
                            </ul>
                        </ScrollArea>
                    </>
                );
            default:
                return null;
        }
    };

    const renderButtons = () => {
        switch (context.type) {
            case 'active_flow':
                return (
                    <div className="flex gap-2 w-full justify-between">
                        <Button
                            variant="destructive"
                            onClick={() => onConfirm('stop_program')}
                            className="bg-red-900/50 hover:bg-red-900 border border-red-800"
                        >
                            <Square className="w-4 h-4 mr-2" />
                            STOP PROGRAM
                        </Button>
                        <Button
                            onClick={() => onConfirm('resume_flow')}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            <Play className="w-4 h-4 mr-2" />
                            Resume Flow
                        </Button>
                    </div>
                );
            case 'active_with_expired':
                return (
                    <div className="flex gap-2 w-full justify-between">
                        <Button
                            variant="destructive"
                            onClick={() => onConfirm('stop_program')}
                            className="bg-red-900/50 hover:bg-red-900 border border-red-800"
                        >
                            <Square className="w-4 h-4 mr-2" />
                            STOP PROGRAM
                        </Button>
                        <Button
                            onClick={() => onConfirm('resume_flow')}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            <Play className="w-4 h-4 mr-2" />
                            Resume Flow
                        </Button>
                    </div>
                );
            case 'expired':
                return (
                    <div className="flex gap-2 w-full justify-between">
                        <Button
                            variant="secondary"
                            onClick={() => onConfirm('skip_expired')}
                        >
                            <SkipForward className="w-4 h-4 mr-2" />
                            Skip All
                        </Button>
                        <Button
                            onClick={() => onConfirm('run_expired')}
                            className="bg-amber-600 hover:bg-amber-700"
                        >
                            <Play className="w-4 h-4 mr-2" />
                            Run Checks Now
                        </Button>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onCancel()}>
            <DialogContent className="sm:max-w-md border-amber-500/30 bg-slate-950/95 backdrop-blur-xl">
                <DialogHeader>
                    <div className="flex items-center gap-2 text-amber-500 mb-2">
                        {context.type === 'active_flow' ? <Activity className="h-6 w-6 text-blue-500" /> : <AlertTriangle className="h-6 w-6" />}
                        <DialogTitle>
                            {context.type === 'active_flow' ? 'Активен Процес' :
                                context.type === 'active_with_expired' ? 'Конфликт при Възобновяване' :
                                    'Пропуснати Прозорци'}
                        </DialogTitle>
                    </div>
                    {renderContent()}
                </DialogHeader>

                <div className="flex flex-col items-center justify-center p-2 text-sm text-gray-400 gap-2 w-full">
                    <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-amber-500/70" />
                        <span className="text-xs mr-2">Default Action: </span>
                        <span className="text-white font-mono font-bold text-lg">{timeLeft}s</span>
                        <span className="text-xs ml-2 text-gray-500">
                            ({getDefaultAction() === 'stop_program' ? 'STOP' : 'SKIP'})
                        </span>
                    </div>
                    <Progress value={progress} className="h-1 w-full bg-gray-800" indicatorClassName={timeLeft < 10 ? "bg-red-500" : "bg-amber-600"} />
                </div>

                <DialogFooter className="flex w-full pt-2">
                    {renderButtons()}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
