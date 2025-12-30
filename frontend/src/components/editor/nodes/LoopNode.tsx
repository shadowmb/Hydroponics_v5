import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { Handle, Position } from '@xyflow/react';
import { Repeat, Hourglass, Timer, Ban, AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/tooltip';
import { cn } from '../../../lib/utils';

import { useFlowContext } from '../../../context/FlowContext';

export const LoopNode = memo(({ data, selected }: NodeProps) => {
    const { variables } = useFlowContext();

    // Helper to format variable names (strip {{ }}), resolving to readable name if possible
    const fmtVar = (val: any) => {
        const s = String(val || '');
        if (s.startsWith('{{') && s.endsWith('}}')) {
            const varId = s.slice(2, -2);
            // Try to find variable by ID to get readable name
            const found = variables?.find((v: any) => v.id === varId);
            return found ? found.name : varId;
        }
        return s;
    };

    const isTimeMode = data.limitMode === 'TIME';
    const countVar = fmtVar(data.count);
    const isCountVar = String(data.count).startsWith('{{');
    const timeout = String(data.timeout || 0);
    const interval = String(data.interval || 0);

    // Condition Data
    const hasCondition = !!data.variable;
    // Resolve condition variable name (stored as {{var_id}})
    const condVarRaw = String(data.variable || '');
    let condVarDisplay = condVarRaw;

    if (condVarRaw.startsWith('{{') && condVarRaw.endsWith('}}')) {
        const vid = condVarRaw.slice(2, -2);
        const found = variables?.find((v: any) => v.id === vid);
        condVarDisplay = found ? found.name : vid;
    } else {
        // Fallback if stored without braces or different format
        const found = variables?.find((v: any) => v.id === condVarRaw);
        condVarDisplay = found ? found.name : condVarRaw;
    }

    const condOp = String(data.operator || '==');
    const condVal = fmtVar(data.value);
    const isCondValVar = String(data.value).startsWith('{{');

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div className={cn(
                    "shadow-md rounded-md bg-card border-2 min-w-[180px] overflow-hidden transition-all",
                    selected ? "border-primary ring-1 ring-primary" : "border-border",
                    !!data.hasError && "border-destructive bg-destructive/5"
                )}>
                    {/* Input Handle */}
                    <Handle type="target" position={Position.Top} className="w-3 h-3 bg-muted-foreground" />

                    {/* --- HEADER: The "WHAT" --- */}
                    <div className={cn(
                        "px-3 py-2 flex items-center gap-2 border-b",
                        isTimeMode ? "bg-purple-50/50 dark:bg-purple-900/20" : "bg-blue-50/50 dark:bg-blue-900/20"
                    )}>
                        <div className={cn(
                            "p-1.5 rounded-md",
                            isTimeMode ? "bg-purple-100 text-purple-700 dark:bg-purple-800 dark:text-purple-300"
                                : "bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-300"
                        )}>
                            {isTimeMode ? <Hourglass className="h-4 w-4" /> : <Repeat className="h-4 w-4" />}
                        </div>

                        <div className="flex flex-col leading-tight">
                            {isTimeMode ? (
                                <>
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground opacity-70">Running For</span>
                                    <span className="font-bold text-sm text-foreground">{timeout}s</span>
                                </>
                            ) : (
                                <>
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground opacity-70">Repeat</span>
                                    <div className="font-bold text-sm text-foreground flex items-center gap-1">
                                        {isCountVar ? (
                                            <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-xs font-mono border border-primary/20">
                                                {countVar}
                                            </span>
                                        ) : (
                                            <span>{data.count as string}</span>
                                        )}
                                        <span className="font-normal opacity-80 text-xs">Times</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* --- BODY: The "HOW" --- */}
                    <div className="p-3 bg-card space-y-2">
                        {/* Interval Row */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Timer className="h-3.5 w-3.5 opacity-70" />
                            <span>Every</span>
                            <span className="font-mono font-bold text-foreground bg-muted px-1.5 rounded">
                                {interval}s
                            </span>
                        </div>
                    </div>

                    {/* --- FOOTER: The "STOP IF" (Condition) --- */}
                    {hasCondition && (
                        <div className="px-3 py-2 bg-orange-50/50 dark:bg-orange-900/10 border-t border-orange-100 dark:border-orange-900/30">
                            <div className="flex items-center gap-2 mb-1">
                                <Ban className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                                <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase">Stop If</span>
                            </div>
                            <div className="text-xs font-mono flex flex-wrap gap-1 items-center pl-5">
                                <span className="px-1 py-0.5 rounded bg-background border shadow-sm text-foreground max-w-[80px] truncate" title={condVarDisplay}>
                                    {condVarDisplay}
                                </span>
                                <span className="font-bold text-muted-foreground">{condOp}</span>
                                {isCondValVar ? (
                                    <span className="px-1 py-0.5 rounded bg-background border shadow-sm text-foreground max-w-[60px] truncate" title={condVal}>
                                        {condVal}
                                    </span>
                                ) : (
                                    <span className="text-blue-600 dark:text-blue-400 font-bold">{condVal}</span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Outputs */}

                    {/* Body Path */}
                    <div className="absolute -right-8 top-8 text-[9px] font-bold text-green-600 opacity-0 group-hover:opacity-100 transition-opacity">BODY</div>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Handle
                                type="source"
                                position={Position.Right}
                                id="body"
                                className="w-3 h-3 bg-green-500 hover:scale-125 transition-transform border-2 border-background"
                            />
                        </TooltipTrigger>
                        <TooltipContent side="right" className="text-xs">Loop Body</TooltipContent>
                    </Tooltip>

                    {/* Exit Path */}
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-[9px] font-bold text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">EXIT</div>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Handle
                                type="source"
                                position={Position.Bottom}
                                id="exit"
                                className="w-3 h-3 bg-red-500 hover:scale-125 transition-transform border-2 border-background"
                            />
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs">Exit Loop</TooltipContent>
                    </Tooltip>

                    {/* Error Indicator */}
                    {!!data.hasError && (
                        <div className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-sm animate-pulse" title={String(data.error)}>
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
