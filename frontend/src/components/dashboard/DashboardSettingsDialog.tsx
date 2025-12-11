import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { toast } from 'sonner';

interface Device {
    _id: string;
    name: string;
    type: string;
    group: string;
    dashboardPinned?: boolean;
    dashboardOrder?: number;
}

interface DashboardSettingsDialogProps {
    open: boolean;
    onClose: () => void;
    onSave: () => void;
}

export const DashboardSettingsDialog: React.FC<DashboardSettingsDialogProps> = ({
    open,
    onClose,
    onSave
}) => {
    const [devices, setDevices] = useState<Device[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            fetchDevices();
        }
    }, [open]);

    const fetchDevices = async () => {
        try {
            const res = await fetch('/api/hardware/devices');
            if (res.ok) {
                const data = await res.json();
                const sensorDevices = (data.data || []).filter((d: Device) => d.type === 'SENSOR');
                setDevices(sensorDevices);

                // Pre-select pinned devices
                const pinned = new Set<string>(
                    sensorDevices
                        .filter((d: Device) => d.dashboardPinned)
                        .map((d: Device) => d._id)
                );
                setSelectedIds(pinned);
            }
        } catch (error) {
            console.error('Failed to fetch devices:', error);
            toast.error('Failed to load devices');
        }
    };

    const handleToggle = (deviceId: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(deviceId)) {
                newSet.delete(deviceId);
            } else {
                if (newSet.size >= 6) {
                    toast.error('Maximum 6 sensors can be pinned');
                    return prev;
                }
                newSet.add(deviceId);
            }
            return newSet;
        });
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            // Unpin all first
            const unpinPromises = devices
                .filter(d => d.dashboardPinned && !selectedIds.has(d._id))
                .map(d =>
                    fetch(`/api/hardware/devices/${d._id}/pin`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ pinned: false })
                    })
                );

            // Pin selected
            const pinPromises = Array.from(selectedIds).map((id, index) =>
                fetch(`/api/hardware/devices/${id}/pin`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ pinned: true, order: index })
                })
            );

            await Promise.all([...unpinPromises, ...pinPromises]);

            toast.success('Dashboard settings saved');
            onSave();
            onClose();
        } catch (error) {
            console.error('Failed to save settings:', error);
            toast.error('Failed to save settings');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>⚙️ Dashboard Settings</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div>
                        <h4 className="text-sm font-semibold mb-2">
                            📊 Pinned Sensors (max 6)
                        </h4>
                        <p className="text-xs text-muted-foreground mb-4">
                            Select up to 6 sensors to display on the dashboard
                        </p>

                        {devices.length === 0 ? (
                            <div className="text-center text-muted-foreground py-8">
                                No sensors available
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {devices.map(device => (
                                    <div
                                        key={device._id}
                                        className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                                    >
                                        <Checkbox
                                            id={device._id}
                                            checked={selectedIds.has(device._id)}
                                            onCheckedChange={() => handleToggle(device._id)}
                                        />
                                        <Label
                                            htmlFor={device._id}
                                            className="flex-1 cursor-pointer"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium">{device.name}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {device.group}
                                                </span>
                                            </div>
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="text-xs text-muted-foreground">
                        Selected: {selectedIds.size} / 6
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading ? 'Saving...' : 'Save'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
