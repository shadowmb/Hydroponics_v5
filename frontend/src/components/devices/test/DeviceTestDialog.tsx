import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Square } from 'lucide-react';
import { hardwareService } from '../../../services/hardwareService';
import { DeviceTestHeader } from './DeviceTestHeader';
import { toast } from 'sonner';

import { socketService } from '../../../core/SocketService';
import { SensorValueCard } from './SensorValueCard';
import { DeviceHistoryTab } from '../history/DeviceHistoryTab';
import { ActuatorControlPanel } from './ActuatorControlPanel';
import { ActuatorCalibration } from './calibration/ActuatorCalibration';

interface DeviceTestDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    device: any;
    onDeviceUpdate?: () => void;
}

export const DeviceTestDialog: React.FC<DeviceTestDialogProps> = ({ open, onOpenChange, device, onDeviceUpdate }) => {
    const [activeTab, setActiveTab] = useState('monitor');
    const [liveValue, setLiveValue] = useState<number | null>(null);
    const [liveUnit, setLiveUnit] = useState<string | undefined>(undefined);
    const [rawValue, setRawValue] = useState<number | null>(null);
    const [multiValues, setMultiValues] = useState<any>(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [availableUnits, setAvailableUnits] = useState<string[]>([]);
    const intervalRef = useRef<any>(null);

    const addLog = (msg: string, type: 'info' | 'error' | 'success' = 'info') => {
        const time = new Date().toLocaleTimeString();
        setLogs(prev => [`[${time}] [${type.toUpperCase()}] ${msg}`, ...prev].slice(0, 50));
    };

    const readValue = async () => {
        try {
            addLog('Reading value...', 'info');
            const result = await hardwareService.testDevice(device._id);
            // Result format: { raw: 123, value: 1.2, unit: 'cm' } (Unwrapped by service)
            console.log('DeviceTestDialog Read Result:', result);

            if (result) {
                setLiveValue(result.value);
                setLiveUnit(result.unit);
                setRawValue(result.raw);
                setMultiValues(result.details); // Store full details for multi-value display

                let logMsg = `Read OK: ${result.value} ${result.unit || ''} (Raw: ${result.raw})`;
                if (result.details) {
                    logMsg += ` [Full Response: ${JSON.stringify(result.details)}]`;
                }
                addLog(logMsg, 'success');
            }
        } catch (error: any) {
            const backendError = error.response?.data?.error;
            const details = error.response?.data?.details;

            if (backendError) {
                addLog(`Error: ${backendError}`, 'error');
                if (details) {
                    addLog(`Details: ${typeof details === 'object' ? JSON.stringify(details) : details}`, 'error');
                }
            } else {
                addLog(`Error: ${error.message}`, 'error');
            }
            toast.error('Failed to read device');
        }
    };

    const handleUnitChange = async (unit: string) => {
        try {
            const res = await fetch(`/api/hardware/devices/${device._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ displayUnit: unit })
            });

            if (!res.ok) throw new Error('Failed to update');

            if (onDeviceUpdate) onDeviceUpdate();
            readValue(); // Refresh value immediately
            toast.success(`Display unit set to ${unit}`);
        } catch (error) {
            console.error('Failed to update unit:', error);
            toast.error('Failed to update display unit');
        }
    };

    useEffect(() => {
        if (open && device) {
            fetch(`/api/hardware/devices/${device._id}/available-units`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setAvailableUnits(data.data);
                    }
                })
                .catch(err => console.error('Failed to fetch units:', err));
        }
    }, [open, device]);

    const stopStream = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            addLog('Live stream stopped.', 'info');
        }
        setIsStreaming(false);
    };

    const startStream = () => {
        setIsStreaming(true);
        addLog('Starting live stream (1s interval)...', 'info');
        readValue(); // Read immediately
        intervalRef.current = setInterval(readValue, 1000);
    };

    const toggleStream = () => {
        if (isStreaming) {
            stopStream();
        } else {
            startStream();
        }
    };

    // Clear state when dialog opens/closes
    useEffect(() => {
        if (!open) {
            stopStream();
            setLogs([]);
            setLiveValue(null);
            setRawValue(null);
            setMultiValues(null);
        }
    }, [open]);

    // Cleanup on unmount & Socket listener
    useEffect(() => {
        const handleCommandSent = (data: any) => {
            if (device && data.deviceId === device._id) {
                // Format the command for display
                // Prefer RAW wire protocol if available (1:1 with Serial Monitor)
                if (data.raw) {
                    addLog(`[SENT] ${data.raw.trim()}`, 'info');
                } else {
                    // Fallback to formatted object
                    const { cmd, ...params } = data.packet;
                    delete params.id;
                    delete params.deviceId; // clean up internal metadata

                    let paramStr = JSON.stringify(params);
                    if (paramStr === '{}') paramStr = '';

                    addLog(`[SENT] ${cmd} ${paramStr}`, 'info');
                }
            }
        };

        socketService.on('command:sent', handleCommandSent);

        return () => {
            stopStream();
            socketService.off('command:sent', handleCommandSent);
        };
    }, [device?._id]);

    if (!device) return null;

    console.log('DeviceTestDialog Debug:', {
        id: device._id,
        driverId: device.config?.driverId,
        commands: device.config?.driverId?.commands,
        outputs: device.config?.driverId?.commands?.READ?.outputs,
        multiValues
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden h-[80vh] flex flex-col">
                <DialogTitle className="sr-only">Device Test: {device.name}</DialogTitle>
                <DialogDescription className="sr-only">
                    Test and calibrate device {device.name}
                </DialogDescription>

                {/* Header */}
                <DeviceTestHeader
                    device={device}
                    status={device.status || 'offline'}
                />

                {/* Main Content */}
                <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                        <div className="border-b px-4 bg-muted/5">
                            <TabsList className="h-12">
                                <TabsTrigger value="monitor" className="px-6">Monitor & Test</TabsTrigger>
                                <TabsTrigger value="history" className="px-6">History</TabsTrigger>
                                <TabsTrigger value="calibration" className="px-6">Calibration</TabsTrigger>
                                <TabsTrigger value="settings" className="px-6">Settings</TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="flex-1 overflow-y-auto bg-background p-6 min-h-0">

                            <TabsContent value="monitor" className="m-0 flex flex-col items-center space-y-8">
                                {device.config?.driverId?.category !== 'ACTUATOR' && (
                                    <>
                                        <div className="text-center space-y-2">
                                            <h2 className="text-2xl font-semibold tracking-tight">Live Monitor</h2>
                                            <p className="text-muted-foreground">
                                                Read real-time values from the sensor to verify operation.
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <Button
                                                size="lg"
                                                variant={isStreaming ? "destructive" : "default"}
                                                onClick={toggleStream}
                                                className="min-w-[160px]"
                                            >
                                                {isStreaming ? (
                                                    <>
                                                        <Square className="mr-2 h-4 w-4 fill-current" /> Stop Stream
                                                    </>
                                                ) : (
                                                    <>
                                                        <Play className="mr-2 h-4 w-4" /> Start Live Stream
                                                    </>
                                                )}
                                            </Button>

                                            <Button
                                                size="lg"
                                                variant="outline"
                                                onClick={readValue}
                                                disabled={isStreaming}
                                            >
                                                Read Once
                                            </Button>

                                            <div className="ml-4 w-[120px]">
                                                <Select
                                                    value={device.displayUnit || activeTab === 'monitor' ? (liveUnit || availableUnits[0]) : undefined}
                                                    onValueChange={handleUnitChange}
                                                    disabled={availableUnits.length === 0}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder={availableUnits.length === 0 ? "No units" : "Unit"} />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {availableUnits.length === 0 ? (
                                                            <SelectItem value="none" disabled>No units available</SelectItem>
                                                        ) : (
                                                            availableUnits.map(u => (
                                                                <SelectItem key={u} value={u}>{u}</SelectItem>
                                                            ))
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Data Grid or Control Panel */}
                                <div className="w-full max-w-3xl">
                                    {device.config?.driverId?.category === 'ACTUATOR' ? (
                                        <ActuatorControlPanel device={device} onLog={addLog} />
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                                            {/* Scenario A: Multi-Value Sensor (e.g. DHT22) */}
                                            {device.config?.driverId?.commands?.READ?.outputs ? (
                                                device.config.driverId.commands.READ.outputs.map((output: any) => {
                                                    // Resolve value: Try direct key match in details, fallback to liveValue if single output
                                                    let val = multiValues && multiValues[output.key] !== undefined
                                                        ? multiValues[output.key]
                                                        : (device.config.driverId.commands.READ.outputs.length === 1 ? liveValue : null);

                                                    // Format number
                                                    if (typeof val === 'number') val = val.toFixed(2);

                                                    return (
                                                        <SensorValueCard
                                                            key={output.key}
                                                            label={output.label}
                                                            value={val}
                                                            unit={output.unit}
                                                            subValue={rawValue}
                                                        />
                                                    );
                                                })
                                            ) : (
                                                /* Scenario B: Single-Value Sensor (e.g. pH) */
                                                <>
                                                    <SensorValueCard
                                                        label={device.config?.driverId?.physicalType === 'ph' ? 'pH Value' : 'Calibrated Value'}
                                                        value={liveValue !== null ? liveValue.toFixed(2) : null}
                                                        unit={liveUnit || device.displayUnit || device.config?.driverId?.uiConfig?.units?.[0]}
                                                        variant="primary"
                                                    />
                                                    <SensorValueCard
                                                        label="Raw Input"
                                                        value={rawValue}
                                                        unit="ADC"
                                                        variant="raw"
                                                    />
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>


                            </TabsContent>

                            <TabsContent value="history" className="m-0 h-full">
                                <DeviceHistoryTab deviceId={device._id} deviceType={device.type} />
                            </TabsContent>

                            <TabsContent value="calibration" className="m-0">
                                <ActuatorCalibration device={device} onUpdate={() => onDeviceUpdate && onDeviceUpdate()} />
                            </TabsContent>

                            <TabsContent value="settings" className="m-0">
                                <div className="flex items-center justify-center h-full text-muted-foreground">
                                    Device Settings UI...
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>

                {/* Footer / Console */}
                <div className="h-32 border-t bg-black text-green-400 font-mono text-sm flex flex-col">
                    <div className="px-4 py-2 border-b border-green-900/30 bg-green-950/10 flex justify-between items-center">
                        <span className="text-xs font-semibold opacity-70">SYSTEM CONSOLE</span>
                        <Button variant="ghost" size="sm" className="h-6 text-xs text-green-400 hover:text-green-300 hover:bg-green-900/20" onClick={() => setLogs([])}>
                            Clear
                        </Button>
                    </div>
                    <ScrollArea className="flex-1 p-4">
                        <div className="space-y-1">
                            {logs.length === 0 && <span className="opacity-50 italic">Ready...</span>}
                            {logs.map((log, i) => (
                                <div key={i} className="break-all">{log}</div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>

            </DialogContent>
        </Dialog>
    );
};
