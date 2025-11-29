import React from 'react';
import type { DeviceTemplate, BoardDefinition, CommandDefinition } from '@/services/firmwareBuilderService';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertCircle } from 'lucide-react';

interface Props {
    devices: DeviceTemplate[];
    selectedDeviceIds: string[];
    selectedBoard?: BoardDefinition;
    commands: CommandDefinition[];
    onToggle: (id: string) => void;
}

export const DeviceSelectionStep: React.FC<Props> = ({ devices, selectedDeviceIds, selectedBoard, commands, onToggle }) => {

    // Filter devices compatible with the board
    const compatibleDevices = devices.filter(device => {
        if (!selectedBoard) return false;

        // Check port requirements
        for (const req of device.portRequirements) {
            if (req.type === 'analog') {
                if ((selectedBoard.pins.analog_input_count || 0) < 1) return false;
            }
            if (req.type === 'digital') {
                if ((selectedBoard.pins.digital_count || 0) < 1) return false;
            }
            if (req.type === 'i2c') {
                if (!selectedBoard.interfaces.i2c || selectedBoard.interfaces.i2c.length === 0) return false;
            }
            // Add more checks as needed (UART, etc.)
        }
        return true;
    });

    // Group by category
    const groupedDevices = compatibleDevices.reduce((acc, device) => {
        const category = device.uiConfig?.category || 'Other';
        if (!acc[category]) acc[category] = [];
        acc[category].push(device);
        return acc;
    }, {} as Record<string, DeviceTemplate[]>);

    const isCommandAvailable = (device: DeviceTemplate) => {
        if (device.commands) {
            // Check if ALL required hardware commands exist
            return Object.values(device.commands).every((cmdConfig: any) => {
                if (cmdConfig.hardwareCmd) {
                    return commands.some(c => c.id.toLowerCase() === cmdConfig.hardwareCmd.toLowerCase());
                }
                return true;
            });
        }
        return true; // No command required? Assume available.
    };

    const getMissingCommandName = (device: DeviceTemplate) => {
        if (device.commands) {
            for (const cmdConfig of Object.values(device.commands) as any[]) {
                if (cmdConfig.hardwareCmd && !commands.some((c: any) => c.id.toLowerCase() === cmdConfig.hardwareCmd.toLowerCase())) {
                    return cmdConfig.hardwareCmd;
                }
            }
        }
        return null;
    };

    return (
        <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-6">
                {Object.entries(groupedDevices).map(([category, categoryDevices]) => (
                    <div key={category} className="space-y-3">
                        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">{category}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {categoryDevices.map(device => {
                                const available = isCommandAvailable(device);
                                const missingCmd = getMissingCommandName(device);

                                return (
                                    <TooltipProvider key={device._id}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div
                                                    className={`flex items-start space-x-3 p-3 border rounded-md transition-colors ${!available
                                                        ? 'opacity-50 cursor-not-allowed bg-muted'
                                                        : selectedDeviceIds.includes(device._id)
                                                            ? 'bg-primary/5 border-primary cursor-pointer'
                                                            : 'hover:bg-muted/50 cursor-pointer'
                                                        }`}
                                                    onClick={() => available && onToggle(device._id)}
                                                >
                                                    <Checkbox
                                                        id={device._id}
                                                        checked={selectedDeviceIds.includes(device._id)}
                                                        onCheckedChange={() => available && onToggle(device._id)}
                                                        disabled={!available}
                                                    />
                                                    <div className="space-y-1 flex-1">
                                                        <div className="flex justify-between items-start">
                                                            <Label htmlFor={device._id} className={`font-medium ${available ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                                                                {device.name}
                                                            </Label>
                                                            {!available && (
                                                                <AlertCircle className="w-4 h-4 text-destructive" />
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-muted-foreground">
                                                            {device.description}
                                                        </p>
                                                        <div className="flex gap-1 mt-1">
                                                            {device.portRequirements.map((req, idx) => (
                                                                <Badge key={idx} variant="secondary" className="text-[10px] px-1 py-0 h-5">
                                                                    {req.type}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TooltipTrigger>
                                            {!available && (
                                                <TooltipContent>
                                                    <p>Missing Firmware Command: <span className="font-mono font-bold">{missingCmd}</span></p>
                                                    <p className="text-xs text-muted-foreground">This device requires a firmware command that is not yet implemented.</p>
                                                </TooltipContent>
                                            )}
                                        </Tooltip>
                                    </TooltipProvider>
                                );
                            })}
                        </div>
                    </div>
                ))}

                {compatibleDevices.length === 0 && (
                    <div className="text-center p-8 text-muted-foreground border border-dashed rounded-md">
                        No compatible devices found for this board.
                    </div>
                )}
            </div>
        </ScrollArea>
    );
};
