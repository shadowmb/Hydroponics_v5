import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { Handle, Position, useNodes } from '@xyflow/react';
import {
    Zap, Thermometer, Clock, FileText, Activity, Play, Square,
    Link as LinkIcon, AlertCircle, Power, PowerOff, RefreshCw, Droplets
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/tooltip';
import { cn } from '../../../lib/utils';
import { useStore } from '../../../core/useStore';
import { useFlowContext } from '../../../context/FlowContext';

const getIcon = (type: string, isMirror: boolean) => {
    if (isMirror) return <LinkIcon className="h-4 w-4" />;

    switch (type) {
        case 'START': return <Play className="h-4 w-4" />;
        case 'END': return <Square className="h-4 w-4" />;
        case 'ACTUATOR_SET': return <Zap className="h-4 w-4" />;
        case 'SENSOR_READ': return <Thermometer className="h-4 w-4" />;
        case 'WAIT': return <Clock className="h-4 w-4" />;
        case 'LOG': return <FileText className="h-4 w-4" />;
        default: return <Activity className="h-4 w-4" />;
    }
};

const getActuatorConfig = (action: string): { header: string; icon: any; headerClass: string } => {
    switch (String(action).toUpperCase()) {
        case 'ON': return {
            header: 'TURN ON',
            icon: <Power className="h-4 w-4" />,
            headerClass: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-b-green-200 dark:border-green-800'
        };
        case 'OFF': return {
            header: 'TURN OFF',
            icon: <PowerOff className="h-4 w-4" />,
            headerClass: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-b-red-200 dark:border-red-800'
        };
        case 'TOGGLE': return {
            header: 'TOGGLE',
            icon: <RefreshCw className="h-4 w-4" />,
            headerClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-b-blue-200 dark:border-blue-800'
        };
        case 'PULSE_ON': return {
            header: 'PULSE (ON ➔ OFF)',
            icon: <Activity className="h-4 w-4" />,
            headerClass: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-b-purple-200 dark:border-purple-800'
        };
        case 'PULSE_OFF': return {
            header: 'PULSE (OFF ➔ ON)',
            icon: <Activity className="h-4 w-4" />,
            headerClass: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-b-purple-200 dark:border-purple-800'
        };
        case 'PULSE': return {
            header: 'PULSE',
            icon: <Activity className="h-4 w-4" />,
            headerClass: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-b-purple-200 dark:border-purple-800'
        };
        case 'DOSE': return {
            header: 'DOSE',
            icon: <Droplets className="h-4 w-4" />,
            headerClass: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400 border-b-cyan-200 dark:border-cyan-800'
        };
        default: return {
            header: action || 'SET ACTUATOR',
            icon: <Zap className="h-4 w-4" />,
            headerClass: 'bg-muted text-muted-foreground border-b-border'
        };
    }
};

export const GenericBlockNode = memo(({ data, selected }: NodeProps<any>) => {
    const { devices } = useStore();
    const { variables } = useFlowContext();
    const isStart = data.type === 'START';
    const isEnd = data.type === 'END';
    const nodes = useNodes();

    // Resolve Mirror Logic
    let displayData = data;
    const isMirror = !!data.mirrorOf;

    if (isMirror && data.mirrorOf) {
        const sourceNode = nodes.find(n => n.id === data.mirrorOf);
        if (sourceNode) {
            displayData = { ...sourceNode.data, mirrorOf: data.mirrorOf, type: data.type };
        }
    }

    // Helper to get device name
    const getDeviceName = (id: string) => {
        const device = devices.get(id);
        return device ? device.name : id;
    };

    // Helper to resolve Variable Name
    const resolveVarName = (val: any) => {
        const s = String(val || '');
        if (s.startsWith('{{') && s.endsWith('}}')) {
            const varId = s.slice(2, -2);
            const found = variables?.find((v: any) => v.id === varId);
            return found ? found.name : varId;
        }
        const foundDirect = variables?.find((v: any) => v.id === s);
        return foundDirect ? foundDirect.name : s;
    };

    // Render Logic
    if (displayData.type === 'ACTUATOR_SET') {
        const action = String(displayData.action || '');
        const config = getActuatorConfig(action);
        const deviceName = displayData.deviceId ? getDeviceName(String(displayData.deviceId)) : 'Select Device';
        const isUnknownDevice = displayData.deviceId && deviceName === displayData.deviceId; // ID shown means not found

        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className={cn(
                        "flex flex-col shadow-md rounded-md bg-card border-2 min-w-[180px] overflow-hidden transition-all",
                        selected ? "border-primary ring-1 ring-primary" : "border-border",
                        !!displayData.hasError && "border-destructive ring-destructive ring-1"
                    )}>
                        <Handle type="target" position={Position.Top} className="w-3 h-3 bg-muted-foreground" />

                        {/* Header */}
                        <div className={cn(
                            "flex items-center gap-2 px-3 py-1.5 border-b text-xs font-bold uppercase tracking-wide",
                            config.headerClass
                        )}>
                            {config.icon}
                            <span className="truncate max-w-[150px]" title={String(displayData.label || config.header)}>
                                {displayData.label || config.header}
                            </span>
                            {isMirror && <LinkIcon className="ml-auto w-3 h-3 opacity-50" />}
                        </div>

                        {/* Body */}
                        <div className="p-3 bg-card">
                            <div className={cn(
                                "text-sm font-semibold truncate",
                                isUnknownDevice ? "text-muted-foreground font-mono text-xs" : "text-foreground"
                            )} title={deviceName}>
                                {deviceName}
                            </div>
                        </div>

                        {/* Footer (Optional Params) */}
                        {((action.includes('PULSE') && displayData.duration) || (action === 'DOSE' && displayData.amount)) && (
                            <div className="px-3 py-1.5 bg-muted/30 border-t text-[10px] font-mono text-muted-foreground flex justify-between">
                                {action.includes('PULSE') && <span>Time: {String(displayData.duration)}ms</span>}
                                {action === 'DOSE' && <span>Vol: {resolveVarName(displayData.amount)}{String(displayData.amountUnit || 'ml')}</span>}
                            </div>
                        )}

                        <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-muted-foreground" />

                        {!!displayData.hasError && (
                            <div className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 animate-pulse" title={String(displayData.error)}>
                                <AlertCircle className="w-3 h-3" />
                            </div>
                        )}
                    </div>
                </TooltipTrigger>
                {!!displayData.comment && (
                    <TooltipContent className="max-w-[200px] text-xs">
                        <p>{displayData.comment as string}</p>
                    </TooltipContent>
                )}
            </Tooltip>
        )
    }


    if (displayData.type === 'SENSOR_READ') {
        const deviceName = displayData.deviceId ? getDeviceName(String(displayData.deviceId)) : 'Select Device';
        const isUnknownDevice = displayData.deviceId && deviceName === displayData.deviceId;

        const varName = resolveVarName(displayData.variable);

        return (
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className={cn(
                        "flex flex-col shadow-md rounded-md bg-card border-2 min-w-[200px] overflow-hidden transition-all",
                        selected ? "border-primary ring-1 ring-primary" : "border-border",
                        !!displayData.hasError && "border-destructive ring-destructive ring-1"
                    )}>
                        <Handle type="target" position={Position.Top} className="w-3 h-3 bg-muted-foreground" />

                        {/* Header */}
                        <div className="flex items-center gap-2 px-3 py-1.5 border-b text-xs font-bold uppercase tracking-wide bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400 border-b-cyan-200 dark:border-cyan-800">
                            <Thermometer className="h-4 w-4" />
                            <span className="truncate max-w-[150px]" title={String(displayData.label || 'READ SENSOR')}>
                                {displayData.label || 'READ SENSOR'}
                            </span>
                            {isMirror && <LinkIcon className="ml-auto w-3 h-3 opacity-50" />}
                        </div>

                        {/* Body */}
                        <div className="p-3 bg-card flex flex-col gap-2">
                            <div className={cn(
                                "text-sm font-semibold truncate flex items-center gap-2",
                                isUnknownDevice ? "text-muted-foreground font-mono text-xs" : "text-foreground"
                            )} title={deviceName}>
                                {deviceName}
                            </div>
                        </div>

                        {/* Footer (Output Variable) */}
                        <div className="px-3 py-1.5 bg-muted/30 border-t text-[10px] font-mono text-muted-foreground flex items-center gap-2">
                            <span>Save to:</span>
                            <span className="text-cyan-600 font-bold truncate">➜ [{varName || '?'}]</span>
                        </div>

                        <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-muted-foreground" />

                        {!!displayData.hasError && (
                            <div className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 animate-pulse" title={String(displayData.error)}>
                                <AlertCircle className="w-3 h-3" />
                            </div>
                        )}
                    </div>
                </TooltipTrigger>
                {!!displayData.comment && (
                    <TooltipContent className="max-w-[200px] text-xs">
                        <p>{displayData.comment as string}</p>
                    </TooltipContent>
                )}
            </Tooltip>
        );
    }

    // Default Generic Render
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div className={cn(
                    "px-4 py-2 shadow-md rounded-md bg-card border-2 min-w-[150px]",
                    selected ? "border-primary" : "border-border",
                    isStart && "border-green-500 bg-green-50/10",
                    isEnd && "border-red-500 bg-red-50/10",
                    isMirror && "border-dashed border-blue-400 bg-blue-50/5",
                    !!displayData.hasError && "border-destructive bg-destructive/5"
                )}>
                    {!isStart && (
                        <Handle type="target" position={Position.Top} className="w-3 h-3 bg-muted-foreground" />
                    )}

                    <div className="flex items-center gap-2">
                        <div className={cn("p-1 rounded bg-muted",
                            isStart && "bg-green-100 text-green-700",
                            isEnd && "bg-red-100 text-red-700",
                            isMirror && "bg-blue-100 text-blue-700"
                        )}>
                            {getIcon(String(displayData.type), isMirror)}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold truncate max-w-[150px]">
                                {String(displayData.label || displayData.type)}
                            </span>
                            <div className="flex items-center gap-1">
                                <span className="text-[10px] text-muted-foreground">{String(displayData.type)}</span>
                                {isMirror && <span className="text-[10px] bg-blue-100 text-blue-700 px-1 rounded-sm">Linked</span>}
                            </div>

                            {/* Dynamic Content Display */}
                            {!!displayData.deviceId && (
                                <span className="text-[10px] text-blue-600 font-mono mt-1">
                                    Device: {getDeviceName(String(displayData.deviceId))}
                                </span>
                            )}
                            {!!displayData.variable && (
                                <span className="text-[10px] text-orange-600 font-mono">
                                    Var: {String(displayData.variable)}
                                </span>
                            )}

                            {/* WAIT Specifics */}
                            {displayData.type === 'WAIT' && !!displayData.duration && (
                                <span className="text-[10px] text-gray-500 font-mono mt-1">
                                    Wait: {String(displayData.duration)} ms
                                </span>
                            )}
                        </div>
                    </div>

                    {!isEnd && (
                        <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-muted-foreground" />
                    )}

                    {!!displayData.hasError && (
                        <div className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1" title={String(displayData.error)}>
                            <AlertCircle className="w-3 h-3" />
                        </div>
                    )}
                </div>
            </TooltipTrigger>
            {!!displayData.comment && (
                <TooltipContent className="max-w-[200px] text-xs">
                    <p>{displayData.comment as string}</p>
                </TooltipContent>
            )}
        </Tooltip>
    );
});
