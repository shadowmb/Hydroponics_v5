import React, { useState, useEffect, useMemo } from 'react';
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
import { ArrowRight, Cpu, Activity, Droplet, Thermometer, Zap, X, Plus, Settings2, Wind, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Search, Filter, LayoutGrid, List, ChevronRight } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";

const categoryConfig: Record<string, { color: string }> = {
    'water': { color: 'bg-blue-100 text-blue-600' },
    'air': { color: 'bg-sky-100 text-sky-600' },
    'light': { color: 'bg-yellow-100 text-yellow-600' },
    'power': { color: 'bg-orange-100 text-orange-600' },
    'other': { color: 'bg-gray-100 text-gray-600' }
};
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
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
    const [selectedVariant, setSelectedVariant] = useState<any>(null); // Mode
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

    // Device Selection State
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'sensor' | 'actuator'>('all');

    // Filtered Templates Logic
    const filteredTemplates = useMemo(() => {
        return templates.filter(t => {
            // 1. Category Filter
            const categoryMatch = (t.uiConfig?.category || 'other') === selectedCategory;
            if (!categoryMatch) return false;

            // 2. Search Filter
            const searchMatch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.description.toLowerCase().includes(searchQuery.toLowerCase());
            if (!searchMatch) return false;

            // 3. Type Filter
            if (filterType !== 'all') {
                const type = (t.category || '').toLowerCase(); // SENSOR or ACTUATOR
                if (type !== filterType) return false;
            }

            return true;
        });
    }, [templates, selectedCategory, searchQuery, filterType]);

    const isEditMode = !!initialData;

    useEffect(() => {
        if (open) {
            fetchData();
            if (initialData) {
                // Pre-fill for Edit Mode
                setStep(3); // Go directly to Config
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
                setSelectedCategory('');
                setSelectedTemplate(null);
                setSelectedVariant(null);
                setConnectionType('direct');
                setTagInput('');
            }
        }
    }, [open, initialData]);

    // When initialData is loaded, try to find and set the selected template
    useEffect(() => {
        if (initialData && templates.length > 0) {
            const tpl = templates.find(t => t._id === initialData.config?.driverId);
            if (tpl) {
                setSelectedTemplate(tpl);
                // Try to infer variant if possible (not strictly stored, but maybe inferred from capabilities/pins)
                // For now, we leave selectedVariant null in edit mode unless we store it.
                // If we stored variantId in config, we could use it:
                if (initialData.config?.variantId && tpl.variants) {
                    const v = tpl.variants.find((v: any) => v.id === initialData.config.variantId);
                    if (v) setSelectedVariant(v);
                }
            }
        }
    }, [initialData, templates]);

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

    const handleCategorySelect = (category: string) => {
        setSelectedCategory(category);
        setStep(2);
    };

    const handleTemplateSelect = (template: any) => {
        setSelectedTemplate(template);
        // Default to first variant if available, or null
        if (template.variants && template.variants.length > 0) {
            setSelectedVariant(template.variants[0]);
        } else {
            setSelectedVariant(null);
        }
        setStep(3);
    };

    // Helper to get the effective configuration (Template + Variant)
    const getEffectiveTemplate = () => {
        if (!selectedTemplate) return null;
        if (!selectedVariant) return selectedTemplate;

        return {
            ...selectedTemplate,
            ...selectedVariant, // Merge variant properties (requirements, commands, pins, capabilities)
            name: selectedTemplate.name, // Keep original name
            description: selectedVariant.description || selectedTemplate.description
        };
    };

    const effectiveTemplate = getEffectiveTemplate();

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
                type: effectiveTemplate?.physicalType === 'relay' ? 'ACTUATOR' : 'SENSOR', // This logic might need update based on variant
                isEnabled: formData.isEnabled,
                config: {
                    driverId: selectedTemplate?._id, // Always use the base template ID
                    pollInterval: 5000,
                    variantId: selectedVariant?.id
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
                    pins: effectiveTemplate?.pins?.length > 0 ? formData.pins : undefined,
                    port: effectiveTemplate?.pins?.length > 0 ? undefined : formData.port
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
            case 'wind': return <Wind className="h-6 w-6" />;
            case 'light': return <Lightbulb className="h-6 w-6" />;
            default: return <Cpu className="h-6 w-6" />;
        }
    };

    const getAvailablePorts = (pinType: string, currentRole?: string) => {
        if (!formData.controllerId) return [];
        const controller = controllers.find(c => c._id === formData.controllerId);
        if (!controller) return [];

        return Object.entries(controller.ports)
            .filter(([id, state]) => {
                // 1. Check Backend Occupancy & Ownership
                let isOccupiedByOther = state.isOccupied;

                if (isEditMode && initialData?.hardware?.parentId === formData.controllerId) {
                    const isLegacyPort = initialData.hardware.port === id;

                    let isMyPin = false;
                    const pins = initialData.hardware.pins;
                    if (Array.isArray(pins)) {
                        isMyPin = pins.some((p: any) => p.portId === id);
                    } else if (pins && typeof pins === 'object') {
                        isMyPin = Object.values(pins).includes(id);
                    }

                    if (isLegacyPort || isMyPin) {
                        isOccupiedByOther = false;
                    }
                }

                if (isOccupiedByOther) return false;

                // 2. Check Frontend usage (Dynamic Swapping)
                const usedInOtherField = Object.entries(formData.pins).some(([role, portId]) => {
                    return role !== currentRole && portId === id;
                });

                const usedInLegacyField = !currentRole && formData.port === id;

                if (usedInOtherField || usedInLegacyField) return false;

                // 3. Filter by type
                if (pinType === 'ANALOG_IN' && !id.startsWith('A')) return false;
                if ((pinType === 'DIGITAL_IN' || pinType === 'DIGITAL_OUT') && !id.startsWith('D')) return false;
                if (pinType === 'PWM_OUT' && !state.pwm) return false; // Check for PWM capability

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
                if (isEditMode && initialData?.hardware?.relayId === formData.relayId && initialData?.hardware?.channel === c.channelIndex) return true;
                return !c.isOccupied;
            })
            .map((c: any) => ({
                value: String(c.channelIndex),
                label: `Channel ${c.channelIndex} ${c.name ? `(${c.name})` : ''}`
            }));
    };

    const isFormValid = () => {
        if (connectionType === 'relay') {
            return formData.relayId && formData.channel;
        }

        if (!formData.controllerId) return false;

        if (effectiveTemplate?.pins?.length > 0) {
            return effectiveTemplate.pins.every((pin: any) => formData.pins[pin.name]);
        }

        return !!formData.port;
    };

    // Group templates by category for Step 1
    const categories = [
        { id: 'water', label: 'Water Systems', icon: 'droplet', description: 'Pumps, Valves, pH, EC, Level' },
        { id: 'air', label: 'Climate & Air', icon: 'wind', description: 'Fans, Temperature, Humidity, CO2' },
        { id: 'light', label: 'Lighting', icon: 'light', description: 'Grow Lights, Dimmers, PAR Sensors' },
        { id: 'power', label: 'Power Control', icon: 'power', description: 'Relays, Contactors, Power Meters' },
        { id: 'other', label: 'Other', icon: 'cpu', description: 'Generic Sensors & Actuators' }
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] h-[700px] flex flex-col">
                <DialogHeader>
                    <DialogTitle>{isEditMode ? 'Edit Device' : `Add New Device - Step ${step}`}</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto py-4 px-1">
                    {/* STEP 1: CATEGORY SELECTION */}
                    {step === 1 && (
                        <div className="grid grid-cols-1 gap-4">
                            {categories.map(cat => (
                                <Card
                                    key={cat.id}
                                    className="cursor-pointer hover:border-primary transition-colors"
                                    onClick={() => handleCategorySelect(cat.id)}
                                >
                                    <CardContent className="p-4 flex items-center gap-4">
                                        <div className="p-3 bg-muted rounded-full">
                                            {getIcon(cat.icon)}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg">{cat.label}</h3>
                                            <p className="text-sm text-muted-foreground">{cat.description}</p>
                                        </div>
                                        <ArrowRight className="ml-auto h-5 w-5 text-muted-foreground" />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Step 2: Device Selection */}
                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-muted/20 p-3 rounded-lg border">
                                <div className="flex gap-2 w-full md:w-auto flex-1">
                                    <div className="relative flex-1 md:max-w-xs">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search devices..."
                                            className="pl-8"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                    <Select value={filterType} onValueChange={(v: 'all' | 'sensor' | 'actuator') => setFilterType(v)}>
                                        <SelectTrigger className="w-[180px]">
                                            <Filter className="w-4 h-4 mr-2" />
                                            <SelectValue placeholder="Device Type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Types</SelectItem>
                                            <SelectItem value="sensor">Sensors</SelectItem>
                                            <SelectItem value="actuator">Actuators</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex gap-1 border rounded-md p-1 bg-background">
                                    <Button
                                        variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                                        size="sm"
                                        onClick={() => setViewMode('grid')}
                                        title="Grid View"
                                    >
                                        <LayoutGrid className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                                        size="sm"
                                        onClick={() => setViewMode('list')}
                                        title="List View"
                                    >
                                        <List className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <ScrollArea className="h-[500px] pr-4">
                                {filteredTemplates.length === 0 ? (
                                    <div className="text-center py-10 text-muted-foreground">
                                        No devices found matching your criteria.
                                    </div>
                                ) : viewMode === 'grid' ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {filteredTemplates.map((template) => (
                                            <Card
                                                key={template.id}
                                                className="cursor-pointer hover:border-primary transition-colors"
                                                onClick={() => handleTemplateSelect(template)}
                                            >
                                                <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                                                    <div className={`p-3 rounded-full ${categoryConfig[selectedCategory as string]?.color || 'bg-gray-100 text-gray-600'}`}>
                                                        {getIcon(template.uiConfig?.icon)}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold">{template.name}</h3>
                                                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                                            {template.description}
                                                        </p>
                                                    </div>
                                                    <div className="flex gap-2 flex-wrap justify-center">
                                                        <Badge variant="outline">{template.category}</Badge>
                                                        {template.requirements?.interface && (
                                                            <Badge variant="secondary">{template.requirements.interface}</Badge>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="border rounded-md">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Name</TableHead>
                                                    <TableHead>Type</TableHead>
                                                    <TableHead>Interface</TableHead>
                                                    <TableHead>Voltage</TableHead>
                                                    <TableHead className="text-right">Action</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredTemplates.map((template) => (
                                                    <TableRow key={template.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleTemplateSelect(template)}>
                                                        <TableCell className="font-medium">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`p-2 rounded-full ${categoryConfig[selectedCategory as string]?.color || 'bg-gray-100 text-gray-600'}`}>
                                                                    {getIcon(template.uiConfig?.icon)}
                                                                </div>
                                                                <div>
                                                                    <div>{template.name}</div>
                                                                    <div className="text-xs text-muted-foreground line-clamp-1">{template.description}</div>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline">{template.category}</Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            {template.requirements?.interface && (
                                                                <Badge variant="secondary">{template.requirements.interface}</Badge>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            {template.requirements?.voltage || '-'}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <Button size="sm" variant="ghost">
                                                                Select <ChevronRight className="w-4 h-4 ml-1" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </ScrollArea>
                        </div>
                    )}

                    {/* STEP 3: CONFIGURATION + MODE */}
                    {step === 3 && (
                        <div className="space-y-6">
                            {/* MODE SELECTION (If Variants Exist) */}
                            {selectedTemplate?.variants && selectedTemplate.variants.length > 0 && (
                                <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                                    <Label className="text-base font-semibold flex items-center gap-2">
                                        <Settings2 className="h-4 w-4" />
                                        Control Mode
                                    </Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {selectedTemplate.variants.map((variant: any) => (
                                            <div
                                                key={variant.id}
                                                className={`cursor-pointer border rounded-md p-3 flex flex-col gap-1 transition-colors ${selectedVariant?.id === variant.id
                                                    ? 'bg-primary/10 border-primary'
                                                    : 'hover:bg-muted'
                                                    }`}
                                                onClick={() => {
                                                    setSelectedVariant(variant);
                                                    // Reset pins when changing mode as requirements change
                                                    setFormData(prev => ({ ...prev, pins: {}, port: '' }));
                                                }}
                                            >
                                                <span className="font-medium text-sm">{variant.label}</span>
                                                {variant.description && <span className="text-xs text-muted-foreground">{variant.description}</span>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

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

                            {/* Hardware Connection */}
                            <div className="space-y-4 pt-4 border-t">
                                <h3 className="font-medium">Hardware Connection</h3>

                                <div className="space-y-2">
                                    <Label>Connection Type</Label>
                                    <Tabs value={connectionType} onValueChange={(v: any) => setConnectionType(v)} className="w-full">
                                        <TabsList className="grid w-full grid-cols-2">
                                            <TabsTrigger value="direct">Direct to Controller</TabsTrigger>
                                            <TabsTrigger value="relay" disabled={effectiveTemplate?.pins?.some((p: any) => p.type === 'PWM_OUT')}>
                                                Via Relay Module
                                            </TabsTrigger>
                                        </TabsList>
                                    </Tabs>
                                    {effectiveTemplate?.pins?.some((p: any) => p.type === 'PWM_OUT') && (
                                        <p className="text-xs text-amber-500">Relay modules do not support PWM control.</p>
                                    )}
                                </div>

                                {connectionType === 'direct' ? (
                                    <div className="space-y-4 border p-4 rounded-md bg-muted/10">
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
                                                {effectiveTemplate?.pins?.length > 0 ? (
                                                    effectiveTemplate.pins.map((pin: any) => (
                                                        <div key={pin.name} className="space-y-2">
                                                            <Label>Select {pin.name} ({pin.type})</Label>
                                                            <Select
                                                                value={formData.pins[pin.name] || 'none'}
                                                                onValueChange={v => setFormData({
                                                                    ...formData,
                                                                    pins: { ...formData.pins, [pin.name]: v === 'none' ? '' : v }
                                                                })}
                                                            >
                                                                <SelectTrigger><SelectValue placeholder={`Select ${pin.name} Pin`} /></SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="none" className="text-muted-foreground italic">None (Deselect)</SelectItem>
                                                                    {getAvailablePorts(pin.type, pin.name).map(p => (
                                                                        <SelectItem key={p} value={p}>{p}</SelectItem>
                                                                    ))}
                                                                    {getAvailablePorts(pin.type, pin.name).length === 0 && (
                                                                        <SelectItem value="no_ports" disabled>No available ports</SelectItem>
                                                                    )}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="space-y-2">
                                                        <Label>Select Port ({effectiveTemplate?.portRequirements?.[0]?.type || 'Generic'})</Label>
                                                        <Select
                                                            value={formData.port || 'none'}
                                                            onValueChange={v => setFormData({ ...formData, port: v === 'none' ? '' : v })}
                                                        >
                                                            <SelectTrigger><SelectValue placeholder="Select Port" /></SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="none" className="text-muted-foreground italic">None (Deselect)</SelectItem>
                                                                {getAvailablePorts(effectiveTemplate?.portRequirements?.[0]?.type === 'analog' ? 'ANALOG_IN' : 'DIGITAL_IN').map(p => (
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
                                    <div className="space-y-4 border p-4 rounded-md bg-muted/10">
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
                        </div>
                    )}
                </div>

                <DialogFooter className="flex justify-between sm:justify-between border-t pt-4 mt-2">
                    {step > 1 ? (
                        <Button variant="outline" onClick={() => setStep(step - 1)}>Back</Button>
                    ) : <div></div>}

                    {step < 3 ? (
                        <Button
                            onClick={() => setStep(step + 1)}
                            disabled={step === 2 && !selectedTemplate}
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
