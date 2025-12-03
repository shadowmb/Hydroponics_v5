import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Save, Plus, Trash2, Clock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ScrollArea } from '../components/ui/scroll-area';
import type { ICycle, IProgram } from '../../../shared/types';

export const ProgramEditor: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [cycles, setCycles] = useState<ICycle[]>([]);
    const [programName, setProgramName] = useState('');
    const [description, setDescription] = useState('');
    const [schedule, setSchedule] = useState<IProgram['schedule']>([]);

    useEffect(() => {
        fetchCycles();
        if (id) fetchProgram();
    }, [id]);

    const fetchCycles = async () => {
        try {
            const res = await fetch('/api/cycles');
            if (!res.ok) throw new Error('Failed to fetch cycles');
            setCycles(await res.json());
        } catch (error) {
            toast.error('Failed to load cycles');
        }
    };

    const fetchProgram = async () => {
        try {
            const res = await fetch(`/api/programs/${id}`);
            if (!res.ok) throw new Error('Failed to fetch program');
            const data = await res.json();
            setProgramName(data.name);
            setDescription(data.description || '');
            setSchedule(data.schedule || []);
        } catch (error) {
            toast.error('Failed to load program');
        }
    };

    const handleAddScheduleItem = () => {
        setSchedule([...schedule, { time: '08:00', cycleId: '' }]);
    };

    const handleRemoveScheduleItem = (index: number) => {
        const newSchedule = [...schedule];
        newSchedule.splice(index, 1);
        setSchedule(newSchedule);
    };

    const handleScheduleChange = (index: number, field: keyof IProgram['schedule'][0], value: string) => {
        const newSchedule = [...schedule];
        newSchedule[index] = { ...newSchedule[index], [field]: value };
        setSchedule(newSchedule);
    };

    const handleSave = async () => {
        if (!programName) return toast.error('Program name is required');
        if (schedule.length === 0) return toast.error('Add at least one schedule item');
        if (schedule.some(item => !item.cycleId)) return toast.error('All schedule items must have a cycle selected');

        const payload = {
            name: programName,
            description,
            schedule,
            isActive: true
        };

        try {
            const method = id ? 'PUT' : 'POST';
            const url = id ? `/api/programs/${id}` : '/api/programs';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Failed to save program');
            toast.success('Program saved successfully');
            if (!id) navigate('/programs');
        } catch (error) {
            toast.error('Failed to save program');
        }
    };

    return (
        <div className="h-full flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-4">
                    <Input
                        value={programName}
                        onChange={(e) => setProgramName(e.target.value)}
                        placeholder="Program Name"
                        className="w-64 font-semibold"
                    />
                    <Input
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Description (optional)"
                        className="w-96"
                    />
                </div>
                <Button onClick={handleSave}>
                    <Save className="mr-2 h-4 w-4" /> Save Program
                </Button>
            </div>

            <Card className="flex-1 flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-sm">Daily Schedule</CardTitle>
                    <Button size="sm" variant="outline" onClick={handleAddScheduleItem}>
                        <Plus className="mr-2 h-4 w-4" /> Add Event
                    </Button>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden p-0 bg-muted/20">
                    <ScrollArea className="h-full">
                        <div className="p-4 space-y-2">
                            {schedule.map((item, index) => (
                                <div key={index} className="p-4 border rounded-md flex items-center gap-4 bg-card">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="time"
                                            value={item.time}
                                            onChange={(e) => handleScheduleChange(index, 'time', e.target.value)}
                                            className="w-32"
                                        />
                                    </div>

                                    <div className="flex-1">
                                        <Select
                                            value={item.cycleId}
                                            onValueChange={(value) => handleScheduleChange(index, 'cycleId', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Cycle" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {cycles.map(cycle => (
                                                    <SelectItem key={cycle.id} value={cycle.id}>
                                                        {cycle.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-destructive"
                                        onClick={() => handleRemoveScheduleItem(index)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            {schedule.length === 0 && (
                                <div className="text-center py-12 text-muted-foreground">
                                    No events scheduled. Add an event to define the daily routine.
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
};
