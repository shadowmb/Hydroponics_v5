import React, { useEffect, useState } from 'react';
import type { Node, Edge } from '@xyflow/react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { BLOCK_DEFINITIONS, type FieldDefinition } from './block-definitions';


import { Button } from '../ui/button';
import { DeviceSelector } from './DeviceSelector';
import { useStore } from '../../core/useStore';
import { VariableManager } from './VariableManager';
import { VariableSelector } from './VariableSelector';
import type { IVariable } from '../../../../shared/types';

interface PropertiesPanelProps {
    selectedNode: Node | null;
    selectedEdge: Edge | null;
    onChange: (nodeId: string, data: any) => void;
    onEdgeChange: (edgeId: string, style: any) => void;
    onDeleteNode: (nodeId: string) => void;
    onDeleteEdge: (edgeId: string) => void;
    variables: IVariable[];
    onVariablesChange: (vars: IVariable[]) => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
    selectedNode,
    selectedEdge,
    onChange,
    onEdgeChange,
    onDeleteNode,
    onDeleteEdge,
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

    if (selectedEdge) {
        return (
            <div className="w-80 border-l bg-card flex flex-col h-full">
                <div className="p-4 border-b">
                    <h3 className="font-semibold">Connection Properties</h3>
                    <p className="text-xs text-muted-foreground">ID: {selectedEdge.id}</p>
                </div>
                <div className="flex-1 p-4 space-y-4">
                    <div className="space-y-2">
                        <Label>Color</Label>
                        <Select
                            value={selectedEdge.style?.stroke || '#b1b1b7'}
                            onValueChange={(val) => onEdgeChange(selectedEdge.id, { stroke: val })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select color" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="#b1b1b7">Default (Gray)</SelectItem>
                                <SelectItem value="#ef4444">Red</SelectItem>
                                <SelectItem value="#22c55e">Green</SelectItem>
                                <SelectItem value="#3b82f6">Blue</SelectItem>
                                <SelectItem value="#eab308">Yellow</SelectItem>
                                <SelectItem value="#a855f7">Purple</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Separator />

                    <Button
                        variant="destructive"
                        className="w-full"
                        onClick={() => onDeleteEdge(selectedEdge.id)}
                    >
                        Delete Connection
                    </Button>
                </div>
            </div>
        );
    }

    if (!selectedNode) {
        return (
            <div className="w-80 border-l bg-card flex flex-col h-full">
                <div className="p-4 border-b">
                    <h3 className="font-semibold">Flow Properties</h3>
                    <p className="text-xs text-muted-foreground">Global settings for this flow.</p>
                </div>
                <div className="flex-1 p-4 space-y-4">
                    <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                        Select a block or connection to edit its properties.
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

        // --- Visibility Logic ---
        // --- Visibility Logic ---
        if (nodeType === 'ACTUATOR_SET') {
            const action = formData['action'] || 'ON';
            if (key === 'duration') {
                if (action !== 'PULSE_ON' && action !== 'PULSE_OFF') return null;
            }
            if (key === 'amount') {
                if (action !== 'DOSE') return null;
            }
        }

        if (nodeType === 'LOOP') {
            const loopType = formData['loopType'] || 'COUNT';
            if (key === 'count') {
                if (loopType !== 'COUNT') return null;
            }
            if (['variable', 'operator', 'value'].includes(key)) {
                if (loopType !== 'WHILE') return null;
            }
        }

        // --- Dynamic Options Logic ---
        let options = field.options;
        if (key === 'action' && nodeType === 'ACTUATOR_SET' && formData.deviceId) {
            const { devices } = useStore.getState(); // Access store directly or via hook if inside component
            const device = devices.get(formData.deviceId);
            if (device && device.config?.calibrations?.volumetric_flow) {
                // Check if DOSE is already in options to avoid duplicates
                if (!options?.find(o => o.value === 'DOSE')) {
                    options = [
                        ...(options || []),
                        { label: 'Dose Volume (ml)', value: 'DOSE' }
                    ];
                }
            }
        }

        switch (field.type) {
            case 'text':
                // Check if value is a variable reference (string starting with {{)
                const isVarText = typeof value === 'string' && value.startsWith('{{');

                return (
                    <div className="flex gap-2">
                        {isVarText ? (
                            <VariableSelector
                                value={value.replace(/{{|}}/g, '')}
                                onChange={(val) => handleChange(key, `{{${val}}}`)}
                                placeholder="Select variable"
                                variables={variables}
                            />
                        ) : (
                            <Input
                                type="text"
                                value={value || ''}
                                onChange={(e) => handleChange(key, e.target.value)}
                                placeholder={field.placeholder}
                            />
                        )}
                        <Button
                            variant="outline"
                            size="icon"
                            className="shrink-0"
                            title={isVarText ? "Switch to Static Value" : "Switch to Variable"}
                            onClick={() => {
                                if (isVarText) {
                                    handleChange(key, ''); // Reset to empty string
                                } else {
                                    handleChange(key, '{{}}'); // Switch to variable format
                                }
                            }}
                        >
                            {isVarText ? <span className="font-mono text-xs">Abc</span> : <span className="font-mono text-xs">Var</span>}
                        </Button>
                    </div>
                );
            case 'number':
                // Check if value is a variable reference (string starting with {{)
                const isVariable = typeof value === 'string' && value.startsWith('{{');

                return (
                    <div className="flex gap-2">
                        {isVariable ? (
                            <VariableSelector
                                value={value.replace(/{{|}}/g, '')}
                                onChange={(val) => handleChange(key, `{{${val}}}`)}
                                placeholder="Select variable"
                                variables={variables}
                            />
                        ) : (
                            <Input
                                type="number"
                                value={value || 0}
                                onChange={(e) => handleChange(key, parseFloat(e.target.value))}
                                placeholder={field.placeholder}
                            />
                        )}
                        <Button
                            variant="outline"
                            size="icon"
                            className="shrink-0"
                            title={isVariable ? "Switch to Static Value" : "Switch to Variable"}
                            onClick={() => {
                                if (isVariable) {
                                    handleChange(key, 0); // Reset to number
                                } else {
                                    handleChange(key, '{{}}'); // Switch to variable format
                                }
                            }}
                        >
                            {isVariable ? <span className="font-mono text-xs">123</span> : <span className="font-mono text-xs">Var</span>}
                        </Button>
                    </div>
                );
            case 'select':
                return (
                    <Select value={String(value)} onValueChange={(val: string) => handleChange(key, val === 'true' ? true : val === 'false' ? false : val)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select option" />
                        </SelectTrigger>
                        <SelectContent>
                            {options?.map((opt) => (
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

                <Separator className="my-4" />

                <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => onDeleteNode(selectedNode.id)}
                >
                    Delete Block
                </Button>
            </div>
        </div>
    );
};

