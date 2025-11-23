import React, { useEffect, useState } from 'react';
import { Cpu, Thermometer, Activity, Power, RefreshCw, Zap } from 'lucide-react';
import { useStore } from '../core/useStore';
import { cn } from '../lib/utils';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/card';

export const Devices: React.FC = () => {
    const { devices, setDevices } = useStore();
    const [filter, setFilter] = useState<'ALL' | 'SENSOR' | 'ACTUATOR'>('ALL');
    const [loading, setLoading] = useState(false);

    const fetchDevices = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/hardware/devices');
            const data = await res.json();
            if (Array.isArray(data)) {
                setDevices(data);
            }
        } catch (error) {
            console.error('Failed to fetch devices:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDevices();
    }, []);

    const handleToggle = async (deviceId: string, currentValue: boolean) => {
        try {
            await fetch('/api/hardware/command', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    deviceId,
                    command: 'SET',
                    params: { value: !currentValue }
                })
            });
            // Optimistic update could go here, but we rely on socket for truth
        } catch (error) {
            console.error('Failed to toggle device:', error);
        }
    };

    const filteredDevices = Array.from(devices.values()).filter(d => {
        if (filter === 'ALL') return true;
        return d.type === filter;
    });

    const getIcon = (type: string) => {
        switch (type) {
            case 'SENSOR': return <Thermometer className="h-5 w-5" />;
            case 'ACTUATOR': return <Zap className="h-5 w-5" />;
            default: return <Cpu className="h-5 w-5" />;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header & Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Device Manager</h2>
                    <p className="text-muted-foreground">Monitor and control hardware modules.</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-muted rounded-lg p-1">
                        {(['ALL', 'SENSOR', 'ACTUATOR'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={cn(
                                    "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                                    filter === f
                                        ? "bg-background text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {f.charAt(0) + f.slice(1).toLowerCase() + 's'}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={fetchDevices}
                        className="p-2 hover:bg-muted rounded-full transition-colors"
                        disabled={loading}
                    >
                        <RefreshCw className={cn("h-5 w-5", loading && "animate-spin")} />
                    </button>
                </div>
            </div>

            {/* Device Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDevices.map((device: any) => (
                    <Card key={device.id} className="overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted/30">
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "p-2 rounded-lg",
                                    device.type === 'ACTUATOR' ? "bg-orange-500/10 text-orange-600" : "bg-blue-500/10 text-blue-600"
                                )}>
                                    {getIcon(device.type)}
                                </div>
                                <div>
                                    <CardTitle className="text-base">{device.name}</CardTitle>
                                    <div className="text-xs text-muted-foreground font-mono">{device.id}</div>
                                </div>
                            </div>
                            <div className={cn(
                                "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                                device.isEnabled !== false ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
                            )}>
                                {device.isEnabled !== false ? 'Active' : 'Disabled'}
                            </div>
                        </CardHeader>

                        <CardContent className="pt-6">
                            <div className="flex items-baseline justify-between">
                                <div className="text-3xl font-bold">
                                    {device.type === 'ACTUATOR' ? (
                                        <span className={cn(
                                            device.value ? "text-green-600" : "text-muted-foreground"
                                        )}>
                                            {device.value ? 'ON' : 'OFF'}
                                        </span>
                                    ) : (
                                        <span>
                                            {typeof device.value === 'number' ? device.value.toFixed(1) : (device.value || '--')}
                                            <span className="text-sm text-muted-foreground ml-1 font-normal">
                                                {device.config?.unit || ''}
                                            </span>
                                        </span>
                                    )}
                                </div>
                            </div>
                        </CardContent>

                        <CardFooter className="bg-muted/10 border-t p-3 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Activity className="h-3 w-3" />
                                <span>{device.driverId}</span>
                            </div>

                            {device.type === 'ACTUATOR' && (
                                <button
                                    onClick={() => handleToggle(device.id, !!device.value)}
                                    disabled={device.isEnabled === false}
                                    className={cn(
                                        "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                                        device.value
                                            ? "bg-red-500/10 text-red-600 hover:bg-red-500/20"
                                            : "bg-green-500/10 text-green-600 hover:bg-green-500/20",
                                        device.isEnabled === false && "opacity-50 cursor-not-allowed"
                                    )}
                                >
                                    <Power className="h-3 w-3" />
                                    {device.value ? 'Turn OFF' : 'Turn ON'}
                                </button>
                            )}
                        </CardFooter>
                    </Card>
                ))}

                {filteredDevices.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                        No devices found matching filter.
                    </div>
                )}
            </div>
        </div>
    );
};
