import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { Handle, Position } from '@xyflow/react';
import { Repeat, Hourglass, Timer, AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/tooltip';
import { cn } from '../../../lib/utils';

import { useFlowContext } from '../../../context/FlowContext';

export const LoopNode = memo((props: NodeProps) => {
    const { data, selected } = props as any;
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

    // Helper to get variable unit from variables array
    const getVarUnit = (val: any): string | undefined => {
        const s = String(val || '');
        if (s.startsWith('{{') && s.endsWith('}}')) {
            const varId = s.slice(2, -2);
            const found = variables?.find((v: any) => v.id === varId);
            return found?.unit;
        }
        return undefined;
    };

    const isTimeMode = data.limitMode === 'TIME';
    const countVar = fmtVar(data.count);
    const isCountVar = String(data.count).startsWith('{{');
    const countVarUnit = getVarUnit(data.count);

    const timeout = String(data.timeout || 0);
    const timeoutUnit = String(data.timeoutUnit || 'sec');
    const isTimeoutVar = String(data.timeout).startsWith('{{');
    const timeoutVar = fmtVar(data.timeout);
    const timeoutVarUnit = getVarUnit(data.timeout);

    const interval = String(data.interval || 0);
    const intervalUnit = String(data.intervalUnit || 'sec');
    const isIntervalVar = String(data.interval).startsWith('{{');
    const intervalVar = fmtVar(data.interval);
    const intervalVarUnit = getVarUnit(data.interval);

    // Condition Data - Show section if any field has value or if there is an error
    const hasCondition = !!data.variable || !!data.operator || (data.value !== undefined && data.value !== '') || (!!data.hasError && (data.error?.includes('Variable') || data.error?.includes('Operator') || data.error?.includes('value')));
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
                    "flex flex-col rounded-md bg-card border-2 min-w-[180px] transition-all duration-200",
                    "border-border shadow-md",
                    !!data.hasError && "border-destructive bg-destructive/5",
                    selected && "border-green-500 ring-[10px] ring-green-500/20 shadow-[0_0_25px_rgba(34,197,94,0.4)] z-50 scale-[1.03] outline outline-2 outline-green-500"
                )}>
                    {/* Input Handle */}
                    <Handle type="target" position={Position.Top} className="input-handle-triangle" />

                    {/* --- HEADER --- */}
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

                        <div className="flex flex-col leading-tight w-full">
                            {data.label ? (
                                <>
                                    <span className="font-bold text-xs uppercase text-foreground truncate max-w-[150px]" title={String(data.label)}>
                                        {String(data.label)}
                                    </span>
                                    <div className="flex items-center gap-1 mt-0.5">
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground opacity-70">
                                            {isTimeMode ? 'Timer:' : 'Count:'}
                                        </span>
                                        {isTimeMode ? (
                                            <span className="font-mono text-xs text-foreground">
                                                {isTimeoutVar ? timeoutVar : timeout}
                                                {isTimeoutVar ? (timeoutVarUnit || '') : timeoutUnit}
                                            </span>
                                        ) : (
                                            <div className="font-mono text-xs text-foreground flex items-center gap-1">
                                                {isCountVar ? (
                                                    <span className="px-1 py-0.5 rounded bg-primary/10 text-primary text-[10px] border border-primary/20">
                                                        {countVar}
                                                    </span>
                                                ) : (
                                                    <span>{data.count as string}</span>
                                                )}
                                                <span className="opacity-80">{isCountVar && countVarUnit ? countVarUnit : 'x'}</span>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                isTimeMode ? (
                                    <>
                                        <span className="text-[10px] uppercase font-bold text-muted-foreground opacity-70">Running For</span>
                                        <span className="font-bold text-sm text-foreground">
                                            {isTimeoutVar ? timeoutVar : timeout}
                                            {isTimeoutVar ? (timeoutVarUnit || '') : timeoutUnit}
                                        </span>
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
                                            <span className="font-normal opacity-80 text-xs">{isCountVar && countVarUnit ? countVarUnit : 'Times'}</span>
                                        </div>
                                    </>
                                )
                            )}
                        </div>
                    </div>

                    {/* --- BODY --- */}
                    <div className="p-3 bg-card space-y-2">
                        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                            <Timer className="h-3.5 w-3.5 opacity-70" />
                            <span>Every</span>
                            <span className="font-mono font-bold text-foreground bg-muted px-1.5 rounded">
                                {isIntervalVar ? intervalVar : interval}{isIntervalVar ? (intervalVarUnit || '') : intervalUnit}
                            </span>
                        </div>
                    </div>

                    {/* --- CONDITION FOOTER (IF LOOP CONDITION EXISTS) --- */}
                    {hasCondition && (
                        <div className="px-3 py-2 bg-purple-50/50 dark:bg-purple-900/10 border-t border-purple-100 dark:border-purple-900/30">
                            <div className="flex items-center justify-center gap-2 mb-1">
                                <Repeat className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                                <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase flex items-baseline">
                                    <span className="text-[8px] opacity-70 mr-1">Keep</span>
                                    Looping If
                                </span>
                            </div>
                            <div className="text-xs font-mono flex flex-wrap gap-1 items-center justify-center">
                                <span className={cn(
                                    "px-1 py-0.5 rounded bg-background border shadow-sm text-foreground max-w-[80px] truncate",
                                    !data.variable && "text-orange-500 italic font-bold"
                                )} title={condVarDisplay}>
                                    {condVarDisplay || 'Var?'}
                                </span>
                                <span className="font-bold text-muted-foreground">{condOp}</span>
                                {isCondValVar ? (
                                    <span className={cn(
                                        "px-1 py-0.5 rounded bg-background border shadow-sm text-foreground max-w-[60px] truncate",
                                        !condVal && "text-blue-500 italic font-bold"
                                    )} title={condVal}>
                                        {condVal || 'Val?'}
                                    </span>
                                ) : (
                                    <span className={cn(
                                        "text-purple-600 dark:text-purple-400 font-bold",
                                        (data.value === undefined || data.value === '') && "text-blue-500 italic"
                                    )}>
                                        {(data.value === undefined || data.value === '') ? 'Val?' : condVal}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* --- EXIT PATHS FOOTER --- */}
                    <div className="flex text-[10px] font-bold h-7 border-t mt-auto">
                        {/* DONE Path (Left, Green) */}
                        <div className="flex-1 flex items-center justify-center gap-1 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-500 border-r relative rounded-bl-sm">
                            DONE
                            <Handle
                                type="source"
                                position={Position.Bottom}
                                id="exit"
                                className="w-3 h-3 bg-green-500 !bottom-[-6px]"
                            />
                        </div>

                        {/* LOOP Path (Right, Purple) */}
                        <div className="flex-1 flex items-center justify-center gap-1 bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-500 relative rounded-br-sm">
                            <Repeat className="h-3 w-3" />
                            LOOP
                            <Handle
                                type="source"
                                position={Position.Bottom}
                                id="body"
                                className="w-3 h-3 bg-purple-500 !bottom-[-6px]"
                            />
                        </div>
                    </div>

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
