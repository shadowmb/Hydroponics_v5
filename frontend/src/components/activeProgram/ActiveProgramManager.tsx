import { useState } from 'react';
import type { IActiveProgram, IActiveScheduleItem } from '../../types/ActiveProgram';
import { activeProgramService } from '../../services/activeProgramService';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { Play, Pause, Square, Edit, ArrowUpDown, SkipForward, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { TimePicker24 } from '../ui/time-picker-24';

interface ActiveProgramManagerProps {
    program: IActiveProgram;
    onUpdate: () => void;
}

export const ActiveProgramManager = ({ program, onUpdate }: ActiveProgramManagerProps) => {
    const [editingItem, setEditingItem] = useState<IActiveScheduleItem | null>(null);
    const [editTime, setEditTime] = useState('');
    // const [editOverrides, setEditOverrides] = useState({}); // TODO: Implement variable editing

    const handleStop = async () => {
        try {
            await activeProgramService.stop();
            toast.success('Program stopped');
            onUpdate();
        } catch (error) {
            toast.error('Failed to stop program');
        }
    };

    const handlePause = async () => {
        try {
            await activeProgramService.pause();
            toast.success('Program paused');
            onUpdate();
        } catch (error) {
            toast.error('Failed to pause program');
        }
    };

    const handleResume = async () => {
        try {
            await activeProgramService.start();
            toast.success('Program resumed');
            onUpdate();
        } catch (error) {
            toast.error('Failed to resume program');
        }
    };

    const handleSaveEdit = async () => {
        if (!editingItem) return;
        try {
            await activeProgramService.updateScheduleItem(editingItem._id, { time: editTime });
            toast.success('Schedule updated');
            setEditingItem(null);
            onUpdate();
        } catch (error) {
            toast.error('Failed to update schedule');
        }
    };

    const handleSwap = async (index: number) => {
        // Swap with next item
        if (index >= program.schedule.length - 1) return;
        const itemA = program.schedule[index];
        const itemB = program.schedule[index + 1];
        try {
            await activeProgramService.swapCycles(itemA._id, itemB._id);
            toast.success('Cycles swapped');
            onUpdate();
        } catch (error) {
            toast.error('Failed to swap cycles');
        }
    };

    const handleSkip = async (itemId: string) => {
        try {
            await activeProgramService.skipCycle(itemId, 'once');
            toast.success('Cycle skipped');
            onUpdate();
        } catch (error) {
            toast.error('Failed to skip cycle');
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Active Program: {program.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-2">
                            <Badge variant={program?.status === 'running' ? 'default' : 'secondary'}>
                                {(program?.status || 'UNKNOWN').toUpperCase()}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                                Min Interval: {program?.minCycleInterval || 0}m
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {program?.status === 'ready' && (
                            <Button onClick={handleResume} className="gap-2 bg-green-600 hover:bg-green-700">
                                <Play className="h-4 w-4" />
                                Start Program
                            </Button>
                        )}
                        {program?.status === 'running' ? (
                            <Button variant="outline" size="icon" onClick={handlePause}>
                                <Pause className="h-4 w-4" />
                            </Button>
                        ) : (program?.status === 'paused') && (
                            <Button variant="outline" size="icon" onClick={handleResume}>
                                <Play className="h-4 w-4" />
                            </Button>
                        )}
                        <Button variant="destructive" size="icon" onClick={handleStop} title="Stop">
                            <Square className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={async () => {
                            if (!confirm('Are you sure you want to remove the active program?')) return;
                            try {
                                await activeProgramService.unload();
                                toast.success('Program removed');
                                onUpdate();
                            } catch (e) { toast.error('Failed to remove program'); }
                        }} title="Remove">
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {(program?.schedule || []).map((item, index) => (
                            <div key={item._id} className={`flex items-center justify-between p-3 rounded border ${item.status === 'running' ? 'bg-primary/10 border-primary' :
                                item.status === 'completed' ? 'bg-muted opacity-50' :
                                    'bg-card'
                                }`}>
                                <div className="flex items-center gap-4">
                                    <div className="font-mono text-lg font-bold w-16">{item.time}</div>
                                    <div>
                                        <div className="font-medium">Cycle ID: {item.cycleId}</div>
                                        <div className="text-xs text-muted-foreground uppercase">{item.status}</div>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    {item.status === 'pending' && (
                                        <>
                                            <Dialog open={editingItem?._id === item._id} onOpenChange={(open) => {
                                                if (open) {
                                                    setEditingItem(item);
                                                    setEditTime(item.time);
                                                } else {
                                                    setEditingItem(null);
                                                }
                                            }}>
                                                <DialogTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Edit Schedule Item</DialogTitle>
                                                    </DialogHeader>
                                                    <div className="grid gap-4 py-4">
                                                        <div className="grid gap-2">
                                                            <Label htmlFor="time">Start Time</Label>
                                                            <TimePicker24
                                                                value={editTime}
                                                                onChange={setEditTime}
                                                            />
                                                        </div>
                                                        {/* TODO: Variable Overrides Editor */}
                                                    </div>
                                                    <div className="flex justify-end">
                                                        <Button onClick={handleSaveEdit}>Save Changes</Button>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>

                                            <Button variant="ghost" size="icon" onClick={() => handleSwap(index)} disabled={index >= program.schedule.length - 1}>
                                                <ArrowUpDown className="h-4 w-4" />
                                            </Button>

                                            <Button variant="ghost" size="icon" onClick={() => handleSkip(item._id)}>
                                                <SkipForward className="h-4 w-4" />
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
