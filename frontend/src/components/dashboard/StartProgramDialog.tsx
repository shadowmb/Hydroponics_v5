import React, { useEffect, useState } from 'react';
import { Play, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '../ui/dialog';
import { Button } from '../ui/button';
import type { IProgram } from '../../../../shared/types';

interface StartProgramDialogProps {
    children: React.ReactNode;
    onStart: (programId: string) => Promise<void>;
}

export const StartProgramDialog: React.FC<StartProgramDialogProps> = ({ children, onStart }) => {
    const [open, setOpen] = useState(false);
    const [programs, setPrograms] = useState<IProgram[]>([]);
    const [loading, setLoading] = useState(false);
    const [startingId, setStartingId] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            fetchPrograms();
        }
    }, [open]);

    const fetchPrograms = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/programs');
            if (!res.ok) throw new Error('Failed to fetch programs');
            const data = await res.json();
            setPrograms(data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load programs');
        } finally {
            setLoading(false);
        }
    };

    const handleStart = async (programId: string) => {
        setStartingId(programId);
        try {
            await onStart(programId);
            setOpen(false);
            toast.success('Program started successfully');
        } catch (error) {
            console.error(error);
            // Error handling is done in parent or via toast in parent
        } finally {
            setStartingId(null);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Start Automation Program</DialogTitle>
                    <DialogDescription>
                        Select a program from the list below to start a new execution session.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : programs.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No programs found. Create one in the Editor.
                        </div>
                    ) : (
                        <div className="border rounded-md overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted text-muted-foreground">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">Name</th>
                                        <th className="px-4 py-3 font-medium">ID</th>
                                        <th className="px-4 py-3 font-medium text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {programs.map((program) => (
                                        <tr key={program.id} className="hover:bg-muted/50 transition-colors">
                                            <td className="px-4 py-3 font-medium">{program.name}</td>
                                            <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{program.id}</td>
                                            <td className="px-4 py-3 text-right">
                                                <Button
                                                    size="sm"
                                                    variant="default"
                                                    className="gap-2 h-8"
                                                    onClick={() => handleStart(program.id)}
                                                    disabled={startingId === program.id}
                                                >
                                                    {startingId === program.id ? (
                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                    ) : (
                                                        <Play className="h-3 w-3" />
                                                    )}
                                                    Start
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};
