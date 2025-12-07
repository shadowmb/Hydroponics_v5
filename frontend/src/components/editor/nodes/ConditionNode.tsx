import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { Handle, Position, useNodes } from '@xyflow/react';
import { GitBranch, AlertCircle, Link } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/tooltip';
import { cn } from '../../../lib/utils';

export const ConditionNode = memo(({ data, selected }: NodeProps) => {
    // Mirror Logic: Resolve source node if this is a mirror
    const nodes = useNodes();
    const sourceNode = data.mirrorOf ? nodes.find(n => n.id === data.mirrorOf) : null;
    const displayData = sourceNode ? sourceNode.data : data;

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div className={cn(
                    "px-4 py-2 shadow-md rounded-md bg-card border-2 min-w-[150px]",
                    selected ? "border-primary" : "border-border",
                    !!data.hasError && "border-destructive bg-destructive/5",
                    !!data.mirrorOf && "border-blue-400 border-dashed bg-blue-50/10"
                )}>
                    <Handle type="target" position={Position.Top} className="w-3 h-3 bg-muted-foreground" />

                    <div className="flex items-center gap-2">
                        <div className="p-1 rounded bg-muted">
                            {data.mirrorOf ? <Link className="h-4 w-4 text-blue-500" /> : <GitBranch className="h-4 w-4" />}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold">{data.label as string || 'Condition'}</span>
                            <span className="text-[10px] text-muted-foreground">IF / ELSE</span>

                            {/* Dynamic Content Display */}
                            {!!displayData.variable && (
                                <div className="flex flex-col mt-1 text-[10px] font-mono">
                                    <span className="text-orange-600">{String(displayData.variable)}</span>
                                    <div className="flex gap-1 items-center">
                                        <span className="text-muted-foreground font-bold">{String(displayData.operator || '==')}</span>
                                        {String(displayData.value || '').startsWith('{{') ? (
                                            <span className="text-orange-600">{String(displayData.value)}</span>
                                        ) : (
                                            <span className="text-blue-600">{String(displayData.value)}</span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* True Path */}
                    <div className="absolute -bottom-3 left-1/3 text-[9px] font-bold text-green-600">TRUE</div>
                    <Handle
                        type="source"
                        position={Position.Bottom}
                        id="true"
                        style={{ left: '30%' }}
                        className="w-3 h-3 bg-green-500"
                    />

                    {/* False Path */}
                    <div className="absolute -bottom-3 right-1/3 text-[9px] font-bold text-red-600">FALSE</div>
                    <Handle
                        type="source"
                        position={Position.Bottom}
                        id="false"
                        style={{ left: '70%' }}
                        className="w-3 h-3 bg-red-500"
                    />
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
