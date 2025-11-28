import React, { useState, useEffect } from 'react';
import { hardwareService, type IController } from '../../services/hardwareService';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { ArrowRight, Cpu, Activity, Droplet, Thermometer, Zap, X, Plus } from 'lucide-react';
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
    const [existingTags, setExistingTags] = useState<string[]>([]); // For suggestions
    const [loading, setLoading] = useState(false);

    // Form Data
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
    const [connectionType, setConnectionType] = useState<'direct' | 'relay'>('direct');
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        controllerId: '',
        port: '', // Legacy single port
        pins: {} as Record<string, string>, // New multi-pin map
        relayId: '',
        channel: '',
        isEnabled: true,
        tags: [] as string[]
    });

    const [tagInput, setTagInput] = useState('');

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
                    pins: Array.isArray(initialData.hardware?.pins)
                        ? initialData.hardware.pins.reduce((acc: any, pin: any) => ({ ...acc, [pin.role]: pin.portId }), {})
                        : initialData.hardware?.pins || {},
                    relayId: initialData.hardware?.relayId || '',
                    channel: initialData.hardware?.channel !== undefined ? String(initialData.hardware.channel) : '',
                    isEnabled: initialData.isEnabled !== undefined ? initialData.isEnabled : true,
                    tags: initialData.tags || []
                });
                // Determine connection type
                if (initialData.hardware?.relayId) {
                    setConnectionType('relay');
                } else {
                    setConnectionType('direct');
                }
                // We need to set the template to display correct info
                if (initialData.config?.driverId) {
                    setSelectedTemplate(initialData.config.driverId);
                }
            } else {
                // Reset for New Device
                setStep(1);
                setFormData({
                    name: '',
                    description: '',
                    controllerId: '',
                    port: '',
                    pins: {},
                    relayId: '',
                    channel: '',
                    isEnabled: true,
                    tags: []
                });
                setSelectedTemplate(null);
                setConnectionType('direct');
                setTagInput('');
            }
        }
    }, [open, initialData]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [tpls, ctrls, rlys, devices] = await Promise.all([
                hardwareService.getDeviceTemplates(),
                hardwareService.getControllers(),
                hardwareService.getRelays(),
                hardwareService.getDevices() // Fetch devices to get existing tags
            ]);
            setTemplates(tpls);
            setControllers(ctrls);
            setRelays(rlys);

            // Extract unique tags
            const tags = new Set<string>();
            devices.forEach((d: any) => {
                if (d.tags && Array.isArray(d.tags)) {
                    d.tags.forEach((t: string) => tags.add(t));
                }
            });
            setExistingTags(Array.from(tags).sort());

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

    const handleAddTag = () => {
        if (tagInput && !formData.tags.includes(tagInput)) {
            setFormData({ ...formData, tags: [...formData.tags, tagInput] });
            setTagInput('');
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setFormData({ ...formData, tags: formData.tags.filter(tag => tag !== tagToRemove) });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleAddTag();
        }
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
                tags: formData.tags, // Include tags
                hardware: {}
            };

            if (connectionType === 'direct') {
                payload.hardware = {
                    parentId: formData.controllerId,
                    // If template has pins definition, use pins map, otherwise fallback to legacy port
                    pins: selectedTemplate?.pins?.length > 0 ? formData.pins : undefined,
                    port: selectedTemplate?.pins?.length > 0 ? undefined : formData.port
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

    const getAvailablePorts = (pinType: string) => {
        if (!formData.controllerId) return [];
        const controller = controllers.find(c => c._id === formData.controllerId);
        if (!controller) return [];

        return Object.entries(controller.ports)
            .filter(([id, state]) => {
                // If editing and this is the current port, allow it
                // Check both legacy port and new pins map
                const isCurrentLegacy = isEditMode && initialData?.hardware?.parentId === formData.controllerId && initialData?.hardware?.port === id;
                const isCurrentPin = isEditMode && initialData?.hardware?.parentId === formData.controllerId && Object.values(initialData?.hardware?.pins || {}).includes(id);

                if (isCurrentLegacy || isCurrentPin) return true;

                if (state.isOccupied) return false;

                // Filter by type
                if (pinType === 'ANALOG_IN' && !id.startsWith('A')) return false;
                if ((pinType === 'DIGITAL_IN' || pinType === 'DIGITAL_OUT') && !id.startsWith('D')) return false;

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

    // Helper to check if form is valid
    const isFormValid = () => {
        if (connectionType === 'relay') {
            return formData.relayId && formData.channel;
        }

        if (!formData.controllerId) return false;

        // If template has specific pins defined, check if all are selected
        if (selectedTemplate?.pins?.length > 0) {
            return selectedTemplate.pins.every((pin: any) => formData.pins[pin.name]);
        }

        // Legacy fallback
        return !!formData.port;
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

                            {/* Tags Section */}
                            <div className="space-y-2">
                                <Label>Device Group / Tags</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={tagInput}
                                        onChange={e => setTagInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="Add a tag (e.g. 'Tank 1', 'Nutrients')"
                                        className="flex-1"
                                    />
                                    <Button type="button" size="icon" variant="outline" onClick={handleAddTag}>
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>

                                {/* Active Tags */}
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {formData.tags.map(tag => (
                                        <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                                            {tag}
                                            <X
                                                className="h-3 w-3 cursor-pointer hover:text-destructive"
                                                onClick={() => handleRemoveTag(tag)}
                                            />
                                        </Badge>
                                    ))}
                                </div>

                                {/* Suggested Tags */}
                                {existingTags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        <span className="text-xs text-muted-foreground mr-2">Suggestions:</span>
                                        {existingTags.filter(t => !formData.tags.includes(t)).map(tag => (
                                            <Badge
                                                key={tag}
                                                variant="outline"
                                                className="cursor-pointer hover:bg-muted text-xs"
                                                onClick={() => {
                                                    if (!formData.tags.includes(tag)) {
                                                        setFormData({ ...formData, tags: [...formData.tags, tag] });
                                                    }
                                                }}
                                            >
                                                + {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
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
                                <div className="p-4 bg-muted/50 rounded-lg flex flex-col gap-3">
                                    <div className="flex items-center gap-3">
                                        {getIcon(selectedTemplate.uiConfig?.icon)}
                                        <div>
                                            <p className="font-medium">{selectedTemplate.name}</p>
                                            <p className="text-xs text-muted-foreground">Type: {selectedTemplate.physicalType}</p>
                                        </div>
                                        {!isEditMode && (
                                            <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setStep(1)}>Change</Button>
                                        )}
                                    </div>

                                    {/* Read-Only Metric Key Context */}
                                    {selectedTemplate.commands?.READ?.outputs && (
                                        <div className="text-xs text-muted-foreground border-t pt-2 mt-1">
                                            <span className="font-semibold">Metric Keys: </span>
                                            {selectedTemplate.commands.READ.outputs.map((o: any) => o.key).join(', ')}
                                        </div>
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
                                            onValueChange={v => setFormData({ ...formData, controllerId: v, port: '', pins: {} })}
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
                                        <div className="space-y-4">
                                            {/* Dynamic Pin Selection Loop */}
                                            {selectedTemplate?.pins?.length > 0 ? (
                                                selectedTemplate.pins.map((pin: any) => (
                                                    <div key={pin.name} className="space-y-2">
                                                        <Label>Select {pin.name} ({pin.type})</Label>
                                                        <Select
                                                            value={formData.pins[pin.name] || ''}
                                                            onValueChange={v => setFormData({
                                                                ...formData,
                                                                pins: { ...formData.pins, [pin.name]: v }
                                                            })}
                                                        >
                                                            <SelectTrigger><SelectValue placeholder={`Select ${pin.name} Pin`} /></SelectTrigger>
                                                            <SelectContent>
                                                                {getAvailablePorts(pin.type).map(p => (
                                                                    <SelectItem key={p} value={p}>{p}</SelectItem>
                                                                ))}
                                                                {getAvailablePorts(pin.type).length === 0 && (
                                                                    <SelectItem value="none" disabled>No available ports</SelectItem>
                                                                )}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                ))
                                            ) : (
                                                // Legacy Single Port Fallback
                                                <div className="space-y-2">
                                                    <Label>Select Port ({selectedTemplate?.portRequirements?.[0]?.type || 'Generic'})</Label>
                                                    <Select
                                                        value={formData.port}
                                                        onValueChange={v => setFormData({ ...formData, port: v })}
                                                    >
                                                        <SelectTrigger><SelectValue placeholder="Select Port" /></SelectTrigger>
                                                        <SelectContent>
                                                            {getAvailablePorts(selectedTemplate?.portRequirements?.[0]?.type === 'analog' ? 'ANALOG_IN' : 'DIGITAL_IN').map(p => (
                                                                <SelectItem key={p} value={p}>{p}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            )}
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
                                                    {getAvailableChannels().map((c: any) => (
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
                            disabled={!isFormValid() || loading}
                        >
                            {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Device' : 'Create Device')}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
