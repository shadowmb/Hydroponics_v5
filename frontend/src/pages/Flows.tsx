import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Edit, Trash2, Plus, Loader2, AlertTriangle } from 'lucide-react';
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
import { FlowTestDialog } from '../components/flows/FlowTestDialog';

import type { IFlow } from '../../../shared/types';

export const Flows: React.FC = () => {
    const navigate = useNavigate();
    const [flows, setFlows] = useState<IFlow[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [hardDeleteId, setHardDeleteId] = useState<string | null>(null);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [viewDeleted, setViewDeleted] = useState(false);

    // Test Flow State
    const [testFlowId, setTestFlowId] = useState<string | null>(null);
    const [systemStatus, setSystemStatus] = useState<any>(null);

    useEffect(() => {
        fetchFlows();
        fetchSystemStatus();
    }, [viewDeleted]);

    // Periodically refresh system status to detect changes (e.g. if another flow started)
    // In a real app we might rely on socket updates, but polling is safer for now.
    useEffect(() => {
        const interval = setInterval(fetchSystemStatus, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchSystemStatus = async () => {
        try {
            const res = await fetch('/api/system/status');
            if (res.ok) {
                const data = await res.json();
                setSystemStatus(data);
            }
        } catch (error) {
            console.error('Failed to fetch system status', error);
        }
    };

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

    // System is BUSY if:
    // 1. Active Program is NOT stopped (running, paused, delayed)
    // 2. OR There are other running sessions (runningSessionsCount > 0)
    // System is BUSY if:
    // 1. Scheduler Active Program is NOT stopped (running, paused)
    // 2. OR There are other running sessions (runningSessionsCount > 0)
    // 3. OR The immediate automation snapshot thinks it's running (session.status)
    const isSystemBusy = systemStatus && (
        (systemStatus.session?.status && systemStatus.session.status !== 'stopped') ||
        (systemStatus.runningSessionsCount && systemStatus.runningSessionsCount > 0) ||
        (systemStatus.activeProgramStatus && systemStatus.activeProgramStatus !== 'stopped')
    );

    const handleTest = (flowId: string) => {
        if (isSystemBusy) {
            toast.error('Cannot test flow: System is busy');
            return;
        }
        setTestFlowId(flowId);
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

            {/* System Status Alert if Busy */}
            {isSystemBusy && !viewDeleted && (
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-md p-3 flex items-center gap-3 text-orange-500 text-sm">
                    <AlertTriangle className="h-4 w-4" />
                    <span>
                        System is currently running a program or test. Flow execution is disabled until stopped.
                        {systemStatus?.runningSessionsCount > 0 && ` (${systemStatus.runningSessionsCount} active sessions)`}
                    </span>
                </div>
            )}

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
                                                    <div className="flex flex-col gap-1">
                                                        {flow.validationStatus === 'INVALID' && (
                                                            <div className="flex items-center text-xs text-orange-600 font-medium" title="This flow has errors and cannot be run.">
                                                                <AlertTriangle className="h-3 w-3 mr-1" />
                                                                Draft / Invalid
                                                            </div>
                                                        )}
                                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium w-fit ${flow.isActive ? 'bg-green-500/10 text-green-600' : 'bg-gray-500/10 text-gray-600'
                                                            }`}>
                                                            {flow.isActive ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </div>
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
                                                                onClick={() => handleTest(flow.id)}
                                                                disabled={!!processingId || flow.validationStatus === 'INVALID' || isSystemBusy}
                                                                title={isSystemBusy ? "System is busy" : "Run Flow (Visual Log)"}
                                                                className="text-cyan-500 hover:text-cyan-400 hover:bg-cyan-950/30"
                                                            >
                                                                {processingId === flow.id ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    <Play className="h-4 w-4" />
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

            {/* Test Dialog */}
            <FlowTestDialog
                open={!!testFlowId}
                onOpenChange={(open) => {
                    if (!open) {
                        setTestFlowId(null);
                        // Refresh status when closing to check if it really stopped
                        fetchSystemStatus();
                    }
                }}
                flowId={testFlowId}
                flowName={flows.find(f => f.id === testFlowId)?.name || 'Flow'}
                isActive={isSystemBusy}
            />

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
