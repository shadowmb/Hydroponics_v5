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
    const [hardDeleteId, setHardDeleteId] = useState<string | null>(null);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [viewDeleted, setViewDeleted] = useState(false);

    useEffect(() => {
        fetchFlows();
    }, [viewDeleted]);

    const fetchFlows = async () => {
        setLoading(true);
        try {
            const endpoint = viewDeleted ? '/api/flows?deleted=true' : '/api/flows';
            const res = await fetch(endpoint);
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
            toast.success('Flow moved to Recycle Bin');
            setDeleteId(null);
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete flow');
        } finally {
            setProcessingId(null);
        }
    };

    const handleRestore = async (flow: IFlow) => {
        setProcessingId(flow.id);
        try {
            const res = await fetch(`/api/flows/${flow.id}/restore`, { method: 'POST' });
            if (!res.ok) throw new Error('Failed to restore flow');

            setFlows(flows.filter(p => p.id !== flow.id));
            toast.success('Flow restored');
        } catch (error) {
            console.error(error);
            toast.error('Failed to restore flow');
        } finally {
            setProcessingId(null);
        }
    };

    const handleHardDelete = async () => {
        if (!hardDeleteId) return;
        setProcessingId(hardDeleteId);
        try {
            const res = await fetch(`/api/flows/${hardDeleteId}/hard`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to permanently delete flow');

            setFlows(flows.filter(p => p.id !== hardDeleteId));
            toast.success('Flow permanently deleted');
            setHardDeleteId(null);
        } catch (error) {
            console.error(error);
            toast.error('Failed to permanently delete flow');
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
                <div className="flex gap-2">
                    <Button
                        variant={viewDeleted ? "secondary" : "ghost"}
                        onClick={() => setViewDeleted(!viewDeleted)}
                        className={viewDeleted ? "bg-orange-100 text-orange-700 hover:bg-orange-200" : ""}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {viewDeleted ? 'View Active' : 'Recycle Bin'}
                    </Button>
                    {!viewDeleted && (
                        <Button onClick={() => navigate('/editor')}>
                            <Plus className="mr-2 h-4 w-4" /> Create Flow
                        </Button>
                    )}
                </div>
            </div>

            <Card className={viewDeleted ? "border-orange-200 bg-orange-50/30" : ""}>
                <CardHeader>
                    <CardTitle>{viewDeleted ? 'Recycle Bin' : 'All Flows'}</CardTitle>
                    <CardDescription>{viewDeleted ? 'Recover or permanently delete flows.' : 'A list of all automation flows in the system.'}</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : flows.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            {viewDeleted ? 'Recycle bin is empty.' : 'No flows found. Create one to get started.'}
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
                                                {viewDeleted ? (
                                                    <span className="text-xs text-orange-600 font-medium">Deleted</span>
                                                ) : (
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${flow.isActive ? 'bg-green-500/10 text-green-600' : 'bg-gray-500/10 text-gray-600'
                                                        }`}>
                                                        {flow.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex justify-end gap-2">
                                                    {viewDeleted ? (
                                                        <>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleRestore(flow)}
                                                                disabled={!!processingId}
                                                            >
                                                                {processingId === flow.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Restore'}
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                onClick={() => setHardDeleteId(flow.id)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <>
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
                                                        </>
                                                    )}
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

            {/* Soft Delete Confirmation Dialog */}
            <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Flow?</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to move this flow to the Recycle Bin? You can restore it later.
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
                            Move to Trash
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Hard Delete Confirmation Dialog */}
            <Dialog open={!!hardDeleteId} onOpenChange={(open) => !open && setHardDeleteId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-red-600">Permanently Delete Flow?</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. This flow will be permanently removed from the database.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button
                            variant="destructive"
                            onClick={handleHardDelete}
                            disabled={!!processingId}
                        >
                            {processingId ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Delete Permanently
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
