import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Edit, Trash2, Plus, Loader2, Repeat } from 'lucide-react';
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
import type { ICycle } from '../../../shared/types';

export const Cycles: React.FC = () => {
    const navigate = useNavigate();
    const [cycles, setCycles] = useState<ICycle[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        fetchCycles();
    }, []);

    const fetchCycles = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/cycles');
            if (!res.ok) throw new Error('Failed to fetch cycles');
            const data = await res.json();
            setCycles(data);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load cycles');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setProcessingId(deleteId);
        try {
            const res = await fetch(`/api/cycles/${deleteId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete cycle');

            setCycles(cycles.filter(c => c.id !== deleteId));
            toast.success('Cycle deleted successfully');
            setDeleteId(null);
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete cycle');
        } finally {
            setProcessingId(null);
        }
    };

    const handleRun = async (cycleId: string) => {
        setProcessingId(cycleId);
        try {
            const res = await fetch(`/api/cycles/${cycleId}/start`, { method: 'POST' });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message);
            }
            toast.success('Cycle started');
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
                    <h2 className="text-2xl font-bold tracking-tight">Cycles</h2>
                    <p className="text-muted-foreground">Manage your automation cycles (sequences of flows).</p>
                </div>
                <Button onClick={() => navigate('/cycles/new')}>
                    <Plus className="mr-2 h-4 w-4" /> Create Cycle
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Cycles</CardTitle>
                    <CardDescription>A list of all automation cycles in the system.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : cycles.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            No cycles found. Create one to get started.
                        </div>
                    ) : (
                        <div className="relative w-full overflow-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50 text-muted-foreground [&_th]:px-4 [&_th]:py-3 [&_th]:font-medium">
                                    <tr>
                                        <th>Name</th>
                                        <th>Steps</th>
                                        <th>Created At</th>
                                        <th>Status</th>
                                        <th className="text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {cycles.map((cycle) => (
                                        <tr key={cycle.id} className="hover:bg-muted/50 transition-colors">
                                            <td className="px-4 py-3 font-medium flex items-center gap-2">
                                                <Repeat className="h-4 w-4 text-muted-foreground" />
                                                {cycle.name}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {cycle.steps.length} steps
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {cycle.createdAt ? new Date(cycle.createdAt).toLocaleDateString() : '-'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${cycle.isActive ? 'bg-green-500/10 text-green-600' : 'bg-gray-500/10 text-gray-600'
                                                    }`}>
                                                    {cycle.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleRun(cycle.id)}
                                                        disabled={!!processingId}
                                                        title="Run Cycle"
                                                    >
                                                        {processingId === cycle.id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Play className="h-4 w-4 text-green-600" />
                                                        )}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => navigate(`/cycles/${cycle.id}`)}
                                                        title="Edit Cycle"
                                                    >
                                                        <Edit className="h-4 w-4 text-blue-600" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setDeleteId(cycle.id)}
                                                        title="Delete Cycle"
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
                        <DialogTitle>Delete Cycle?</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this cycle? This action cannot be undone.
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
