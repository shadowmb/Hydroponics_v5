import { memo } from 'react';
import type { NodeProps } from '@xyflow/react';
import { Handle, Position, useNodes } from '@xyflow/react';
import { Flag, DoorOpen, AlertCircle, RefreshCw, Anchor, FastForward } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../ui/tooltip';
import { cn } from '../../../lib/utils';

export const FlowControlNode = memo(({ data, selected }: NodeProps<any>) => {
    const nodes = useNodes();
    const controlType = data.controlType as string || 'LABEL';
    const labelName = data.labelName as string || 'Unknown';
    const targetLabelId = data.targetLabel as string || '';

    // Helper to resolve target name
    const getTargetName = (id: string) => {
        if (!id) return 'Unknown';
        const targetNode = nodes.find(n => n.id === id);
        // Priority: User Label > Node Type/ID
        return targetNode?.data?.label ? String(targetNode.data.label) : id;
    };

    const targetName = getTargetName(targetLabelId);

    // User Label Priority (for THIS block)
    const userLabel = data.label; // The "Name" given by user in properties
    const hasUserLabel = !!userLabel;

    // Visual configuration
    let Icon = Flag;
    let headerText = 'LABEL';
    let bodyText = labelName;
    let headerClass = 'bg-slate-100 text-slate-700 border-b-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    let cardBorderClass = 'border-slate-300 dark:border-slate-600';

    if (controlType === 'LABEL') {
        Icon = Anchor;
        headerText = 'ANCHOR';
        bodyText = labelName;
        headerClass = 'bg-indigo-100 text-indigo-700 border-b-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800';
        cardBorderClass = 'border-indigo-200 dark:border-indigo-800';
    } else if (controlType === 'GOTO') {
        Icon = FastForward;
        headerText = 'JUMP TO';
        bodyText = `➜ ${targetName}`;
        headerClass = 'bg-amber-100 text-amber-700 border-b-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800';
        cardBorderClass = 'border-amber-200 dark:border-amber-800 border-dashed';
    } else if (controlType === 'LOOP_BACK') {
        Icon = RefreshCw;
        headerText = 'LOOP BACK';
        bodyText = `↻ ${targetName}`;
        headerClass = 'bg-orange-100 text-orange-700 border-b-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800';
        cardBorderClass = 'border-orange-200 dark:border-orange-800 border-dashed';
    } else if (controlType === 'LOOP_BREAK') {
        Icon = DoorOpen;
        headerText = 'BREAK LOOP';
        bodyText = 'EXIT LOOP';
        headerClass = 'bg-red-100 text-red-700 border-b-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
        cardBorderClass = 'border-red-200 dark:border-red-800';
    }

    // If User Label is present, implementation:
    // Header -> User Label
    // Body -> Technical Type + Value
    const displayHeader = hasUserLabel ? userLabel : headerText;
    const displayBody = hasUserLabel ? (controlType === 'LABEL' ? `ID: ${labelName}` : `${headerText}: ${bodyText}`) : bodyText;

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div className={cn(
                    "flex flex-col shadow-sm rounded-md bg-card border-2 min-w-[140px] overflow-hidden transition-all",
                    cardBorderClass,
                    selected ? "border-primary ring-1 ring-primary" : "",
                    !!data.hasError && "border-destructive ring-destructive ring-1"
                )}>
                    {/* Input Handle - Always present */}
                    <Handle type="target" position={Position.Left} className="w-3 h-3 bg-muted-foreground" />

                    {/* Header */}
                    <div className={cn(
                        "flex items-center gap-2 px-3 py-1.5 border-b text-[10px] font-bold uppercase tracking-wide",
                        headerClass
                    )}>
                        <Icon className="h-3 w-3" />
                        <span className="truncate max-w-[120px]" title={String(displayHeader)}>{displayHeader}</span>
                    </div>

                    {/* Body */}
                    <div className="p-2 bg-card flex justify-center">
                        <span className={cn(
                            "text-xs font-mono font-semibold truncate max-w-[130px]",
                            hasUserLabel ? "text-muted-foreground" : "text-foreground"
                        )} title={String(displayBody)}>
                            {displayBody}
                        </span>
                    </div>

                    {/* Output Handle - ONLY for LABEL (Passthrough) */}
                    {controlType === 'LABEL' && (
                        <Handle type="source" position={Position.Right} className="w-3 h-3 bg-muted-foreground" />
                    )}

                    {!!data.hasError && (
                        <div className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5" title={String(data.error)}>
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
