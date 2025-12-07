import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { Handle, Position } from '@xyflow/react';
import { Zap, Thermometer, Clock, FileText, Activity, AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/tooltip';
import { cn } from '../../../lib/utils';

const getIcon = (type: string) => {
    switch (type) {
        case 'ACTUATOR_SET': return <Zap className="h-4 w-4" />;
        case 'SENSOR_READ': return <Thermometer className="h-4 w-4" />;
        case 'WAIT': return <Clock className="h-4 w-4" />;
        case 'LOG': return <FileText className="h-4 w-4" />;
        default: return <Activity className="h-4 w-4" />;
    }
};

export const ActionNode = memo(({ data, selected }: NodeProps) => {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div className={cn(
                    "px-4 py-2 shadow-md rounded-md bg-card border-2 min-w-[150px]",
                    "px-4 py-2 shadow-md rounded-md bg-card border-2 min-w-[150px]",
                    selected ? "border-primary" : "border-border",
                    !!data.hasError && "border-destructive bg-destructive/5"
                )}>
                    <Handle type="target" position={Position.Top} className="w-3 h-3 bg-muted-foreground" />

                    <div className="flex items-center gap-2">
                        <div className="p-1 rounded bg-muted">
                            {getIcon(data.type as string)}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold">{data.label as string}</span>
                            <span className="text-[10px] text-muted-foreground">{data.type as string}</span>
                        </div>
                    </div>

                    <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-muted-foreground" />

                    {!!data.hasError && (
                        <div className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1" title={String(data.error)}>
                            <AlertCircle className="w-3 h-3" />
                        </div>
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
