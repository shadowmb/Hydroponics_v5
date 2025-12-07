import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { Handle, Position } from '@xyflow/react';
import { Flag, ArrowRightCircle, DoorOpen, AlertCircle, RefreshCw } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/tooltip';
import { cn } from '../../../lib/utils';

export const FlowControlNode = memo(({ data, selected }: NodeProps) => {
    const controlType = data.controlType as string || 'LABEL';
    const labelName = data.labelName as string || 'Unknown';
    const targetLabel = data.targetLabel as string || 'Unknown';

    // Visual configuration based on type
    let Icon = Flag;
    let bgColor = 'bg-slate-100';
    let borderColor = 'border-slate-300';
    let label = 'Label';
    let value = labelName;

    if (controlType === 'GOTO') {
        Icon = ArrowRightCircle;
        bgColor = 'bg-blue-50';
        borderColor = 'border-blue-300';
        label = 'Go To';
        value = targetLabel;
    } else if (controlType === 'LOOP_BACK') {
        Icon = RefreshCw;
        bgColor = 'bg-orange-50';
        borderColor = 'border-orange-300';
        label = 'Loop Back To';
        value = targetLabel;
    } else if (controlType === 'LOOP_BREAK') {
        Icon = DoorOpen;
        bgColor = 'bg-red-50';
        borderColor = 'border-red-300';
        label = 'Break Loop';
        value = 'Exit';
    }

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div className={cn(
                    "px-4 py-2 shadow-sm rounded-full border-2 min-w-[120px] flex items-center gap-3",
                    bgColor,
                    selected ? "border-primary" : borderColor,
                    !!data.hasError && "border-destructive bg-destructive/10"
                )}>
                    {/* Input Handle (All except START-like labels might need inputs, but LABEL is a passthrough usually) */}
                    <Handle type="target" position={Position.Left} className="w-2 h-2 bg-muted-foreground" />

                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />

                    <div className="flex flex-col leading-none">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">{label}</span>
                        <span className="text-sm font-bold truncate max-w-[150px]">{value}</span>
                    </div>

                    {/* Output Handle */}
                    {/* GOTO/BREAK/LOOP_BACK are terminal/jumps, so they effectively end the linear flow here visually, 
                        but technically might connect to nothing if they are pure jumps. 
                        However, LABEL acts as a passthrough or anchor. */}
                    {controlType === 'LABEL' && (
                        <Handle type="source" position={Position.Right} className="w-2 h-2 bg-muted-foreground" />
                    )}

                    {/* Error Indicator */}
                    {!!data.hasError && (
                        <div className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-1" title={String(data.error)}>
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
