import React, { useState, useEffect } from 'react';
import {
    Activity,
    Thermometer,
    Zap,
    Droplets,
    Wind,
    Sun,
    Settings,
    TestTube,
    Cpu,
    Info,
    Clock
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { hardwareService } from '../../services/hardwareService';

interface ExpandedControllerViewProps {
    controllerId: string;
    onEditDevice: (device: any) => void;
    onTestDevice: (device: any) => void;
}

// Helper to determine icon based on device type or name
const getDeviceIcon = (device: any) => {
    const name = device.name?.toLowerCase() || '';
    const type = device.type?.toLowerCase() || '';

    if (type === 'relay') return <Zap className="h-5 w-5 text-yellow-500" />;
    if (name.includes('temp')) return <Thermometer className="h-5 w-5 text-red-500" />;
    if (name.includes('ph')) return <Activity className="h-5 w-5 text-purple-500" />;
    if (name.includes('ec')) return <Zap className="h-5 w-5 text-blue-500" />;
    if (name.includes('pump') || name.includes('water')) return <Droplets className="h-5 w-5 text-blue-400" />;
    if (name.includes('fan') || name.includes('air')) return <Wind className="h-5 w-5 text-cyan-500" />;
    if (name.includes('light') || name.includes('led')) return <Sun className="h-5 w-5 text-orange-500" />;

    return <Cpu className="h-5 w-5 text-gray-500" />;
};

// Helper for relative time (e.g. "5m ago")
const formatTimeAgo = (dateInput?: string | Date) => {
    if (!dateInput) return 'Never';
    const date = new Date(dateInput);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    // Seconds
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return `${diffSec}s ago`;

    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    return `${Math.floor(diffHours / 24)}d ago`;
};

// Helper to format values (toFixed 2)
const formatValue = (val: any) => {
    if (val === undefined || val === null || val === 'N/A') return 'N/A';
    if (typeof val === 'number') {
        // If integer, return as integer string? User requested 2 decimal places generally.
        // Let's stick to 2 decimal places for consistency as requested.
        return val.toFixed(2);
    }
    return String(val);
};

export const ExpandedControllerView: React.FC<ExpandedControllerViewProps> = ({
    controllerId,
    onEditDevice,
    onTestDevice
}) => {
    const [devices, setDevices] = useState<any[]>([]);
    const [relays, setRelays] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [allDevices, allRelays] = await Promise.all([
                    hardwareService.getDevices(),
                    hardwareService.getRelays()
                ]);

                // Filter for this controller
                setDevices(allDevices.filter((d: any) => d.hardware?.parentId === controllerId));
                setRelays(allRelays.filter((r: any) => (r.controllerId?._id || r.controllerId) === controllerId));
            } catch (err) {
                console.error("Failed to fetch details for expanded row", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [controllerId]);

    // Pin formatting logic
    const formatPins = (pins: any) => {
        if (!pins) return null;

        // If it's an array of objects (New Backend Structure)
        if (Array.isArray(pins)) {
            return (
                <div className="flex flex-wrap gap-1">
                    {pins.map((pin: any, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-[10px] font-mono px-1 h-5">
                            {pin.portId}
                            {pin.role && <span className="opacity-50 ml-1">({pin.role})</span>}
                        </Badge>
                    ))}
                </div>
            );
        }

        // If it's an object/map (Legacy or direct map)
        if (typeof pins === 'object') {
            return (
                <div className="flex flex-wrap gap-1">
                    {Object.entries(pins).map(([key, val]: [string, any], idx) => (
                        <Badge key={idx} variant="outline" className="text-[10px] font-mono px-1 h-5">
                            {key}: {String(val)}
                        </Badge>
                    ))}
                </div>
            );
        }

        // Simple string
        return <Badge variant="outline" className="text-[10px] px-1 h-5">{String(pins)}</Badge>;
    };

    if (loading) return (
        <div className="p-8 flex justify-center items-center">
            <div className="animate-pulse flex gap-2 text-muted-foreground text-sm">
                <Activity className="h-4 w-4 animate-spin" /> Loading data...
            </div>
        </div>
    );

    if (devices.length === 0 && relays.length === 0) return (
        <div className="p-8 text-center bg-muted/20 border-t border-dashed">
            <p className="text-muted-foreground text-sm mb-2">No hardware connected to this controller yet.</p>
            <Button variant="outline" size="sm" onClick={() => onEditDevice({ hardware: { parentId: controllerId } })}>
                Add Device
            </Button>
        </div>
    );

    return (
        <div className="p-6 bg-slate-50/50 dark:bg-slate-900/50 border-t shadow-inner space-y-6">

            {/* --- RELAYS SECTION --- */}
            {relays.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <Zap className="h-3 w-3" /> Connected Relays
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {relays.map(relay => (
                            <Card key={relay._id} className="border-l-4 border-l-yellow-500 shadow-sm hover:shadow-md transition-all">
                                <CardHeader className="pb-2 pt-4 px-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-sm font-medium">{relay.name}</CardTitle>
                                            <CardDescription className="text-xs mt-1 font-mono">
                                                {relay.channels.length} Channels • {relay.type}
                                            </CardDescription>
                                        </div>
                                        {/* Visual Channel Status (Simulated) */}
                                        <div className="flex gap-1">
                                            {Array.from({ length: Math.min(relay.channels.length, 8) }).map((_, i) => (
                                                <div key={i} className="w-2 h-2 rounded-full bg-green-200 dark:bg-green-900 border border-green-400" title={`Channel ${i + 1}`} />
                                            ))}
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="px-4 pb-3">
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {relay.channels?.map((c: any, i: number) => (
                                            c.controllerPortId && (
                                                <Badge key={i} variant="secondary" className="text-[10px] bg-slate-100 dark:bg-slate-800">
                                                    CH{i + 1} → {c.controllerPortId}
                                                </Badge>
                                            )
                                        ))}
                                    </div>
                                    <div className="mt-4 flex gap-2 justify-end">
                                        {/* Currently Test works per device/relay usually, relay test might be complex if it requires channel */}
                                        <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => onEditDevice(relay)}>
                                            <Settings className="h-3 w-3 mr-1" /> Config
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* --- DEVICES SECTION --- */}
            {devices.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <Cpu className="h-3 w-3" /> Connected Devices
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {devices.map(device => {
                            // 1. Value formatting
                            const lastValue = formatValue(device.lastReading?.value);

                            // 2. Unit Resolution Logic (Hierarchy)
                            // A: User Override (displayUnit)
                            // B: Dynamic unit from reading (if backend sends it) - not reliable yet
                            // C: Driver Default (from template)
                            let unit = device.displayUnit;
                            if (!unit && typeof device.config?.driverId === 'object') {
                                // Fallback to template default
                                unit = device.config.driverId.uiConfig?.units?.[0] || '';
                            }

                            // 3. Time formatting
                            const timeAgo = formatTimeAgo(device.lastReading?.timestamp);

                            // 4. Model/Interface Extraction
                            // driverId can be string or object.
                            const template = typeof device.config?.driverId === 'object' ? device.config.driverId : null;
                            const modelName = template?.name || 'Generic Device';
                            const interfaceType = template?.requirements?.interface || 'UNKNOWN';

                            return (
                                <Card key={device._id} className="shadow-sm hover:shadow-md transition-all group">
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg group-hover:bg-primary/10 transition-colors shrink-0">
                                                    {getDeviceIcon(device)}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-semibold text-sm truncate" title={device.name}>{device.name}</span>
                                                        {device.metadata?.description && (
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Info className="h-3.5 w-3.5 text-muted-foreground/70 cursor-help shrink-0" />
                                                                    </TooltipTrigger>
                                                                    <TooltipContent className="max-w-[250px] text-xs">
                                                                        {device.metadata.description}
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </TooltipProvider>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                        {device.status === 'online' ?
                                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" /> :
                                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 inline-block" />
                                                        }
                                                        {device.status || 'Offline'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Connection Details */}
                                        <div className="bg-muted/30 p-2 rounded text-xs space-y-1">
                                            {/* LAST READING ROW */}
                                            <div className="flex justify-between items-center mb-2 pb-2 border-b border-dashed border-slate-200 dark:border-slate-700">
                                                <span className="text-muted-foreground flex items-center gap-1">
                                                    <Activity className="h-3 w-3" /> Reading:
                                                </span>
                                                <div className="text-right">
                                                    <div className="font-bold text-sm">
                                                        {lastValue} <span className="text-xs font-normal text-muted-foreground ml-0.5">{unit}</span>
                                                    </div>
                                                    <div className="text-[10px] text-muted-foreground opacity-70 flex items-center justify-end gap-1" title={device.lastReading?.timestamp}>
                                                        <Clock className="h-2 w-2" />
                                                        {timeAgo}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* MODEL Info */}
                                            <div className="flex items-center gap-2">
                                                <span className="text-muted-foreground min-w-[50px]">Model:</span>
                                                <span className="font-medium truncate" title={modelName}>{modelName}</span>
                                            </div>

                                            {/* INTERFACE Info */}
                                            <div className="flex items-center gap-2">
                                                <span className="text-muted-foreground min-w-[50px]">Interface:</span>
                                                <Badge variant="outline" className="text-[10px] h-4 py-0">{interfaceType}</Badge>
                                            </div>

                                            <div className="flex justify-start items-center gap-2 mt-1 pt-1 border-t border-dashed border-slate-200 dark:border-slate-700">
                                                <span className="text-muted-foreground min-w-[35px]">Pins:</span>
                                                {formatPins(device.hardware?.pins)}
                                                {/* Also try simple port for simplicity */}
                                                {device.hardware?.port && !device.hardware?.pins?.length && (
                                                    <Badge variant="outline" className="text-[10px] px-1 h-5">{device.hardware.port}</Badge>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2 mt-4 pt-2 border-t">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="flex-1 h-8 text-xs hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20"
                                                onClick={() => onTestDevice(device)}
                                            >
                                                <TestTube className="h-3 w-3 mr-2" />
                                                Test
                                            </Button>
                                            <div className="w-px bg-slate-200 dark:bg-slate-700 mx-1" />
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="flex-1 h-8 text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
                                                onClick={() => onEditDevice(device)}
                                            >
                                                <Settings className="h-3 w-3 mr-2" />
                                                Config
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
