import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Play, Square } from 'lucide-react';
import { hardwareService } from '../../../services/hardwareService';
import { DeviceTestHeader } from './DeviceTestHeader';
import { toast } from 'sonner';
import { ECCalibration } from './calibration/ECCalibration';

interface DeviceTestDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    device: any;
    onDeviceUpdate?: () => void;
}

export const DeviceTestDialog: React.FC<DeviceTestDialogProps> = ({ open, onOpenChange, device, onDeviceUpdate }) => {
    const [activeTab, setActiveTab] = useState('monitor');
    const [liveValue, setLiveValue] = useState<number | null>(null);
    const [rawValue, setRawValue] = useState<number | null>(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const intervalRef = useRef<any>(null);

    // Clear state when dialog opens/closes
    useEffect(() => {
        if (!open) {
            stopStream();
            setLogs([]);
            setLiveValue(null);
            setRawValue(null);
        }
    }, [open]);

    // Cleanup on unmount
    useEffect(() => {
        return () => stopStream();
    }, []);

    const addLog = (msg: string, type: 'info' | 'error' | 'success' = 'info') => {
        const time = new Date().toLocaleTimeString();
        setLogs(prev => [`[${time}] ${msg}`, ...prev].slice(0, 50));
    };

    const readValue = async () => {
        try {
            addLog('Reading value...', 'info');
            const result = await hardwareService.testDevice(device._id);
            // Result format: { raw: 123, value: 1.2 } (Unwrapped by service)

            if (result) {
                setLiveValue(result.value);
                setRawValue(result.raw);

                let logMsg = `Read OK: ${result.value} (Raw: ${result.raw})`;
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

    const toggleStream = () => {
        if (isStreaming) {
            stopStream();
        } else {
            startStream();
        }
    };

    const startStream = () => {
        setIsStreaming(true);
        addLog('Starting live stream (1s interval)...', 'info');
        readValue(); // Read immediately
        intervalRef.current = setInterval(readValue, 1000);
    };

    const stopStream = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        setIsStreaming(false);
        addLog('Live stream stopped.', 'info');
    };

    if (!device) return null;

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
                    liveValue={liveValue}
                    rawValue={rawValue}
                    unit={device.config?.driverId?.defaultUnits?.[0]}
                    status={device.status || 'offline'}
                />

                {/* Main Content */}
                <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                        <div className="border-b px-4 bg-muted/5">
                            <TabsList className="h-12">
                                <TabsTrigger value="monitor" className="px-6">Monitor & Test</TabsTrigger>
                                <TabsTrigger value="calibration" className="px-6">Calibration</TabsTrigger>
                                <TabsTrigger value="settings" className="px-6">Settings</TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="flex-1 overflow-y-auto bg-background p-6 min-h-0">

                            <TabsContent value="monitor" className="m-0 flex flex-col items-center justify-center space-y-8">
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

                                {/* Placeholder for Chart */}
                                <div className="w-full max-w-2xl h-48 border rounded-lg bg-muted/5 flex items-center justify-center text-muted-foreground border-dashed">
                                    Chart Visualization Coming Soon
                                </div>
                            </TabsContent>

                            <TabsContent value="calibration" className="m-0">
                                <ECCalibration device={device} onUpdate={() => onDeviceUpdate && onDeviceUpdate()} />
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
