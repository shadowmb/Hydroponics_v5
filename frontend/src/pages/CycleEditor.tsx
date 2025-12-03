import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Save, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { ScrollArea } from '../components/ui/scroll-area';
import type { IFlow, ICycle } from '../../../shared/types';

export const CycleEditor: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [flows, setFlows] = useState<IFlow[]>([]);
    const [cycleName, setCycleName] = useState('');
    const [steps, setSteps] = useState<ICycle['steps']>([]);
    const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null);

    useEffect(() => {
        fetchFlows();
        if (id) fetchCycle();
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

    const fetchCycle = async () => {
        try {
            const res = await fetch(`/api/cycles/${id}`);
            if (!res.ok) throw new Error('Failed to fetch cycle');
            const data = await res.json();
            setCycleName(data.name);
            setSteps(data.steps);
        } catch (error) {
            toast.error('Failed to load cycle');
        }
    };

    const handleAddStep = (flow: IFlow) => {
        setSteps([...steps, { flowId: flow.id, overrides: {} }]);
    };

    const handleRemoveStep = (index: number) => {
        const newSteps = [...steps];
        newSteps.splice(index, 1);
        setSteps(newSteps);
        if (selectedStepIndex === index) setSelectedStepIndex(null);
    };

    const handleMoveStep = (index: number, direction: 'up' | 'down') => {
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === steps.length - 1) return;

        const newSteps = [...steps];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
        setSteps(newSteps);
        if (selectedStepIndex === index) setSelectedStepIndex(targetIndex);
    };

    const handleOverrideChange = (key: string, value: any) => {
        if (selectedStepIndex === null) return;
        const newSteps = [...steps];
        newSteps[selectedStepIndex].overrides = {
            ...(newSteps[selectedStepIndex].overrides || {}),
            [key]: value
        };
        setSteps(newSteps);
    };

    const handleSave = async () => {
        if (!cycleName) return toast.error('Cycle name is required');
        if (steps.length === 0) return toast.error('Add at least one step');

        const payload = {
            name: cycleName,
            steps,
            isActive: true
        };

        try {
            const method = id ? 'PUT' : 'POST';
            const url = id ? `/api/cycles/${id}` : '/api/cycles';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error('Failed to save cycle');
            toast.success('Cycle saved successfully');
            if (!id) navigate('/cycles');
        } catch (error) {
            toast.error('Failed to save cycle');
        }
    };

    const selectedFlow = selectedStepIndex !== null ? flows.find(f => f.id === steps[selectedStepIndex].flowId) : null;

    return (
        <div className="h-full flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-4">
                    <Input
                        value={cycleName}
                        onChange={(e) => setCycleName(e.target.value)}
                        placeholder="Cycle Name"
                        className="w-64 font-semibold"
                    />
                </div>
                <Button onClick={handleSave}>
                    <Save className="mr-2 h-4 w-4" /> Save Cycle
                </Button>
            </div>

            <div className="flex-1 flex gap-4 overflow-hidden">
                {/* Left: Available Flows */}
                <Card className="w-64 flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-sm">Available Flows</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-hidden p-0">
                        <ScrollArea className="h-full">
                            <div className="p-4 space-y-2">
                                {flows.map(flow => (
                                    <div
                                        key={flow.id}
                                        className="p-3 border rounded-md hover:bg-accent cursor-pointer flex items-center justify-between group"
                                        onClick={() => handleAddStep(flow)}
                                    >
                                        <span className="text-sm font-medium truncate">{flow.name}</span>
                                        <Plus className="h-4 w-4 opacity-0 group-hover:opacity-100" />
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Center: Steps */}
                <Card className="flex-1 flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-sm">Cycle Steps</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-hidden p-0 bg-muted/20">
                        <ScrollArea className="h-full">
                            <div className="p-4 space-y-2">
                                {steps.map((step, index) => {
                                    const flow = flows.find(f => f.id === step.flowId);
                                    return (
                                        <div
                                            key={index}
                                            className={`p-4 border rounded-md flex items-center gap-4 bg-card ${selectedStepIndex === index ? 'ring-2 ring-primary' : ''}`}
                                            onClick={() => setSelectedStepIndex(index)}
                                        >
                                            <div className="flex flex-col items-center gap-1">
                                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); handleMoveStep(index, 'up'); }}>
                                                    <ArrowUp className="h-3 w-3" />
                                                </Button>
                                                <span className="text-xs font-mono text-muted-foreground">{index + 1}</span>
                                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); handleMoveStep(index, 'down'); }}>
                                                    <ArrowDown className="h-3 w-3" />
                                                </Button>
                                            </div>

                                            <div className="flex-1">
                                                <div className="font-medium">{flow?.name || step.flowId}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {Object.keys(step.overrides || {}).length} overrides
                                                </div>
                                            </div>

                                            <Button variant="ghost" size="icon" className="text-destructive" onClick={(e) => { e.stopPropagation(); handleRemoveStep(index); }}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    );
                                })}
                                {steps.length === 0 && (
                                    <div className="text-center py-12 text-muted-foreground">
                                        Add flows from the left panel to create a sequence.
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Right: Step Configuration */}
                <Card className="w-80 flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-sm">Step Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-hidden p-4">
                        {selectedStepIndex !== null && selectedFlow ? (
                            <div className="space-y-4">
                                <div>
                                    <Label className="text-xs text-muted-foreground">Flow</Label>
                                    <div className="font-medium">{selectedFlow.name}</div>
                                </div>
                                <Separator />
                                <div className="space-y-4">
                                    <Label>Input Overrides</Label>
                                    {selectedFlow.inputs && selectedFlow.inputs.length > 0 ? (
                                        selectedFlow.inputs.map(input => (
                                            <div key={input.name} className="space-y-1">
                                                <Label className="text-xs">{input.name} <span className="text-muted-foreground">({input.type})</span></Label>
                                                <Input
                                                    value={steps[selectedStepIndex].overrides?.[input.name] ?? ''}
                                                    placeholder={String(input.default ?? '')}
                                                    onChange={(e) => {
                                                        const val = input.type === 'number' ? parseFloat(e.target.value) : e.target.value;
                                                        handleOverrideChange(input.name, val);
                                                    }}
                                                    type={input.type === 'number' ? 'number' : 'text'}
                                                />
                                                {input.description && <p className="text-xs text-muted-foreground">{input.description}</p>}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-sm text-muted-foreground">This flow has no inputs to override.</div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                Select a step to configure overrides.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
