import React, { useMemo } from 'react';
import type { DeviceTemplate, BoardDefinition, CommandDefinition } from '@/services/firmwareBuilderService';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertCircle } from 'lucide-react';
import { checkCompatibility, calculateResourceUsage } from '@/utils/firmwareValidation';

interface Props {
    devices: DeviceTemplate[];
    selectedDeviceIds: string[];
    selectedBoard?: BoardDefinition;
    commands: CommandDefinition[];
    onToggle: (id: string) => void;
}

export const DeviceSelectionStep: React.FC<Props> = ({ devices, selectedDeviceIds, selectedBoard, commands, onToggle }) => {

    // Filter devices compatible with the board (basic check)
    // We keep the list broad but disable incompatible ones
    const allDevices = devices;

    // Group by category
    const groupedDevices = allDevices.reduce((acc, device) => {
        const category = device.uiConfig?.category || 'Other';
        if (!acc[category]) acc[category] = [];
        acc[category].push(device);
        return acc;
    }, {} as Record<string, DeviceTemplate[]>);

    // Calculate current resource usage based on SELECTED devices
    const selectedDevices = devices.filter(d => selectedDeviceIds.includes(d._id));

    // Calculate current resource usage
    const currentUsage = useMemo(() => {
        return calculateResourceUsage(selectedDevices, selectedBoard || undefined);
    }, [selectedDevices, selectedBoard]);

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
        return true;
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
                                const isSelected = selectedDeviceIds.includes(device._id);
                                const commandAvailable = isCommandAvailable(device);
                                const missingCmd = getMissingCommandName(device);

                                // Check compatibility
                                // If already selected, we consider it compatible (or at least don't block unchecking)
                                // If NOT selected, we check if adding it would violate constraints
                                let validation: { compatible: boolean; reason?: string } = { compatible: true };
                                if (selectedBoard && !isSelected) {
                                    validation = checkCompatibility(selectedBoard, device, currentUsage);
                                }

                                const isDisabled = !commandAvailable || (!isSelected && !validation.compatible);

                                return (
                                    <TooltipProvider key={device._id}>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div
                                                    className={`flex items-start space-x-3 p-3 border rounded-md transition-colors ${isDisabled
                                                        ? 'opacity-50 cursor-not-allowed bg-muted'
                                                        : isSelected
                                                            ? 'bg-primary/5 border-primary cursor-pointer'
                                                            : 'hover:bg-muted/50 cursor-pointer'
                                                        }`}
                                                    onClick={() => !isDisabled && onToggle(device._id)}
                                                >
                                                    <Checkbox
                                                        id={device._id}
                                                        checked={isSelected}
                                                        onCheckedChange={() => !isDisabled && onToggle(device._id)}
                                                        disabled={isDisabled}
                                                    />
                                                    <div className="space-y-1 flex-1">
                                                        <div className="flex justify-between items-start">
                                                            <Label htmlFor={device._id} className={`font-medium ${!isDisabled ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                                                                {device.name}
                                                            </Label>
                                                            {isDisabled && (
                                                                <AlertCircle className="w-4 h-4 text-destructive" />
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-muted-foreground">
                                                            {device.description}
                                                        </p>
                                                        <div className="flex gap-1 mt-1">
                                                            {device.requirements?.interface && (
                                                                <Badge variant="secondary" className="text-[10px] px-1 py-0 h-5">
                                                                    {device.requirements.interface}
                                                                </Badge>
                                                            )}
                                                            {device.requirements?.voltage && (
                                                                <Badge variant="outline" className="text-[10px] px-1 py-0 h-5">
                                                                    {Array.isArray(device.requirements.voltage)
                                                                        ? device.requirements.voltage.map(v => typeof v === 'number' ? `${v}V` : v).join(' / ')
                                                                        : device.requirements.voltage}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TooltipTrigger>
                                            {isDisabled && (
                                                <TooltipContent>
                                                    {!commandAvailable ? (
                                                        <>
                                                            <p>Missing Firmware Command: <span className="font-mono font-bold">{missingCmd}</span></p>
                                                            <p className="text-xs text-muted-foreground">This device requires a firmware command that is not yet implemented.</p>
                                                        </>
                                                    ) : (
                                                        <p className="text-destructive font-semibold">{validation.reason}</p>
                                                    )}
                                                </TooltipContent>
                                            )}
                                        </Tooltip>
                                    </TooltipProvider>
                                );
                            })}
                        </div>
                    </div>
                ))}

                {allDevices.length === 0 && (
                    <div className="text-center p-8 text-muted-foreground border border-dashed rounded-md">
                        No devices found.
                    </div>
                )}
            </div>
        </ScrollArea>
    );
};
