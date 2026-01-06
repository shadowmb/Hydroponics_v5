import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { Settings2, ArrowRight, HelpCircle, Save } from 'lucide-react';
import { cn } from '../../lib/utils';

// Types (should ideally be shared, but defining here for now if not in global types)
import type { IVariable, IContext } from '../../types/ActiveProgram';

interface VariableConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    windowId: string | null;
    windowName: string;
    contexts: IContext[];
    initialOverrides: Record<string, Record<string, any>>; // ContextId -> { VarName: Value }
    onSave: (windowId: string, overrides: Record<string, Record<string, any>>) => void;
}

export const VariableConfigModal = ({
    isOpen,
    onClose,
    windowId,
    windowName,
    contexts,
    initialOverrides,
    onSave
}: VariableConfigModalProps) => {
    const [selectedContextId, setSelectedContextId] = useState<string | null>(null);
    const [overrides, setOverrides] = useState<Record<string, Record<string, any>>>({});

    // Reset state when opening
    useEffect(() => {
        if (isOpen && windowId) {
            setOverrides(initialOverrides || {});
            if (contexts.length > 0) {
                setSelectedContextId(contexts[0].contextId);
            } else {
                setSelectedContextId(null);
            }
        }
    }, [isOpen, windowId, contexts, initialOverrides]);

    if (!windowId) return null;

    const updateOverride = (contextId: string, varName: string, value: any) => {
        setOverrides(prev => ({
            ...prev,
            [contextId]: {
                ...(prev[contextId] || {}),
                [varName]: value
            }
        }));
    };

    const getContextMissingCount = (ctx: IContext) => {
        let missing = 0;
        const currentContextOverrides = overrides[ctx.contextId] || {};

        for (const v of ctx.variables) {
            const val = currentContextOverrides[v.name];
            // Check if missing (undefined or empty string)
            // boolean false is valid, 0 is valid
            if (val === undefined || val === '') {
                missing++;
            }
            if (v.hasTolerance) {
                const tol = currentContextOverrides[v.name + '_tolerance'];
                if (tol === undefined || tol === '') {
                    missing++;
                }
            }
        }
        return missing;
    };

    const handleSave = () => {
        onSave(windowId, overrides);
        onClose();
    };

    // Grouping Logic
    const groups: Record<string, IContext[]> = {};
    contexts.forEach(ctx => {
        const [prefix] = ctx.label.split(':');
        const groupName = prefix.trim();
        if (!groups[groupName]) groups[groupName] = [];
        groups[groupName].push(ctx);
    });

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-5xl h-[80vh] flex flex-col p-0 overflow-hidden gap-0">
                {/* Header */}
                <DialogHeader className="p-6 pb-2 shrink-0 border-b flex flex-row items-center justify-between">
                    <div>
                        <DialogTitle className="flex items-center gap-2">
                            <Settings2 className="h-5 w-5 text-primary" />
                            Configure: {windowName}
                        </DialogTitle>
                        <DialogDescription>
                            Set variables for all execution contexts in this time window.
                        </DialogDescription>
                    </div>
                    {/* Action Buttons in Header */}
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose}>Cancel</Button>
                        <Button onClick={handleSave} className="gap-2">
                            <Save className="h-4 w-4" />
                            Save Configuration
                        </Button>
                    </div>
                </DialogHeader>

                {/* Body - Master Detail Layout */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Left Sidebar - Context List */}
                    <div className="w-72 border-r bg-muted/10 overflow-y-auto p-2 shrink-0">
                        <div className="space-y-4 p-2">
                            {Object.entries(groups).map(([groupName, groupContexts]) => {
                                const groupMissing = groupContexts.reduce((sum, ctx) => sum + getContextMissingCount(ctx), 0);
                                const isGroupError = groupMissing > 0;

                                return (
                                    <div key={groupName} className="space-y-1">
                                        <div className="flex items-center justify-between px-2 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                            <span>{groupName}</span>
                                            {isGroupError && (
                                                <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                                            )}
                                        </div>

                                        <div className="space-y-1">
                                            {groupContexts.map(ctx => {
                                                const missingCount = getContextMissingCount(ctx);
                                                const isSelected = selectedContextId === ctx.contextId;
                                                const isError = missingCount > 0;
                                                const labelParts = ctx.label.split(':');
                                                const displayName = labelParts[1]?.trim() || labelParts[0];

                                                return (
                                                    <div
                                                        key={ctx.contextId}
                                                        onClick={() => setSelectedContextId(ctx.contextId)}
                                                        className={cn(
                                                            "relative flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-all text-sm border",
                                                            isSelected
                                                                ? "bg-background border-primary shadow-sm ring-1 ring-primary/20"
                                                                : "bg-transparent border-transparent hover:bg-muted/50 hover:text-foreground text-muted-foreground",
                                                            isError && !isSelected ? "text-red-600 hover:bg-red-50" : ""
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                            <Settings2 className={cn("h-4 w-4 shrink-0", isSelected ? "text-primary" : "opacity-50")} />
                                                            <span className="truncate font-medium">{displayName}</span>
                                                        </div>

                                                        {isError ? (
                                                            <div className="flex items-center gap-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                                                                {missingCount}
                                                            </div>
                                                        ) : (
                                                            isSelected && <ArrowRight className="h-3 w-3 text-primary opacity-50" />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right Content */}
                    <div className="flex-1 overflow-y-auto bg-background flex flex-col">
                        {selectedContextId ? (() => {
                            const ctx = contexts.find(c => c.contextId === selectedContextId);
                            if (!ctx) return <div className="p-10 text-center text-muted-foreground">Context not found</div>;

                            return (
                                <div className="animate-in fade-in duration-300">
                                    {/* Sticky Content Header */}
                                    <div className="sticky top-0 bg-background/95 backdrop-blur z-10 border-b px-8 py-5 flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                                <span>{ctx.label.split(':')[0]}</span>
                                                <ArrowRight className="h-3 w-3" />
                                            </div>
                                            <h3 className="text-xl font-bold tracking-tight text-foreground">{ctx.label.split(':')[1]?.trim() || ctx.label}</h3>
                                        </div>
                                        <div className="flex gap-4 text-xs text-muted-foreground">
                                            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary/20 border border-primary/50"></span> Configured</div>
                                            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500/20 border border-red-500/50"></span> Missing</div>
                                        </div>
                                    </div>

                                    <div className="p-8 max-w-4xl">
                                        <div className="grid grid-cols-[1.5fr_1fr_0.8fr] gap-4 mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                            <div>Variable Parameter</div>
                                            <div>Target Value</div>
                                            <div>Tolerance / Mode</div>
                                        </div>

                                        <div className="space-y-1">
                                            {ctx.variables.map((variable: IVariable, idx: number) => {
                                                const contextId = ctx.contextId;
                                                const currentContextOverrides = overrides[contextId] || {};
                                                const val = currentContextOverrides[variable.name];
                                                const isMissing = (val === undefined || val === '');

                                                return (
                                                    <div
                                                        key={`${windowId}-${contextId}-${variable.name}-${idx}`}
                                                        className={cn(
                                                            "grid grid-cols-[1.5fr_1fr_0.8fr] gap-4 items-center p-3 rounded-lg border transition-all text-sm group",
                                                            isMissing
                                                                ? "bg-red-50/30 border-red-200 dark:border-red-900/30 dark:bg-red-900/10"
                                                                : "bg-card border-transparent hover:border-border hover:bg-muted/20"
                                                        )}
                                                    >
                                                        {/* Col 1 */}
                                                        <div className="flex items-center gap-2 overflow-hidden">
                                                            <span className={cn("font-medium truncate", isMissing ? "text-red-700 dark:text-red-400" : "text-foreground")}>
                                                                {variable.name}
                                                            </span>
                                                            {variable.description && (
                                                                <TooltipProvider>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/50 hover:text-muted-foreground cursor-help" />
                                                                        </TooltipTrigger>
                                                                        <TooltipContent side="right" className="max-w-xs text-xs">
                                                                            {variable.description}
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            )}
                                                            {variable.unit && <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{variable.unit}</span>}
                                                        </div>

                                                        {/* Col 2 */}
                                                        <div>
                                                            {variable.type === 'boolean' ? (
                                                                <div className="flex items-center gap-2">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={!!val}
                                                                        onChange={(e) => updateOverride(contextId, variable.name, e.target.checked)}
                                                                        className="h-4 w-4 rounded border-primary accent-primary cursor-pointer"
                                                                    />
                                                                    <span className="text-xs text-muted-foreground">{val ? 'Active' : 'Disabled'}</span>
                                                                </div>
                                                            ) : (
                                                                <div className="relative">
                                                                    <Input
                                                                        type={variable.type === 'number' ? 'number' : 'text'}
                                                                        value={val ?? ''}
                                                                        onChange={(e) => updateOverride(contextId, variable.name, variable.type === 'number' ? Number(e.target.value) : e.target.value)}
                                                                        placeholder={variable.default !== undefined ? `${variable.default}` : 'Required'}
                                                                        className={cn(
                                                                            "h-8 text-sm transition-all",
                                                                            isMissing
                                                                                ? "border-red-300 focus-visible:ring-red-400 bg-red-50/50 pr-8"
                                                                                : "focus-visible:ring-primary/20",
                                                                            variable.unit ? "pr-8" : ""
                                                                        )}
                                                                    />
                                                                    {isMissing && (
                                                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                                                                            <div className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Col 3: Tolerance */}
                                                        <div>
                                                            {variable.hasTolerance ? (
                                                                <div className="flex items-center gap-2">
                                                                    <div className="relative flex-1">
                                                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-[10px]">±</span>
                                                                        <Input
                                                                            type="number"
                                                                            placeholder="0.0"
                                                                            className="h-8 pl-5 text-xs"
                                                                            value={currentContextOverrides[variable.name + '_tolerance'] ?? ''}
                                                                            onChange={(e) => updateOverride(contextId, variable.name + '_tolerance', Number(e.target.value))}
                                                                        />
                                                                    </div>
                                                                    <TooltipProvider>
                                                                        <Tooltip>
                                                                            <TooltipTrigger asChild>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="icon"
                                                                                    className="h-8 w-8 shrink-0"
                                                                                    onClick={() => {
                                                                                        const mode = currentContextOverrides[variable.name + '_tolerance_mode'] === 'relative' ? 'symmetric' : 'relative';
                                                                                        updateOverride(contextId, variable.name + '_tolerance_mode', mode);
                                                                                    }}
                                                                                >
                                                                                    <span className="text-[10px] font-bold text-muted-foreground">
                                                                                        {currentContextOverrides[variable.name + '_tolerance_mode'] === 'relative' ? '%' : 'ABS'}
                                                                                    </span>
                                                                                </Button>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent className="text-xs">
                                                                                <p>{currentContextOverrides[variable.name + '_tolerance_mode'] === 'relative' ? 'Relative (%)' : 'Absolute (Unit)'} Tolerance</p>
                                                                            </TooltipContent>
                                                                        </Tooltip>
                                                                    </TooltipProvider>
                                                                </div>
                                                            ) : (
                                                                <span className="text-xs text-muted-foreground opacity-30 italic">No tolerance</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })() : (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
                                <Settings2 className="h-12 w-12 mb-4 stroke-1" />
                                <p>Select a context to configure variables</p>
                            </div>
                        )}
                    </div>
                </div>
                {/* Footer removed: Actions are in Header now to save space/access */}
            </DialogContent>
        </Dialog>
    );
};
