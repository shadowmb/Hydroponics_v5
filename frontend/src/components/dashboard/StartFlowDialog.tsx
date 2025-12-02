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
import type { IFlow } from '../../../../shared/types';

interface StartFlowDialogProps {
    children: React.ReactNode;
    onStart: (flowId: string) => Promise<void>;
}

export const StartFlowDialog: React.FC<StartFlowDialogProps> = ({ children, onStart }) => {
    const [open, setOpen] = useState(false);
    const [flows, setFlows] = useState<IFlow[]>([]);
    const [loading, setLoading] = useState(false);
    const [startingId, setStartingId] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            fetchFlows();
        }
    }, [open]);

    const fetchFlows = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/flows');
            if (!res.ok) throw new Error('Failed to fetch flows');
            const data = await res.json();
            setFlows(data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load flows');
        } finally {
            setLoading(false);
        }
    };

    const handleStart = async (flowId: string) => {
        setStartingId(flowId);
        try {
            await onStart(flowId);
            setOpen(false);
            toast.success('Flow started successfully');
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
                    <DialogTitle>Start Automation Flow</DialogTitle>
                    <DialogDescription>
                        Select a flow from the list below to start a new execution session.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : flows.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No flows found. Create one in the Editor.
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
                                    {flows.map((flow) => (
                                        <tr key={flow.id} className="hover:bg-muted/50 transition-colors">
                                            <td className="px-4 py-3 font-medium">{flow.name}</td>
                                            <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{flow.id}</td>
                                            <td className="px-4 py-3 text-right">
                                                <Button
                                                    size="sm"
                                                    variant="default"
                                                    className="gap-2 h-8"
                                                    onClick={() => handleStart(flow.id)}
                                                    disabled={startingId === flow.id}
                                                >
                                                    {startingId === flow.id ? (
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
