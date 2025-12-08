import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { Handle, Position, useNodes } from '@xyflow/react';
import { Zap, Thermometer, Clock, FileText, Activity, Play, Square, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/tooltip';
import { cn } from '../../../lib/utils';
import { useStore } from '../../../core/useStore';

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

export const GenericBlockNode = memo(({ data, selected }: NodeProps) => {
    const { devices } = useStore();
    const isStart = data.type === 'START';
    const isEnd = data.type === 'END';
    const nodes = useNodes(); // Access all nodes to find mirror source

    // Resolve Mirror Logic: If this is a mirror, try to find the source node and use its data for display
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

                            {/* ACTUATOR_SET Specifics */}
                            {displayData.type === 'ACTUATOR_SET' && !!displayData.action && (
                                <span className="text-[10px] text-purple-600 font-mono mt-1">
                                    Action: {String(displayData.action)}
                                    {/* Show Duration only for Pulse actions */}
                                    {(String(displayData.action) === 'PULSE_ON' || String(displayData.action) === 'PULSE_OFF') && !!displayData.duration && ` (${String(displayData.duration)}ms)`}
                                    {/* Show Amount only for Dose action, with correct unit */}
                                    {String(displayData.action) === 'DOSE' && !!displayData.amount && ` (${String(displayData.amount)}${displayData.amountUnit || 'ml'})`}
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
