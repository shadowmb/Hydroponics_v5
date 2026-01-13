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
import { AlertTriangle, Clock } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";

interface ExpiredWindowsDialogProps {
    open: boolean;
    expiredWindows: Array<{ id: string, name: string }>;
    onConfirm: (strategy: 'run' | 'skip') => void;
    onCancel: () => void; // Usually treats as cancel resume? Or default to skip? Let's say Cancel = Close without action.
}

const TIMEOUT_SECONDS = 60;

export const ExpiredWindowsDialog: React.FC<ExpiredWindowsDialogProps> = ({
    open,
    expiredWindows,
    onConfirm,
    onCancel
}) => {
    const [timeLeft, setTimeLeft] = useState(TIMEOUT_SECONDS);
    const [progress, setProgress] = useState(100);

    useEffect(() => {
        if (!open) {
            setTimeLeft(TIMEOUT_SECONDS);
            setProgress(100);
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    // Auto-Skip on timeout
                    onConfirm('skip');
                    return 0;
                }
                const newTime = prev - 1;
                setProgress((newTime / TIMEOUT_SECONDS) * 100);
                return newTime;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [open, onConfirm]);

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onCancel()}>
            <DialogContent className="sm:max-w-md border-amber-500/50">
                <DialogHeader>
                    <div className="flex items-center gap-2 text-amber-500 mb-2">
                        <AlertTriangle className="h-6 w-6" />
                        <DialogTitle>Пропуснати Времеви Прозорци</DialogTitle>
                    </div>
                    <DialogDescription className="text-gray-300">
                        Времето на следните прозорци изтече докато програмата беше спряна/на пауза.
                        Как искате да продължите?
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="h-[120px] w-full rounded-md border border-gray-800 bg-gray-900/50 p-4 my-2">
                    <ul className="space-y-2">
                        {expiredWindows.map((w) => (
                            <li key={w.id} className="text-sm font-medium text-gray-200 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-amber-500/50" />
                                {w.name}
                            </li>
                        ))}
                    </ul>
                </ScrollArea>

                <div className="flex flex-col items-center justify-center p-2 text-sm text-gray-400 gap-2 w-full">
                    <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-amber-500 animate-pulse" />
                        Автоматично пропускане след: <span className="text-white font-mono ml-1 text-lg font-bold">{timeLeft}s</span>
                    </div>
                    <Progress value={progress} className="h-2 w-full bg-gray-800" indicatorClassName="bg-amber-500 transition-all duration-1000" />
                </div>

                <DialogFooter className="flex gap-2 sm:justify-between w-full">
                    <Button
                        variant="secondary"
                        onClick={() => onConfirm('skip')}
                        className="w-full sm:w-auto"
                    >
                        Пропусни (Skip)
                    </Button>
                    <Button
                        variant="default"
                        onClick={() => onConfirm('run')}
                        className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white"
                    >
                        Изпълни Проверка (Evaluating)
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
