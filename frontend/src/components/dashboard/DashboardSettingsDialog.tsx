import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { toast } from 'sonner';
import { Settings, Thermometer, Droplet, Zap, Ruler, Wind, Sun, Percent, Beaker, Leaf, Gauge, Activity, Clock, ChevronDown } from 'lucide-react';
import { useDashboardConfig } from '../../hooks/useDashboardConfig';
import { Collapsible, CollapsibleContent } from '../ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

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

    // New Config Hook
    const { updateSensorConfig, getSensorConfig } = useDashboardConfig();
    const [openConfigId, setOpenConfigId] = useState<string | null>(null);

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
                if (newSet.size >= 9) {
                    toast.error('Maximum 9 sensors can be pinned');
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
            const unpinPromises = devices
                .filter(d => d.dashboardPinned && !selectedIds.has(d._id))
                .map(d =>
                    fetch(`/api/hardware/devices/${d._id}/pin`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ pinned: false })
                    })
                );

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
                            📊 Pinned Sensors (max 9)
                        </h4>
                        <p className="text-xs text-muted-foreground mb-4">
                            Select up to 9 sensors to display on the dashboard. Click the gear icon to configure ranges and aliases.
                        </p>

                        {devices.length === 0 ? (
                            <div className="text-center text-muted-foreground py-8">
                                No sensors available
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {devices.map(device => {
                                    const isSelected = selectedIds.has(device._id);
                                    const sensorConfig = getSensorConfig(device._id);
                                    const isConfigOpen = openConfigId === device._id;

                                    return (
                                        <div key={device._id} className={`rounded-lg border transition-all ${isConfigOpen ? 'bg-muted/30 border-primary/30' : 'hover:bg-muted/50'}`}>
                                            <div
                                                className="flex items-center space-x-3 p-3 select-none cursor-pointer"
                                                onClick={() => setOpenConfigId(isConfigOpen ? null : device._id)}
                                            >
                                                <div onClick={(e) => e.stopPropagation()}>
                                                    <Checkbox
                                                        id={device._id}
                                                        checked={isSelected}
                                                        onCheckedChange={() => handleToggle(device._id)}
                                                    />
                                                </div>
                                                <div className="flex-1 flex items-center justify-between">
                                                    <span className={`font-medium text-sm ${!isSelected && 'text-muted-foreground'}`}>
                                                        {sensorConfig.alias || device.name}
                                                        {sensorConfig.alias && <span className="text-xs text-muted-foreground ml-2">({device.name})</span>}
                                                    </span>

                                                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isConfigOpen ? 'rotate-180' : ''}`} />
                                                </div>
                                            </div>

                                            <Collapsible open={isConfigOpen}>
                                                <CollapsibleContent className="px-4 pb-4 pt-0 space-y-3 border-t border-border/50 mt-2">


                                                    <div className="grid grid-cols-2 gap-4 pt-3">
                                                        <div className="space-y-1">
                                                            <Label className="text-xs">Custom Alias</Label>
                                                            <Input
                                                                className="h-8 text-xs"
                                                                placeholder="e.g. Nutrient Tank 1"
                                                                value={sensorConfig.alias || ''}
                                                                onChange={(e) => updateSensorConfig(device._id, { alias: e.target.value })}
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <Label className="text-xs">Icon</Label>
                                                            <Select
                                                                value={sensorConfig.icon || 'auto'}
                                                                onValueChange={(val) => updateSensorConfig(device._id, { icon: val === 'auto' ? undefined : val })}
                                                            >
                                                                <SelectTrigger className="h-8 text-xs w-full">
                                                                    <SelectValue placeholder="Auto" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="auto"><span className="flex items-center gap-2"><Settings className="h-3 w-3" /> Auto (Default)</span></SelectItem>
                                                                    <SelectItem value="thermometer"><span className="flex items-center gap-2"><Thermometer className="h-3 w-3 text-orange-500" /> Thermometer</span></SelectItem>
                                                                    <SelectItem value="droplet"><span className="flex items-center gap-2"><Droplet className="h-3 w-3 text-blue-500" /> Water/Humidity</span></SelectItem>
                                                                    <SelectItem value="zap"><span className="flex items-center gap-2"><Zap className="h-3 w-3 text-yellow-500" /> Energy/EC</span></SelectItem>
                                                                    <SelectItem value="ruler"><span className="flex items-center gap-2"><Ruler className="h-3 w-3 text-green-500" /> Level/Distance</span></SelectItem>
                                                                    <SelectItem value="wind"><span className="flex items-center gap-2"><Wind className="h-3 w-3 text-sky-500" /> Air/CO2</span></SelectItem>
                                                                    <SelectItem value="sun"><span className="flex items-center gap-2"><Sun className="h-3 w-3 text-amber-500" /> Light/PAR</span></SelectItem>
                                                                    <SelectItem value="percent"><span className="flex items-center gap-2"><Percent className="h-3 w-3 text-indigo-500" /> Percentage</span></SelectItem>
                                                                    <SelectItem value="beaker"><span className="flex items-center gap-2"><Beaker className="h-3 w-3 text-purple-500" /> pH/Chemical</span></SelectItem>
                                                                    <SelectItem value="leaf"><span className="flex items-center gap-2"><Leaf className="h-3 w-3 text-emerald-600" /> Soil/Plant</span></SelectItem>
                                                                    <SelectItem value="gauge"><span className="flex items-center gap-2"><Gauge className="h-3 w-3 text-red-500" /> Pressure/Flow</span></SelectItem>
                                                                    <SelectItem value="clock"><span className="flex items-center gap-2"><Clock className="h-3 w-3 text-gray-500" /> Time/Cycle</span></SelectItem>
                                                                    <SelectItem value="activity"><span className="flex items-center gap-2"><Activity className="h-3 w-3 text-pink-500" /> Generic</span></SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 pt-2">
                                                        <Checkbox
                                                            id={`trend-${device._id}`}
                                                            checked={sensorConfig.showTrend !== false} // Default true
                                                            onCheckedChange={(c) => updateSensorConfig(device._id, { showTrend: c === true })}
                                                        />
                                                        <Label htmlFor={`trend-${device._id}`} className="text-xs cursor-pointer">Show Trend Arrow</Label>
                                                    </div>

                                                    <div className="space-y-1">
                                                        <Label className="text-xs font-semibold">Target Range (Green Zone)</Label>
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-1 space-y-1">
                                                                <Label className="text-[10px] text-muted-foreground">Min</Label>
                                                                <Input
                                                                    type="number"
                                                                    className="h-8 text-xs font-mono"
                                                                    value={sensorConfig.min ?? ''}
                                                                    placeholder="No Limit"
                                                                    onChange={(e) => updateSensorConfig(device._id, { min: e.target.value ? parseFloat(e.target.value) : undefined })}
                                                                />
                                                            </div>
                                                            <div className="flex-1 space-y-1">
                                                                <Label className="text-[10px] text-muted-foreground">Max</Label>
                                                                <Input
                                                                    type="number"
                                                                    className="h-8 text-xs font-mono"
                                                                    value={sensorConfig.max ?? ''}
                                                                    placeholder="No Limit"
                                                                    onChange={(e) => updateSensorConfig(device._id, { max: e.target.value ? parseFloat(e.target.value) : undefined })}
                                                                />
                                                            </div>
                                                            <div className="flex-1 space-y-1">
                                                                <Label className="text-[10px] text-muted-foreground">Tolerance (+/-)</Label>
                                                                <Input
                                                                    type="number"
                                                                    className="h-8 text-xs font-mono"
                                                                    value={sensorConfig.tolerance ?? ''}
                                                                    placeholder="0"
                                                                    onChange={(e) => updateSensorConfig(device._id, { tolerance: e.target.value ? parseFloat(e.target.value) : undefined })}
                                                                />
                                                            </div>
                                                        </div>
                                                        <p className="text-[10px] text-muted-foreground italic pt-1">
                                                            Values outside (Min-Tol) to (Max+Tol) will show as warnings (Orange/Red).
                                                        </p>
                                                    </div>
                                                </CollapsibleContent>
                                            </Collapsible>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="text-xs text-muted-foreground">
                        Selected: {selectedIds.size} / 9
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
