import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Settings, Thermometer, Droplet, Zap, Ruler, Wind } from 'lucide-react';
import { SensorCard, type SensorStatus, type TrendDirection } from './SensorCard';
import { useStore } from '../../core/useStore';
import { useDashboardConfig } from '../../hooks/useDashboardConfig';

interface PinnedDevice {
    _id: string;
    name: string;
    type: string;
    displayUnit?: string;
    lastReading?: {
        value: number;
        timestamp: Date;
        unit?: string;
    };
    config: {
        driverId: {
            uiConfig?: {
                unit?: string;
                icon?: string;
            };
        };
    };
}

interface LastKnownReading {
    value: number;
    timestamp: number;
}

interface PinnedSensorsGridProps {
    onSettingsClick: () => void;
}

export const PinnedSensorsGrid: React.FC<PinnedSensorsGridProps> = ({ onSettingsClick }) => {
    const [devices, setDevices] = useState<PinnedDevice[]>([]);
    const [loading, setLoading] = useState(true);
    // Separate state for trends so they persist across refreshes of the same data
    const [trends, setTrends] = useState<Record<string, TrendDirection>>({});

    const { systemStatus } = useStore();
    const { getSensorConfig } = useDashboardConfig();

    // Ref to store the LAST UNIQUE READING (Value + Timestamp) to detect REAL updates
    const lastReadingsRef = useRef<Record<string, LastKnownReading>>({});

    // 1. Fetching Logic (Unified for Poll & Socket)
    const updateDeviceList = (newDevices: PinnedDevice[]) => {
        setDevices(newDevices);
    };

    const fetchPinnedDevices = async () => {
        try {
            const res = await fetch('/api/hardware/devices/pinned');
            if (res.ok) {
                const data = await res.json();
                updateDeviceList(data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch pinned devices:', error);
        } finally {
            setLoading(false);
        }
    };

    // 2. Initial Load & Polling
    useEffect(() => {
        fetchPinnedDevices();
        const interval = setInterval(fetchPinnedDevices, 10000);
        return () => clearInterval(interval);
    }, []);

    // 3. Socket Listener
    useEffect(() => {
        const handleDeviceData = (event: CustomEvent) => {
            const { deviceId, value, timestamp, unit } = event.detail;

            setDevices(prev => prev.map(d =>
                d._id === deviceId
                    ? { ...d, lastReading: { value, timestamp: new Date(timestamp), unit } }
                    : d
            ));
        };

        window.addEventListener('device:data' as any, handleDeviceData);
        return () => window.removeEventListener('device:data' as any, handleDeviceData);
    }, []);

    // 4. CENTRALIZED TREND LOGIC (Fixed for "Flat on New Reading")
    // This effect runs whenever 'devices' changes (from Socket OR Poll)
    useEffect(() => {
        const newTrends: Record<string, TrendDirection> = {};
        let hasChanges = false;

        devices.forEach(device => {
            const devId = device._id;
            const currentVal = Number(device.lastReading?.value);
            const currentTs = device.lastReading?.timestamp ? new Date(device.lastReading.timestamp).getTime() : 0;

            const lastKnown = lastReadingsRef.current[devId];

            // Initialize if missing
            if (!lastKnown && !isNaN(currentVal) && currentTs > 0) {
                lastReadingsRef.current[devId] = { value: currentVal, timestamp: currentTs };
                return;
            }

            // Detect NEW Update
            if (lastKnown && currentTs > lastKnown.timestamp) {
                // It is a NEW reading (Time advanced)
                let direction: TrendDirection = 'flat';

                if (currentVal > lastKnown.value) direction = 'up';
                else if (currentVal < lastKnown.value) direction = 'down';
                else direction = 'flat'; // Value is SAME, but time is NEW -> Trend becomes FLAT

                newTrends[devId] = direction;
                hasChanges = true;

                // Update Ref to new state
                lastReadingsRef.current[devId] = { value: currentVal, timestamp: currentTs };
            }
            // If timestamps are equal (Polling old data), do NOTHING. Keep existing trend.
        });

        if (hasChanges) {
            setTrends(prev => ({ ...prev, ...newTrends }));
        }

    }, [devices]);

    const getIcon = (iconName?: string) => {
        switch (iconName) {
            case 'thermometer': return <Thermometer className="h-4 w-4 text-orange-500" />;
            case 'droplet': return <Droplet className="h-4 w-4 text-blue-500" />;
            case 'zap': return <Zap className="h-4 w-4 text-yellow-500" />;
            case 'ruler': return <Ruler className="h-4 w-4 text-green-500" />;
            case 'wind': return <Wind className="h-4 w-4 text-sky-500" />;
            default: return <Thermometer className="h-4 w-4 text-muted-foreground" />;
        }
    };

    const calculateStatus = (value: number | undefined, config: any): SensorStatus => {
        if (value === undefined || systemStatus === 'offline') return 'error';
        if (config.min === undefined && config.max === undefined) return 'normal';

        const min = config.min ?? -Infinity;
        const max = config.max ?? Infinity;
        const tol = config.tolerance ?? 0;

        if (value >= min && value <= max) return 'normal';
        if ((value >= min - tol && value < min) || (value > max && value <= max + tol)) {
            return 'warning';
        }
        return 'critical';
    };

    if (loading) {
        return (
            <Card>
                <CardHeader><CardTitle>📊 Quick Stats</CardTitle></CardHeader>
                <CardContent><div className="text-center py-8">Loading sensors...</div></CardContent>
            </Card>
        );
    }

    if (devices.length === 0) {
        return (
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>📊 Quick Stats</CardTitle>
                    <Button variant="ghost" size="sm" onClick={onSettingsClick}><Settings className="h-4 w-4" /></Button>
                </CardHeader>
                <CardContent>
                    <div className="text-center text-muted-foreground py-8">
                        <p className="mb-4">No pinned sensors</p>
                        <Button variant="outline" onClick={onSettingsClick}><Settings className="mr-2 h-4 w-4" /> Select Sensors</Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    📊 Quick Stats
                </h3>
                <Button variant="ghost" size="sm" onClick={onSettingsClick}>
                    <Settings className="h-4 w-4" />
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {devices.map(device => {
                    const config = getSensorConfig(device._id);
                    const currentVal = device.lastReading?.value;
                    const trend = trends[device._id] || 'flat';

                    return (
                        <SensorCard
                            key={device._id}
                            name={device.name}
                            alias={config.alias}
                            value={currentVal ?? 'N/A'}
                            unit={device.lastReading?.unit || device.displayUnit || device.config.driverId?.uiConfig?.unit}
                            icon={getIcon(device.config.driverId?.uiConfig?.icon)}
                            lastUpdate={device.lastReading?.timestamp}
                            status={calculateStatus(currentVal, config)}
                            trend={trend}
                            showTrend={config.showTrend}
                            config={{ min: config.min, max: config.max, tolerance: config.tolerance }}
                        />
                    );
                })}
            </div>
        </div>
    );
};
