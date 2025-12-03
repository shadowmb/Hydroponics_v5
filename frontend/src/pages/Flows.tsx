import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Edit, Trash2, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from '../components/ui/dialog';

import type { IFlow } from '../../../shared/types';

export const Flows: React.FC = () => {
    const navigate = useNavigate();
    const [flows, setFlows] = useState<IFlow[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        fetchFlows();
    }, []);

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

    const handleDelete = async () => {
        if (!deleteId) return;
        setProcessingId(deleteId);
        try {
            const res = await fetch(`/api/flows/${deleteId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete flow');

            setFlows(flows.filter(p => p.id !== deleteId));
            toast.success('Flow deleted successfully');
            setDeleteId(null);
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete flow');
        } finally {
            setProcessingId(null);
        }
    };

    const handleRun = async (flowId: string) => {
        setProcessingId(flowId);
        try {
            // Note: We still use automation/start but now we pass programId which refers to a Flow ID for now
            // until we fully implement the Schedule/Cycle logic.
            // The backend loadProgram now expects a Flow ID.

            // 1. Load
            const loadRes = await fetch('/api/automation/load', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ programId: flowId })
            });

            if (!loadRes.ok) {
                const err = await loadRes.json();
                throw new Error(err.message);
            }

            // 2. Start
            const startRes = await fetch('/api/automation/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });

            if (!startRes.ok) {
                const err = await startRes.json();
                throw new Error(err.message);
            }

            toast.success('Flow started');
            navigate('/'); // Redirect to Dashboard
        } catch (error: any) {
            console.error(error);
            toast.error(`Failed to start: ${error.message}`);
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Flows</h2>
                    <p className="text-muted-foreground">Manage your automation flows.</p>
                </div>
                <Button onClick={() => navigate('/editor')}>
                    <Plus className="mr-2 h-4 w-4" /> Create Flow
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Flows</CardTitle>
                    <CardDescription>A list of all automation flows in the system.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : flows.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            No flows found. Create one to get started.
                        </div>
                    ) : (
                        <div className="relative w-full overflow-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50 text-muted-foreground [&_th]:px-4 [&_th]:py-3 [&_th]:font-medium">
                                    <tr>
                                        <th>Name</th>
                                        <th>ID</th>
                                        <th>Created At</th>
                                        <th>Status</th>
                                        <th className="text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {flows.map((flow) => (
                                        <tr key={flow.id} className="hover:bg-muted/50 transition-colors">
                                            <td className="px-4 py-3 font-medium">{flow.name}</td>
                                            <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{flow.id}</td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {flow.createdAt ? new Date(flow.createdAt).toLocaleDateString() : '-'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${flow.isActive ? 'bg-green-500/10 text-green-600' : 'bg-gray-500/10 text-gray-600'
                                                    }`}>
                                                    {flow.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleRun(flow.id)}
                                                        disabled={!!processingId}
                                                        title="Run Flow"
                                                    >
                                                        {processingId === flow.id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Play className="h-4 w-4 text-green-600" />
                                                        )}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => navigate(`/editor/${flow.id}`)}
                                                        title="Edit Flow"
                                                    >
                                                        <Edit className="h-4 w-4 text-blue-600" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setDeleteId(flow.id)}
                                                        title="Delete Flow"
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-600" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Flow?</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this flow? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={!!processingId}
                        >
                            {processingId ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
