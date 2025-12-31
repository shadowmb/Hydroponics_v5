import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Trash2, Plus, Loader2, Calendar, Play } from 'lucide-react';
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

import type { IProgram } from '../../../shared/types';
import { activeProgramService } from '../services/activeProgramService';

export const Programs: React.FC = () => {
    const navigate = useNavigate();
    const [programs, setPrograms] = useState<IProgram[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [hardDeleteId, setHardDeleteId] = useState<string | null>(null);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [viewDeleted, setViewDeleted] = useState(false);

    useEffect(() => {
        fetchPrograms();
    }, [viewDeleted]);

    const fetchPrograms = async () => {
        setLoading(true);
        try {
            const endpoint = viewDeleted ? '/api/programs?deleted=true' : '/api/programs';
            const res = await fetch(endpoint);
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

    const handleDelete = async () => {
        if (!deleteId) return;
        setProcessingId(deleteId);
        try {
            const res = await fetch(`/api/programs/${deleteId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete program');

            setPrograms(programs.filter(p => p.id !== deleteId));
            toast.success('Program moved to Recycle Bin');
            setDeleteId(null);
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete program');
        } finally {
            setProcessingId(null);
        }
    };

    const handleRestore = async (program: IProgram) => {
        setProcessingId(program.id);
        try {
            const res = await fetch(`/api/programs/${program.id}/restore`, { method: 'POST' });
            if (!res.ok) throw new Error('Failed to restore program');

            setPrograms(programs.filter(p => p.id !== program.id));
            toast.success('Program restored');
        } catch (error) {
            console.error(error);
            toast.error('Failed to restore program');
        } finally {
            setProcessingId(null);
        }
    };

    const handleHardDelete = async () => {
        if (!hardDeleteId) return;
        setProcessingId(hardDeleteId);
        try {
            const res = await fetch(`/api/programs/${hardDeleteId}/hard`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to permanently delete program');

            setPrograms(programs.filter(p => p.id !== hardDeleteId));
            toast.success('Program permanently deleted');
            setHardDeleteId(null);
        } catch (error) {
            console.error(error);
            toast.error('Failed to permanently delete program');
        } finally {
            setProcessingId(null);
        }
    };

    const handleToggleActive = async (program: IProgram) => {
        // TODO: Implement activation logic (ensure only one program is active?)
        // For now just toggle the flag
        try {
            const res = await fetch(`/api/programs/${program.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...program, isActive: !program.isActive })
            });
            if (!res.ok) throw new Error('Failed to update program');

            // Refresh list to reflect backend side-effects (deactivating others)
            fetchPrograms();
            toast.success(`Program ${!program.isActive ? 'activated' : 'deactivated'}`);
        } catch (error) {
            toast.error('Failed to update program status');
        }
    };

    const handleLoad = async (program: IProgram) => {
        try {
            await activeProgramService.load(program.id);
            toast.success('Program loaded');
            navigate('/active-program');
        } catch (error) {
            console.error(error);
            toast.error('Failed to load program');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Programs</h2>
                    <p className="text-muted-foreground">Manage daily schedules and automation routines.</p>
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
                        <Button onClick={() => navigate('/programs/new')}>
                            <Plus className="mr-2 h-4 w-4" /> Create Program
                        </Button>
                    )}
                </div>
            </div>

            <Card className={viewDeleted ? "border-orange-200 bg-orange-50/30" : ""}>
                <CardHeader>
                    <CardTitle>{viewDeleted ? 'Recycle Bin' : 'All Programs'}</CardTitle>
                    <CardDescription>{viewDeleted ? 'Recover or permanently delete programs.' : 'A list of all schedules in the system.'}</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : programs.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            {viewDeleted ? 'Recycle bin is empty.' : 'No programs found. Create one to get started.'}
                        </div>
                    ) : (
                        <div className="relative w-full overflow-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50 text-muted-foreground [&_th]:px-4 [&_th]:py-3 [&_th]:font-medium">
                                    <tr>
                                        <th>Name</th>
                                        <th>Type</th>
                                        <th>Description</th>
                                        <th>Events</th>
                                        <th>Status</th>
                                        <th className="text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {programs.map((program) => (
                                        <tr key={program.id} className="hover:bg-muted/50 transition-colors">
                                            <td className="px-4 py-3 font-medium">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                                    {program.name}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {(program as any).type === 'ADVANCED' ? (
                                                    <span className="text-xs px-2 py-1 rounded-full bg-purple-500/10 text-purple-600 font-medium">
                                                        Advanced
                                                    </span>
                                                ) : (
                                                    <span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-600 font-medium">
                                                        Basic
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">{program.description || '-'}</td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {(program as any).type === 'ADVANCED'
                                                    ? `${(program as any).windows?.length || 0} windows`
                                                    : `${program.schedule?.length || 0} cycles`
                                                }
                                            </td>
                                            <td className="px-4 py-3">
                                                {viewDeleted ? (
                                                    <span className="text-xs text-orange-600 font-medium">Deleted</span>
                                                ) : (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className={`h-6 px-2 text-xs font-medium rounded-full ${program.isActive ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20' : 'bg-gray-500/10 text-gray-600 hover:bg-gray-500/20'}`}
                                                        onClick={() => handleToggleActive(program)}
                                                    >
                                                        {program.isActive ? 'Active' : 'Inactive'}
                                                    </Button>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex justify-end gap-2">
                                                    {viewDeleted ? (
                                                        <>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleRestore(program)}
                                                                disabled={!!processingId}
                                                            >
                                                                {processingId === program.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Restore'}
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                onClick={() => setHardDeleteId(program.id)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => handleLoad(program)}
                                                                title="Load Program"
                                                            >
                                                                <Play className="h-4 w-4 text-green-600" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => navigate(`/programs/${program.id}`)}
                                                                title="Edit Program"
                                                            >
                                                                <Edit className="h-4 w-4 text-blue-600" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => setDeleteId(program.id)}
                                                                title="Delete Program"
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
                        <DialogTitle>Delete Program?</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to move this program to the Recycle Bin? You can restore it later.
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
                        <DialogTitle className="text-red-600">Permanently Delete Program?</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. This program will be permanently removed from the database.
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
