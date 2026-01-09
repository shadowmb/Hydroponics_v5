import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Badge } from '../ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import {
    CalendarIcon, RefreshCw, Loader2, ChevronDown, ChevronRight,
    Clock, Info
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { format } from 'date-fns';
import { analyticsService, type ExecutionTrace as ExecutionTraceType, type ExecutedProgram } from '../../services/analyticsService';
import { resourceRoleService } from '../../services/resourceRoleService';
import { ExecutionTrace } from './ExecutionTrace';
import { toast } from 'sonner';

export function SessionTimeline() {
    const [programs, setPrograms] = useState<ExecutedProgram[]>([]);
    const [selectedProgram, setSelectedProgram] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [loadingPrograms, setLoadingPrograms] = useState(true);
    const [sessions, setSessions] = useState<ExecutionTraceType[]>([]);
    const [date, setDate] = useState<Date>(new Date());
    const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());
    const [visibleRoles, setVisibleRoles] = useState<Set<string>>(new Set());
    const [roleLabels, setRoleLabels] = useState<Map<string, string>>(new Map());

    useEffect(() => {
        loadPrograms();
        loadVisibleRoles();
    }, []);

    const loadVisibleRoles = async () => {
        try {
            const roles = await resourceRoleService.getAll();
            const visible = roles.filter(r => r.showInSummary).map(r => r.key);
            setVisibleRoles(new Set(visible));
            // Build labels map
            const labels = new Map<string, string>();
            roles.forEach(r => labels.set(r.key, r.label));
            setRoleLabels(labels);
        } catch {
            // Fallback: show all
        }
    };

    useEffect(() => {
        if (selectedProgram) {
            loadSessions();
        }
    }, [selectedProgram, date]);

    const loadPrograms = async () => {
        setLoadingPrograms(true);
        try {
            const result = await analyticsService.getExecutedPrograms();
            setPrograms(result);
            if (result.length > 0) {
                setSelectedProgram(result[0].programId);
            }
        } catch (error: any) {
            toast.error('Грешка при зареждане на програми: ' + error.message);
        } finally {
            setLoadingPrograms(false);
        }
    };

    const loadSessions = async () => {
        if (!selectedProgram) return;

        setLoading(true);
        try {
            const dateStr = format(date, 'yyyy-MM-dd');
            const result = await analyticsService.getSessionTimeline(selectedProgram, dateStr);

            // Sort sessions chronologically (Start -> End)
            // Assuming backend returns them, but let's be safe and explicit
            const sortedSessions = result.sessions.sort((a, b) =>
                new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
            );

            setSessions(sortedSessions);

            // Auto-expand all sessions
            setExpandedSessions(new Set(sortedSessions.map(s => s.windowId)));
        } catch (error: any) {
            toast.error('Грешка: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const toggleSession = (windowId: string) => {
        setExpandedSessions(prev => {
            const next = new Set(prev);
            if (next.has(windowId)) {
                next.delete(windowId);
            } else {
                next.add(windowId);
            }
            return next;
        });
    };

    const formatTime = (isoString: string) => {
        return format(new Date(isoString), 'HH:mm:ss');
    };



    return (
        <div className="space-y-6">
            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-wrap gap-4 items-end">
                        {/* Program Selector */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Програма</label>
                            <Select value={selectedProgram || undefined} onValueChange={setSelectedProgram} disabled={loadingPrograms}>
                                <SelectTrigger className="w-[200px]">
                                    {loadingPrograms ? (
                                        <span className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Зареждане...</span>
                                    ) : (
                                        <SelectValue placeholder="Избери програма" />
                                    )}
                                </SelectTrigger>
                                <SelectContent>
                                    {programs.map(p => (
                                        <SelectItem key={p.programId} value={p.programId}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Date Picker */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Дата</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-[180px] justify-start text-left font-normal">
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {format(date, 'dd.MM.yyyy')}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={date}
                                        onSelect={(d) => d && setDate(d)}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Refresh Button */}
                        <Button variant="outline" onClick={loadSessions} disabled={loading}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Timeline */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : sessions.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        Няма сесии за избраната дата
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {sessions.map((session) => (
                        <Card key={session.windowId} className="overflow-hidden">
                            <Collapsible
                                open={expandedSessions.has(session.windowId)}
                                onOpenChange={() => toggleSession(session.windowId)}
                            >
                                <CollapsibleTrigger asChild>
                                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                {expandedSessions.has(session.windowId) ?
                                                    <ChevronDown className="h-5 w-5" /> :
                                                    <ChevronRight className="h-5 w-5" />
                                                }
                                                <CardTitle className="text-lg">
                                                    {session.windowName}
                                                </CardTitle>
                                                <Badge variant="outline" className="ml-2">
                                                    <Clock className="h-3 w-3 mr-1" />
                                                    {formatTime(session.startTime)} - {formatTime(session.endTime)}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                {session.totals.byRole && Object.entries(session.totals.byRole)
                                                    .filter(([role, stats]) => stats.value > 0 && visibleRoles.has(role))
                                                    .map(([role, stats]) => (
                                                        <TooltipProvider key={role}>
                                                            <Tooltip delayDuration={300}>
                                                                <TooltipTrigger asChild>
                                                                    <Badge variant="secondary" className="text-xs font-normal cursor-help">
                                                                        <span className="mr-1 text-muted-foreground">{roleLabels.get(role) || role}:</span>
                                                                        <span className="font-mono font-medium">{stats.value.toFixed(1)} {stats.unit}</span>
                                                                    </Badge>
                                                                </TooltipTrigger>
                                                                {stats.devices && stats.devices.length > 0 && (
                                                                    <TooltipContent>
                                                                        <div className="text-xs">
                                                                            <span className="font-semibold text-muted-foreground block mb-1">Devices:</span>
                                                                            {stats.devices.map(d => (
                                                                                <div key={d}>{d}</div>
                                                                            ))}
                                                                        </div>
                                                                    </TooltipContent>
                                                                )}
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    ))}
                                                <span className="text-muted-foreground ml-2">{session.sessions.length} sessions</span>
                                            </div>
                                        </div>
                                    </CardHeader>
                                </CollapsibleTrigger>

                                <CollapsibleContent>
                                    <CardContent className="pt-0">
                                        <ExecutionTrace trace={session} visibleRoles={visibleRoles} roleLabels={roleLabels} />
                                    </CardContent>
                                </CollapsibleContent>
                            </Collapsible>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
