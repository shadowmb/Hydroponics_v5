import React, { useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, Play, SkipForward, Square, Activity, CheckCircle, AlertCircle, Ban } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";

export interface ResumeContext {
    type: 'active_flow' | 'active_with_expired' | 'expired' | 'clean';
    programId: string;
    programName: string;
    pausedAt?: string;
    pauseTimeout?: number;
    pauseFlowName?: string;
    pauseBlockLabel?: string;
    pauseWindowId?: string;
    pauseWindowName?: string;
    activeWindows: Array<{ id: string; name: string }>;
    expiredWindows: Array<{ id: string; name: string; startTime: string; endTime: string }>;
}

interface ResumeProgramDialogProps {
    open: boolean;
    onConfirm: (strategy: 'resume_flow' | 'skip_active' | 'stop_program' | 'run_expired' | 'skip_expired' | 'clean_start' | 'terminate_flow') => void;
    onCancel: () => void;
}

function formatElapsed(pausedAt?: string): string {
    if (!pausedAt) return 'N/A';
    const elapsed = Date.now() - new Date(pausedAt).getTime();
    const minutes = Math.floor(elapsed / 60000);
    if (minutes < 60) return `${minutes} минути`;
    const hours = Math.floor(minutes / 60);
    return `${hours} часа`;
}

function formatRemaining(timeout?: number, pausedAt?: string): string {
    if (!timeout || !pausedAt) return 'N/A';
    const elapsed = (Date.now() - new Date(pausedAt).getTime()) / 1000;
    const remaining = Math.max(0, timeout - elapsed);
    const minutes = Math.floor(remaining / 60);
    const seconds = Math.floor(remaining % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export const ResumeProgramDialog: React.FC<ResumeProgramDialogProps> = ({
    open,
    onConfirm,
    onCancel
}) => {
    const [context, setContext] = useState<ResumeContext | null>(null);
    const [loading, setLoading] = useState(false);

    // Fetch context when dialog opens
    useEffect(() => {
        if (open) {
            fetchContext();
        } else {
            setContext(null);
        }
    }, [open]);

    const fetchContext = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/active-program/resume-context');
            const { data } = await res.json();
            setContext(data);
        } catch (err) {
            console.error('Failed to fetch resume context:', err);
        } finally {
            setLoading(false);
        }
    };

    if (!context && !loading) return null;
    if (loading) {
        return (
            <Dialog open={open} onOpenChange={(val) => !val && onCancel()}>
                <DialogContent className="sm:max-w-md border-amber-500/30 bg-slate-950/95 backdrop-blur-xl">
                    <DialogHeader>
                        <DialogTitle>Loading...</DialogTitle>
                    </DialogHeader>
                    <div className="flex items-center justify-center p-8">
                        <Clock className="h-8 w-8 animate-spin text-amber-500" />
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    if (!context) return null;

    const renderDescription = () => {
        switch (context.type) {
            case 'active_flow':
                return (
                    <>
                        Има активен процес (помпа/цикъл), който беше прекъснат.
                        Как искате да продължите?
                    </>
                );
            case 'active_with_expired':
                return (
                    <>
                        Системата е в <strong>смесен режим</strong>: има прекъснат активен процес И пропуснати прозорци.
                    </>
                );
            case 'expired':
                return "Времето на следните прозорци изтече докато програмата беше спряна.";
            case 'clean':
                return (
                    <>
                        {context.pauseWindowName ?
                            <>
                                Програмата е паузирана във времеви прозорец: <strong className="text-white">"{context.pauseWindowName}"</strong>.
                                <br />
                                Няма активни процеси (потоци).
                            </> :
                            'Програмата е паузирана, но няма активни или пропуснати прозорци.'
                        }
                        <br /><br />
                        Желаете ли да продължите наблюдението (check)?
                    </>
                );
            default:
                return null;
        }
    };

    const renderBody = () => {
        switch (context.type) {
            case 'active_flow':
                return (
                    <div className="bg-blue-900/20 border border-blue-800 p-4 rounded-md my-4">
                        <div className="mb-2">
                            <p className="text-sm font-medium text-blue-200">
                                Прозорец: {context.pauseWindowName || 'N/A'}
                            </p>
                        </div>

                        {(context.pauseFlowName || context.pauseBlockLabel) && (
                            <div className="ml-4 text-sm text-gray-400">
                                Поток: <span className="font-mono text-blue-300">{context.pauseFlowName || 'Unknown'}</span>
                                {context.pauseBlockLabel && (
                                    <> → Блок "<span className="text-green-300">{context.pauseBlockLabel}</span>"</>
                                )}
                            </div>
                        )}

                        {/* Static Timer Info */}
                        <div className="mt-3 pt-3 border-t border-blue-800/50 text-xs text-gray-500">
                            <div className="flex items-center gap-2">
                                <Clock className="w-3 h-3" />
                                <span>
                                    Паузирано преди: {formatElapsed(context.pausedAt)}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <AlertCircle className="w-3 h-3" />
                                <span>
                                    Остава време: {formatRemaining(context.pauseTimeout, context.pausedAt)}
                                </span>
                            </div>
                        </div>
                    </div>
                );
            case 'active_with_expired':
                return (
                    <div className="space-y-4 my-4">
                        <div className="bg-blue-900/20 border border-blue-800 p-3 rounded-md flex items-center gap-3">
                            <Activity className="h-4 w-4 text-blue-400" />
                            <div>
                                <p className="text-xs font-medium text-blue-200 uppercase">Активен</p>
                                <p className="text-sm text-gray-300">{context.pauseWindowName || context.activeWindows.map(w => w.name).join(', ')}</p>
                                {(context.pauseFlowName || context.pauseBlockLabel) && (
                                    <p className="text-xs text-gray-400 mt-1">
                                        {context.pauseFlowName} {context.pauseBlockLabel ? `→ ${context.pauseBlockLabel}` : ''}
                                    </p>
                                )}
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
                );
            case 'expired':
                return (
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
                );
            case 'clean':
                return (
                    <>
                        <div className="bg-green-900/20 border border-green-800 p-4 rounded-md my-4 flex items-center gap-3">
                            <CheckCircle className="h-5 w-5 text-green-400" />
                            <div>
                                <p className="text-sm font-medium text-green-200">Състояние: В Покой (Idle)</p>
                                <p className="text-xs text-gray-400">Програмата ще възобнови следенето на условията.</p>
                            </div>
                        </div>

                        {/* Static Timer Info */}
                        <div className="mt-3 pt-3 border-t border-gray-800/50 text-xs text-gray-500">
                            <div className="flex items-center gap-2">
                                <Clock className="w-3 h-3" />
                                <span>
                                    Паузирано преди: {formatElapsed(context.pausedAt)}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <AlertCircle className="w-3 h-3" />
                                <span>
                                    Остава време: {formatRemaining(context.pauseTimeout, context.pausedAt)}
                                </span>
                            </div>
                        </div>
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
                            className="bg-red-900/50 hover:bg-red-900 border border-red-800 whitespace-nowrap px-4"
                        >
                            <Square className="w-4 h-4 mr-2" />
                            STOP PROGRAM
                        </Button>
                        <Button
                            onClick={() => onConfirm('terminate_flow')}
                            className="bg-amber-600 hover:bg-amber-700 text-white whitespace-nowrap"
                        >
                            <Ban className="w-4 h-4 mr-2" />
                            Terminate Flow
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
            case 'clean':
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
                            onClick={() => onConfirm('clean_start')}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            <Play className="w-4 h-4 mr-2" />
                            Resume
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
                        {context.type === 'active_flow' || context.type === 'active_with_expired' ?
                            <Activity className="h-6 w-6 text-blue-500" /> :
                            context.type === 'clean' ?
                                <CheckCircle className="h-6 w-6 text-green-500" /> :
                                <AlertTriangle className="h-6 w-6" />
                        }
                        <DialogTitle>
                            {context.type === 'active_flow' ? 'Активен Процес' :
                                context.type === 'active_with_expired' ? 'Конфликт при Възобновяване' :
                                    context.type === 'clean' ? 'Възобновяване' :
                                        'Пропуснати Прозорци'}
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-gray-300">
                        {renderDescription()}
                    </DialogDescription>
                </DialogHeader>
                {renderBody()}
                <DialogFooter className="flex w-full pt-2">
                    {renderButtons()}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
