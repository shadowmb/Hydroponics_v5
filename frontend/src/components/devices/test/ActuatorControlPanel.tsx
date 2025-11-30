import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { hardwareService } from '../../../services/hardwareService';
import { toast } from 'sonner';
import { Loader2, Power, RefreshCw } from 'lucide-react';
import { cn } from "@/lib/utils";

interface ActuatorControlPanelProps {
    device: any;
    onLog?: (msg: string, type: 'info' | 'error' | 'success') => void;
}

export const ActuatorControlPanel: React.FC<ActuatorControlPanelProps> = ({ device, onLog }) => {
    const [state, setState] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isToggling, setIsToggling] = useState(false);

    const readState = async (silent = false) => {
        try {
            if (!silent) setIsLoading(true);
            const result = await hardwareService.testDevice(device._id);
            // Expecting result.value to be 1 or 0, or boolean
            if (result) {
                // Log raw result for debugging
                if (onLog) onLog(`Read Result: ${JSON.stringify(result)}`, 'info');
                console.log('Actuator Read Result:', result);

                // Normalize to boolean
                const boolState = result.value === 1 || result.value === true || result.value === '1';
                setState(boolState);
                if (!silent) toast.success(`Status updated: ${boolState ? 'ON' : 'OFF'}`);
            }
        } catch (error) {
            console.error('Failed to read state:', error);
            if (!silent) toast.error('Failed to read device status');
        } finally {
            if (!silent) setIsLoading(false);
        }
    };

    const toggleState = async () => {
        try {
            setIsToggling(true);
            const newState = !state;

            // We need to pass driverId. It's usually in device.config.driverId
            // If populated, it's an object, otherwise string.
            const driverId = typeof device.config?.driverId === 'object'
                ? device.config.driverId.id || device.config.driverId._id
                : device.config?.driverId;

            await hardwareService.executeCommand(device._id, 'RELAY_SET', {
                state: newState ? 1 : 0,
                driverId: driverId
            });

            toast.success(`Device turned ${newState ? 'ON' : 'OFF'}`);
            setState(newState);

            // Verify removed as per user request - we trust the command succeeded
            // setTimeout(() => readState(true), 1000);

        } catch (error) {
            console.error('Failed to toggle:', error);
            toast.error('Failed to toggle device');
        } finally {
            setIsToggling(false);
        }
    };

    const runForDuration = async (seconds: number) => {
        try {
            if (state) return; // Already running

            setIsToggling(true);
            toast.info(`Running for ${seconds} seconds...`);

            // Turn ON
            const driverId = typeof device.config?.driverId === 'object'
                ? device.config.driverId.id || device.config.driverId._id
                : device.config?.driverId;

            await hardwareService.executeCommand(device._id, 'RELAY_SET', {
                state: 1,
                driverId: driverId
            });
            setState(true);

            // Wait
            await new Promise(resolve => setTimeout(resolve, seconds * 1000));

            // Turn OFF
            await hardwareService.executeCommand(device._id, 'RELAY_SET', {
                state: 0,
                driverId: driverId
            });
            setState(false);
            toast.success('Finished run cycle');

        } catch (error) {
            console.error('Run cycle failed:', error);
            toast.error('Run cycle failed');
            // Try to force off just in case
            try {
                const driverId = typeof device.config?.driverId === 'object'
                    ? device.config.driverId.id || device.config.driverId._id
                    : device.config?.driverId;
                await hardwareService.executeCommand(device._id, 'RELAY_SET', { state: 0, driverId });
                setState(false);
            } catch (e) { /* ignore */ }
        } finally {
            setIsToggling(false);
        }
    };

    // Initial read removed as per user request to avoid auto-commands
    // useEffect(() => {
    //    readState();
    // }, [device._id]);

    return (
        <div className="flex flex-col items-center justify-center space-y-8 py-8">
            {/* Header removed as per user request */}

            <Card className="w-full max-w-md border-2">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-center">
                        Current Status
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-6 pt-4">

                    {/* Status Display */}
                    <div className={cn(
                        "text-4xl font-bold transition-colors duration-300",
                        state === true ? "text-green-500" : (state === false ? "text-slate-400" : "text-amber-500")
                    )}>
                        {state === null ? 'UNKNOWN' : (state ? 'ON' : 'OFF')}
                    </div>

                    {/* Big Toggle Button */}
                    <Button
                        variant={state ? "default" : "outline"}
                        size="lg"
                        className={cn(
                            "h-32 w-32 rounded-full border-4 transition-all duration-300 shadow-lg",
                            state
                                ? "bg-green-500 hover:bg-green-600 border-green-600 shadow-green-500/20"
                                : "hover:bg-slate-100 border-slate-200"
                        )}
                        onClick={toggleState}
                        disabled={isLoading || isToggling || state === null}
                        title={state === null ? "Please refresh status first" : "Toggle Device"}
                    >
                        {isToggling ? (
                            <Loader2 className="h-12 w-12 animate-spin" />
                        ) : (
                            <Power className={cn("h-12 w-12", state ? "text-white" : "text-slate-400")} />
                        )}
                    </Button>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 gap-4 w-full pt-4 border-t">
                        <Button
                            variant="outline"
                            onClick={() => runForDuration(5)}
                            disabled={isLoading || isToggling}
                        >
                            Run 5s
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => runForDuration(10)}
                            disabled={isLoading || isToggling}
                        >
                            Run 10s
                        </Button>
                    </div>

                    {/* Refresh Button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => readState()}
                        disabled={isLoading}
                        className="text-muted-foreground"
                    >
                        <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
                        Refresh Status
                    </Button>

                </CardContent>
            </Card>
        </div>
    );
};
