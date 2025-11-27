import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface DeviceHistoryTabProps {
    deviceId: string;
    deviceType: string;
}

interface Reading {
    _id: string;
    timestamp: string;
    readings: any;
}

const METRIC_COLORS: Record<string, string> = {
    temp: '#ef4444', // Red
    humidity: '#3b82f6', // Blue
    ph: '#8b5cf6', // Purple
    ec: '#10b981', // Emerald
    par: '#f59e0b', // Amber
    default: '#64748b' // Slate
};

export function DeviceHistoryTab({ deviceId, deviceType }: DeviceHistoryTabProps) {
    const [readings, setReadings] = useState<Reading[]>([]);
    const [loading, setLoading] = useState(false);
    const [limit, setLimit] = useState('50');
    const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:3000/api/hardware/devices/${deviceId}/history?limit=${limit}`);
            const json = await res.json();
            if (json.success) {
                setReadings(json.data);
            } else {
                toast.error(json.error || 'Failed to fetch history');
            }
        } catch (err) {
            toast.error('Network error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [deviceId, limit]);

    // Prepare data for chart
    const chartData = readings.map(r => ({
        timestamp: format(new Date(r.timestamp), 'HH:mm:ss'),
        ...r.readings
    }));

    // Extract keys from the first reading to know what lines to draw
    const dataKeys = readings.length > 0 ? Object.keys(readings[0].readings).filter(k => k !== 'ok' && k !== 'raw') : [];

    return (
        <div className="space-y-4 h-full flex flex-col">
            <div className="flex justify-between items-center">
                <div className="flex gap-2">
                    <Select value={limit} onValueChange={setLimit}>
                        <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Limit" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="50">Last 50</SelectItem>
                            <SelectItem value="100">Last 100</SelectItem>
                            <SelectItem value="500">Last 500</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={fetchHistory} disabled={loading}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    </Button>
                </div>
                <div className="flex gap-2">
                    <Button variant={viewMode === 'chart' ? 'default' : 'outline'} onClick={() => setViewMode('chart')}>Chart</Button>
                    <Button variant={viewMode === 'table' ? 'default' : 'outline'} onClick={() => setViewMode('table')}>Table</Button>
                </div>
            </div>

            <Card className="flex-1 min-h-0 overflow-hidden flex flex-col">
                <CardContent className="p-4 h-full overflow-auto">
                    {readings.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                            No data available
                        </div>
                    ) : viewMode === 'chart' ? (
                        <div className="h-[400px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="timestamp" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    {dataKeys.map(key => (
                                        <Line
                                            key={key}
                                            type="monotone"
                                            dataKey={key}
                                            stroke={METRIC_COLORS[key] || METRIC_COLORS.default}
                                            dot={false}
                                        />
                                    ))}
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Time</TableHead>
                                    {dataKeys.map(key => <TableHead key={key}>{key.toUpperCase()}</TableHead>)}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {readings.slice().reverse().map((r) => (
                                    <TableRow key={r._id}>
                                        <TableCell>{format(new Date(r.timestamp), 'dd/MM HH:mm:ss')}</TableCell>
                                        {dataKeys.map(key => (
                                            <TableCell key={key}>{r.readings[key]}</TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
