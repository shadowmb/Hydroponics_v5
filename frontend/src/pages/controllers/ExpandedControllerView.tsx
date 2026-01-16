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
    Clock,
    ChevronDown,
    ChevronRight,
    ArrowRight
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

// ... (removed cn import)

interface ExpandedControllerViewProps {
    controllerId: string;
    onEditDevice: (device: any) => void;
    onTestDevice: (device: any) => void;
}

const getDeviceIcon = (device: any) => {
    const name = device.name?.toLowerCase() || '';
    const type = device.type?.toLowerCase() || '';

    if (type === 'relay') return <Zap className="h-5 w-5 text-yellow-500" />;
    if (name.includes('pump') || name.includes('water')) return <Droplets className="h-5 w-5 text-blue-400" />;
    if (name.includes('fan') || name.includes('air')) return <Wind className="h-5 w-5 text-cyan-500" />;
    if (name.includes('light') || name.includes('led')) return <Sun className="h-5 w-5 text-orange-500" />;
    if (name.includes('heat') || name.includes('temp')) return <Thermometer className="h-5 w-5 text-red-500" />;
    if (name.includes('temp')) return <Thermometer className="h-5 w-5 text-red-500" />;
    if (name.includes('ph')) return <Activity className="h-5 w-5 text-purple-500" />;
    if (name.includes('ec')) return <Zap className="h-5 w-5 text-blue-500" />;

    return <Cpu className="h-5 w-5 text-gray-500" />;
};

const formatTimeAgo = (dateInput?: string | Date) => {
    if (!dateInput) return 'Never';
    const date = new Date(dateInput);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
};

const formatValue = (val: any) => {
    if (val === undefined || val === null || val === 'N/A') return 'N/A';
    if (typeof val === 'number') {
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

    // Collapse States (Default Closed)
    const [relaysOpen, setRelaysOpen] = useState(false);
    const [actuatorsOpen, setActuatorsOpen] = useState(false);
    const [sensorsOpen, setSensorsOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [allDevices, allRelays] = await Promise.all([
                    hardwareService.getDevices(),
                    hardwareService.getRelays()
                ]);

                const thisControllerRelays = allRelays.filter((r: any) => (r.controllerId?._id || r.controllerId) === controllerId);
                const relayIds = thisControllerRelays.map(r => r._id);

                const relevantDevices = allDevices.filter((d: any) => {
                    if (d.hardware?.parentId === controllerId) return true;
                    if (d.hardware?.relayId && relayIds.includes(d.hardware.relayId)) return true;
                    return false;
                });

                setDevices(relevantDevices);
                setRelays(thisControllerRelays);
            } catch (err) {
                console.error("Failed to fetch details for expanded row", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [controllerId]);

    // Format Pins Helper
    const formatPins = (pins: any) => {
        if (!pins) return null;
        if (Array.isArray(pins)) {
            return (
                <div className="flex flex-wrap gap-1">
                    {pins.map((pin: any, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-[10px] font-mono px-1 h-5">
                            {pin.portId}
                        </Badge>
                    ))}
                </div>
            );
        }
        return <Badge variant="outline" className="text-[10px] px-1 h-5">{String(pins)}</Badge>;
    };

    // Render Actuator Card
    const renderActuatorCard = (device: any, isDirect: boolean, relayName?: string) => {
        // Default Source: Logical State (lastReading)
        // Especially critical for Direct Actuators where no Relay object exists to report state
        let isOn = (device.lastReading?.value > 0);
        let connectionInfo = null;

        if (!isDirect && relayName && device.hardware?.channel) {
            const parentRelay = relays.find(r => r._id === device.hardware?.relayId);
            let controllerPin = 'Unknown';
            if (parentRelay) {
                const channel = parentRelay.channels?.find((c: any) => Number(c.channelIndex) === Number(device.hardware.channel));
                if (channel) {
                    // Override with Relay State (Physical Truth)
                    isOn = channel.state === true;
                    controllerPin = channel.controllerPortId;
                }
            }
            connectionInfo = <div className="flex flex-col items-end gap-0.5" title={relayName}>
                <span className="flex items-center gap-1">Via {relayName} CH:{device.hardware.channel}</span>
                {controllerPin && <span className="flex items-center gap-1 text-[9px] text-muted-foreground opacity-80">
                    <ArrowRight className="h-2 w-2" /> Pin: {controllerPin}
                </span>}
            </div>;
        } else {
            connectionInfo = <span className="flex items-center gap-1">
                Direct Pin {formatPins(device.hardware?.pins)}
                {device.hardware?.port && !device.hardware?.pins?.length && <Badge variant="outline" className="text-[10px] h-4">{device.hardware.port}</Badge>}
            </span>;
        }

        return (
            <Card key={device._id} className={`shadow-sm transition-all border-l-4 ${isOn ? 'border-l-green-500' : 'border-l-red-500'}`}>
                <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${isOn ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                                {getDeviceIcon(device)}
                            </div>
                            <div>
                                <div className="font-semibold text-sm truncate max-w-[120px]" title={device.name}>
                                    {device.name}
                                </div>
                                <div className="text-xs text-muted-foreground font-mono">
                                    {device.type}
                                </div>
                            </div>
                        </div>
                        <Badge
                            variant="outline"
                            className={`h-5 text-[10px] px-1.5 border-0 ${isOn ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
                        >
                            {isOn ? 'ON' : 'OFF'}
                        </Badge>
                    </div>

                    <div className="bg-muted/30 p-2 rounded text-xs space-y-1 mb-3">
                        <div className="flex justify-between items-start">
                            <span className="text-muted-foreground mt-0.5">Connection:</span>
                            <div className="font-mono text-[10px] text-right">
                                {connectionInfo}
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground mr-2">Model:</span>
                            <span className="truncate max-w-[100px]" title={device.config?.driverId?.name || 'Generic'}>
                                {device.config?.driverId?.name || 'Generic'}
                            </span>
                        </div>
                    </div>

                    <div className="flex gap-2 pt-2 border-t">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="flex-1 h-7 text-xs"
                            onClick={() => onTestDevice(device)}
                        >
                            <TestTube className="h-3 w-3 mr-2" /> Test
                        </Button>
                        <div className="w-px bg-slate-200 dark:bg-slate-700" />
                        <Button
                            variant="ghost"
                            size="sm"
                            className="flex-1 h-7 text-xs"
                            onClick={() => onEditDevice(device)}
                        >
                            <Settings className="h-3 w-3 mr-2" /> Config
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    };

    if (loading) return (
        <div className="p-8 flex justify-center items-center">
            <div className="animate-pulse flex gap-2 text-muted-foreground text-sm">
                <Activity className="h-4 w-4 animate-spin" /> Loading data...
            </div>
        </div>
    );

    const sensors = devices.filter(d => d.type === 'SENSOR');
    const actuators = devices.filter(d => d.type === 'ACTUATOR');
    const directActuators = actuators.filter(d => !d.hardware?.relayId);

    // Group actuators by relay
    const actuatorsByRelay: Record<string, any[]> = {};
    actuators.forEach(dev => {
        if (dev.hardware?.relayId) {
            if (!actuatorsByRelay[dev.hardware.relayId]) {
                actuatorsByRelay[dev.hardware.relayId] = [];
            }
            actuatorsByRelay[dev.hardware.relayId].push(dev);
        }
    });

    if (devices.length === 0 && relays.length === 0) return (
        <div className="p-8 text-center bg-muted/20 border-t border-dashed">
            <p className="text-muted-foreground text-sm mb-2">No hardware connected to this controller yet.</p>
            <Button variant="outline" size="sm" onClick={() => onEditDevice({ hardware: { parentId: controllerId } })}>
                Add Device
            </Button>
        </div>
    );

    return (
        <div className="p-6 bg-slate-50/50 dark:bg-slate-900/50 border-t shadow-inner space-y-4">

            {/* --- 1. RELAY GROUPS --- */}
            {relays.length > 0 && (
                <div className="border rounded-lg bg-background shadow-sm overflow-hidden">
                    <button
                        onClick={() => setRelaysOpen(!relaysOpen)}
                        className="w-full flex items-center justify-between p-4 bg-muted/20 hover:bg-muted/30 transition-colors text-left"
                    >
                        <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-yellow-500" />
                            <span className="font-semibold text-sm uppercase tracking-wider">Relay Groups</span>
                            <Badge variant="secondary" className="text-xs ml-2">{relays.length}</Badge>
                        </div>
                        {relaysOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    </button>

                    {relaysOpen && (
                        <div className="p-4 space-y-6 animate-in slide-in-from-top-2 duration-200">
                            {relays.map(relay => {
                                const boundActuators = actuatorsByRelay[relay._id] || [];
                                return (
                                    <div key={relay._id} className="p-4 border rounded-xl bg-slate-100/50 dark:bg-slate-900/50 border-dashed border-slate-300 dark:border-slate-700">
                                        <div className="mb-4 flex items-center gap-2">
                                            <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20">Relay Group</Badge>
                                            <span className="font-semibold text-sm text-foreground/80">{relay.name}</span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                            {/* First Card: The Relay Itself */}
                                            <Card className="border-l-4 border-l-yellow-500 shadow-sm bg-white dark:bg-slate-950">
                                                <CardHeader className="pb-2 pt-4 px-4">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <CardTitle className="text-sm font-medium">{relay.name}</CardTitle>
                                                            <CardDescription className="text-xs mt-1 font-mono">
                                                                {relay.channels.length} Channels (Control Unit)
                                                            </CardDescription>
                                                        </div>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="px-4 pb-3">
                                                    <div className="flex flex-wrap gap-1 mt-2 mb-3">
                                                        {relay.channels?.map((c: any, i: number) => (
                                                            c.controllerPortId && (
                                                                <Badge key={i} variant="secondary" className="text-[9px] px-1 bg-slate-100 dark:bg-slate-800">
                                                                    {c.controllerPortId}
                                                                </Badge>
                                                            )
                                                        ))}
                                                    </div>
                                                    <Button size="sm" variant="ghost" className="w-full h-7 text-xs border border-dashed" onClick={() => onEditDevice(relay)}>
                                                        <Settings className="h-3 w-3 mr-1" /> Configure Relay
                                                    </Button>
                                                </CardContent>
                                            </Card>

                                            {/* Connected Actuators */}
                                            {boundActuators.map(dev => renderActuatorCard(dev, false, relay.name))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* --- 2. DIRECT ACTUATORS --- */}
            {directActuators.length > 0 && (
                <div className="border rounded-lg bg-background shadow-sm overflow-hidden">
                    <button
                        onClick={() => setActuatorsOpen(!actuatorsOpen)}
                        className="w-full flex items-center justify-between p-4 bg-muted/20 hover:bg-muted/30 transition-colors text-left"
                    >
                        <div className="flex items-center gap-2">
                            <Droplets className="h-4 w-4 text-blue-500" />
                            <span className="font-semibold text-sm uppercase tracking-wider">Direct Actuators</span>
                            <Badge variant="secondary" className="text-xs ml-2">{directActuators.length}</Badge>
                        </div>
                        {actuatorsOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    </button>

                    {actuatorsOpen && (
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-in slide-in-from-top-2 duration-200">
                            {directActuators.map(dev => renderActuatorCard(dev, true))}
                        </div>
                    )}
                </div>
            )}

            {/* --- 3. SENSORS SECTION --- */}
            {sensors.length > 0 && (
                <div className="border rounded-lg bg-background shadow-sm overflow-hidden">
                    <button
                        onClick={() => setSensorsOpen(!sensorsOpen)}
                        className="w-full flex items-center justify-between p-4 bg-muted/20 hover:bg-muted/30 transition-colors text-left"
                    >
                        <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-purple-500" />
                            <span className="font-semibold text-sm uppercase tracking-wider">Sensors & Monitors</span>
                            <Badge variant="secondary" className="text-xs ml-2">{sensors.length}</Badge>
                        </div>
                        {sensorsOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    </button>

                    {sensorsOpen && (
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-in slide-in-from-top-2 duration-200">
                            {sensors.map(device => {
                                const lastValue = formatValue(device.lastReading?.value);
                                // Priority: Reading Unit (Snapshot) -> Display Unit (Settings)
                                let unit = device.lastReading?.unit || device.displayUnit;
                                if (!unit && typeof device.config?.driverId === 'object') {
                                    unit = device.config.driverId.uiConfig?.units?.[0] || '';
                                }
                                const timeAgo = formatTimeAgo(device.lastReading?.timestamp);
                                const template = typeof device.config?.driverId === 'object' ? device.config.driverId : null;
                                const modelName = template?.name || 'Generic Device';
                                const interfaceType = template?.requirements?.interface || template?.commands?.READ?.hardwareCmd || 'UNKNOWN';

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

                                            <div className="bg-muted/30 p-2 rounded text-xs space-y-1">
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
                                                <div className="flex items-center gap-2">
                                                    <span className="text-muted-foreground min-w-[50px]">Model:</span>
                                                    <span className="font-medium truncate" title={modelName}>{modelName}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-muted-foreground min-w-[50px]">Interface:</span>
                                                    <Badge variant="outline" className="text-[10px] h-4 py-0">{interfaceType}</Badge>
                                                </div>
                                                <div className="flex justify-start items-center gap-2 mt-1 pt-1 border-t border-dashed border-slate-200 dark:border-slate-700">
                                                    <span className="text-muted-foreground min-w-[35px]">Pins:</span>
                                                    {formatPins(device.hardware?.pins)}
                                                    {device.hardware?.port && !device.hardware?.pins?.length && (
                                                        <Badge variant="outline" className="text-[10px] px-1 h-5">{device.hardware.port}</Badge>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex gap-2 mt-4 pt-2 border-t">
                                                <Button variant="ghost" size="sm" className="flex-1 h-8 text-xs hover:bg-blue-50 dark:hover:bg-blue-900/20" onClick={() => onTestDevice(device)}>
                                                    <TestTube className="h-3 w-3 mr-2" /> Test
                                                </Button>
                                                <div className="w-px bg-slate-200 dark:bg-slate-700 mx-1" />
                                                <Button variant="ghost" size="sm" className="flex-1 h-8 text-xs hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => onEditDevice(device)}>
                                                    <Settings className="h-3 w-3 mr-2" /> Config
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
