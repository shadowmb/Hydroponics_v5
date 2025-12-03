import React, { useEffect, useState } from 'react';
import type { Node } from '@xyflow/react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { BLOCK_DEFINITIONS, type FieldDefinition } from './block-definitions';
import { useStore } from '../../core/useStore';

import { FlowInputsPanel } from './FlowInputsPanel';
import type { IFlow } from '../../../../shared/types';

interface PropertiesPanelProps {
    selectedNode: Node | null;
    onChange: (nodeId: string, data: any) => void;
    inputs: NonNullable<IFlow['inputs']>;
    onInputsChange: (inputs: NonNullable<IFlow['inputs']>) => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ selectedNode, onChange, inputs, onInputsChange }) => {
    const { devices } = useStore();
    const [formData, setFormData] = useState<Record<string, any>>({});

    useEffect(() => {
        if (selectedNode) {
            // Merge default values with existing data
            const definition = BLOCK_DEFINITIONS[selectedNode.data.type as string];
            const defaults = definition ? Object.entries(definition.fields).reduce((acc, [key, field]) => {
                if (field.defaultValue !== undefined) acc[key] = field.defaultValue;
                return acc;
            }, {} as Record<string, any>) : {};

            setFormData({ ...defaults, ...selectedNode.data });
        } else {
            setFormData({});
        }
    }, [selectedNode]);

    const handleChange = (key: string, value: any) => {
        const newData = { ...formData, [key]: value };
        setFormData(newData);
        if (selectedNode) {
            onChange(selectedNode.id, newData);
        }
    };

    if (!selectedNode) {
        return <FlowInputsPanel inputs={inputs} onChange={onInputsChange} />;
    }

    const nodeType = selectedNode.data.type as string;
    const definition = BLOCK_DEFINITIONS[nodeType];

    // Helper to render a single field based on its definition
    const renderField = (key: string, field: FieldDefinition) => {
        const value = formData[key] !== undefined ? formData[key] : field.defaultValue;

        switch (field.type) {
            case 'text':
                return (
                    <Input
                        type="text"
                        value={value || ''}
                        onChange={(e) => handleChange(key, e.target.value)}
                        placeholder={field.placeholder}
                    />
                );
            case 'number':
                return (
                    <Input
                        type="number"
                        value={value || 0}
                        onChange={(e) => handleChange(key, parseFloat(e.target.value))}
                        placeholder={field.placeholder}
                    />
                );
            case 'select':
                return (
                    <Select value={String(value)} onValueChange={(val: string) => handleChange(key, val === 'true' ? true : val === 'false' ? false : val)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select option" />
                        </SelectTrigger>
                        <SelectContent>
                            {field.options?.map((opt) => (
                                <SelectItem key={String(opt.value)} value={String(opt.value)}>
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );
            case 'device':
                return (
                    <Select value={value || ''} onValueChange={(val: string) => handleChange(key, val)}>
                        <SelectTrigger>
                            <SelectValue placeholder={field.placeholder || "Select Device"} />
                        </SelectTrigger>
                        <SelectContent>
                            {Array.from(devices.values()).map((device) => (
                                <SelectItem key={device.id} value={device.id}>
                                    {device.name} ({device.type})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );
            default:
                return null;
        }
    };

    return (
        <div className="w-80 border-l bg-card flex flex-col h-full">
            <div className="p-4 border-b">
                <h3 className="font-semibold">Properties</h3>
                <p className="text-xs text-muted-foreground">ID: {selectedNode.id}</p>
                <p className="text-xs text-muted-foreground">Type: {nodeType}</p>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
                <div className="space-y-2">
                    <Label>Label</Label>
                    <Input
                        type="text"
                        value={formData.label || ''}
                        onChange={(e) => handleChange('label', e.target.value)}
                    />
                </div>

                <Separator />

                {definition ? (
                    Object.entries(definition.fields).map(([key, field]) => (
                        <div key={key} className="space-y-2">
                            <Label>
                                {field.label}
                                {field.description && <span className="ml-2 text-xs text-muted-foreground">({field.description})</span>}
                            </Label>
                            {renderField(key, field)}
                        </div>
                    ))
                ) : (
                    <div className="text-sm text-muted-foreground italic">
                        No properties definition for this block type.
                    </div>
                )}
            </div>
        </div>
    );
};

