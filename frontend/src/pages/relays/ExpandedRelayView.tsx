import React, { useState, useEffect } from 'react';
import {
    Settings,
    TestTube,
    Activity,
    Zap,
    Droplets,
    Wind,
    Sun,
    Thermometer,
    Power
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { hardwareService } from '../../services/hardwareService';

interface ExpandedRelayViewProps {
    relay: any;
    onEditDevice: (device: any) => void;
    onTestDevice: (device: any) => void;
    onAddDevice: (relayId: string, channelIndex: number) => void;
    onRefresh: () => void;
}

// Helper to get device icon
const getDeviceIcon = (device: any) => {
    const name = device?.name?.toLowerCase() || '';
    if (name.includes('pump') || name.includes('water')) return <Droplets className="h-4 w-4 text-blue-400" />;
    if (name.includes('fan') || name.includes('air')) return <Wind className="h-4 w-4 text-cyan-500" />;
    if (name.includes('light') || name.includes('led')) return <Sun className="h-4 w-4 text-orange-500" />;
    if (name.includes('heat') || name.includes('temp')) return <Thermometer className="h-4 w-4 text-red-500" />;
    return <Zap className="h-4 w-4 text-yellow-500" />;
};

export const ExpandedRelayView: React.FC<ExpandedRelayViewProps> = ({
    relay,
    onEditDevice,
    onTestDevice
}) => {
    const [devices, setDevices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDevices = async () => {
            try {
                const allDevices = await hardwareService.getDevices();
                // Filter devices attached to THIS relay
                const relayDevices = allDevices.filter(d => d.hardware?.relayId === relay._id);
                setDevices(relayDevices);
            } catch (err) {
                console.error("Failed to fetch devices for relay view", err);
            } finally {
                setLoading(false);
            }
        };
        fetchDevices();
    }, [relay._id]);

    if (loading) return (
        <div className="p-8 flex justify-center items-center">
            <div className="animate-pulse flex gap-2 text-muted-foreground text-sm">
                <Activity className="h-4 w-4 animate-spin" /> Loading channels...
            </div>
        </div>
    );

    // Merge logic: Map relay channels to devices
    const renderedChannels = relay.channels.map((channel: any) => {
        const connectedDevice = devices.find(d =>
            d.hardware?.relayId === relay._id &&
            Number(d.hardware?.channel) === Number(channel.channelIndex)
        );
        return {
            ...channel,
            device: connectedDevice
        };
    });

    return (
        <div className="p-6 bg-slate-50/50 dark:bg-slate-900/50 border-t shadow-inner">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {renderedChannels.map((ch: any) => {
                    const isOccupied = !!ch.device;
                    const isOn = ch.state === true;

                    if (isOccupied) {
                        return (
                            <Card key={ch.channelIndex} className={`shadow-sm transition-all border-l-4 ${isOn ? 'border-l-green-500' : 'border-l-red-500'}`}>
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-full ${isOn ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                                                {getDeviceIcon(ch.device)}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-sm truncate max-w-[120px]" title={ch.device.name}>
                                                    {ch.device.name}
                                                </div>
                                                <div className="text-xs text-muted-foreground font-mono">
                                                    CH {ch.channelIndex}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Disabled Toggle Button */}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            disabled
                                            className={`h-8 w-8 rounded-full ${isOn ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : 'text-red-500 bg-red-50 dark:bg-red-900/20'} opacity-100`}
                                        >
                                            <Power className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <div className="bg-muted/30 p-2 rounded text-xs space-y-1 mb-3">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Pin:</span>
                                            <span className="font-mono">{ch.controllerPortId || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-muted-foreground">Status:</span>
                                            <Badge
                                                variant="outline"
                                                className={`h-4 text-[10px] px-1 border-0 ${isOn ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-red-500 text-white hover:bg-red-600'}`}
                                            >
                                                {isOn ? 'ON' : 'OFF'}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 pt-2 border-t">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="flex-1 h-7 text-xs"
                                            onClick={() => onTestDevice(ch.device)}
                                        >
                                            <TestTube className="h-3 w-3 mr-2" /> Test
                                        </Button>
                                        <div className="w-px bg-slate-200 dark:bg-slate-700" />
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="flex-1 h-7 text-xs"
                                            onClick={() => onEditDevice(ch.device)}
                                        >
                                            <Settings className="h-3 w-3 mr-2" /> Config
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    } else {
                        // EMPTY SLOT
                        return (
                            <Card key={ch.channelIndex} className="border-dashed shadow-none bg-transparent opacity-60 hover:opacity-100 transition-opacity">
                                <CardContent className="p-4 flex flex-col items-center justify-center h-full min-h-[140px] gap-2 text-center pointer-events-none select-none">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-1">
                                        <span className="font-mono text-sm font-bold text-slate-400">{ch.channelIndex}</span>
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-slate-400 uppercase tracking-widest">Free Channel</div>
                                        <Badge variant="outline" className="mt-2 text-[10px] font-mono opacity-50">
                                            Pin: {ch.controllerPortId || 'N/A'}
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    }
                })}
            </div>
        </div>
    );
};
