import React, { useEffect, useState } from 'react';
import type { Node, Edge } from '@xyflow/react';
import { FlowHealthDashboard } from './FlowHealthDashboard';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Copy, AlertCircle, Settings2, Monitor, BookOpen, Pencil, ShieldAlert, Bell } from 'lucide-react';
import { cn } from '../../lib/utils';
import { StrategyRegistry, validateBlockStrategy, validateStrategyCalibration } from '@shared/strategies/StrategyRegistry'; // Import Registry
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
import { DoseVolumeInput } from './DoseVolumeInput';
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
    edges: Edge[];
    onSelectBlock: (nodeId: string) => void;
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
    const { devices, deviceTemplates } = useStore();
    const [channels, setChannels] = useState<{ _id: string, name: string }[]>([]);

    useEffect(() => {
        fetch('http://localhost:3000/api/notifications/channels')
            .then(res => res.json())
            .then(data => setChannels(data))
            .catch(err => console.error("Failed to load channels", err));
    }, []);

    // --- VISUAL DEBUGGER REMOVED ---


    useEffect(() => {
        if (selectedNode) {
            // Merge default values with existing data
            // Only run when node ID changes, not when node.data changes
            const definition = BLOCK_DEFINITIONS[selectedNode.data.type as string];
            const defaults = definition ? Object.entries(definition.fields).reduce((acc, [key, field]) => {
                if (field.defaultValue !== undefined) acc[key] = field.defaultValue;
                return acc;
            }, {} as Record<string, any>) : {};

            setFormData({ ...defaults, ...selectedNode.data });
        } else {
            setFormData({});
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedNode?.id]); // Only re-run when node ID changes, not on every data change

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
            <div className="w-[350px] border-l bg-background h-full flex flex-col">
                <FlowHealthDashboard
                    nodes={nodes || []}
                    edges={props.edges || []}
                    variables={variables || []}
                    onSelectBlock={props.onSelectBlock}
                />
            </div>
        );
    }

    const nodeType = selectedNode.data.type as string; // 'SENSOR_READ', 'ACTUATOR_SET', etc.
    const definition = BLOCK_DEFINITIONS[nodeType];
    const isMirrorable = nodeType === 'SENSOR_READ' || nodeType === 'IF';
    // Fix: Treat empty string as true (Mirror Mode active but no source selected yet)
    const isMirror = formData.mirrorOf !== undefined && formData.mirrorOf !== null;

    // Helper to find potential mirror sources
    const availableSources = isMirrorable ? nodes
        .filter(n => n.id !== selectedNode.id && n.data.type === nodeType && !n.data.mirrorOf) // Must be same type, not self, and not a mirror itself (no chaining mirrors for simplicity)
        .map(n => ({ label: n.data.label || n.id, value: n.id }))
        : [];

    // Resolve Device and Template at Component Level
    const targetDeviceId = formData.deviceId;

    // Explicitly track source
    let device: any = undefined;

    if (targetDeviceId) {
        // CONSOLE DEBUGGING
        console.group('PropertiesPanel Resolution Debug');
        console.log('Target Device ID:', targetDeviceId);
        console.log('Devices Store Keys:', devices ? Array.from(devices.keys()) : 'NULL');
        console.log('Templates Store Length:', deviceTemplates?.length);

        if (devices && devices.has(targetDeviceId)) {
            device = devices.get(targetDeviceId);
            console.log('✅ Device Found in Store:', device);
            console.log('   Driver ID from Config:', device.config?.driverId);
            console.log('   Driver ID (Root):', device.driverId);
        } else {
            console.warn('❌ Device NOT found in Store!');
        }
    }

    let template: any = undefined;
    if (device) {
        // Handle both simple ID string and populated object
        const driverId = device.driverId || device.config?.driverId;
        const driverIdStr = typeof driverId === 'string' ? driverId : (driverId as any)?._id;

        console.log('Raw Driver ID:', driverId);
        console.log('Resolved Driver ID String:', driverIdStr);

        if (driverIdStr && deviceTemplates) {
            template = deviceTemplates.find(t => t._id === driverIdStr || t.id === driverIdStr);
            console.log('Resolved Template:', template);
        } else {
            console.warn('Cannot resolve template: Missing ID or Templates Store empty');
        }
        console.groupEnd();
    } else if (targetDeviceId) {
        console.groupEnd();
    }

    // Helper to render a single field based on its definition
    const renderField = (key: string, field: FieldDefinition, readOnly: boolean = false) => {
        const value = formData[key] !== undefined ? formData[key] : field.defaultValue;

        // --- Generic Unit Field Hiding ---
        // If this is a Unit field (e.g. durationUnit) and the base field (duration) 
        // has an expectedUnit property, it means the base field handles the Unit rendering inline.
        if (key.endsWith('Unit')) {
            const baseKey = key.replace('Unit', '');
            const baseField = definition.fields[baseKey];
            if (baseField && baseField.expectedUnit) {
                return null;
            }
        }

        // --- Visibility Logic ---
        if (nodeType === 'ACTUATOR_SET') {
            const action = formData['action']; // No default 'ON'
            if (key === 'duration') {
                if (action !== 'PULSE_ON' && action !== 'PULSE_OFF') return null;
            }
            if (key === 'amount' || key === 'amountMode' || key === 'amountUnit') {
                if (action !== 'DOSE') return null;
            }
        }

        if (nodeType === 'LOOP') {
            const limitMode = formData['limitMode'] || 'COUNT';

            // 1. LIMIT FIELDS (Based on Mode)
            if (limitMode === 'COUNT') {
                if (key === 'timeout' || key === 'timeoutUnit') return null; // Hide Timeout fields
            } else {
                if (key === 'count') return null;   // Hide Iterations
            }



            // 3. SAFETY/LEGACY FIELDS
            if (['maxIterations', 'onMaxIterations'].includes(key)) return null;

            // 4. ALL OTHER FIELDS (Condition, Interval, etc.) -> SHOW DEFAULT
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

        if (key === 'errorTargetLabel') {
            const onFailure = formData['onFailure'] || formData['onMaxIterations']; // Check both failure types
            if (onFailure !== 'GOTO_LABEL') return null;
        }

        // --- Dynamic Options Logic ---
        let options = field.options;

        // 1. ACTUATOR CONTROL STRATEGY SELECTOR
        if (key === 'strategy' && nodeType === 'ACTUATOR_SET' && formData.deviceId) {
            if (device) {
                // Use outer 'template' (already resolved correctly)


                // Fetch compatible strategies
                const allStrategies = StrategyRegistry.getForType('ACTUATOR');

                // NEW: Role-Aware Logic
                let available = allStrategies;
                const activeRoleKey = device.config?.activeRole;

                if (activeRoleKey && template?.roles && template.roles[activeRoleKey]) {
                    // 1. Strict Mode: If role is defined, ONLY allow strategies for that role
                    const roleStrategies = template.roles[activeRoleKey].strategies || [];
                    available = allStrategies.filter(s => roleStrategies.includes(s.id));
                } else {
                    // 2. Legacy/Fallback: Union of all available strategies (backward compat)
                    // If supportedStrategies exists (legacy), use it. 
                    // If roles exist but no activeRole, merge all strategies.
                    const legacySupported = template?.supportedStrategies;

                    if (legacySupported && legacySupported.length > 0) {
                        available = allStrategies.filter(s => legacySupported.includes(s.id));
                    } else if (template?.roles) {
                        const allRoleStrategies = new Set(Object.values(template.roles).flatMap((r: any) => r.strategies));
                        available = allStrategies.filter(s => allRoleStrategies.has(s.id));
                    }
                }

                // Map to Options
                options = available.map(strategy => {
                    const isAvailable = StrategyRegistry.isStrategyAvailable(strategy.id, device.config);
                    return {
                        label: strategy.label,
                        value: strategy.id,
                        disabled: !isAvailable
                    };
                });

                // Auto-select Default if empty/invalid
                // We can't use useEffect here directly inside renderField, but we can check value match
                // actually, we can't emit side effects during render.
                // Correct approach: Display valid value, but don't force change state yet?
                // Be careful. For now, rely on User to select, but ensure the "correct" default is used for "new" blocks.
                // We fixed block-definitions, so new blocks are fine.
                // For existing blocks, show Placeholder.

                // If the current value is NOT in options (and options exist), maybe warn?
                const isValueValid = options.some(o => o.value === value);
                if (value && !isValueValid && options.length > 0) {
                    // Current value is invalid (e.g. 'raw' but only 'linear' exists)
                    // Using a ref or effect at component level is cleaner, but complex here.
                    // We will rely on the user to fix it, but show Warning?
                }

                if (options.length === 0) {
                    options = [{ label: 'Manual (On/Off)', value: 'actuator_manual' }];
                }
            }
        }

        // 2. ACTUATOR ACTION SELECTOR (Dependent on Strategy)
        if (key === 'action' && nodeType === 'ACTUATOR_SET') {
            const strategyId = formData.strategy || 'actuator_manual';

            if (strategyId === 'actuator_manual') {
                options = [
                    { label: 'Turn ON', value: 'ON' },
                    { label: 'Turn OFF', value: 'OFF' },
                    { label: 'Pulse ON', value: 'PULSE_ON' },
                    { label: 'Pulse OFF', value: 'PULSE_OFF' }
                ];
            } else if (strategyId === 'volumetric_flow' || strategyId === 'actuator_dose') {
                options = [
                    { label: 'Dose Volume', value: 'DOSE' }
                ];
            } else {
                // Fallback for unknown strategies
                options = [
                    { label: 'Turn ON', value: 'ON' },
                    { label: 'Turn OFF', value: 'OFF' }
                ];
            }
        }

        // 3. FLOW_CONTROL Target Label (Dynamic Dropdown)
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

        // 3. SENSOR READ - Strategy Selector (Read As)
        if (key === 'readingType' && nodeType === 'SENSOR_READ' && formData.deviceId) {
            if (device) {
                // Use outer 'template' (already resolved correctly)


                const allStrategies = StrategyRegistry.getForType('SENSOR');

                // NEW: Role-Aware Logic for Seniors
                let available = allStrategies;
                const activeRoleKey = device.config?.activeRole;

                if (activeRoleKey && template?.roles && template.roles[activeRoleKey]) {
                    // 1. Strict Mode: If role is defined, ONLY allow strategies for that role
                    const roleStrategies = template.roles[activeRoleKey].strategies || [];
                    available = allStrategies.filter(s => roleStrategies.includes(s.id));
                } else {
                    // 2. Legacy/Fallback: Union of all available strategies (backward compat)
                    const legacySupported = template?.supportedStrategies;

                    if (legacySupported && legacySupported.length > 0) {
                        available = allStrategies.filter(s => legacySupported.includes(s.id));
                    } else if (template?.roles) {
                        const allRoleStrategies = new Set(Object.values(template.roles).flatMap((r: any) => r.strategies));
                        available = allStrategies.filter(s => allRoleStrategies.has(s.id));
                    }
                }

                options = available.map(strategy => {
                    const isAvailable = StrategyRegistry.isStrategyAvailable(strategy.id, device.config);
                    return {
                        label: strategy.label,
                        value: strategy.id,
                        disabled: !isAvailable
                    };
                });
            } else {
                return null;
            }
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
                const expectedUnit = (field as any).expectedUnit;

                // Resolve Unit Field Definition
                const unitKey = key + 'Unit';
                const unitDef = definition.fields[unitKey];
                const unitOptions = unitDef?.options || [];
                let varValidationError: string | null = null;
                if (isVariable && expectedUnit) {
                    const varId = value.replace(/{{|}}/g, '');
                    const selectedVar = variables.find(v => v.id === varId);
                    if (selectedVar && selectedVar.unit) {
                        // Dynamically check against valid units for this field type
                        const validUnits = unitOptions.map(o => String(o.value).toLowerCase());
                        // Add common aliases if needed, or rely on options

                        if (unitOptions.length > 0 && !validUnits.includes(String(selectedVar.unit).toLowerCase())) {
                            // Basic validation: if var unit isn't in options
                            // Note: This might be too strict if var unit aliases exist (e.g. 's' vs 'sec')
                            // For now, let's keep the specific Time/Count checks if we want robust messages,
                            // OR generalize. Generalized is better but harder with aliases.
                            // Let's stick to the existing logic for Time/Count for better error messages,
                            // but use unitOptions for the Selector.

                            // Keep existing specific checks for better UX messages:
                            const timeUnits = ['sec', 'min', 'hours', 's', 'seconds', 'minutes'];
                            const countUnits = ['count', 'iterations', 'doses', 'integer', '#'];

                            if (expectedUnit === 'sec' && !timeUnits.includes(selectedVar.unit)) {
                                varValidationError = `"${selectedVar.name}" has unit "${selectedVar.unit}". Time fields need: sec, min, hours.`;
                            } else if (expectedUnit === 'count' && !countUnits.includes(selectedVar.unit)) {
                                varValidationError = `"${selectedVar.name}" has unit "${selectedVar.unit}". Count fields need: count, iterations.`;
                            }
                        }
                    }
                }

                return (
                    <div className="space-y-1">
                        <div className="flex gap-2">
                            {isVariable ? (
                                <VariableSelector
                                    value={value.replace(/{{|}}/g, '')}
                                    onChange={(val) => handleChange(key, `{{${val}}}`)}
                                    placeholder="Select variable"
                                    variables={variables}
                                />
                            ) : (
                                <>
                                    <Input
                                        type="number"
                                        value={value || 0}
                                        onChange={(e) => handleChange(key, parseFloat(e.target.value))}
                                        placeholder={field.placeholder}
                                        className="flex-1"
                                    />
                                    {expectedUnit && unitOptions.length > 0 && (
                                        <Select
                                            value={formData[unitKey] || unitOptions[0].value}
                                            onValueChange={(val) => handleChange(unitKey, val)}
                                        >
                                            <SelectTrigger className="w-[100px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {unitOptions.map(opt => (
                                                    <SelectItem key={String(opt.value)} value={String(opt.value)}>
                                                        {opt.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                </>
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
                        {
                            varValidationError && (
                                <div className="p-1.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-400 flex items-start gap-1">
                                    <span>⚠️ {varValidationError}</span>
                                </div>
                            )
                        }
                    </div >
                );
            case 'select':
                return (
                    <Select value={String(value)} onValueChange={(val: string) => handleChange(key, val === 'true' ? true : val === 'false' ? false : val)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select option" />
                        </SelectTrigger>
                        <SelectContent>
                            {options?.map((opt) => (
                                <SelectItem key={String(opt.value)} value={String(opt.value)} disabled={(opt as any).disabled}>
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
            case 'boolean':
                return (
                    <div className="flex items-center space-x-2">
                        <Switch
                            checked={!!value}
                            onCheckedChange={(checked) => handleChange(key, checked)}
                        />
                        <span className="text-xs text-muted-foreground">{field.description || field.label}</span>
                    </div>
                );
            default:
                return null;
        }
    };

    // --- CONTEXTUAL STYLING HELPERS ---
    const getBlockColorContext = (type: string) => {
        if (type === 'SENSOR_READ') return { border: 'border-l-4 border-l-cyan-500', text: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-950/20', icon: 'text-cyan-500' };
        if (type === 'ACTUATOR_SET') return { border: 'border-l-4 border-l-blue-500', text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/20', icon: 'text-blue-500' };
        if (type === 'IF') return { border: 'border-l-4 border-l-purple-500', text: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/20', icon: 'text-purple-500' };
        if (type === 'LOOP') return { border: 'border-l-4 border-l-orange-500', text: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/20', icon: 'text-orange-500' };
        if (type === 'FLOW_CONTROL') return { border: 'border-l-4 border-l-indigo-500', text: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-950/20', icon: 'text-indigo-500' };
        return { border: 'border-l-4 border-l-slate-500', text: 'text-slate-600', bg: 'bg-slate-50', icon: 'text-slate-500' };
    };

    const blockContext = getBlockColorContext(nodeType);

    return (
        <div className="w-80 border-l bg-card flex flex-col h-full">
            <div className="p-4 border-b">
                <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Properties</h3>
                <div className="flex justify-between items-center mt-1">
                    <span className="text-xs font-mono text-muted-foreground opacity-70">ID: {selectedNode.id}</span>
                </div>
            </div>

            <div className="p-4 space-y-5 overflow-y-auto flex-1">
                {/* 1. HEADER (Label) - REDESIGNED */}
                <div className="pb-2">
                    <div className="relative flex items-center gap-2 group">
                        <Pencil className="h-4 w-4 text-muted-foreground shrink-0 opacity-70" />
                        <Input
                            type="text"
                            value={formData.label || ''}
                            onChange={(e) => handleChange('label', e.target.value)}
                            disabled={isMirror}
                            className={cn(
                                "text-lg font-bold border-transparent px-2 h-auto rounded-md focus-visible:ring-1 focus-visible:ring-primary transition-all placeholder:text-muted-foreground/40 hover:bg-muted/30",
                                !formData.label && "italic"
                            )}
                            placeholder={definition?.label || "Name this block..."}
                        />
                    </div>
                </div>

                {/* 2. MIRROR CONFIGURATION (Gray Border) */}
                {isMirrorable && (
                    <CollapsibleSection
                        key={`${selectedNode.id}-mirror`}
                        title="Mirror Configuration"
                        icon={Monitor}
                        defaultOpen={isMirror}
                        className={cn("border bg-card shadow-sm overflow-hidden border-l-4 border-l-slate-400", isMirror && "bg-slate-50/50")}
                        headerClassName="text-slate-700 dark:text-slate-300"
                    >
                        <div className="space-y-3 pt-3">
                            {/* ... Content remains same ... */}
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
                        const errorKeys = ['retryCount', 'retryDelay', 'onFailure', 'errorNotification', 'maxIterations', 'onMaxIterations', 'errorTargetLabel', 'revertOnStop', 'notificationChannelId', 'notificationMode'];

                        // Conditional filtering for volumetric_flow strategy
                        const isDosingStrategy = nodeType === 'ACTUATOR_SET' &&
                            formData.strategy === 'volumetric_flow' &&
                            formData.action === 'DOSE';
                        const doseFieldKeys = ['amount', 'amountMode', 'amountUnit'];

                        const mainFields = Object.entries(definition.fields).filter(([key]) => {
                            if (errorKeys.includes(key)) return false;
                            // Skip dose fields if using volumetric_flow - we render custom component
                            if (isDosingStrategy && doseFieldKeys.includes(key)) return false;
                            return true;
                        });
                        const errorFields = Object.entries(definition.fields).filter(([key]) => errorKeys.includes(key));

                        return (
                            <>
                                {/* 3. MAIN CONFIGURATION - STYLED */}
                                <CollapsibleSection
                                    key={`${selectedNode.id}-config`}
                                    title="Configuration"
                                    icon={Settings2}
                                    defaultOpen={true}
                                    className={cn("border bg-card shadow-sm overflow-hidden", blockContext.border)}
                                    headerClassName={cn(blockContext.bg, blockContext.text)}
                                >
                                    <div className="space-y-3 pt-3">
                                        {mainFields.map(([key, field]) => (
                                            <div key={key} className="space-y-2">
                                                <Label className={cn("text-muted-foreground", isMirror && "opacity-50")}>
                                                    {field.label}
                                                </Label>
                                                {renderField(key, field, isMirror)}

                                                {/* UNIT VALIDATION WARNING */}
                                                {key === 'variable' && nodeType === 'SENSOR_READ' && formData.deviceId && formData[key] && !formData[key].startsWith('{{') && (
                                                    (() => {
                                                        const { devices, deviceTemplates } = useStore.getState();
                                                        const device = devices.get(formData.deviceId);
                                                        const variable = variables.find(v => v.id === formData[key]);

                                                        if (device && variable && variable.unit) {
                                                            const driverId = typeof device.config?.driverId === 'object' ? (device.config.driverId as any)._id : device.config?.driverId;
                                                            const template = deviceTemplates?.find(t => t._id === driverId || t._id === device.driverId);

                                                            const check = validateBlockStrategy(formData.readingType || 'linear', variable.unit, { device, template });

                                                            if (!check.isValid) {
                                                                return (
                                                                    <div className="text-xs text-red-600 bg-red-50 border border-red-200 p-2 rounded flex flex-col gap-1">
                                                                        <div className="flex gap-2 items-center font-semibold">
                                                                            <AlertCircle className="h-3 w-3" />
                                                                            <span>Incompatible Units!</span>
                                                                        </div>
                                                                        <span className="opacity-90 pl-5">
                                                                            {check.error || 'Strategy output unit does not match variable unit.'}
                                                                        </span>
                                                                    </div>
                                                                );
                                                            }
                                                        }
                                                        return null;
                                                    })()
                                                )}

                                                {/* MISSING CALIBRATION WARNING */}
                                                {(key === 'readingType' || key === 'strategy') && formData.deviceId && (
                                                    (() => {
                                                        const { devices } = useStore.getState();
                                                        const device = devices.get(formData.deviceId);
                                                        const strategyId = formData[key] || 'linear';

                                                        if (device) {
                                                            const check = validateStrategyCalibration(strategyId, device.config);
                                                            if (!check.isValid) {
                                                                return (
                                                                    <div className="text-xs text-yellow-600 bg-yellow-50 border border-yellow-200 p-2 rounded flex flex-col gap-1 mt-1">
                                                                        <div className="flex gap-2 items-center font-semibold">
                                                                            <AlertCircle className="h-3 w-3" />
                                                                            <span>Calibration Required</span>
                                                                        </div>
                                                                        <span className="opacity-90 pl-5">
                                                                            {check.error}
                                                                        </span>
                                                                    </div>
                                                                );
                                                            }
                                                        }
                                                        return null;
                                                    })()
                                                )}
                                            </div>
                                        ))}

                                        {/* CUSTOM DOSE/VOLUME INPUT FOR VOLUMETRIC FLOW */}
                                        {isDosingStrategy && (
                                            <div className="space-y-2 pt-2 border-t">
                                                <Label className="text-muted-foreground text-xs">Dose Configuration</Label>
                                                <DoseVolumeInput
                                                    amountMode={
                                                        formData.amountMode ||
                                                        (formData.amountUnit === 'doses' ? 'DOSES' : 'VOLUME')
                                                    }
                                                    amount={formData.amount}
                                                    amountUnit={formData.amountUnit || 'ml'}
                                                    onChange={handleChange}
                                                    variables={variables}
                                                    device={device}
                                                    isVariable={typeof formData.amount === 'string' && formData.amount.startsWith('{{')}
                                                    selectedVariable={typeof formData.amount === 'string' && formData.amount.startsWith('{{')
                                                        ? formData.amount.slice(2, -2)
                                                        : undefined}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </CollapsibleSection>

                                {/* 3.5 NOTIFICATION CONFIGURATION  */}
                                {(!isMirror) && (
                                    <CollapsibleSection
                                        key={`${selectedNode.id}-notify`}
                                        title="Notifications"
                                        icon={Bell}
                                        className="border bg-card shadow-sm overflow-hidden"
                                        headerClassName="text-slate-700 dark:text-slate-300"
                                    >
                                        <div className="space-y-3 pt-3">
                                            <div className="space-y-2">
                                                <Label className="text-muted-foreground text-xs">Notification Channel</Label>
                                                <Select
                                                    value={formData.notificationChannelId || "default"}
                                                    onValueChange={(val) => handleChange('notificationChannelId', val === "default" ? "" : val)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Inherit (Global Rules)" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="default">
                                                            <span className="text-muted-foreground italic">Inherit (Global Rules)</span>
                                                        </SelectItem>
                                                        {channels.map((c: any) => (
                                                            <SelectItem key={c._id} value={c._id}>
                                                                {c.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-muted-foreground text-xs">Behavior</Label>
                                                <Select
                                                    value={formData.notificationMode || "AUTO"}
                                                    onValueChange={(val) => handleChange('notificationMode', val)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="AUTO">Auto (Errors Only)</SelectItem>
                                                        <SelectItem value="ALWAYS">Always Alert (Success & Error)</SelectItem>
                                                        <SelectItem value="MUTE">Mute (No Alerts)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </CollapsibleSection>
                                )}

                                {/* 4. ERROR HANDLING - RED BORDER */}
                                {errorFields.length > 0 && !isMirror && (
                                    <CollapsibleSection
                                        key={`${selectedNode.id}-error`}
                                        title="Error Handling"
                                        icon={ShieldAlert}
                                        className="border-l-4 border-l-red-500 border-red-100 dark:border-red-900/30 overflow-hidden"
                                        headerClassName="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20"
                                    >
                                        <div className="space-y-3 pt-3">
                                            {errorFields.map(([key, field]) => {
                                                if (key === 'errorTargetLabel') {
                                                    const onFailure = formData['onFailure'] || formData['onMaxIterations'];
                                                    if (onFailure !== 'GOTO_LABEL') return null;
                                                }
                                                // Skip notification fields in Error section (they have their own section)
                                                if (key === 'notificationChannelId' || key === 'notificationMode') return null;

                                                const content = key === 'errorTargetLabel' ? (
                                                    <Select
                                                        value={formData.errorTargetLabel || ''}
                                                        onValueChange={(val) => handleChange('errorTargetLabel', val)}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select Target Label" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {nodes.find(n => n.data.type === 'END') && (
                                                                <SelectItem value="END">End Program</SelectItem>
                                                            )}
                                                            {nodes
                                                                .filter(n => n.data.type === 'FLOW_CONTROL' && n.data.controlType === 'LABEL')
                                                                .map(n => (
                                                                    <SelectItem key={n.id} value={n.data.labelName as string}>
                                                                        {String(n.data.labelName || 'Unnamed Label')}
                                                                    </SelectItem>
                                                                ))
                                                            }
                                                            {nodes.filter(n => n.data.type === 'FLOW_CONTROL' && n.data.controlType === 'LABEL').length === 0 && !nodes.find(n => n.data.type === 'END') && (
                                                                <div className="p-2 text-xs text-muted-foreground">No Labels found</div>
                                                            )}
                                                        </SelectContent>
                                                    </Select>
                                                ) : renderField(key, field, false);

                                                if (!content) return null;

                                                return (
                                                    <div key={key} className="space-y-2">
                                                        <Label className="text-muted-foreground text-xs">
                                                            {field.label}
                                                        </Label>
                                                        {content}
                                                    </div>
                                                );
                                            })}
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

                {/* 5. DOCUMENTATION (Bottom) - GRAY BORDER */}
                <CollapsibleSection
                    title="Documentation"
                    icon={BookOpen}
                    key={`${selectedNode.id}-docs`}
                    className="border-l-4 border-l-slate-400"
                    headerClassName="text-slate-700 dark:text-slate-300"
                >
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


// Helper Component for Collapsible Sections
const CollapsibleSection = ({ title, icon: Icon, defaultOpen = false, children, className, headerClassName }: { title: string, icon?: any, defaultOpen?: boolean, children: React.ReactNode, className?: string, headerClassName?: string }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    useEffect(() => {
        setIsOpen(defaultOpen);
    }, [defaultOpen]);

    return (
        <div className={cn("rounded-md border bg-card transition-all", className)}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn("flex items-center justify-between w-full p-3 text-sm font-medium hover:bg-muted/50 transition-colors rounded-t-md", headerClassName)}
            >
                <div className="flex items-center gap-2">
                    {Icon && <Icon className="h-4 w-4 opacity-70" />}
                    <span>{title}</span>
                </div>
                <span className={cn("text-muted-foreground transition-transform duration-200 text-[10px]", isOpen && "rotate-180")}>
                    ▼
                </span>
            </button>
            {isOpen && (
                <div className="p-3 pt-0 border-t bg-muted/5 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200">
                    {children}
                </div>
            )}
        </div>
    );
};
