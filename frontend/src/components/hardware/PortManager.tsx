import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { hardwareService, type IController, type IPortState } from '../../services/hardwareService';
import { toast } from 'sonner';

interface PortManagerProps {
    controller: IController | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpdate?: () => void;
}

export const PortManager: React.FC<PortManagerProps> = ({
    controller,
    open,
    onOpenChange,
    onUpdate
}) => {
    const [localPorts, setLocalPorts] = useState<Record<string, IPortState>>({});

    useEffect(() => {
        if (controller && open) {
            // Deep copy to avoid mutating props
            setLocalPorts(JSON.parse(JSON.stringify(controller.ports || {})));
        }
    }, [controller, open]);

    const handleUpdatePort = async (portId: string, updates: Partial<IPortState>) => {
        if (!controller) return;

        // Optimistic update
        setLocalPorts(prev => ({
            ...prev,
            [portId]: { ...prev[portId], ...updates }
        }));

        try {
            const updatedPorts = {
                ...controller.ports,
                [portId]: { ...controller.ports[portId], ...updates }
            };

            await hardwareService.updateController(controller._id, {
                ports: updatedPorts
            });

            toast.success(`Port ${portId} updated`);
            if (onUpdate) onUpdate();
        } catch (error) {
            // Revert optimistic update
            setLocalPorts(prev => ({
                ...prev,
                [portId]: { ...prev[portId], ...controller.ports[portId] }
            }));
            toast.error('Failed to update port');
        }
    };

    if (!controller) return null;

    // Sort ports naturally (A0, A1, D0, D1...)
    const sortedPorts = Object.entries(localPorts).sort((a, b) => {
        return a[0].localeCompare(b[0], undefined, { numeric: true, sensitivity: 'base' });
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Manage Ports - {controller.name}</DialogTitle>
                    <DialogDescription>
                        Enable or disable specific ports on this controller.
                        Occupied ports cannot be disabled manually.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-4">
                        {sortedPorts.map(([portId, state]) => (
                            <div
                                key={portId}
                                className="flex items-center justify-between p-3 border rounded-lg bg-card"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${state.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                                    <div>
                                        <div className="font-medium">{portId}</div>
                                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                                            {state.isOccupied ? (
                                                <span className="text-red-500 font-medium">
                                                    Occupied
                                                </span>
                                            ) : (
                                                <span className="text-green-600">Available</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    {state.isOccupied ? (
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <div className="flex items-center gap-2 opacity-80 cursor-not-allowed">
                                                        <Badge variant="destructive" className="text-[10px] px-1 py-0 h-5">
                                                            IN USE
                                                        </Badge>
                                                        <Switch
                                                            checked={state.isActive}
                                                            disabled={true}
                                                        />
                                                    </div>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p className="text-xs">
                                                        <strong>Occupied by:</strong> {state.occupiedBy?.name || 'Unknown Device'}
                                                        <br />
                                                        <span className="text-muted-foreground">Type: {state.occupiedBy?.type || 'Unknown'}</span>
                                                    </p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    ) : (
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Logic</span>
                                                <Select
                                                    value={state.triggerLogic || 'HIGH'}
                                                    onValueChange={(val) => handleUpdatePort(portId, { triggerLogic: val as any })}
                                                >
                                                    <SelectTrigger className="h-7 text-xs w-[80px]">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="HIGH">HIGH</SelectItem>
                                                        <SelectItem value="LOW">LOW</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="flex items-center justify-end gap-2">
                                                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Port</span>
                                                <Switch
                                                    checked={state.isActive}
                                                    onCheckedChange={() => handleUpdatePort(portId, { isActive: !state.isActive })}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};
