import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Settings, Thermometer, Droplet, Zap, Ruler } from 'lucide-react';
import { SensorCard } from './SensorCard';
import { useStore } from '../../core/useStore';

interface PinnedDevice {
    _id: string;
    name: string;
    type: string;
    displayUnit?: string;
    lastReading?: {
        value: number;
        timestamp: Date;
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

interface PinnedSensorsGridProps {
    onSettingsClick: () => void;
}

export const PinnedSensorsGrid: React.FC<PinnedSensorsGridProps> = ({ onSettingsClick }) => {
    const [devices, setDevices] = useState<PinnedDevice[]>([]);
    const [loading, setLoading] = useState(true);
    const { systemStatus } = useStore();

    const fetchPinnedDevices = async () => {
        try {
            const res = await fetch('/api/hardware/devices/pinned');
            if (res.ok) {
                const data = await res.json();
                setDevices(data.data || []);
            }
        } catch (error) {
            console.error('Failed to fetch pinned devices:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPinnedDevices();
        // Refresh every 10 seconds
        const interval = setInterval(fetchPinnedDevices, 10000);
        return () => clearInterval(interval);
    }, []);

    // Listen to real-time device updates
    useEffect(() => {
        const handleDeviceData = (event: CustomEvent) => {
            const { deviceId, value, timestamp, unit } = event.detail;
            setDevices(prev => prev.map(d =>
                d._id === deviceId
                    ? {
                        ...d,
                        lastReading: { value, timestamp: new Date(timestamp) },
                        displayUnit: unit
                    }
                    : d
            ));
        };

        window.addEventListener('device:data' as any, handleDeviceData);
        return () => window.removeEventListener('device:data' as any, handleDeviceData);
    }, []);

    const getIcon = (iconName?: string) => {
        switch (iconName) {
            case 'thermometer': return <Thermometer className="h-4 w-4 text-orange-500" />;
            case 'droplet': return <Droplet className="h-4 w-4 text-blue-500" />;
            case 'zap': return <Zap className="h-4 w-4 text-yellow-500" />;
            case 'ruler': return <Ruler className="h-4 w-4 text-green-500" />;
            default: return <Thermometer className="h-4 w-4 text-muted-foreground" />;
        }
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>📊 Quick Stats</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center text-muted-foreground py-8">
                        Loading sensors...
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (devices.length === 0) {
        return (
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>📊 Quick Stats</CardTitle>
                    <Button variant="ghost" size="sm" onClick={onSettingsClick}>
                        <Settings className="h-4 w-4" />
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="text-center text-muted-foreground py-8">
                        <p className="mb-4">Няма избрани сензори</p>
                        <Button variant="outline" onClick={onSettingsClick}>
                            <Settings className="h-4 w-4 mr-2" />
                            Избери сензори
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">📊 Quick Stats</h3>
                <Button variant="ghost" size="sm" onClick={onSettingsClick}>
                    <Settings className="h-4 w-4" />
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {devices.map(device => (
                    <SensorCard
                        key={device._id}
                        name={device.name}
                        value={device.lastReading?.value ?? 'N/A'}
                        unit={device.displayUnit || device.config.driverId?.uiConfig?.unit}
                        icon={getIcon(device.config.driverId?.uiConfig?.icon)}
                        lastUpdate={device.lastReading?.timestamp}
                        status={systemStatus === 'offline' ? 'error' : 'normal'}
                    />
                ))}
            </div>
        </div>
    );
};
