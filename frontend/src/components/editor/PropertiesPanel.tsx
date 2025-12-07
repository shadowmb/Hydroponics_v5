import React, { useEffect, useState } from 'react';
import type { Node, Edge } from '@xyflow/react';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Copy, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { BLOCK_DEFINITIONS, type FieldDefinition } from './block-definitions';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../ui/dialog";

import { Button } from '../ui/button';
import { DeviceSelector } from './DeviceSelector';
import { useStore } from '../../core/useStore';
import { VariableSelector } from './VariableSelector';
import type { IVariable } from '../../../../shared/types';

interface PropertiesPanelProps {
    selectedNode: Node | null;
    selectedEdge: Edge | null;
    onChange: (nodeId: string, data: any) => void;
    onEdgeChange: (edgeId: string, style: any) => void;
    onDeleteNode: (nodeId: string) => void;
    onDeleteEdge: (edgeId: string) => void;
    onDuplicateNode: (nodeId: string) => void;
    variables: IVariable[];
    onVariablesChange: (vars: IVariable[]) => void;
    flowDescription?: string;
    onFlowDescriptionChange?: (desc: string) => void;
    nodes: Node[];
}


export const PropertiesPanel: React.FC<PropertiesPanelProps> = (props) => {
    const {
        selectedNode,
        selectedEdge,
        onChange,
        onEdgeChange,
        onDeleteNode,
        onDeleteEdge,
        onDuplicateNode,
        variables,
        nodes
    } = props;

    const [formData, setFormData] = useState<Record<string, any>>({});
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

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
                        <Label className="text-muted-foreground">Color</Label>
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
                    <div className="space-y-2">
                        <Label className="text-muted-foreground">Flow Comment</Label>
                        <Textarea
                            value={props.flowDescription || ''}
                            onChange={(e) => props.onFlowDescriptionChange?.(e.target.value)}
                            placeholder="Describe the purpose of this flow..."
                            className="resize-none h-32"
                        />
                        <p className="text-xs text-muted-foreground">
                            This comment is saved with the flow and helps identify its purpose.
                        </p>
                    </div>

                    <Separator />

                    <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                        Select a block or connection to edit its properties.
                    </div>
                </div>
            </div>
        );
    }

    const nodeType = selectedNode.data.type as string; // 'SENSOR_READ', 'ACTUATOR_SET', etc.
    const definition = BLOCK_DEFINITIONS[nodeType];
    const isMirrorable = nodeType === 'SENSOR_READ'; // Restrict for now as requested
    // Fix: Treat empty string as true (Mirror Mode active but no source selected yet)
    const isMirror = formData.mirrorOf !== undefined && formData.mirrorOf !== null;

    // Helper to find potential mirror sources
    const availableSources = isMirrorable ? nodes
        .filter(n => n.id !== selectedNode.id && n.data.type === nodeType && !n.data.mirrorOf) // Must be same type, not self, and not a mirror itself (no chaining mirrors for simplicity)
        .map(n => ({ label: n.data.label || n.id, value: n.id }))
        : [];

    // Helper to render a single field based on its definition
    const renderField = (key: string, field: FieldDefinition, readOnly: boolean = false) => {
        const value = formData[key] !== undefined ? formData[key] : field.defaultValue;

        // --- Visibility Logic ---
        if (nodeType === 'ACTUATOR_SET') {
            const action = formData['action']; // No default 'ON'
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
            if (key === 'maxIterations') {
                if (loopType !== 'WHILE') return null;
            }
            if (['variable', 'operator', 'value'].includes(key)) {
                if (loopType !== 'WHILE') return null;
            }
        }

        if (nodeType === 'FLOW_CONTROL') {
            const controlType = formData['controlType'] || 'LABEL';
            if (key === 'labelName') {
                if (controlType !== 'LABEL') return null;
            }
            if (key === 'targetLabel') {
                if (controlType === 'LABEL' || controlType === 'LOOP_BREAK') return null;
            }
        }

        // --- Dynamic Options Logic ---
        let options = field.options;

        // 1. ACTUATOR DOSE Check
        if (key === 'action' && nodeType === 'ACTUATOR_SET' && formData.deviceId) {
            const { devices } = useStore.getState();
            const device = devices.get(formData.deviceId);
            if (device && device.config?.calibrations?.volumetric_flow) {
                if (!options?.find(o => o.value === 'DOSE')) {
                    options = [
                        ...(options || []),
                        { label: 'Dose Volume (ml)', value: 'DOSE' }
                    ];
                }
            }
        }

        // 2. FLOW_CONTROL Target Label (Dynamic Dropdown)
        if (nodeType === 'FLOW_CONTROL' && key === 'targetLabel') {
            const controlType = formData['controlType'];

            // A. If Loop Back -> Show ONLY Loop blocks (Return to start of loop)
            if (controlType === 'LOOP_BACK') {
                options = nodes
                    .filter(n => n.type === 'loop')
                    .map(n => ({
                        label: `Loop: ${n.data.label || n.id}`,
                        value: String(n.id)
                    }));
            }
            // B. If GoTo -> Show ALL blocks (Jump anywhere)
            else if (controlType === 'GOTO') {
                options = nodes
                    .filter(n => n.id !== selectedNode.id) // Avoid self-reference
                    .map(n => ({
                        label: `${n.data.label || n.type} (${n.id})`,
                        value: String(n.id)
                    }));
            }

            // FORCE SELECT RENDER for this field when we have dynamic options
            field = { ...field, type: 'select' };
        }

        if (readOnly) {
            return (
                <div className="p-2 bg-muted rounded border border-dashed text-sm text-muted-foreground">
                    {String(value)}
                </div>
            );
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

    // Helper Component for Collapsible Sections
    const CollapsibleSection = ({ title, icon: Icon, defaultOpen = false, children, className }: { title: string, icon?: any, defaultOpen?: boolean, children: React.ReactNode, className?: string }) => {
        const [isOpen, setIsOpen] = useState(defaultOpen);
        return (
            <div className={cn("rounded-md border bg-card", className)}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center justify-between w-full p-3 text-sm font-medium hover:bg-muted/50 transition-colors"
                >
                    <div className="flex items-center gap-2">
                        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
                        <span>{title}</span>
                    </div>
                    <span className={cn("text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")}>
                        ▼
                    </span>
                </button>
                {isOpen && (
                    <div className="p-3 pt-0 border-t bg-muted/5 space-y-3">
                        {children}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="w-80 border-l bg-card flex flex-col h-full">
            <div className="p-4 border-b">
                <h3 className="font-semibold">Properties</h3>
                <p className="text-xs text-muted-foreground">ID: {selectedNode.id}</p>
                <p className="text-xs text-muted-foreground">Type: {nodeType}</p>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto flex-1">
                {/* 1. HEADER (Label) */}
                <div className="space-y-2">
                    <Label className="text-muted-foreground">Label</Label>
                    <Input
                        type="text"
                        value={formData.label || ''}
                        onChange={(e) => handleChange('label', e.target.value)}
                        disabled={isMirror}
                    />
                </div>

                {/* 2. MIRROR CONFIGURATION (If applicable) */}
                {isMirrorable && (
                    <CollapsibleSection
                        title="Mirror Configuration"
                        defaultOpen={isMirror}
                        className={isMirror ? "border-blue-200 bg-blue-50/10" : ""}
                    >
                        <div className="space-y-3 pt-3">
                            <div className="flex items-center justify-between">
                                <Label className="font-semibold text-xs">Enable Mirroring</Label>
                                <Button
                                    variant={isMirror ? "default" : "outline"}
                                    size="sm"
                                    className={cn("h-6 text-xs w-24 transition-all", isMirror ? "bg-blue-600 hover:bg-blue-700 shadow-sm" : "text-muted-foreground")}
                                    onClick={() => handleChange('mirrorOf', isMirror ? null : '')}
                                >
                                    {isMirror ? "Active" : "Inactive"}
                                </Button>
                            </div>

                            {isMirror && (
                                <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200">
                                    <Label className="text-xs text-muted-foreground">Source Block</Label>
                                    <Select
                                        value={formData.mirrorOf || ''}
                                        onValueChange={(val) => {
                                            handleChange('mirrorOf', val);
                                            const sourceNode = nodes.find(n => n.id === val);
                                            if (sourceNode && definition) {
                                                const newData: Record<string, any> = { ...formData, mirrorOf: val };
                                                Object.keys(definition.fields).forEach(fKey => {
                                                    newData[fKey] = sourceNode.data[fKey];
                                                });
                                                setFormData(newData);
                                                onChange(selectedNode.id, newData);
                                            }
                                        }}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Source Block" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableSources.length > 0 ? (
                                                availableSources.map(src => (
                                                    <SelectItem key={src.value} value={src.value}>
                                                        {String(src.label)}
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <div className="p-2 text-xs text-muted-foreground text-center">No compatible blocks found</div>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                    </CollapsibleSection>
                )}

                {definition ? (
                    (() => {
                        const errorKeys = ['retryCount', 'retryDelay', 'onFailure', 'errorNotification'];
                        const mainFields = Object.entries(definition.fields).filter(([key]) => !errorKeys.includes(key));
                        const errorFields = Object.entries(definition.fields).filter(([key]) => errorKeys.includes(key));

                        return (
                            <>
                                {/* 3. MAIN CONFIGURATION */}
                                <CollapsibleSection title="Configuration" defaultOpen={false}>
                                    <div className="space-y-3 pt-3">
                                        {mainFields.map(([key, field]) => (
                                            <div key={key} className="space-y-2">
                                                <Label className={cn("text-muted-foreground", isMirror && "opacity-50")}>
                                                    {field.label}
                                                </Label>
                                                {renderField(key, field, isMirror)}
                                            </div>
                                        ))}
                                    </div>
                                </CollapsibleSection>

                                {/* 4. ERROR HANDLING */}
                                {errorFields.length > 0 && !isMirror && (
                                    <CollapsibleSection
                                        title="Error Handling"
                                        icon={AlertCircle}
                                        className="border-red-100 dark:border-red-900/50"
                                    >
                                        <div className="space-y-3 pt-3">
                                            {errorFields.map(([key, field]) => (
                                                <div key={key} className="space-y-2">
                                                    <Label className="text-muted-foreground text-xs">
                                                        {field.label}
                                                    </Label>
                                                    {renderField(key, field, false)}
                                                </div>
                                            ))}
                                        </div>
                                    </CollapsibleSection>
                                )}
                            </>
                        );
                    })()
                ) : (
                    <div className="text-sm text-muted-foreground italic">
                        No properties definition for this block type.
                    </div>
                )}

                {/* 5. DOCUMENTATION (Bottom) */}
                <CollapsibleSection title="Documentation">
                    <div className="pt-3">
                        <Label className="text-muted-foreground mb-2 block">Comment</Label>
                        <Textarea
                            value={formData.comment || ''}
                            onChange={(e) => handleChange('comment', e.target.value)}
                            placeholder="Add notes..."
                            className="resize-none h-20 text-xs"
                        />
                    </div>
                </CollapsibleSection>

                <Separator className="my-4" />

                {(nodeType !== 'START' && nodeType !== 'END') && (
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => onDuplicateNode(selectedNode.id)}
                            title="Duplicate Block"
                        >
                            <Copy className="h-4 w-4" />
                        </Button>

                        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    variant="destructive"
                                    className="flex-1"
                                    title="Delete Block"
                                >
                                    Delete
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Delete Block?</DialogTitle>
                                    <DialogDescription>
                                        Are you sure you want to delete this block? This action cannot be undone.
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={() => {
                                            if (selectedNode) {
                                                onDeleteNode(selectedNode.id);
                                                setIsDeleteDialogOpen(false);
                                            }
                                        }}
                                    >
                                        Delete
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                )}
            </div>
        </div>
    );
};

