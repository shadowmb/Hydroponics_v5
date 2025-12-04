import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { Handle, Position } from '@xyflow/react';
import { Zap, Thermometer, Clock, FileText, Activity, Play, Square } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/tooltip';
import { cn } from '../../../lib/utils';
import { useStore } from '../../../core/useStore';

const getIcon = (type: string) => {
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
                    isEnd && "border-red-500 bg-red-50/10"
                )}>
                    {!isStart && (
                        <Handle type="target" position={Position.Top} className="w-3 h-3 bg-muted-foreground" />
                    )}

                    <div className="flex items-center gap-2">
                        <div className={cn("p-1 rounded bg-muted",
                            isStart && "bg-green-100 text-green-700",
                            isEnd && "bg-red-100 text-red-700"
                        )}>
                            {getIcon(String(data.type))}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold">{String(data.label || data.type)}</span>
                            <span className="text-[10px] text-muted-foreground">{String(data.type)}</span>

                            {/* Dynamic Content Display */}
                            {!!data.deviceId && (
                                <span className="text-[10px] text-blue-600 font-mono mt-1">
                                    Device: {getDeviceName(String(data.deviceId))}
                                </span>
                            )}
                            {!!data.variable && (
                                <span className="text-[10px] text-orange-600 font-mono">
                                    Var: {String(data.variable)}
                                </span>
                            )}

                            {/* ACTUATOR_SET Specifics */}
                            {data.type === 'ACTUATOR_SET' && !!data.action && (
                                <span className="text-[10px] text-purple-600 font-mono mt-1">
                                    Action: {String(data.action)}
                                    {!!data.duration && ` (${String(data.duration)}ms)`}
                                    {!!data.amount && ` (${String(data.amount)}ml)`}
                                </span>
                            )}

                            {/* WAIT Specifics */}
                            {data.type === 'WAIT' && !!data.duration && (
                                <span className="text-[10px] text-gray-500 font-mono mt-1">
                                    Wait: {String(data.duration)} ms
                                </span>
                            )}
                        </div>
                    </div>

                    {!isEnd && (
                        <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-muted-foreground" />
                    )}
                </div>
            </TooltipTrigger>
            {!!data.comment && (
                <TooltipContent className="max-w-[200px] text-xs">
                    <p>{data.comment as string}</p>
                </TooltipContent>
            )}
        </Tooltip>
    );
});
