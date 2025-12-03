import React, { useEffect, useState } from 'react';
import type { Node } from '@xyflow/react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { BLOCK_DEFINITIONS, type FieldDefinition } from './block-definitions';


import { DeviceSelector } from './DeviceSelector';
import { VariableManager } from './VariableManager';
import { VariableSelector } from './VariableSelector';
import type { IVariable } from '../../../../shared/types';

interface PropertiesPanelProps {
    selectedNode: Node | null;
    onChange: (nodeId: string, data: any) => void;
    variables: IVariable[];
    onVariablesChange: (vars: IVariable[]) => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
    selectedNode,
    onChange,
    variables,
    onVariablesChange
}) => {

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
        return (
            <div className="w-80 border-l bg-card flex flex-col h-full">
                <div className="p-4 border-b">
                    <h3 className="font-semibold">Flow Properties</h3>
                    <p className="text-xs text-muted-foreground">Global settings for this flow.</p>
                </div>
                <div className="flex-1 p-4 space-y-4">
                    <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                        Select a block to edit its properties.
                    </div>

                    <Separator />

                    <div className="space-y-2">
                        <Label>Variables</Label>
                        <p className="text-xs text-muted-foreground mb-2">
                            Manage local and global variables used in this flow.
                        </p>
                        <VariableManager
                            variables={variables}
                            onUpdateVariables={onVariablesChange}
                        />
                    </div>
                </div>
            </div>
        );
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
                // Determine filter type based on block type
                let filterType: 'SENSOR' | 'ACTUATOR' | undefined = undefined;
                if (nodeType === 'SENSOR_READ') filterType = 'SENSOR';
                else if (nodeType === 'ACTUATOR_SET') filterType = 'ACTUATOR';

                return (
                    <DeviceSelector
                        value={value || ''}
                        onChange={(val: string) => handleChange(key, val)}
                        placeholder={field.placeholder}
                        filterType={filterType}
                    />
                );
            case 'variable':
                return (
                    <VariableSelector
                        value={value || ''}
                        onChange={(val: string) => handleChange(key, val)}
                        placeholder={field.placeholder}
                        variables={variables}
                    />
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

