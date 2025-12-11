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
import { DeviceValidationSettings } from './DeviceValidationSettings';

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

    // New state for template info
    const [hardwareLimits, setHardwareLimits] = useState<{ min?: number, max?: number, unit?: string } | undefined>(undefined);

    useEffect(() => {
        // Get Hardware Limits & Base Unit from populated driverId (or fallback to fetching templates)
        const extractTemplateInfo = () => {
            // driverId might be populated as an object with all template data
            const template = typeof device?.config?.driverId === 'object'
                ? device.config.driverId
                : null;

            if (template) {
                console.log('🔍 [DeviceTestDialog] Using populated driverId:', template._id || template.id);

                let baseUnit = 'raw';
                let hwMin: number | undefined;
                let hwMax: number | undefined;

                // 1. Try hardwareLimits (best source)
                if (template.hardwareLimits?.unit) {
                    baseUnit = template.hardwareLimits.unit;
                    hwMin = template.hardwareLimits.min;
                    hwMax = template.hardwareLimits.max;
                    console.log('🔍 [DeviceTestDialog] Found hardwareLimits:', { baseUnit, hwMin, hwMax });
                }

                // 2. Fallback: Try commands.READ.outputs[0].unit
                if (baseUnit === 'raw' && template.commands?.READ?.outputs?.[0]?.unit) {
                    baseUnit = template.commands.READ.outputs[0].unit;
                    console.log('🔍 [DeviceTestDialog] Using commands.READ.outputs[0].unit:', baseUnit);
                }

                // 3. Final fallback: uiConfig.units[0]
                if (baseUnit === 'raw' && template.uiConfig?.units?.[0]) {
                    baseUnit = template.uiConfig.units[0];
                    console.log('🔍 [DeviceTestDialog] Using uiConfig.units[0]:', baseUnit);
                }

                console.log('🔍 [DeviceTestDialog] FINAL setHardwareLimits:', { min: hwMin, max: hwMax, unit: baseUnit });
                setHardwareLimits({ min: hwMin, max: hwMax, unit: baseUnit });

                if (template.uiConfig?.units) {
                    setAvailableUnits(template.uiConfig.units);
                }
            } else {
                console.warn('🔍 [DeviceTestDialog] driverId is not populated, template info unavailable');
            }
        };

        extractTemplateInfo();
    }, [device?.config?.driverId]);

    const addLog = (msg: string, type: 'info' | 'error' | 'success' = 'info') => {
        const time = new Date().toLocaleTimeString();
        setLogs(prev => [`[${time}] [${type.toUpperCase()}] ${msg}`, ...prev].slice(0, 50));
    };

    const readValue = async () => {
        try {
            addLog('Reading value...', 'info');
            const result = await hardwareService.testDevice(device._id);
            // Result format: { raw: 123, value: 1.2, unit: 'cm' }
            console.log('DeviceTestDialog Read Result:', result);

            if (result) {
                setLiveValue(result.value);
                setLiveUnit(result.unit);
                setRawValue(result.raw);
                setMultiValues(result.details);

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

    const handleUnitChange = async (unit: string, key: string = 'default') => {
        try {
            // Determine payload
            let body: any = {};
            if (key === 'default') {
                body = { displayUnit: unit };
            } else {
                // If checking for map support, we need to send the whole object or use a specific endpoint?
                // Standard PATCH usually merges top-level. 
                // Mongoose 'displayUnits' is a Map.
                // We likely need to send { displayUnits: { [key]: unit } } and handle merge on backend?
                // Or simply send the updated map. 
                // Let's assume backend merges or we send the delta.
                // Best practice: Send the structure we want.

                // We need current displayUnits to merge? 
                // Simplest: Send { displayUnits: { [key]: unit } } and backend Mongoose might replace the map if not careful.
                // Let's rely on standard object structure:
                const currentMap = device.displayUnits || {};
                body = {
                    displayUnits: {
                        ...currentMap,
                        [key]: unit
                    }
                };
            }

            const res = await fetch(`/api/hardware/devices/${device._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!res.ok) throw new Error('Failed to update');

            if (onDeviceUpdate) onDeviceUpdate();
            readValue(); // Refresh value immediately
            toast.success(`Unit for ${key === 'default' ? 'Device' : key} set to ${unit}`);
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

                                        </div>
                                    </>
                                )}

                                {/* Data Grid or Control Panel */}
                                <div className="w-full max-w-3xl">
                                    {device.config?.driverId?.category === 'ACTUATOR' ? (
                                        <ActuatorControlPanel device={device} onLog={addLog} />
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                                            {/* Logic for Multi-Output Sensors */}
                                            {(device.config?.driverId?.commands?.READ?.outputs || [{ key: '_primary', label: 'Value', unit: device.config?.driverId?.uiConfig?.units?.[0] }]).map((output: any) => {
                                                // Resolve Value
                                                // If outputs > 1, check multiValues[key]. If not, use liveValue (primary).
                                                const isMulti = device.config?.driverId?.commands?.READ?.outputs?.length > 1;
                                                const key = output.key || '_primary';

                                                // Value Logic:
                                                // 1. Try multiValues[key] (raw form from backend might differ)
                                                // 2. Try liveValue if single
                                                // 3. Backend now returns 'readings' object with CONVERTED values if configured

                                                // We need raw base value for the "Small" display.
                                                // But 'liveValue' comes pre-converted if primary. 
                                                // 'multiValues' (details) usually has the RAW response.

                                                // Let's assume 'readings' in event/response has the processed values.
                                                // But initially we only have 'liveValue' (primary) and 'multiValues' (raw details).
                                                // We rely on the backend sending valid 'readings' structure in 'details' or similar?
                                                // In 'readValue', we setMultiValues(result.details).

                                                // If we want accurate "Base vs Converted" here without complex frontend math,
                                                // we might need to rely on the backend sending both. 
                                                // BUT, for now, let's assume 'liveValue' IS the converted one.
                                                // And 'rawValue' is the ADC/Wire raw.

                                                // Better approach: 
                                                // If we have a display unit selected, 'val' IS converted.
                                                // We should ideally calculate 'base' by reversing or (safer) just standardizing units.
                                                // Let's Simplify: 
                                                // The backend ensures 'readings' contains the correct values.

                                                let val = isMulti && multiValues
                                                    ? multiValues[output.key]
                                                    : liveValue;

                                                if (typeof val === 'number') val = val.toFixed(2);

                                                // Unit Resolution
                                                // 1. User Override (displayUnits[key] or displayUnit)
                                                // 2. Default (output.unit)
                                                const userUnit = isMulti
                                                    ? (device.displayUnits?.[key] || device.displayUnit)
                                                    : (device.displayUnit || liveUnit);

                                                const finalUnit = userUnit || output.unit;
                                                const baseUnit = output.unit; // The physical/driver unit

                                                return (
                                                    <div key={key} className="flex flex-col gap-2">
                                                        <SensorValueCard
                                                            label={output.label || 'Value'}
                                                            value={val}
                                                            unit={finalUnit}

                                                            // Pass Base Info for "Small Display" Logic
                                                            baseValue={isMulti ? null : rawValue} // Only showing raw for single for now unless we dig deeper
                                                            baseUnit={baseUnit}

                                                        // Current SensorValueCard logic uses baseValue/baseUnit to trigger "Converted" view
                                                        // validation: if finalUnit != baseUnit, it shows base below.
                                                        />

                                                        {/* Per-Value Unit Selector */}
                                                        <div className="flex justify-center">
                                                            <Select
                                                                value={finalUnit}
                                                                onValueChange={(u) => handleUnitChange(u, isMulti ? key : 'default')}
                                                            >
                                                                <SelectTrigger className="w-[100px] h-8 text-xs">
                                                                    <SelectValue placeholder="Unit" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {/* 
                                                                        Smart Unit Options:
                                                                        Ideally filtered by category (Temp vs Humidity).
                                                                        For now, we can use a helper map or just offer all if generic.
                                                                        Let's hardcode common category mappings or use availableUnits if single.
                                                                     */}
                                                                    {(availableUnits.length > 0 ? availableUnits : ['%', 'C', 'F']).map(u => (
                                                                        <SelectItem key={u} value={u} className="text-xs">{u}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>
                                                );
                                            })}
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


                            <TabsContent value="settings" className="m-0 h-full overflow-y-auto p-4 space-y-6">
                                <DeviceValidationSettings
                                    device={device}
                                    onSave={async (newConfig) => {
                                        try {
                                            const response = await fetch(`/api/hardware/devices/${device._id}`, {
                                                method: 'PUT',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    "config.validation": newConfig
                                                })
                                            });

                                            if (!response.ok) throw new Error('Failed to save settings');

                                            toast.success('Validation settings saved successfully');
                                            if (onDeviceUpdate) onDeviceUpdate();
                                        } catch (error) {
                                            console.error(error);
                                            toast.error('Failed to save settings');
                                        }
                                    }}
                                    hardwareLimits={hardwareLimits}
                                />
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

            </DialogContent >
        </Dialog >
    );
};
