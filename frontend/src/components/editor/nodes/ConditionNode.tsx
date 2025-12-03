import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { Handle, Position } from '@xyflow/react';
import { GitBranch } from 'lucide-react';
import { cn } from '../../../lib/utils';

export const ConditionNode = memo(({ data, selected }: NodeProps) => {
    return (
        <div className={cn(
            "px-4 py-2 shadow-md rounded-md bg-card border-2 min-w-[150px]",
            selected ? "border-primary" : "border-border"
        )}>
            <Handle type="target" position={Position.Top} className="w-3 h-3 bg-muted-foreground" />

            <div className="flex items-center gap-2">
                <div className="p-1 rounded bg-muted">
                    <GitBranch className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-bold">Condition</span>
                    <span className="text-[10px] text-muted-foreground">IF / ELSE</span>

                    {/* Dynamic Content Display */}
                    {data.variable && (
                        <div className="flex flex-col mt-1 text-[10px] font-mono">
                            <span className="text-orange-600">{data.variable as string}</span>
                            <div className="flex gap-1">
                                <span className="text-muted-foreground">{data.operator as string || '=='}</span>
                                <span className="text-blue-600">{data.value as string}</span>
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
        </div>
    );
});
