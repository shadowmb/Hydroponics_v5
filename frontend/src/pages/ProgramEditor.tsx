import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Save, Plus, Trash2, Clock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ScrollArea } from '../components/ui/scroll-area';
import { TimePicker24 } from '../components/ui/time-picker-24';
import { slugify } from '../lib/string-utils';
import { AdvancedProgramEditor } from '../components/programs';
import type { ITimeWindow, ProgramType } from '../components/programs';
import type { IProgram, IFlow } from '../../../shared/types';

export const ProgramEditor: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [flows, setFlows] = useState<IFlow[]>([]);
    const [programName, setProgramName] = useState('');
    const [description, setDescription] = useState('');
    const [minCycleInterval, setMinCycleInterval] = useState(60);
    const [programType, setProgramType] = useState<ProgramType>('BASIC');
    // Basic mode state
    const [schedule, setSchedule] = useState<IProgram['schedule']>([]);
    // Advanced mode state
    const [windows, setWindows] = useState<ITimeWindow[]>([]);

    useEffect(() => {
        fetchFlows();
        if (id) fetchProgram();
    }, [id]);

    const fetchFlows = async () => {
        try {
            const res = await fetch('/api/flows');
            if (!res.ok) throw new Error('Failed to fetch flows');
            setFlows(await res.json());
        } catch (error) {
            toast.error('Failed to load flows');
        }
    };

    const fetchProgram = async () => {
        try {
            const res = await fetch(`/api/programs/${id}`);
            if (!res.ok) throw new Error('Failed to fetch program');
            const data = await res.json();
            setProgramName(data.name);
            setDescription(data.description || '');
            setMinCycleInterval(data.minCycleInterval ?? 60);
            setProgramType(data.type || 'BASIC');
            setSchedule(data.schedule || []);
            setWindows(data.windows || []);
        } catch (error) {
            toast.error('Failed to load program');
        }
    };

    const handleAddScheduleItem = () => {
        const nextIndex = schedule.length + 1;
        let nextTime = '08:00';

        if (schedule.length > 0) {
            const lastItem = schedule[schedule.length - 1];
            const [hours, minutes] = lastItem.time.split(':').map(Number);
            const date = new Date();
            date.setHours(hours, minutes, 0, 0);
            date.setMinutes(date.getMinutes() + minCycleInterval);
            nextTime = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        }

        setSchedule([...schedule, {
            time: nextTime,
            name: `Event ${nextIndex}`,
            description: '',
            steps: [],
            overrides: {}
        }]);
    };

    const handleAutoFix = () => {
        if (schedule.length === 0) return;

        const newSchedule = [...schedule];
        // Sort by time first to ensure correct order? Or assume user order is correct?
        // Let's assume user order is the intended sequence and we just fix the times.

        let previousTime = new Date(`1970-01-01T${newSchedule[0].time}`);

        for (let i = 1; i < newSchedule.length; i++) {
            const expectedTime = new Date(previousTime.getTime() + minCycleInterval * 60000);
            // const currentTime = new Date(`1970-01-01T${newSchedule[i].time}`);

            // If current time is LESS than expected (overlap), fix it.
            // Or should we ALWAYS enforce the interval?
            // User asked: "if time between cycles is larger than current... auto fix"
            // Let's enforce strict interval spacing for simplicity and correctness.

            const hours = expectedTime.getHours().toString().padStart(2, '0');
            const minutes = expectedTime.getMinutes().toString().padStart(2, '0');
            newSchedule[i] = { ...newSchedule[i], time: `${hours}:${minutes}` };

            previousTime = expectedTime;
        }

        setSchedule(newSchedule);
        toast.success('Schedule times auto-adjusted');
    };

    const handleRemoveScheduleItem = (index: number) => {
        const newSchedule = [...schedule];
        newSchedule.splice(index, 1);
        setSchedule(newSchedule);
    };

    const handleScheduleChange = (index: number, field: keyof IProgram['schedule'][0], value: any) => {
        const newSchedule = [...schedule];
        newSchedule[index] = { ...newSchedule[index], [field]: value };
        setSchedule(newSchedule);
    };
    const handleAddStep = (scheduleIndex: number) => {
        const newSchedule = [...schedule];
        newSchedule[scheduleIndex].steps.push({ flowId: '', overrides: {} });
        setSchedule(newSchedule);
    };

    const handleRemoveStep = (scheduleIndex: number, stepIndex: number) => {
        const newSchedule = [...schedule];
        newSchedule[scheduleIndex].steps.splice(stepIndex, 1);
        setSchedule(newSchedule);
    };

    const handleStepChange = (scheduleIndex: number, stepIndex: number, field: 'flowId' | 'overrides', value: any) => {
        const newSchedule = [...schedule];
        newSchedule[scheduleIndex].steps[stepIndex] = { ...newSchedule[scheduleIndex].steps[stepIndex], [field]: value };
        setSchedule(newSchedule);
    };

    // Calculate conflicts based on minCycleInterval
    const conflicts = React.useMemo(() => {
        const indices = new Set<number>();
        if (schedule.length < 2) return indices;

        for (let i = 1; i < schedule.length; i++) {
            const prev = schedule[i - 1];
            const curr = schedule[i];
            const [ph, pm] = prev.time.split(':').map(Number);
            const [ch, cm] = curr.time.split(':').map(Number);

            let diff = (ch * 60 + cm) - (ph * 60 + pm);
            if (diff < 0) diff += 24 * 60; // Handle midnight crossing

            if (diff < minCycleInterval) {
                indices.add(i);
            }
        }
        return indices;
    }, [schedule, minCycleInterval]);

    const handleSave = async () => {
        if (!programName) return toast.error('Program name is required');

        // Validate based on program type
        if (programType === 'BASIC') {
            if (schedule.length === 0) return toast.error('Add at least one scheduled event');
            // Validate steps
            for (let i = 0; i < schedule.length; i++) {
                if (schedule[i].steps.length === 0) {
                    return toast.error(`Event at ${schedule[i].time} has no steps`);
                }
                if (schedule[i].steps.some(s => !s.flowId)) {
                    return toast.error(`Event at ${schedule[i].time} has a step with no flow selected`);
                }
            }
        } else {
            // ADVANCED mode validation
            if (windows.length === 0) return toast.error('Add at least one time window');
            // Validate windows have at least one trigger
            for (const win of windows) {
                if (win.triggers.length === 0) {
                    return toast.error(`Window "${win.name}" has no triggers`);
                }
            }
        }

        const payload = {
            name: programName,
            description,
            minCycleInterval,
            type: programType,
            schedule: programType === 'BASIC' ? schedule : [],
            windows: programType === 'ADVANCED' ? windows : [],
            isActive: true,
            ...(id ? {} : { id: `prog_${slugify(programName)}` })
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
                <div className="flex items-center gap-2">
                    {/* Mode Toggle */}
                    <div className="flex items-center gap-2 mr-4 border-r pr-4">
                        <span className="text-sm font-medium text-muted-foreground">Режим:</span>
                        <div className="flex rounded-md border">
                            <button
                                onClick={() => setProgramType('BASIC')}
                                className={`px-3 py-1.5 text-sm font-medium transition-colors ${programType === 'BASIC'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'hover:bg-muted'
                                    }`}
                            >
                                Basic
                            </button>
                            <button
                                onClick={() => setProgramType('ADVANCED')}
                                className={`px-3 py-1.5 text-sm font-medium transition-colors ${programType === 'ADVANCED'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'hover:bg-muted'
                                    }`}
                            >
                                Advanced
                            </button>
                        </div>
                    </div>
                    {programType === 'BASIC' && (
                        <div className="flex items-center gap-2 mr-4">
                            <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">Min Interval (min):</span>
                            <Input
                                type="number"
                                value={minCycleInterval}
                                onChange={(e) => setMinCycleInterval(Number(e.target.value))}
                                className="w-20"
                            />
                            <Button
                                variant={conflicts.size > 0 ? "destructive" : "outline"}
                                size="sm"
                                onClick={handleAutoFix}
                                title={conflicts.size > 0 ? "Fix detected interval conflicts" : "Auto-adjust all times based on interval"}
                            >
                                {conflicts.size > 0 ? "Fix Conflicts" : "Auto-Fix"}
                            </Button>
                        </div>
                    )}
                    <Button onClick={handleSave}>
                        <Save className="mr-2 h-4 w-4" /> Save Program
                    </Button>
                </div>
            </div>

            {/* Conditional Editor based on mode */}
            {programType === 'ADVANCED' ? (
                <AdvancedProgramEditor
                    windows={windows}
                    onWindowsChange={setWindows}
                    flows={flows.map(f => ({ id: f.id, name: f.name }))}
                />
            ) : (
                <Card className="flex-1 flex flex-col">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-sm">Daily Schedule</CardTitle>
                        <Button size="sm" variant="outline" onClick={handleAddScheduleItem}>
                            <Plus className="mr-2 h-4 w-4" /> Add Event
                        </Button>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-hidden p-0 bg-muted/20">
                        <ScrollArea className="h-full">
                            <div className="p-4 space-y-4">
                                {schedule.map((item, index) => (
                                    <div key={index} className={`p-4 border rounded-md bg-card shadow-sm ${conflicts.has(index) ? 'border-destructive border-2' : ''}`}>
                                        <div className="flex flex-col gap-3 mb-4">
                                            {/* Row 1: Name */}
                                            <Input
                                                value={item.name}
                                                onChange={(e) => handleScheduleChange(index, 'name', e.target.value)}
                                                placeholder="Event Name"
                                                className="font-medium text-lg border-none px-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/50"
                                            />

                                            {/* Row 2: Time, Description, Controls */}
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                                    <TimePicker24
                                                        value={item.time}
                                                        onChange={(val) => handleScheduleChange(index, 'time', val)}
                                                    />
                                                </div>

                                                <Input
                                                    value={item.description || ''}
                                                    onChange={(e) => handleScheduleChange(index, 'description', e.target.value)}
                                                    placeholder="Description (optional)"
                                                    className="flex-1 h-9"
                                                />

                                                <span className="text-sm text-muted-foreground whitespace-nowrap">
                                                    {item.steps.length} steps
                                                </span>

                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive"
                                                    onClick={() => handleRemoveScheduleItem(index)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Steps List */}
                                        <div className="space-y-2 pl-4 border-l-2 border-muted ml-2">
                                            {item.steps.map((step, stepIndex) => (
                                                <div key={stepIndex} className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
                                                        {stepIndex + 1}
                                                    </div>
                                                    <Select
                                                        value={step.flowId}
                                                        onValueChange={(value) => handleStepChange(index, stepIndex, 'flowId', value)}
                                                    >
                                                        <SelectTrigger className="w-[300px]">
                                                            <SelectValue placeholder="Select Flow" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {flows.map(flow => (
                                                                <SelectItem key={flow.id} value={flow.id}>
                                                                    {flow.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>

                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-muted-foreground hover:text-destructive"
                                                        onClick={() => handleRemoveStep(index, stepIndex)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}

                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-muted-foreground hover:text-primary mt-2"
                                                onClick={() => handleAddStep(index)}
                                            >
                                                <Plus className="h-3 w-3 mr-1" /> Add Step
                                            </Button>
                                        </div>
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
            )}
        </div>
    );
};

