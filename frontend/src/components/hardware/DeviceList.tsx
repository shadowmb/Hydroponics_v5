import React, { useEffect, useState } from 'react';
import { hardwareService } from '../../services/hardwareService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit, Play, Activity, Droplet, Thermometer, Zap, Cpu, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { DeviceTestDialog } from '../devices/test/DeviceTestDialog';

interface DeviceListProps {
    onEdit?: (device: any) => void;
    onRefreshDevice?: (device: any) => void;
}

export const DeviceList: React.FC<DeviceListProps> = ({ onEdit, onRefreshDevice }) => {
    const [devices, setDevices] = useState<any[]>([]);
    const [controllers, setControllers] = useState<any[]>([]);
    const [relays, setRelays] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [testDialogOpen, setTestDialogOpen] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deviceToDelete, setDeviceToDelete] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [devicesData, controllersData, relaysData] = await Promise.all([
                hardwareService.getDevices(),
                hardwareService.getControllers(),
                hardwareService.getRelays()
            ]);
            setDevices(devicesData);
            setControllers(controllersData);
            setRelays(relaysData);
        } catch (error) {
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setDeviceToDelete(id);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!deviceToDelete) return;
        try {
            await hardwareService.deleteDevice(deviceToDelete);
            toast.success('Device deleted');
            setDeleteDialogOpen(false);
            setDeviceToDelete(null);
            loadData();
        } catch (error) {
            toast.error('Failed to delete device');
        }
    };

    const handleTest = (device: any) => {
        setTestDialogOpen(device._id);
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'ph': return <Droplet className="h-4 w-4 text-blue-500" />;
            case 'temp': return <Thermometer className="h-4 w-4 text-red-500" />;
            case 'ec': return <Activity className="h-4 w-4 text-green-500" />;
            case 'relay': return <Zap className="h-4 w-4 text-yellow-500" />;
            default: return <Cpu className="h-4 w-4 text-gray-500" />;
        }
    };

    const renderControllerInfo = (device: any) => {
        if (device.hardware?.parentId) {
            const ctrl = controllers.find(c => c._id === device.hardware.parentId);
            return ctrl ? (
                <span className="font-medium">{ctrl.name}</span>
            ) : <span className="text-muted-foreground">Unknown</span>;
        }
        if (device.hardware?.relayId) {
            const relay = relays.find(r => r._id === device.hardware.relayId);
            if (relay) {
                const ctrlName = relay.controllerId?.name;
                return (
                    <div className="flex flex-col">
                        <span className="font-medium">{ctrlName || 'Unassigned Relay'}</span>
                        <span className="text-xs text-muted-foreground">via {relay.name}</span>
                    </div>
                );
            }
            return <span className="text-muted-foreground">Unknown Relay</span>;
        }
        return (
            <Badge variant="destructive" className="bg-yellow-500 hover:bg-yellow-600 text-white border-0">
                Unassigned
            </Badge>
        );
    };

    const getDeviceHealth = (device: any) => {
        // User requested UI to strictly follow DB status
        // Backend now handles the logic of updating device status based on controller
        return device.status || 'offline';
    };
    const formatLastCheck = (dateString?: string) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return '< 1 min';
        if (diffMins < 60) return `${diffMins} min`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours} h`;
        return `${Math.floor(diffHours / 24)} d`;
    };

    return (
        <div className="space-y-4">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Controller</TableHead>
                            <TableHead>Connection</TableHead>
                            <TableHead>Health</TableHead>
                            <TableHead>Last Check</TableHead>
                            <TableHead>Config</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {devices.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                                    No devices found. Add one to get started.
                                </TableCell>
                            </TableRow>
                        ) : (
                            devices.map((device) => {
                                const health = getDeviceHealth(device);
                                return (
                                    <TableRow key={device._id}>
                                        <TableCell className="font-medium flex items-center gap-2">
                                            {getIcon(device.config?.driverId?.physicalType)}
                                            {device.name}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{device.config?.driverId?.name || 'Unknown'}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            {renderControllerInfo(device)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                {device.hardware?.parentId ? (
                                                    <>
                                                        {device.hardware.port ? (
                                                            <>
                                                                <span className="text-muted-foreground">Port: </span>
                                                                <Badge variant="secondary" className="font-mono">{device.hardware.port}</Badge>
                                                            </>
                                                        ) : (Array.isArray(device.hardware.pins) && device.hardware.pins.length > 0) ? (
                                                            <div className="flex flex-col gap-1">
                                                                {device.hardware.pins.map((pin: any, index: number) => (
                                                                    <div key={index} className="flex items-center gap-1">
                                                                        <span className="text-muted-foreground text-xs">{pin.role}:</span>
                                                                        <Badge variant="secondary" className="font-mono text-xs">{pin.portId}</Badge>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (device.hardware.pins && !Array.isArray(device.hardware.pins) && Object.keys(device.hardware.pins).length > 0) ? (
                                                            <div className="flex flex-col gap-1">
                                                                {Object.entries(device.hardware.pins).map(([key, value]) => (
                                                                    <div key={key} className="flex items-center gap-1">
                                                                        <span className="text-muted-foreground text-xs">{key}:</span>
                                                                        <Badge variant="secondary" className="font-mono text-xs">{value as string}</Badge>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted-foreground italic">
                                                                -
                                                            </span>
                                                        )}
                                                    </>
                                                ) : device.hardware?.relayId ? (
                                                    <>
                                                        <span className="text-muted-foreground">Relay Ch: </span>
                                                        <Badge variant="secondary" className="font-mono">{device.hardware.channel}</Badge>
                                                    </>
                                                ) : (
                                                    <span className="text-muted-foreground italic">
                                                        -
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={health === 'online' ? 'default' : health === 'error' ? 'destructive' : 'secondary'}
                                                className={health === 'error' ? 'bg-orange-500 hover:bg-orange-600' : ''}
                                            >
                                                {health === 'online' ? 'Online' : health === 'error' ? 'Error' : 'Offline'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-muted-foreground min-w-[60px]">
                                                    {formatLastCheck(device.lastConnectionCheck)}
                                                </span>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-6 w-6"
                                                    onClick={() => onRefreshDevice && onRefreshDevice(device)}
                                                    title="Refresh Status"
                                                >
                                                    <RefreshCw className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={device.isEnabled ? 'outline' : 'secondary'} className={device.isEnabled ? "border-green-500 text-green-600" : ""}>
                                                {device.isEnabled ? 'Enabled' : 'Disabled'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button size="icon" variant="ghost" onClick={() => handleTest(device)} title="Test Device">
                                                    <Play className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    title="Edit"
                                                    onClick={() => onEdit && onEdit(device)}
                                                    disabled={!onEdit}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={(e) => handleDeleteClick(device._id, e)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            <DeviceTestDialog
                open={!!testDialogOpen}
                onOpenChange={(open) => !open && setTestDialogOpen(null)}
                device={devices.find(d => d._id === testDialogOpen)}
                onDeviceUpdate={loadData}
            />

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Device</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this device? This action cannot be undone and will free up any occupied ports.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
