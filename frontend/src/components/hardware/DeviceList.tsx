import React, { useEffect, useState } from 'react';
import { hardwareService } from '../../services/hardwareService';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DeviceTestDialog } from '../devices/test/DeviceTestDialog';
import { DeviceListTable } from './DeviceListTable';

interface DeviceListProps {
    onEdit?: (device: any) => void;
    onRefreshDevice?: (device: any) => void;
}

export const DeviceList: React.FC<DeviceListProps> = ({ onEdit, onRefreshDevice }) => {
    const [devices, setDevices] = useState<any[]>([]);
    const [controllers, setControllers] = useState<any[]>([]);
    const [relays, setRelays] = useState<any[]>([]);
    const [testDialogOpen, setTestDialogOpen] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deviceToDelete, setDeviceToDelete] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
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
        } catch (error: any) {
            const msg = error.response?.data?.error || error.message || 'Failed to delete device';
            toast.error(msg, { duration: 5000 });
        }
    };

    const handleTest = (device: any) => {
        setTestDialogOpen(device._id);
    };

    return (
        <div className="space-y-4">
            <DeviceListTable
                devices={devices}
                controllers={controllers}
                relays={relays}
                onEdit={onEdit}
                onRefreshDevice={onRefreshDevice}
                onTest={handleTest}
                onDelete={handleDeleteClick}
            />

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
