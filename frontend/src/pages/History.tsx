import { useState, useEffect, useMemo } from 'react';
import { useStore } from '../core/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subHours, subDays } from 'date-fns';
import { Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { hardwareService } from '../services/hardwareService';
import { Input } from '@/components/ui/input';
import { getMetricConfig } from '../config/MetricConfig';

// Helper to fetch history
const fetchDeviceHistory = async (deviceId: string, startDate?: Date, endDate?: Date, limit: number = 1000) => {
    let url = `/api/hardware/devices/${deviceId}/history?limit=${limit}`;
    if (startDate) url += `&startDate=${startDate.toISOString()}`;
    if (endDate) url += `&endDate=${endDate.toISOString()}`;

    const response = await fetch(url);
    const data = await response.json();
    return data.success ? data.data : [];
};

type TimeRange = '1h' | '6h' | '24h' | '7d' | 'custom';

export function History() {
    const { devices, setDevices } = useStore();

    // Selection State
    const [selectedMetric, setSelectedMetric] = useState<string>('temp');
    const [selectedDevices, setSelectedDevices] = useState<string[]>([]);

    // Time Range State
    const [timeRange, setTimeRange] = useState<TimeRange>('24h');
    const [customStart, setCustomStart] = useState<string>('');
    const [customEnd, setCustomEnd] = useState<string>('');

    // Data State
    const [historyData, setHistoryData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Initial Load
    useEffect(() => {
        if (devices.size === 0) {
            hardwareService.getDevices().then(data => {
                setDevices(data);
            });
        }
    }, [devices, setDevices]);

    // 1. Extract Available Metrics from Sensors
    const availableMetrics = useMemo(() => {
        const metrics = new Set<string>();
        devices.forEach(d => {
            if (d.type === 'SENSOR') {
                const outputs = d.config?.driverId?.commands?.READ?.outputs;
                if (outputs && Array.isArray(outputs)) {
                    outputs.forEach((output: any) => metrics.add(output.key));
                } else {
                    // Fallback for single-value sensors
                    metrics.add('value');
                }
            }
        });
        return Array.from(metrics).sort();
    }, [devices]);

    // 2. Filter Devices by Selected Metric
    const filteredDevices = useMemo(() => {
        return Array.from(devices.values()).filter(d => {
            if (d.type !== 'SENSOR') return false;

            const outputs = d.config?.driverId?.commands?.READ?.outputs;
            if (outputs && Array.isArray(outputs)) {
                return outputs.some((o: any) => o.key === selectedMetric);
            }

            // Fallback: if selected metric is 'value', include devices without explicit outputs
            return selectedMetric === 'value';
        });
    }, [devices, selectedMetric]);

    // Reset selected devices when metric changes
    useEffect(() => {
        setSelectedDevices([]);
    }, [selectedMetric]);

    const handleDeviceToggle = (deviceId: string) => {
        setSelectedDevices(prev =>
            prev.includes(deviceId)
                ? prev.filter(id => id !== deviceId)
                : [...prev, deviceId]
        );
    };

    // Calculate Date Range
    const getDateRange = () => {
        const now = new Date();
        let start: Date;
        let end: Date = now;

        switch (timeRange) {
            case '1h': start = subHours(now, 1); break;
            case '6h': start = subHours(now, 6); break;
            case '24h': start = subHours(now, 24); break;
            case '7d': start = subDays(now, 7); break;
            case 'custom':
                start = customStart ? new Date(customStart) : subHours(now, 24);
                end = customEnd ? new Date(customEnd) : now;
                break;
            default: start = subHours(now, 24);
        }
        return { start, end };
    };

    // Fetch Data
    useEffect(() => {
        const loadData = async () => {
            if (selectedDevices.length === 0) {
                setHistoryData([]);
                return;
            }

            setLoading(true);
            try {
                const { start, end } = getDateRange();

                // Fetch history for all selected devices
                const promises = selectedDevices.map(id => fetchDeviceHistory(id, start, end));
                const results = await Promise.all(promises);

                const mergedData: any[] = [];

                results.forEach((deviceReadings, index) => {
                    const deviceId = selectedDevices[index];
                    const device = devices.get(deviceId);
                    const deviceName = device?.name || deviceId;

                    deviceReadings.forEach((r: any) => {
                        // Extract the specific metric value
                        let val = r.readings?.value; // Default
                        if (r.readings && typeof r.readings === 'object') {
                            if (r.readings[selectedMetric] !== undefined) {
                                val = r.readings[selectedMetric];
                            } else if (selectedMetric === 'value' && r.readings.value !== undefined) {
                                val = r.readings.value;
                            }
                        }

                        if (val !== undefined) {
                            mergedData.push({
                                timestamp: new Date(r.timestamp).getTime(),
                                [deviceName]: val,
                                deviceName: deviceName
                            });
                        }
                    });
                });

                mergedData.sort((a, b) => a.timestamp - b.timestamp);
                setHistoryData(mergedData);

            } catch (error) {
                console.error("Failed to load history", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [selectedDevices, timeRange, customStart, customEnd, selectedMetric, devices]);

    const metricConfig = getMetricConfig(selectedMetric);

    return (
        <div className="flex h-full">
            {/* Sidebar for Filters */}
            <div className="w-80 border-r bg-card p-4 space-y-6 overflow-y-auto flex flex-col">

                {/* 1. Metric Selection */}
                <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                        1. Select Metric
                    </h3>
                    <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select metric" />
                        </SelectTrigger>
                        <SelectContent>
                            {availableMetrics.map(m => {
                                const config = getMetricConfig(m);
                                return (
                                    <SelectItem key={m} value={m}>
                                        <span className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }}></span>
                                            {config.label}
                                        </span>
                                    </SelectItem>
                                );
                            })}
                            {availableMetrics.length === 0 && <SelectItem value="none" disabled>No metrics found</SelectItem>}
                        </SelectContent>
                    </Select>
                </div>

                {/* 2. Device Selection */}
                <div className="flex-1 min-h-0 flex flex-col">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                        2. Select Devices
                    </h3>
                    <ScrollArea className="flex-1 border rounded-md p-2 min-h-[200px]">
                        <div className="space-y-2">
                            {filteredDevices.map(device => (
                                <div key={device.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={device.id}
                                        checked={selectedDevices.includes(device.id)}
                                        onCheckedChange={() => handleDeviceToggle(device.id)}
                                    />
                                    <Label htmlFor={device.id} className="text-sm cursor-pointer w-full">
                                        {device.name}
                                    </Label>
                                </div>
                            ))}
                            {filteredDevices.length === 0 && (
                                <div className="text-sm text-muted-foreground p-2">
                                    No devices found for {metricConfig.label}
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>

                {/* 3. Time Range */}
                <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                        3. Time Range
                    </h3>
                    <Select value={timeRange} onValueChange={(v: TimeRange) => setTimeRange(v)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select range" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1h">Last Hour</SelectItem>
                            <SelectItem value="6h">Last 6 Hours</SelectItem>
                            <SelectItem value="24h">Last 24 Hours</SelectItem>
                            <SelectItem value="7d">Last 7 Days</SelectItem>
                            <SelectItem value="custom">Custom Range</SelectItem>
                        </SelectContent>
                    </Select>

                    {timeRange === 'custom' && (
                        <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2">
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">From</Label>
                                <Input
                                    type="datetime-local"
                                    value={customStart}
                                    onChange={(e) => setCustomStart(e.target.value)}
                                    className="text-sm"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-muted-foreground">To</Label>
                                <Input
                                    type="datetime-local"
                                    value={customEnd}
                                    onChange={(e) => setCustomEnd(e.target.value)}
                                    className="text-sm"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6 flex flex-col overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarIcon className="h-4 w-4" />
                        {timeRange === 'custom' && customStart && customEnd ? (
                            <span>{format(new Date(customStart), 'PP p')} - {format(new Date(customEnd), 'PP p')}</span>
                        ) : (
                            <span>Last {timeRange}</span>
                        )}
                    </div>
                </div>

                <div className="flex-1 min-h-0">
                    <Card className="h-full flex flex-col">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex justify-between items-center">
                                <span className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: metricConfig.color }}></span>
                                    {metricConfig.label} History
                                </span>
                                {loading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 min-h-0 pt-4">
                            {selectedDevices.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                                    <LineChart className="h-12 w-12 opacity-20" />
                                    <p>Select devices from the sidebar to view data</p>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={historyData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                        <XAxis
                                            dataKey="timestamp"
                                            tickFormatter={(tick) => format(new Date(tick), 'HH:mm')}
                                            stroke="#888"
                                            type="number"
                                            domain={['dataMin', 'dataMax']}
                                            scale="time"
                                        />
                                        <YAxis
                                            stroke="#888"
                                            label={{
                                                value: `${metricConfig.label} (${metricConfig.unit})`,
                                                angle: -90,
                                                position: 'insideLeft',
                                                style: { fill: '#888' }
                                            }}
                                        />
                                        <Tooltip
                                            labelFormatter={(label) => format(new Date(label), 'PP pp')}
                                            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                                            formatter={(value: number) => [`${value} ${metricConfig.unit}`, '']}
                                        />
                                        <Legend />
                                        {selectedDevices.map((id, index) => {
                                            const device = devices.get(id);
                                            const name = device?.name || id;
                                            const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'];
                                            const color = colors[index % colors.length];

                                            return (
                                                <Line
                                                    key={id}
                                                    type="monotone"
                                                    dataKey={name}
                                                    stroke={color}
                                                    dot={false}
                                                    strokeWidth={2}
                                                    connectNulls
                                                    activeDot={{ r: 6 }}
                                                />
                                            );
                                        })}
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
