import { memo, useMemo } from 'react';
import type { Node, Edge } from '@xyflow/react';
import { Card, CardContent } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { AlertCircle, AlertTriangle, Activity, Database } from 'lucide-react';
import { FlowValidator } from '../../lib/validation/FlowValidator';
import { useStore } from '../../core/useStore';
import { cn } from '../../lib/utils';

interface FlowHealthDashboardProps {
    nodes: Node[];
    edges: Edge[];
    variables: any[];
    onSelectBlock: (nodeId: string) => void;
}

export const FlowHealthDashboard = memo(({ nodes, edges, variables, onSelectBlock }: FlowHealthDashboardProps) => {
    const { devices, deviceTemplates } = useStore();

    // 1. Calculate Statistics & Validation
    const stats = useMemo(() => {
        const context = { devices, variables, deviceTemplates };
        const validation = FlowValidator.validate(nodes, edges, context);

        const blockCounts = {
            total: nodes.length,
            sensors: nodes.filter(n => n.type === 'generic' && n.data.type === 'SENSOR_READ').length,
            actuators: nodes.filter(n => n.type === 'generic' && n.data.type === 'ACTUATOR_SET').length,
            logic: nodes.filter(n => ['condition', 'loop', 'flowControl'].includes(n.type || '')).length
        };

        // Variable Usage Analysis
        const variableUsage = variables.map(v => {
            const readers: { id: string, label: string }[] = [];
            const writers: { id: string, label: string }[] = [];

            // Helper to clean variable references (e.g. "{{global_1}}" -> "global_1")
            const cleanRef = (val: any) => typeof val === 'string' ? val.replace(/{{|}}/g, '') : val;

            nodes.forEach(n => {
                const type = n.data.type;
                const label = (n.data.label as string) || n.data.type || 'Block';

                // Writers
                if (type === 'SENSOR_READ' && cleanRef(n.data.variable) === v.id) writers.push({ id: n.id, label });

                // Readers
                // IF comparand variable
                if ((type === 'IF' || type === 'LOOP') && cleanRef(n.data.variable) === v.id) readers.push({ id: n.id, label });
                // IF value (if it's a variable reference)
                if ((type === 'IF' || type === 'LOOP') && cleanRef(n.data.value) === v.id) readers.push({ id: n.id, label });

                // Actuator Set reference
                if (type === 'ACTUATOR_SET') {
                    // Check 'variableId' (used when useVariable is true OR sometimes directly depending on usage)
                    if (n.data.useVariable && cleanRef(n.data.variableId) === v.id) readers.push({ id: n.id, label });

                    // Also check standard fields that might use variables
                    if (cleanRef(n.data.duration) === v.id) readers.push({ id: n.id, label });
                    if (cleanRef(n.data.amount) === v.id) readers.push({ id: n.id, label });
                }
            });

            return {
                ...v,
                readers,
                writers,
                isOrphan: readers.length === 0 && writers.length === 0,
                isUnusedWriter: writers.length > 0 && readers.length === 0,
                isUnwrittenReader: writers.length === 0 && readers.length > 0 && !v.initialValue
            };
        });

        return {
            errors: validation.errors.filter(e => e.severity === 'error'),
            warnings: validation.errors.filter(e => e.severity === 'warning'),
            blockCounts,
            variableUsage
        };
    }, [nodes, edges, variables, devices, deviceTemplates]);

    return (
        <div className="h-full flex flex-col bg-slate-50/50 dark:bg-zinc-950/50">
            <div className="p-4 bg-background border-b">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-500" />
                    Flow Health
                </h3>
                <p className="text-xs text-muted-foreground mt-1">Real-time diagnostics and statistics.</p>
            </div>

            <ScrollArea className="flex-1 p-4 space-y-4">
                {/* 1. Diagnostics Section */}
                {(stats.errors.length > 0 || stats.warnings.length > 0) && (
                    <div className="space-y-2 mb-6">
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Diagnostics</h4>

                        {stats.errors.map((err, i) => {
                            const node = nodes.find(n => n.id === err.blockId);
                            const label = (node?.data?.label as string) || (node?.data?.type as string);
                            return (
                                <div
                                    key={`err-${i}`}
                                    onClick={() => onSelectBlock(err.blockId)}
                                    className="flex items-start gap-2 p-3 rounded-md border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-900 hover:bg-red-100 dark:hover:bg-red-900/30 cursor-pointer transition-colors"
                                >
                                    <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5" />
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="text-xs font-bold text-red-900 dark:text-red-300 uppercase tracking-wider">Error</p>
                                            {label && <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-red-300 text-red-800 dark:border-red-800 dark:text-red-300 bg-transparent">{label}</Badge>}
                                        </div>
                                        <p className="text-xs text-red-700 dark:text-red-400 leading-snug">{err.message}</p>
                                    </div>
                                </div>
                            );
                        })}

                        {stats.warnings.map((warn, i) => {
                            const node = nodes.find(n => n.id === warn.blockId);
                            const label = (node?.data?.label as string) || (node?.data?.type as string);
                            return (
                                <div
                                    key={`warn-${i}`}
                                    onClick={() => onSelectBlock(warn.blockId)}
                                    className="flex items-start gap-2 p-3 rounded-md border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-900 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 cursor-pointer transition-colors"
                                >
                                    <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="text-xs font-bold text-yellow-900 dark:text-yellow-300 uppercase tracking-wider">Warning</p>
                                            {label && <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-yellow-300 text-yellow-800 dark:border-yellow-800 dark:text-yellow-300 bg-transparent">{label}</Badge>}
                                        </div>
                                        <p className="text-xs text-yellow-700 dark:text-yellow-400 leading-snug">{warn.message}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* 2. Statistics Section */}
                <div className="space-y-2 mb-6">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Statistics</h4>
                    <div className="grid grid-cols-2 gap-2">
                        <Card className="shadow-none bg-card border-border">
                            <CardContent className="p-3 flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">Total Blocks</span>
                                <span className="text-lg font-bold">{stats.blockCounts.total}</span>
                            </CardContent>
                        </Card>
                        <Card className="shadow-none bg-card border-border">
                            <CardContent className="p-3 flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">Logic</span>
                                <span className="text-lg font-bold text-purple-600 dark:text-purple-400">{stats.blockCounts.logic}</span>
                            </CardContent>
                        </Card>
                        <Card className="shadow-none bg-card border-border">
                            <CardContent className="p-3 flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">Sensors</span>
                                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{stats.blockCounts.sensors}</span>
                            </CardContent>
                        </Card>
                        <Card className="shadow-none bg-card border-border">
                            <CardContent className="p-3 flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">Actuators</span>
                                <span className="text-lg font-bold text-green-600 dark:text-green-400">{stats.blockCounts.actuators}</span>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* 3. Variable Matrix Section */}
                <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                        Variables ({variables.length})
                    </h4>

                    <div className="space-y-2">
                        {stats.variableUsage.map(v => (
                            <div key={v.id} className="text-sm border rounded-md bg-card p-3 shadow-sm">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <Database className={cn("h-3 w-3", v.scope === 'local' ? "text-green-500" : "text-orange-500")} />
                                        <span className={cn("font-semibold", v.scope === 'local' ? "text-green-500 dark:text-green-400" : "text-orange-500 dark:text-orange-400")}>{v.name}</span>
                                        <Badge variant="outline" className="text-[10px] h-5 bg-muted/50">{v.unit || 'No Unit'}</Badge>
                                    </div>
                                    {v.isOrphan && <Badge variant="destructive" className="text-[10px] h-5">Unused</Badge>}
                                    {v.isUnusedWriter && <Badge variant="secondary" className="text-[10px] h-5 text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400">Write-Only</Badge>}
                                    {v.isUnwrittenReader && <Badge variant="secondary" className="text-[10px] h-5 text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400">Read-Only</Badge>}
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-xs">
                                    <div>
                                        <span className="text-muted-foreground block mb-1.5 uppercase tracking-wide text-[10px]">Written By</span>
                                        {v.writers.length > 0 ? (
                                            <div className="flex flex-wrap gap-1.5">
                                                {v.writers.map(ref => (
                                                    <Badge
                                                        key={ref.id}
                                                        variant="outline"
                                                        className="cursor-pointer hover:bg-accent transition-colors text-[10px] px-1.5 py-0.5 h-auto font-normal border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400"
                                                        onClick={() => onSelectBlock(ref.id)}
                                                    >
                                                        {ref.label}
                                                    </Badge>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground/50 italic">-</span>
                                        )}
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block mb-1.5 uppercase tracking-wide text-[10px]">Read By</span>
                                        {v.readers.length > 0 ? (
                                            <div className="flex flex-wrap gap-1.5">
                                                {v.readers.map(ref => (
                                                    <Badge
                                                        key={ref.id}
                                                        variant="outline"
                                                        className="cursor-pointer hover:bg-accent transition-colors text-[10px] px-1.5 py-0.5 h-auto font-normal border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-400"
                                                        onClick={() => onSelectBlock(ref.id)}
                                                    >
                                                        {ref.label}
                                                    </Badge>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground/50 italic">-</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {variables.length === 0 && (
                            <p className="text-xs text-muted-foreground italic text-center py-4">No variables defined.</p>
                        )}
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
});
