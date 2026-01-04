import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Calendar } from '../ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Badge } from '../ui/badge';
import {
    CalendarIcon, RefreshCw, Loader2, ArrowUpDown,
    Activity, Zap, TrendingUp
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { analyticsService, type AnalyticsResponse, type AnalyticsFilters, type ExecutedProgram } from '../../services/analyticsService';
import { toast } from 'sonner';

export function ProgramAnalytics() {
    // State
    const [programs, setPrograms] = useState<ExecutedProgram[]>([]);
    const [selectedProgram, setSelectedProgram] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [loadingPrograms, setLoadingPrograms] = useState(true);
    const [data, setData] = useState<AnalyticsResponse | null>(null);

    // Filters
    const [dateRange, setDateRange] = useState<{ from: Date; to: Date | undefined }>({
        from: new Date(),
        to: new Date()
    });
    const [selectedWindow, setSelectedWindow] = useState<string>('all');
    const [selectedFlow, setSelectedFlow] = useState<string>('all');
    const [selectedDevice, setSelectedDevice] = useState<string>('all');
    const [selectedAction, setSelectedAction] = useState<string>('all');

    // Sorting
    const [sortColumn, setSortColumn] = useState<string>('timestamp');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    // Load programs on mount
    useEffect(() => {
        loadPrograms();
    }, []);

    // Load data when program or date changes
    useEffect(() => {
        if (selectedProgram) {
            loadData();
        }
    }, [selectedProgram, dateRange, selectedWindow, selectedFlow, selectedDevice, selectedAction]);

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

    const loadData = async () => {
        if (!selectedProgram) return;
        if (!dateRange.from || !dateRange.to) return; // Wait for full range

        setLoading(true);
        try {
            const filters: AnalyticsFilters = {
                from: format(dateRange.from, 'yyyy-MM-dd'),
                to: format(dateRange.to, 'yyyy-MM-dd'),
                limit: 500
            };

            if (selectedWindow !== 'all') filters.windowId = selectedWindow;
            if (selectedFlow !== 'all') filters.flowId = selectedFlow;
            if (selectedDevice !== 'all') filters.device = selectedDevice;
            if (selectedAction !== 'all') filters.action = selectedAction;

            const result = await analyticsService.getAnalytics(selectedProgram, filters);
            setData(result);
        } catch (error: any) {
            toast.error('Failed to load analytics: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Sorted data
    const sortedData = useMemo(() => {
        if (!data?.data) return [];

        return [...data.data].sort((a, b) => {
            let aVal = (a as any)[sortColumn];
            let bVal = (b as any)[sortColumn];

            if (sortColumn === 'timestamp') {
                aVal = new Date(aVal).getTime();
                bVal = new Date(bVal).getTime();
            }

            if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }, [data?.data, sortColumn, sortDirection]);

    const handleSort = (column: string) => {
        if (sortColumn === column) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('desc');
        }
    };

    const formatDuration = (ms: number | null) => {
        if (ms === null || ms === undefined) return '-';
        if (ms < 1000) return `${ms.toFixed(0)}ms`;
        return `${(ms / 1000).toFixed(1)}s`;
    };

    const formatValue = (val: number | null, unit: string) => {
        if (val === null || val === undefined) return '-';
        return `${val.toFixed(2)} ${unit}`;
    };

    return (
        <div className="space-y-6">
            {/* Filters Row */}
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
                                    {programs.length === 0 && !loadingPrograms && (
                                        <SelectItem value="none" disabled>Няма изпълнени програми</SelectItem>
                                    )}
                                    {programs.map(p => (
                                        <SelectItem key={p.programId} value={p.programId}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>



                        {/* Date Range */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Период</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {format(dateRange.from, 'dd.MM.yyyy')} - {dateRange.to ? format(dateRange.to, 'dd.MM.yyyy') : '...'}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <div className="p-2 border-b grid grid-cols-2 gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => setDateRange({ from: new Date(), to: new Date() })}>
                                            Днес
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => setDateRange({ from: subDays(new Date(), 1), to: subDays(new Date(), 1) })}>
                                            Вчера
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => setDateRange({ from: subDays(new Date(), 6), to: new Date() })}>
                                            7 Дни
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => setDateRange({ from: subDays(new Date(), 30), to: new Date() })}>
                                            30 Дни
                                        </Button>
                                    </div>
                                    <Calendar
                                        mode="range"
                                        selected={dateRange}
                                        onSelect={(range) => {
                                            if (range?.from) {
                                                setDateRange({ from: range.from, to: range.to });
                                            }
                                        }}
                                        numberOfMonths={2}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Window Filter */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Прозорец</label>
                            <Select value={selectedWindow} onValueChange={(val) => {
                                setSelectedWindow(val);
                                setSelectedFlow('all'); // Reset child filters
                                setSelectedDevice('all');
                                setSelectedAction('all');
                            }}>
                                <SelectTrigger className="w-[160px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Всички</SelectItem>
                                    {data?.filters.windows.map(w => (
                                        <SelectItem key={w.id} value={w.id}>{w.name || w.id}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Flow Filter */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Flow (Сценарий)</label>
                            <Select value={selectedFlow} onValueChange={(val) => {
                                setSelectedFlow(val);
                                setSelectedDevice('all'); // Reset child filters
                                setSelectedAction('all');
                            }}>
                                <SelectTrigger className="w-[160px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Всички</SelectItem>
                                    {data?.filters.flows.map(f => (
                                        <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Device Filter */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Устройство</label>
                            <Select value={selectedDevice} onValueChange={setSelectedDevice}>
                                <SelectTrigger className="w-[160px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Всички</SelectItem>
                                    {data?.filters.devices.map(d => (
                                        <SelectItem key={d} value={d}>{d}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Action Filter */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Действие</label>
                            <Select value={selectedAction} onValueChange={setSelectedAction}>
                                <SelectTrigger className="w-[120px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Всички</SelectItem>
                                    {data?.filters.actions.map(a => (
                                        <SelectItem key={a} value={a}>{a}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Refresh Button */}
                        <Button variant="outline" onClick={loadData} disabled={loading}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Cards */}
            {data && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Sensors Summary */}
                    {data.summary.sensors.map(sensor => (
                        <Card key={sensor.device}>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <Activity className="h-4 w-4 text-blue-500" />
                                    {sensor.device}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{sensor.avg.toFixed(2)} {sensor.unit}</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    Min: {sensor.min.toFixed(2)} | Max: {sensor.max.toFixed(2)} | Count: {sensor.count}
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {/* Actuators Summary */}
                    {data.summary.actuators.map(actuator => (
                        <Card key={actuator.device}>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <Zap className="h-4 w-4 text-yellow-500" />
                                    {actuator.device}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {actuator.totalVolume > 0
                                        ? `${actuator.totalVolume.toFixed(0)} ml`
                                        : formatDuration(actuator.totalDuration)
                                    }
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                    {actuator.count} действия | Време: {formatDuration(actuator.totalDuration)}
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {/* Triggers Summary */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-green-500" />
                                Тригери
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{data.summary.triggers.matched}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                                Matched: {data.summary.triggers.matched} | Skipped: {data.summary.triggers.skipped}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Data Table */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>Детайли ({data?.pagination.total || 0} записа)</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : sortedData.length === 0 ? (
                        <div className="text-center text-muted-foreground py-12">
                            Няма данни за избрания период
                        </div>
                    ) : (
                        <div className="rounded-md border max-h-[500px] overflow-auto">
                            <Table>
                                <TableHeader className="sticky top-0 bg-card">
                                    <TableRow>
                                        <TableHead
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => handleSort('timestamp')}
                                        >
                                            <div className="flex items-center gap-1">
                                                Дата/Час
                                                <ArrowUpDown className="h-3 w-3" />
                                            </div>
                                        </TableHead>
                                        <TableHead
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => handleSort('device')}
                                        >
                                            <div className="flex items-center gap-1">
                                                Устройство
                                                <ArrowUpDown className="h-3 w-3" />
                                            </div>
                                        </TableHead>
                                        <TableHead>Действие</TableHead>
                                        <TableHead className="text-right">Стойност</TableHead>
                                        <TableHead className="text-right">Време</TableHead>
                                        <TableHead>Прозорец</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sortedData.map((row, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell className="font-mono text-xs">
                                                {format(new Date(row.timestamp), 'dd.MM HH:mm:ss')}
                                            </TableCell>
                                            <TableCell>{row.device || '-'}</TableCell>
                                            <TableCell>
                                                <Badge variant={
                                                    row.action === 'READ' ? 'secondary' :
                                                        row.action === 'DOSE' ? 'default' :
                                                            row.action === 'PULSE_ON' ? 'outline' :
                                                                'secondary'
                                                }>
                                                    {row.action}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {['IF', 'LOOP'].includes(row.blockType) ? (
                                                    <div className="flex flex-col items-end gap-1">
                                                        <Badge variant={row.value === 1 ? 'default' : 'destructive'}
                                                            className={row.value === 1 ? 'bg-green-600 hover:bg-green-700' : ''}>
                                                            {row.value === 1 ? 'TRUE' : 'FALSE'}
                                                        </Badge>
                                                        {row.metadata?.logData?.leftValue !== undefined ? (
                                                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                                {row.metadata.logData.leftValue} {row.metadata.logData.operator} {row.metadata.logData.rightValue}
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                                {row.message?.split('=>')[0] || row.message}
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    row.volume
                                                        ? `${row.volume.toFixed(1)} ml`
                                                        : formatValue(row.value, row.unit)
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right font-mono">
                                                {formatDuration(row.duration)}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-xs">
                                                {row.window || '-'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
