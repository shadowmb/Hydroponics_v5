import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';
import type { IFlow } from '../../../../shared/types';

type FlowInput = NonNullable<IFlow['inputs']>[number];

interface FlowInputsPanelProps {
    inputs: FlowInput[];
    onChange: (inputs: FlowInput[]) => void;
}

export const FlowInputsPanel: React.FC<FlowInputsPanelProps> = ({ inputs, onChange }) => {
    const handleAdd = () => {
        onChange([
            ...inputs,
            { name: 'new_var', type: 'number', default: 0, description: '' }
        ]);
    };

    const handleUpdate = (index: number, field: keyof FlowInput, value: any) => {
        const newInputs = [...inputs];
        newInputs[index] = { ...newInputs[index], [field]: value };
        onChange(newInputs);
    };

    const handleDelete = (index: number) => {
        const newInputs = [...inputs];
        newInputs.splice(index, 1);
        onChange(newInputs);
    };

    return (
        <div className="w-80 border-l bg-card flex flex-col h-full">
            <div className="p-4 border-b flex items-center justify-between">
                <div>
                    <h3 className="font-semibold">Flow Inputs</h3>
                    <p className="text-xs text-muted-foreground">Define variables for this flow.</p>
                </div>
                <Button variant="ghost" size="icon" onClick={handleAdd} title="Add Input">
                    <Plus className="h-4 w-4" />
                </Button>
            </div>
            <div className="p-4 space-y-6 overflow-y-auto flex-1">
                {inputs.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-8">
                        No inputs defined. <br />
                        Click + to add a variable.
                    </div>
                ) : (
                    inputs.map((input, index) => (
                        <div key={index} className="space-y-3 relative group">
                            <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-destructive"
                                    onClick={() => handleDelete(index)}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>

                            <div className="space-y-1">
                                <Label>Name</Label>
                                <Input
                                    value={input.name}
                                    onChange={(e) => handleUpdate(index, 'name', e.target.value)}
                                    placeholder="e.g. duration"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <Label>Type</Label>
                                    <Select
                                        value={input.type}
                                        onValueChange={(val: any) => handleUpdate(index, 'type', val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="number">Number</SelectItem>
                                            <SelectItem value="string">String</SelectItem>
                                            <SelectItem value="boolean">Boolean</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label>Default</Label>
                                    <Input
                                        value={input.default ?? ''}
                                        onChange={(e) => {
                                            const val = input.type === 'number' ? parseFloat(e.target.value) : e.target.value;
                                            handleUpdate(index, 'default', val);
                                        }}
                                        type={input.type === 'number' ? 'number' : 'text'}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <Label>Description</Label>
                                <Input
                                    value={input.description || ''}
                                    onChange={(e) => handleUpdate(index, 'description', e.target.value)}
                                    placeholder="Optional description"
                                />
                            </div>

                            {index < inputs.length - 1 && <Separator className="mt-4" />}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
