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
import { ArrowRight, Cpu, Activity, Droplet, Thermometer, Zap, X, Settings2, Wind, Lightbulb, Ruler, Info } from 'lucide-react';
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
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

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

    const [openCombobox, setOpenCombobox] = useState(false);

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
            const name = t.name || '';
            const description = t.description || '';
            const searchMatch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                description.toLowerCase().includes(searchQuery.toLowerCase());
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

            }
        }
    }, [open, initialData]);

    // When initialData is loaded, try to find and set the selected template
    useEffect(() => {

        if (initialData && templates.length > 0) {
            const driverId = typeof initialData.config?.driverId === 'string'
                ? initialData.config.driverId
                : initialData.config?.driverId?._id || initialData.config?.driverId?.id;

            const tpl = templates.find(t => t._id === driverId || t.id === driverId);
            if (tpl) {
                setSelectedTemplate(tpl);
                // Try to infer variant if possible (not strictly stored, but maybe inferred from capabilities/pins)
                if (initialData.config?.variantId && tpl.variants) {
                    const v = tpl.variants.find((v: any) => v.id === initialData.config.variantId);
                    if (v) setSelectedVariant(v);
                } else if (tpl.variants && initialData.hardware?.pins) {
                    // Inference Logic: Check if any of the variant's pin names match the roles in initialData
                    const currentRoles = Array.isArray(initialData.hardware.pins)
                        ? initialData.hardware.pins.map((p: any) => p.role)
                        : Object.keys(initialData.hardware.pins || {});

                    const inferredVariant = tpl.variants.find((v: any) => {
                        // Check if this variant has a pin that matches one of the current roles
                        return v.pins?.some((p: any) => currentRoles.includes(p.name));
                    });

                    if (inferredVariant) {
                        setSelectedVariant(inferredVariant);
                    }
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



    const handleRemoveTag = (tagToRemove: string) => {
        setFormData({ ...formData, tags: formData.tags.filter(tag => tag !== tagToRemove) });
    };



    const handleSubmit = async () => {
        try {
            setLoading(true);
            const payload: any = {
                name: formData.name,
                type: selectedTemplate?.category || (effectiveTemplate?.physicalType === 'relay' ? 'ACTUATOR' : 'SENSOR'),
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
            case 'ruler': return <Ruler className="h-6 w-6" />;
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
                    <div className="hidden" id="dialog-description">
                        Wizard to configure and add a new hardware device to the system.
                    </div>
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
                                        {filteredTemplates.map((template) => {
                                            // Enrich Badges Logic
                                            const hasVariants = template.variants && template.variants.length > 0;
                                            const variantLabels = hasVariants ? template.variants.map((v: any) => v.label).join(' • ') : '';

                                            // Capabilities (from variants or base)
                                            const capabilities = new Set<string>(template.capabilities || []);
                                            if (hasVariants) {
                                                template.variants.forEach((v: any) => {
                                                    if (v.capabilities) v.capabilities.forEach((c: string) => capabilities.add(c));
                                                });
                                            }

                                            // Aggregate Tooltips
                                            const tooltips: string[] = [];
                                            capabilities.forEach(cap => {
                                                const uiConfig = template.uiConfig?.capabilities?.[cap];
                                                if (uiConfig?.tooltip) {
                                                    const label = uiConfig.label || cap.replace(/_/g, ' ');
                                                    tooltips.push(`${label}: ${uiConfig.tooltip}`);
                                                }
                                            });

                                            // Interfaces (from variants or base)
                                            const interfaces = new Set<string>();
                                            if (template.requirements?.interface) interfaces.add(template.requirements.interface);
                                            if (hasVariants) {
                                                template.variants.forEach((v: any) => {
                                                    if (v.requirements?.interface) interfaces.add(v.requirements.interface);
                                                });
                                            }
                                            const interfaceLabel = Array.from(interfaces).join(' / ');

                                            return (
                                                <Card
                                                    key={template._id}
                                                    className="cursor-pointer hover:border-primary transition-colors"
                                                    onClick={() => handleTemplateSelect(template)}
                                                >
                                                    <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
                                                        <div className={`p-3 rounded-full ${categoryConfig[selectedCategory as string]?.color || 'bg-gray-100 text-gray-600'}`}>
                                                            {getIcon(template.uiConfig?.icon)}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center justify-center gap-2">
                                                                <h3 className="font-semibold">{template.name}</h3>
                                                                {tooltips.length > 0 && (
                                                                    <TooltipProvider delayDuration={0}>
                                                                        <Tooltip>
                                                                            <TooltipTrigger asChild>
                                                                                <div className="cursor-help text-muted-foreground hover:text-primary">
                                                                                    <Info className="h-4 w-4" />
                                                                                </div>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent>
                                                                                <div className="flex flex-col gap-1">
                                                                                    {tooltips.map((t, i) => (
                                                                                        <p key={i} className="text-xs">{t}</p>
                                                                                    ))}
                                                                                </div>
                                                                            </TooltipContent>
                                                                        </Tooltip>
                                                                    </TooltipProvider>
                                                                )}
                                                            </div>
                                                            {hasVariants && (
                                                                <p className="text-xs font-medium text-primary mt-1">
                                                                    {variantLabels}
                                                                </p>
                                                            )}
                                                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                                                {template.description}
                                                            </p>
                                                        </div>

                                                        {/* Capabilities Badges */}
                                                        {capabilities.size > 0 && (
                                                            <div className="flex flex-wrap gap-1 justify-center">
                                                                {Array.from(capabilities).slice(0, 3).map(cap => {
                                                                    // Check for UI config override
                                                                    const uiConfig = template.uiConfig?.capabilities?.[cap];
                                                                    const label = uiConfig?.label || cap.replace(/_/g, ' ');
                                                                    const iconName = uiConfig?.icon;

                                                                    return (
                                                                        <Badge key={cap} variant="outline" className="text-[10px] px-1 py-0 h-5 flex items-center gap-1">
                                                                            {iconName && getIcon(iconName)}
                                                                            {label}
                                                                        </Badge>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}

                                                        <div className="flex gap-2 flex-wrap justify-center mt-2">
                                                            {template.requirements?.voltage && (
                                                                <Badge variant="secondary" className="uppercase text-[10px] flex items-center gap-1">
                                                                    <Zap className="h-3 w-3" />
                                                                    {template.requirements.voltage}
                                                                </Badge>
                                                            )}
                                                            <Badge variant="secondary" className="uppercase text-[10px]">
                                                                {template.category}
                                                            </Badge>
                                                            {interfaceLabel && (
                                                                <Badge variant="secondary" className="uppercase text-[10px]">
                                                                    {interfaceLabel}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            );
                                        })}
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
                            {/* 1. General Info Card */}
                            <Card>
                                <CardContent className="p-4 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold text-lg flex items-center gap-2">
                                            <Settings2 className="h-5 w-5 text-primary" />
                                            General Configuration
                                        </h3>
                                        <div className="flex items-center space-x-2">
                                            <Label htmlFor="enabled-mode" className="text-sm text-muted-foreground">Enabled</Label>
                                            <Switch
                                                id="enabled-mode"
                                                checked={formData.isEnabled}
                                                onCheckedChange={checked => setFormData({ ...formData, isEnabled: checked })}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Device Name <span className="text-destructive">*</span></Label>
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
                                    </div>

                                    {/* Smart Tag Combobox */}
                                    <div className="space-y-2">
                                        <Label>Device Group / Tags</Label>
                                        <div className="flex flex-wrap gap-2 mb-2">
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
                                        <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={openCombobox}
                                                    className="w-full justify-between"
                                                >
                                                    <span className="text-muted-foreground">Select or type a tag...</span>
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[400px] p-0">
                                                <Command>
                                                    <CommandInput
                                                        placeholder="Search or create tag..."
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                const val = e.currentTarget.value;
                                                                if (val && !formData.tags.includes(val)) {
                                                                    setFormData(prev => ({ ...prev, tags: [...prev.tags, val] }));
                                                                    setOpenCombobox(false);
                                                                }
                                                            }
                                                        }}
                                                    />
                                                    <CommandList>
                                                        <CommandEmpty>Type and press Enter to create new tag.</CommandEmpty>
                                                        <CommandGroup heading="Existing Tags">
                                                            {existingTags.map((tag) => (
                                                                <CommandItem
                                                                    key={tag}
                                                                    value={tag.toLowerCase()}
                                                                    onSelect={() => {
                                                                        if (!formData.tags.includes(tag)) {
                                                                            setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
                                                                        }
                                                                        setOpenCombobox(false);
                                                                    }}
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            "mr-2 h-4 w-4",
                                                                            formData.tags.includes(tag) ? "opacity-100" : "opacity-0"
                                                                        )}
                                                                    />
                                                                    {tag}
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* 2. Control Mode (Variants) */}
                            {selectedTemplate?.variants && selectedTemplate.variants.length > 0 && (
                                <Card>
                                    <CardContent className="p-4 space-y-3">
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
                                                        setFormData(prev => ({ ...prev, pins: {}, port: '' }));
                                                    }}
                                                >
                                                    <span className="font-medium text-sm">{variant.label}</span>
                                                    {variant.description && <span className="text-xs text-muted-foreground">{variant.description}</span>}
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* 3. Hardware Connection */}
                            {/* 3. Hardware Connection */}
                            <Card>
                                <CardContent className="p-4 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold text-lg flex items-center gap-2">
                                            <Cpu className="h-5 w-5 text-primary" />
                                            Hardware Connection
                                        </h3>
                                        {(() => {
                                            const isActuator = effectiveTemplate?.category === 'ACTUATOR';
                                            const hasIncompatiblePins = effectiveTemplate?.pins?.some((p: any) =>
                                                ['PWM_OUT', 'ANALOG_IN', 'DIGITAL_IN'].includes(p.type)
                                            );
                                            const requiresComplexInterface = ['uart', 'i2c', 'onewire', 'pwm'].includes(effectiveTemplate?.requirements?.interface || '');

                                            const canUseRelay = isActuator && !hasIncompatiblePins && !requiresComplexInterface;

                                            let restrictionReason = '';
                                            if (!isActuator) restrictionReason = 'Sensors cannot be connected via relay.';
                                            else if (hasIncompatiblePins) restrictionReason = 'Devices requiring PWM or Input pins cannot be connected via relay.';
                                            else if (requiresComplexInterface) restrictionReason = 'Devices with complex interfaces (UART, I2C, etc.) cannot be connected via relay.';

                                            return (
                                                <>
                                                    <Tabs value={connectionType} onValueChange={(v: any) => setConnectionType(v)} className="w-[300px]">
                                                        <TabsList className="grid w-full grid-cols-2">
                                                            <TabsTrigger value="direct">Direct</TabsTrigger>
                                                            <TabsTrigger value="relay" disabled={!canUseRelay}>
                                                                Via Relay
                                                            </TabsTrigger>
                                                        </TabsList>
                                                    </Tabs>
                                                    {!canUseRelay && (
                                                        <p className="text-xs text-amber-500">{restrictionReason}</p>
                                                    )}
                                                </>
                                            );
                                        })()}
                                    </div>

                                    {connectionType === 'direct' ? (
                                        <div className="space-y-4">
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
                                                <div className="border rounded-md overflow-hidden">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow className="bg-muted/50">
                                                                <TableHead className="w-[150px]">Device Pin</TableHead>
                                                                <TableHead>Type</TableHead>
                                                                <TableHead>Controller Port</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {effectiveTemplate?.pins?.length > 0 ? (
                                                                effectiveTemplate.pins.map((pin: any) => (
                                                                    <TableRow key={pin.name}>
                                                                        <TableCell className="font-medium">{pin.name}</TableCell>
                                                                        <TableCell><Badge variant="outline">{pin.type}</Badge></TableCell>
                                                                        <TableCell>
                                                                            <Select
                                                                                value={formData.pins[pin.name] || 'none'}
                                                                                onValueChange={v => setFormData({
                                                                                    ...formData,
                                                                                    pins: { ...formData.pins, [pin.name]: v === 'none' ? '' : v }
                                                                                })}
                                                                            >
                                                                                <SelectTrigger className="w-full h-8">
                                                                                    <SelectValue placeholder="Select Port" />
                                                                                </SelectTrigger>
                                                                                <SelectContent>
                                                                                    <SelectItem value="none" className="text-muted-foreground italic">None</SelectItem>
                                                                                    {getAvailablePorts(pin.type, pin.name).map(p => (
                                                                                        <SelectItem key={p} value={p}>{p}</SelectItem>
                                                                                    ))}
                                                                                    {getAvailablePorts(pin.type, pin.name).length === 0 && (
                                                                                        <SelectItem value="no_ports" disabled>No ports available</SelectItem>
                                                                                    )}
                                                                                </SelectContent>
                                                                            </Select>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ))
                                                            ) : (
                                                                <TableRow>
                                                                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                                                                        No pins defined for this device.
                                                                    </TableCell>
                                                                </TableRow>
                                                            )}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-4 border p-4 rounded-md bg-muted/10">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Relay Module</Label>
                                                    <Select
                                                        value={formData.relayId}
                                                        onValueChange={v => setFormData({ ...formData, relayId: v, channel: '' })}
                                                    >
                                                        <SelectTrigger><SelectValue placeholder="Select Relay Board" /></SelectTrigger>
                                                        <SelectContent>
                                                            {relays.map(r => (
                                                                <SelectItem key={r._id} value={r._id}>{r.name}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Channel</Label>
                                                    <Select
                                                        value={formData.channel}
                                                        onValueChange={v => setFormData({ ...formData, channel: v })}
                                                        disabled={!formData.relayId}
                                                    >
                                                        <SelectTrigger><SelectValue placeholder="Select Channel" /></SelectTrigger>
                                                        <SelectContent>
                                                            {formData.relayId && relays.find(r => r._id === formData.relayId)?.channels.map((ch: any, idx: number) => (
                                                                <SelectItem key={idx} value={String(idx + 1)} disabled={ch.isOccupied}>
                                                                    Channel {idx + 1} {ch.isOccupied ? '(Occupied)' : ''}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
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
