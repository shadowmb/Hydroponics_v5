import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, ArrowRight, ArrowLeft, Check, Cpu, Wifi, Usb, RefreshCw } from 'lucide-react';
import { hardwareService, type IControllerTemplate, type IController } from '../../services/hardwareService';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";

interface ControllerWizardProps {
    onControllerCreated: () => void;
    editController?: IController; // If provided, we are in edit mode
    initialData?: Partial<IController>; // For pre-filling data (e.g. from scanner)
    open?: boolean; // Controlled open state for edit mode
    onOpenChange?: (open: boolean) => void; // Controlled open handler
}

type WizardStep = 'type-selection' | 'configuration' | 'review';

export const ControllerWizard: React.FC<ControllerWizardProps> = ({ onControllerCreated, editController, initialData, open: controlledOpen, onOpenChange }) => {
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const setOpen = isControlled ? onOpenChange! : setInternalOpen;

    const [step, setStep] = useState<WizardStep>('type-selection');
    const [templates, setTemplates] = useState<IControllerTemplate[]>([]);
    const [loading, setLoading] = useState(false);

    // Form State
    const [selectedTemplate, setSelectedTemplate] = useState<IControllerTemplate | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        macAddress: '',
        connectionType: 'network' as 'network' | 'serial',
        ip: '',
        port: 80,
        serialPort: '',
        baudRate: 9600
    });

    const [serialPorts, setSerialPorts] = useState<any[]>([]);
    const [loadingPorts, setLoadingPorts] = useState(false);

    // Map discovered model names to system template keys
    const MODEL_MAP: Record<string, string> = {
        'ArduinoUnoR4WiFi': 'Arduino_Uno',
        'ArduinoUnoR3': 'Arduino_Uno',
        'Arduino Uno': 'Arduino_Uno',
        'ESP32': 'ESP32',
        'WeMos D1 R2': 'WeMos_D1_R2',
        'WeMos D1 R2 V2.1.0': 'WeMos_D1_R2'
    };

    useEffect(() => {
        if (open) {
            loadTemplates();
            loadSerialPorts();
            if (editController) {
                // Edit Mode Initialization
                setStep('configuration');
                setFormData({
                    name: editController.name,
                    description: editController.description || '',
                    macAddress: editController.macAddress || '',
                    connectionType: editController.connection.type,
                    ip: editController.connection.ip || '',
                    port: editController.connection.port || 80,
                    serialPort: editController.connection.serialPort || '',
                    baudRate: editController.connection.baudRate || 9600
                });
                // We need the template to display the type label correctly
                // Fetching templates will handle this, but we can set a placeholder
                setSelectedTemplate({
                    key: editController.type,
                    label: editController.type, // Will be updated when templates load
                    ports: [],
                    communication_by: [],
                    communication_type: []
                });
            } else if (initialData) {
                // Pre-fill Mode (e.g. from Scanner)
                setStep('type-selection'); // Default to selection, but might skip below

                setFormData({
                    name: initialData.name || '',
                    description: initialData.description || '',
                    macAddress: initialData.macAddress || '',
                    connectionType: initialData.connection?.type || 'network',
                    ip: initialData.connection?.ip || '',
                    port: initialData.connection?.port || 80,
                    serialPort: initialData.connection?.serialPort || '',
                    baudRate: initialData.connection?.baudRate || 9600
                });

                // Try to auto-select template
                // We need to wait for templates to load, but we can't easily do that in this effect 
                // without complex dependency management. 
                // Instead, we'll store the target template key and try to match it when templates arrive.
            } else {
                // Create Mode Initialization
                setStep('type-selection');
                resetForm();
            }
        }
    }, [open, editController, initialData]);

    // Effect to handle auto-selection once templates are loaded
    useEffect(() => {
        if (open && !editController && initialData && templates.length > 0) {
            // Extract model name from initialData (it might be in the name or a separate field if we added one)
            // The scanner passes: name: `New Controller (${device.model})`
            // But wait, we don't have the raw model string in initialData as defined in IController.
            // However, we can parse it from the name or pass it separately.
            // BETTER APPROACH: Let's assume the name contains the model or we look at the raw device if we could.
            // But we only get Partial<IController>.

            // Let's parse the model from the name string we constructed in Hardware.tsx:
            // "New Controller (ArduinoUnoR4WiFi)"
            const name = initialData.name || '';
            const match = name.match(/\((.*?)\)/);
            const modelName = match ? match[1] : '';

            const templateKey = MODEL_MAP[modelName];
            if (templateKey) {
                const template = templates.find(t => t.key === templateKey);
                if (template) {
                    setSelectedTemplate(template);
                    setStep('configuration');
                    // Update name to be cleaner if we want, or keep the descriptive one
                    // Let's keep the one passed in which is "New Controller (Model)"
                }
            }
        }
    }, [templates, open, editController, initialData]);

    // Update selected template label once templates are loaded
    useEffect(() => {
        if (editController && templates.length > 0) {
            const tmpl = templates.find(t => t.key === editController.type);
            if (tmpl) setSelectedTemplate(tmpl);
        }
    }, [templates, editController]);

    const loadTemplates = async () => {
        try {
            const data = await hardwareService.getTemplates();
            setTemplates(data);
        } catch (error) {
            toast.error('Failed to load templates');
        }
    };

    const loadSerialPorts = async () => {
        try {
            setLoadingPorts(true);
            const ports = await hardwareService.getSerialPorts();
            setSerialPorts(ports);
        } catch (error) {
            console.error('Failed to load ports');
        } finally {
            setLoadingPorts(false);
        }
    };

    // Common ports for quick selection
    const commonPorts = [
        { path: 'COM1', label: 'COM1 (Windows)' },
        { path: 'COM3', label: 'COM3 (Windows)' },
        { path: '/dev/ttyUSB0', label: '/dev/ttyUSB0 (Linux)' },
        { path: '/dev/ttyACM0', label: '/dev/ttyACM0 (Linux)' },
        { path: '/dev/tty.usbserial', label: '/dev/tty.usbserial (Mac)' },
    ];

    const resetForm = () => {
        setSelectedTemplate(null);
        setFormData({
            name: '',
            description: '',
            macAddress: '',
            connectionType: 'network',
            ip: '',
            port: 80,
            serialPort: '',
            baudRate: 9600
        });
    };

    const handleTemplateSelect = (template: IControllerTemplate) => {
        setSelectedTemplate(template);
        setFormData(prev => ({ ...prev, name: template.label }));
        setStep('configuration');
    };

    const handleSubmit = async () => {
        if (!selectedTemplate) return;

        try {
            setLoading(true);
            const connection = {
                type: formData.connectionType,
                ...(formData.connectionType === 'network' ? {
                    ip: formData.ip,
                    port: Number(formData.port)
                } : {
                    serialPort: formData.serialPort,
                    baudRate: Number(formData.baudRate)
                })
            };

            if (editController) {
                // Update Logic
                await hardwareService.updateController(editController._id, {
                    name: formData.name,
                    description: formData.description,
                    macAddress: formData.macAddress || undefined,
                    connection
                });
                toast.success('Controller updated successfully');
            } else {
                // Create Logic
                const payload = {
                    name: formData.name,
                    type: selectedTemplate.key,
                    description: formData.description,
                    macAddress: formData.macAddress || undefined,
                    connection,
                    status: 'offline' as const,
                    isActive: true,
                    ports: {}
                };
                await hardwareService.createController(payload);
                toast.success('Controller created successfully');
            }

            setOpen(false);
            onControllerCreated();
        } catch (error: any) {
            toast.error(error.response?.data?.error || `Failed to ${editController ? 'update' : 'create'} controller`);
        } finally {
            setLoading(false);
        }
    };

    const renderTypeSelection = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4 max-h-[60vh] overflow-y-auto">
            {templates.map(template => (
                <Card
                    key={template.key}
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => handleTemplateSelect(template)}
                >
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <Cpu className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="font-semibold">{template.label}</h3>
                            <p className="text-xs text-muted-foreground">{template.ports.length} Ports</p>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );

    const renderConfiguration = () => (
        <div className="space-y-4 py-4">
            <div className="grid gap-2">
                <Label>Name</Label>
                <Input
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="My Controller"
                />
            </div>

            <div className="grid gap-2">
                <Label>Description</Label>
                <Textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Location, purpose, etc."
                />
            </div>

            <div className="grid gap-2">
                <Label>Connection Type</Label>
                <Select
                    value={formData.connectionType}
                    onValueChange={(val: 'network' | 'serial') => setFormData({ ...formData, connectionType: val })}
                >
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="network">Network (WiFi/Ethernet)</SelectItem>
                        <SelectItem value="serial">Serial (USB)</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {formData.connectionType === 'network' ? (
                <div className="space-y-4 border-l-2 border-primary/20 pl-4">
                    <div className="grid gap-2">
                        <Label>IP Address</Label>
                        <Input
                            value={formData.ip}
                            onChange={e => setFormData({ ...formData, ip: e.target.value })}
                            placeholder="192.168.1.100"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label>Port</Label>
                        <Input
                            type="number"
                            value={formData.port}
                            onChange={e => setFormData({ ...formData, port: Number(e.target.value) })}
                            placeholder="80"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label>MAC Address (Optional)</Label>
                        <Input
                            value={formData.macAddress}
                            onChange={e => setFormData({ ...formData, macAddress: e.target.value })}
                            placeholder="AA:BB:CC:DD:EE:FF"
                        />
                    </div>
                </div>
            ) : (
                <div className="space-y-4 border-l-2 border-primary/20 pl-4">
                    <div className="grid gap-2">
                        <Label>Serial Port</Label>
                        <div className="flex gap-2">
                            <div className="flex-1 space-y-2">
                                <Select
                                    value={
                                        // If current port is in detected or common list, use it.
                                        // Otherwise, if it's not empty, it's custom.
                                        // If empty, it's empty.
                                        serialPorts.find(p => p.path === formData.serialPort) || commonPorts.find(p => p.path === formData.serialPort)
                                            ? formData.serialPort
                                            : (formData.serialPort ? "custom" : "")
                                    }
                                    onValueChange={(val) => {
                                        if (val === "custom") {
                                            // Keep existing value if switching to custom, or clear if it was a standard port
                                            // Actually, better to just set a flag or let them type.
                                            // For now, if they select custom, we just enable the input below.
                                            // We don't change the actual serialPort value yet until they type.
                                            // But we need to force the Select to show "custom".
                                            // Let's just set serialPort to empty string to clear it for typing?
                                            // No, that clears the input.
                                            // Let's assume if they pick "custom", we clear the selection to let them type.
                                            setFormData({ ...formData, serialPort: "" });
                                        } else {
                                            setFormData({ ...formData, serialPort: val });
                                        }
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a port..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {serialPorts.length > 0 && (
                                            <SelectGroup>
                                                <SelectLabel>Detected Ports</SelectLabel>
                                                {serialPorts.map(port => (
                                                    <SelectItem key={port.path} value={port.path}>
                                                        {port.path} <span className="text-xs text-muted-foreground">({port.manufacturer || 'Unknown'})</span>
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        )}
                                        <SelectGroup>
                                            <SelectLabel>Common Ports</SelectLabel>
                                            {commonPorts.map(port => (
                                                <SelectItem key={port.path} value={port.path}>
                                                    {port.label}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                        <SelectGroup>
                                            <SelectLabel>Other</SelectLabel>
                                            <SelectItem value="custom">Enter Custom Path...</SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>

                                {/* Show input if "custom" is selected OR if the current value is not in the lists (and not empty) */}
                                {(formData.serialPort === "" || (!serialPorts.find(p => p.path === formData.serialPort) && !commonPorts.find(p => p.path === formData.serialPort))) && (
                                    <Input
                                        value={formData.serialPort}
                                        onChange={e => setFormData({ ...formData, serialPort: e.target.value })}
                                        placeholder="e.g. /dev/ttyUSB0"
                                        className="mt-2"
                                    />
                                )}
                            </div>

                            <Button
                                variant="outline"
                                size="icon"
                                onClick={loadSerialPorts}
                                title="Refresh Ports"
                                disabled={loadingPorts}
                            >
                                <RefreshCw className={cn("h-4 w-4", loadingPorts && "animate-spin")} />
                            </Button>
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label>Baud Rate</Label>
                        <Select
                            value={String(formData.baudRate)}
                            onValueChange={(val) => setFormData({ ...formData, baudRate: Number(val) })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="9600">9600</SelectItem>
                                <SelectItem value="115200">115200</SelectItem>
                                <SelectItem value="57600">57600</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            )}
        </div>
    );

    const renderReview = () => (
        <div className="space-y-4 py-4">
            <div className="rounded-lg border p-4 space-y-3">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Type</span>
                    <span className="font-medium">{selectedTemplate?.label || editController?.type}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Name</span>
                    <span className="font-medium">{formData.name}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Connection</span>
                    <span className="font-medium flex items-center gap-2">
                        {formData.connectionType === 'network' ? <Wifi className="h-4 w-4" /> : <Usb className="h-4 w-4" />}
                        {formData.connectionType === 'network' ? formData.ip : formData.serialPort}
                    </span>
                </div>
                {formData.macAddress && (
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">MAC</span>
                        <span className="font-medium">{formData.macAddress}</span>
                    </div>
                )}
            </div>
            <p className="text-sm text-muted-foreground text-center">
                {editController
                    ? "Click Update to save changes."
                    : "Click Create to register this controller. It will start in 'Offline' state until it connects."}
            </p>
        </div>
    );

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {!editController && (
                <DialogTrigger asChild>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Controller
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>
                        {editController
                            ? 'Edit Controller'
                            : (step === 'type-selection' ? 'Select Controller Type' : (step === 'configuration' ? 'Configure Controller' : 'Review & Create'))}
                    </DialogTitle>
                </DialogHeader>

                {step === 'type-selection' && !editController && renderTypeSelection()}
                {step === 'configuration' && renderConfiguration()}
                {step === 'review' && renderReview()}

                <DialogFooter className="flex justify-between sm:justify-between">
                    {step !== 'type-selection' && !(editController && step === 'configuration') ? (
                        <Button variant="outline" onClick={() => setStep(step === 'review' ? 'configuration' : 'type-selection')}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                    ) : <div></div>}

                    {step === 'type-selection' ? (
                        <Button disabled variant="ghost">Select a type above</Button>
                    ) : step === 'configuration' ? (
                        <Button onClick={() => setStep('review')} disabled={!formData.name}>
                            Next <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    ) : (
                        <Button onClick={handleSubmit} disabled={loading}>
                            {loading ? (editController ? 'Updating...' : 'Creating...') : (editController ? 'Update Controller' : 'Create Controller')}
                            {!loading && <Check className="ml-2 h-4 w-4" />}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
