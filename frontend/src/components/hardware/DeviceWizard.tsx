import React, { useState, useEffect } from 'react';
import { hardwareService, type IController } from '../../services/hardwareService';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { ArrowRight, Cpu, Activity, Droplet, Thermometer, Zap, Settings2 } from 'lucide-react';
import { toast } from 'sonner';

interface DeviceWizardProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    initialData?: any; // For Edit Mode
}

export const DeviceWizard: React.FC<DeviceWizardProps> = ({ open, onOpenChange, onSuccess, initialData }) => {
    const [step, setStep] = useState(1);
    const [templates, setTemplates] = useState<any[]>([]);
    const [controllers, setControllers] = useState<IController[]>([]);
    const [relays, setRelays] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Form Data
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
    const [connectionType, setConnectionType] = useState<'direct' | 'relay'>('direct');
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        controllerId: '',
        port: '',
        relayId: '',
        channel: '',
        isEnabled: true
    });

    const isEditMode = !!initialData;

    useEffect(() => {
        if (open) {
            fetchData();
            if (initialData) {
                // Pre-fill for Edit Mode
                setStep(2); // Skip template selection
                setFormData({
                    name: initialData.name,
                    description: initialData.metadata?.description || '',
                    controllerId: initialData.hardware?.parentId || '',
                    port: initialData.hardware?.port || '',
                    relayId: initialData.hardware?.relayId || '',
                    channel: initialData.hardware?.channel !== undefined ? String(initialData.hardware.channel) : '',
                    isEnabled: initialData.isEnabled !== undefined ? initialData.isEnabled : true
                });
                // Determine connection type
                if (initialData.hardware?.relayId) {
                    setConnectionType('relay');
                } else {
                    setConnectionType('direct');
                }
                // We need to set the template to display correct info
                // Ideally we fetch it, but for now we might rely on the one in initialData if populated
                if (initialData.config?.driverId) {
                    setSelectedTemplate(initialData.config.driverId);
                }
            } else {
                // Reset for New Device
                setStep(1);
                setFormData({ name: '', description: '', controllerId: '', port: '', relayId: '', channel: '', isEnabled: true });
                setSelectedTemplate(null);
                setConnectionType('direct');
            }
        }
    }, [open, initialData]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [tpls, ctrls, rlys] = await Promise.all([
                hardwareService.getDeviceTemplates(),
                hardwareService.getControllers(),
                hardwareService.getRelays()
            ]);
            setTemplates(tpls);
            setControllers(ctrls);
            setRelays(rlys);
        } catch (error) {
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleTemplateSelect = (template: any) => {
        setSelectedTemplate(template);
        setStep(2);
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            const payload: any = {
                name: formData.name,
                type: selectedTemplate?.physicalType === 'relay' ? 'ACTUATOR' : 'SENSOR',
                isEnabled: formData.isEnabled,
                config: {
                    driverId: selectedTemplate?._id,
                    pollInterval: 5000
                },
                metadata: {
                    description: formData.description
                },
                hardware: {}
            };

            if (connectionType === 'direct') {
                payload.hardware = {
                    parentId: formData.controllerId,
                    port: formData.port
                };
            } else {
                payload.hardware = {
                    relayId: formData.relayId,
                    channel: parseInt(formData.channel)
                };
            }

            if (isEditMode) {
                await hardwareService.updateDevice(initialData._id, payload);
                toast.success('Device updated successfully');
            } else {
                await hardwareService.createDevice(payload);
                toast.success('Device created successfully');
            }

            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error.response?.data?.error || `Failed to ${isEditMode ? 'update' : 'create'} device`);
        } finally {
            setLoading(false);
        }
    };

    const getIcon = (iconName: string) => {
        switch (iconName) {
            case 'droplet': return <Droplet className="h-6 w-6" />;
            case 'thermometer': return <Thermometer className="h-6 w-6" />;
            case 'activity': return <Activity className="h-6 w-6" />;
            case 'power': return <Zap className="h-6 w-6" />;
            default: return <Cpu className="h-6 w-6" />;
        }
    };

    const getAvailablePorts = () => {
        if (!formData.controllerId) return [];
        const controller = controllers.find(c => c._id === formData.controllerId);
        if (!controller) return [];

        const req = selectedTemplate?.portRequirements[0];
        if (!req) return [];

        return Object.entries(controller.ports)
            .filter(([id, state]) => {
                // If editing and this is the current port, allow it
                if (isEditMode && initialData?.hardware?.parentId === formData.controllerId && initialData?.hardware?.port === id) return true;

                if (state.isOccupied) return false;
                if (req.type === 'analog' && !id.startsWith('A')) return false;
                if (req.type === 'digital' && !id.startsWith('D')) return false;
                return true;
            })
            .map(([id]) => id)
            .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    };

    const getAvailableChannels = () => {
        if (!formData.relayId) return [];
        const relay = relays.find(r => r._id === formData.relayId);
        if (!relay) return [];

        return relay.channels
            .filter((c: any) => {
                // If editing and this is the current channel, allow it
                if (isEditMode && initialData?.hardware?.relayId === formData.relayId && initialData?.hardware?.channel === c.channelIndex) return true;

                return !c.isOccupied;
            })
            .map((c: any) => ({
                value: String(c.channelIndex),
                label: `Channel ${c.channelIndex} ${c.name ? `(${c.name})` : ''}`
            }));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] h-[600px] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? 'Edit Device' : `Add New Device - Step ${step}`}</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto py-4">
                    {step === 1 && (
                        <div className="grid grid-cols-2 gap-4">
                            {templates.map(tpl => (
                                <Card
                                    key={tpl._id}
                                    className="cursor-pointer hover:border-primary transition-colors"
                                    onClick={() => handleTemplateSelect(tpl)}
                                >
                                    <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                                        <div className="p-2 bg-muted rounded-full">
                                            {getIcon(tpl.uiConfig?.icon)}
                                        </div>
                                        <h3 className="font-semibold">{tpl.name}</h3>
                                        <p className="text-xs text-muted-foreground line-clamp-2">{tpl.description}</p>
                                        <Badge variant="secondary">{tpl.physicalType}</Badge>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Device Name</Label>
                                <Input
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Main Tank pH"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Input
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Optional description"
                                />
                            </div>

                            <div className="flex items-center justify-between space-x-2 border p-3 rounded-md">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Enabled</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Disable to stop polling this device without deleting it.
                                    </p>
                                </div>
                                <Switch
                                    checked={formData.isEnabled}
                                    onCheckedChange={checked => setFormData({ ...formData, isEnabled: checked })}
                                />
                            </div>

                            {selectedTemplate && (
                                <div className="p-4 bg-muted/50 rounded-lg flex items-center gap-3">
                                    {getIcon(selectedTemplate.uiConfig?.icon)}
                                    <div>
                                        <p className="font-medium">{selectedTemplate.name}</p>
                                        <p className="text-xs text-muted-foreground">Type: {selectedTemplate.physicalType}</p>
                                    </div>
                                    {!isEditMode && (
                                        <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setStep(1)}>Change</Button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label>Connection Type</Label>
                                <Tabs value={connectionType} onValueChange={(v: any) => setConnectionType(v)} className="w-full">
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="direct">Direct to Controller</TabsTrigger>
                                        <TabsTrigger value="relay">Via Relay Module</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </div>

                            {connectionType === 'direct' ? (
                                <div className="space-y-4 border p-4 rounded-md">
                                    <div className="space-y-2">
                                        <Label>Select Controller</Label>
                                        <Select
                                            value={formData.controllerId}
                                            onValueChange={v => setFormData({ ...formData, controllerId: v, port: '' })}
                                        >
                                            <SelectTrigger><SelectValue placeholder="Select Controller" /></SelectTrigger>
                                            <SelectContent>
                                                {controllers.map(c => (
                                                    <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {formData.controllerId && (
                                        <div className="space-y-2">
                                            <Label>Select Port ({selectedTemplate?.portRequirements[0]?.type})</Label>
                                            <Select
                                                value={formData.port}
                                                onValueChange={v => setFormData({ ...formData, port: v })}
                                            >
                                                <SelectTrigger><SelectValue placeholder="Select Port" /></SelectTrigger>
                                                <SelectContent>
                                                    {getAvailablePorts().map(p => (
                                                        <SelectItem key={p} value={p}>{p}</SelectItem>
                                                    ))}
                                                    {getAvailablePorts().length === 0 && (
                                                        <SelectItem value="none" disabled>No available ports</SelectItem>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4 border p-4 rounded-md">
                                    <div className="space-y-2">
                                        <Label>Select Relay Module</Label>
                                        <Select
                                            value={formData.relayId}
                                            onValueChange={v => setFormData({ ...formData, relayId: v, channel: '' })}
                                        >
                                            <SelectTrigger><SelectValue placeholder="Select Relay" /></SelectTrigger>
                                            <SelectContent>
                                                {relays.map(r => (
                                                    <SelectItem key={r._id} value={r._id}>{r.name}</SelectItem>
                                                ))}
                                                {relays.length === 0 && <SelectItem value="none" disabled>No relays found</SelectItem>}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {formData.relayId && (
                                        <div className="space-y-2">
                                            <Label>Select Channel</Label>
                                            <Select
                                                value={formData.channel}
                                                onValueChange={v => setFormData({ ...formData, channel: v })}
                                            >
                                                <SelectTrigger><SelectValue placeholder="Select Channel" /></SelectTrigger>
                                                <SelectContent>
                                                    {getAvailableChannels().map(c => (
                                                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                                    ))}
                                                    {getAvailableChannels().length === 0 && (
                                                        <SelectItem value="none" disabled>No available channels</SelectItem>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter className="flex justify-between sm:justify-between">
                    {step > 1 ? (
                        <Button variant="outline" onClick={() => setStep(step - 1)}>Back</Button>
                    ) : <div></div>}

                    {step < 3 ? (
                        <Button
                            onClick={() => setStep(step + 1)}
                            disabled={step === 2 && !formData.name}
                        >
                            Next <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit}
                            disabled={
                                (connectionType === 'direct' && (!formData.controllerId || !formData.port)) ||
                                (connectionType === 'relay' && (!formData.relayId || !formData.channel)) ||
                                loading
                            }
                        >
                            {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Device' : 'Create Device')}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
