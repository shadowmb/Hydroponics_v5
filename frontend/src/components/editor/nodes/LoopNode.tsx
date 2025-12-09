import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { Handle, Position } from '@xyflow/react';
import { Repeat, AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/tooltip';
import { cn } from '../../../lib/utils';

export const LoopNode = memo(({ data, selected }: NodeProps) => {
    const loopType = data.loopType as string || 'COUNT';

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div className={cn(
                    "px-4 py-2 shadow-md rounded-md bg-card border-2 min-w-[150px]",
                    selected ? "border-primary" : "border-border",
                    !!data.hasError && "border-destructive bg-destructive/5"
                )}>
                    {/* Input Handle */}
                    <Handle type="target" position={Position.Top} className="w-3 h-3 bg-muted-foreground" />

                    <div className="flex items-center gap-2">
                        <div className="p-1 rounded bg-yellow-100 text-yellow-700">
                            <Repeat className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold">{data.label as string || 'Loop'}</span>
                            <span className="text-[10px] text-muted-foreground">{loopType === 'COUNT' ? 'Repeat' : 'While'}</span>

                            {/* Dynamic Content Display */}
                            {loopType === 'COUNT' && (
                                <div className="flex flex-col gap-0.5 mt-1 font-mono text-[10px]">
                                    {data.limitMode === 'TIME' ? (
                                        <span className="text-purple-600">Max: {String(data.timeout)}s</span>
                                    ) : (
                                        <span className="text-blue-600">{String(data.count)} times</span>
                                    )}

                                    {/* Interval Badge */}
                                    {!!data.interval && Number(data.interval) > 0 && (
                                        <span className="text-gray-500 bg-gray-100 px-1 rounded w-fit">
                                            Every {String(data.interval)}s
                                        </span>
                                    )}
                                </div>
                            )}

                            {loopType === 'WHILE' && !!data.variable && (
                                <div className="flex flex-col mt-1 text-[10px] font-mono">
                                    <span className="text-orange-600">{String(data.variable)}</span>
                                    <div className="flex gap-1 items-center">
                                        <span className="text-muted-foreground font-bold">{String(data.operator || '==')}</span>
                                        {String(data.value || '').startsWith('{{') ? (
                                            <span className="text-orange-600">{String(data.value)}</span>
                                        ) : (
                                            <span className="text-blue-600">{String(data.value)}</span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>


                    {/* Body Path (Start Loop) */}
                    <div className="absolute -right-10 top-1/2 -translate-y-1/2 text-[9px] font-bold text-green-600">BODY</div>
                    <Handle
                        type="source"
                        position={Position.Right}
                        id="body"
                        className="w-3 h-3 bg-green-500"
                    />

                    {/* Exit Path (End Loop) */}
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[9px] font-bold text-red-600">EXIT</div>
                    <Handle
                        type="source"
                        position={Position.Bottom}
                        id="exit"
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
