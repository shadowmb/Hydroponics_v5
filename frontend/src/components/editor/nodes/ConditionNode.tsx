
import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { Handle, Position, useNodes } from '@xyflow/react';
import { GitBranch, AlertCircle, Link, CheckCircle2, XCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/tooltip';
import { cn } from '../../../lib/utils';
import { useFlowContext } from '../../../context/FlowContext';

export const ConditionNode = memo(({ data, selected }: NodeProps<any>) => {
    const { variables } = useFlowContext();
    const nodes = useNodes();

    // Mirror Logic: Resolve source node if this is a mirror
    const sourceNode = data.mirrorOf ? nodes.find(n => n.id === data.mirrorOf) : null;
    const displayData = sourceNode ? sourceNode.data : data;

    // Helper to format/resolve variable names
    const resolveName = (val: any) => {
        const s = String(val || '');
        if (s.startsWith('{{') && s.endsWith('}}')) {
            const varId = s.slice(2, -2);
            const found = variables?.find((v: any) => v.id === varId);
            return found ? found.name : varId;
        }
        // Also check if val itself is an ID (legacy or direct ref)
        const foundDirect = variables?.find((v: any) => v.id === s);
        return foundDirect ? foundDirect.name : s;
    };

    const leftOp = resolveName(displayData.variable);
    const rightOp = resolveName(displayData.value);
    const operator = String(displayData.operator || '==');

    // Visual Operator Map
    const getOpDisplay = (op: string) => {
        const map: Record<string, string> = {
            '==': '=',
            '!=': '≠',
            '>=': '≥',
            '<=': '≤',
            '>': '>',
            '<': '<'
        };
        return map[op] || op;
    };

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div className={cn(
                    "flex flex-col shadow-md rounded-md bg-card border-2 min-w-[200px] transition-all",
                    selected ? "border-primary ring-1 ring-primary" : "border-border",
                    !!data.hasError && "border-destructive ring-destructive ring-1",
                    !!data.mirrorOf && "border-blue-400 border-dashed bg-blue-50/10"
                )}>
                    <Handle type="target" position={Position.Top} className="w-3 h-3 bg-muted-foreground" />

                    {/* Header */}
                    <div className="flex items-center gap-2 px-3 py-1.5 border-b bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-t-sm">
                        {data.mirrorOf ? <Link className="h-4 w-4 text-blue-500" /> : <GitBranch className="h-4 w-4" />}
                        <span className="text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                            {displayData.label || 'Check Condition'}
                        </span>
                    </div>

                    {/* Logic Gate Body */}
                    <div className="p-3 flex flex-col items-center gap-2 bg-card">
                        {/* Equation Visualization */}
                        <div className="flex items-center w-full justify-between gap-1 text-sm">
                            {/* Left Operand (Variable) */}
                            <div className="flex-1 min-w-0 bg-orange-50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900 rounded px-2 py-1 text-center">
                                <span className={cn(
                                    "block truncate font-medium text-orange-700 dark:text-orange-400",
                                    !leftOp && "text-muted-foreground italic"
                                )} title={leftOp}>
                                    {leftOp || 'Var?'}
                                </span>
                            </div>

                            {/* Operator */}
                            <div className="flex-none w-6 h-6 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground shadow-inner">
                                {getOpDisplay(operator)}
                            </div>

                            {/* Right Operand (Value/Variable) */}
                            <div className="flex-1 min-w-0 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded px-2 py-1 text-center">
                                <span className={cn(
                                    "block truncate font-medium text-blue-700 dark:text-blue-400",
                                    !rightOp && "text-muted-foreground italic"
                                )} title={rightOp}>
                                    {rightOp || 'Val?'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Exit Paths Footer */}
                    <div className="flex text-[10px] font-bold h-7 border-t">
                        {/* TRUE Path */}
                        <div className="flex-1 flex items-center justify-center gap-1 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-500 border-r relative rounded-bl-sm">
                            <CheckCircle2 className="h-3 w-3" />
                            TRUE
                            <Handle
                                type="source"
                                position={Position.Bottom}
                                id="true"
                                className="w-3 h-3 bg-green-500 !bottom-[-6px]"
                            />
                        </div>

                        {/* FALSE Path */}
                        <div className="flex-1 flex items-center justify-center gap-1 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-500 relative rounded-br-sm">
                            <XCircle className="h-3 w-3" />
                            FALSE
                            <Handle
                                type="source"
                                position={Position.Bottom}
                                id="false"
                                className="w-3 h-3 bg-red-500 !bottom-[-6px]"
                            />
                        </div>
                    </div>

                    {!!data.hasError && (
                        <div className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 animate-pulse" title={String(data.error)}>
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
