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
    Clock, FlaskConical, Droplets, Activity, Timer
} from 'lucide-react';
import { format } from 'date-fns';
import { analyticsService, type SessionTimelineEntry, type ExecutedProgram } from '../../services/analyticsService';
import { toast } from 'sonner';

export function SessionTimeline() {
    const [programs, setPrograms] = useState<ExecutedProgram[]>([]);
    const [selectedProgram, setSelectedProgram] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [loadingPrograms, setLoadingPrograms] = useState(true);
    const [sessions, setSessions] = useState<SessionTimelineEntry[]>([]);
    const [date, setDate] = useState<Date>(new Date());
    const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());

    useEffect(() => {
        loadPrograms();
    }, []);

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
            setSessions(result.sessions);

            // Auto-expand all sessions
            setExpandedSessions(new Set(result.sessions.map(s => s.windowId)));
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

    const formatDuration = (start: string, end: string) => {
        const diffMs = new Date(end).getTime() - new Date(start).getTime();
        const secs = Math.round(diffMs / 1000);
        if (secs < 60) return `${secs}s`;
        const mins = Math.round(secs / 60);
        return `${mins}min`;
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
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                {session.totalDosedMl > 0 && (
                                                    <span className="flex items-center gap-1">
                                                        <Droplets className="h-4 w-4 text-blue-500" />
                                                        {session.totalDosedMl.toFixed(1)} ml
                                                    </span>
                                                )}
                                                {session.totalPulseSeconds > 0 && (
                                                    <span className="flex items-center gap-1">
                                                        <Timer className="h-4 w-4 text-yellow-500" />
                                                        {session.totalPulseSeconds.toFixed(0)}s
                                                    </span>
                                                )}
                                                <span>{session.flows.length} потоци</span>
                                            </div>
                                        </div>
                                    </CardHeader>
                                </CollapsibleTrigger>

                                <CollapsibleContent>
                                    <CardContent className="pt-0">
                                        {/* Context Summary */}
                                        <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-muted/30 rounded-lg">
                                            <div>
                                                <div className="text-xs font-medium text-muted-foreground mb-1">Начален Контекст</div>
                                                <div className="flex flex-wrap gap-2">
                                                    {Object.entries(session.contextStart).map(([device, data]) => (
                                                        <Badge key={device} variant="secondary" className="text-xs">
                                                            {device}: {data.value.toFixed(2)} {data.unit}
                                                        </Badge>
                                                    ))}
                                                    {Object.keys(session.contextStart).length === 0 && (
                                                        <span className="text-xs text-muted-foreground">Няма данни</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs font-medium text-muted-foreground mb-1">Краен Контекст</div>
                                                <div className="flex flex-wrap gap-2">
                                                    {Object.entries(session.contextEnd).map(([device, data]) => (
                                                        <Badge key={device} variant="secondary" className="text-xs">
                                                            {device}: {data.value.toFixed(2)} {data.unit}
                                                        </Badge>
                                                    ))}
                                                    {Object.keys(session.contextEnd).length === 0 && (
                                                        <span className="text-xs text-muted-foreground">Няма данни</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Flow Timeline */}
                                        <div className="relative">
                                            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

                                            {session.flows.map((flow) => (
                                                <div key={flow.sessionId} className="relative pl-10 pb-4">
                                                    {/* Timeline dot */}
                                                    <div className="absolute left-[11px] w-3 h-3 rounded-full bg-primary border-2 border-background" />

                                                    <div className="p-3 border rounded-lg bg-card hover:bg-muted/30 transition-colors">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="font-medium flex items-center gap-2">
                                                                <FlaskConical className="h-4 w-4 text-purple-500" />
                                                                {flow.flowName}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {formatTime(flow.startTime)} ({formatDuration(flow.startTime, flow.endTime)})
                                                            </span>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                                            {/* Sensor Readings */}
                                                            {flow.sensorReadings.length > 0 && (
                                                                <div>
                                                                    <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                                                                        <Activity className="h-3 w-3" /> Измервания
                                                                    </div>
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {flow.sensorReadings.map((r, i) => (
                                                                            <Badge key={i} variant="outline" className="text-xs">
                                                                                {r.device}: {r.value.toFixed(2)} {r.unit}
                                                                            </Badge>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Actuator Actions */}
                                                            {flow.actuatorActions.length > 0 && (
                                                                <div>
                                                                    <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                                                                        <Droplets className="h-3 w-3" /> Действия
                                                                    </div>
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {flow.actuatorActions.map((a, i) => (
                                                                            <Badge key={i} className="text-xs">
                                                                                {a.device}: {a.totalValue.toFixed(1)} {a.unit} ({a.count}x)
                                                                            </Badge>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
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
