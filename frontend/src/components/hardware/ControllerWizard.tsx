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
import { Checkbox } from "@/components/ui/checkbox";
import { useUIState } from '@/context/UIStateContext';

interface ControllerWizardProps {
    onControllerCreated: () => void;
    editController?: IController;
    initialData?: Partial<IController>;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    hideTrigger?: boolean;
}

type WizardStep = 'type-selection' | 'configuration' | 'review';

const stepMap: Record<WizardStep, number> = {
    'type-selection': 1,
    'configuration': 2,
    'review': 3
};

export const ControllerWizard: React.FC<ControllerWizardProps> = ({ onControllerCreated, editController, initialData, open: controlledOpen, onOpenChange, hideTrigger }) => {
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const setOpen = isControlled ? onOpenChange! : setInternalOpen;

    const [step, setStep] = useState<WizardStep>('type-selection');
    const { setWizardState, clearWizardState } = useUIState();

    const [templates, setTemplates] = useState<IControllerTemplate[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<IControllerTemplate | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        macAddress: '',
        connectionType: 'network' as 'network' | 'serial',
        ip: '',
        port: 8888,
        serialPort: '',
        baudRate: 9600,
        offlineMode: false
    });

    const [serialPorts, setSerialPorts] = useState<any[]>([]);
    const [loadingPorts, setLoadingPorts] = useState(false);

    useEffect(() => {
        if (open) {
            setWizardState({
                active: true,
                name: 'ControllerWizard',
                step: stepMap[step],
                config: {
                    ...formData,
                    template: selectedTemplate?.key
                }
            });
        }
        return () => {
            if (!open) {
                clearWizardState();
            }
        };
    }, [open, step, formData, selectedTemplate, setWizardState, clearWizardState]);

    const MODEL_MAP: Record<string, string> = {
        'Arduino_Uno_R4_WiFi': 'Arduino_Uno',
        'ArduinoUnoR4WiFi': 'Arduino_Uno',
        'ArduinoUnoR3': 'Arduino_Uno',
        'Arduino Uno': 'Arduino_Uno',
        'ESP32': 'ESP32',
        'WeMos D1 R2': 'WeMos_D1_R2',
        'WeMos D1 R2 V2.1.0': 'WeMos_D1_R2',
        'LilyGO T-Relay': 'lilygo_t_relay_4'
    };

    useEffect(() => {
        if (open) {
            loadTemplates();
            loadSerialPorts();
            if (editController) {
                setStep('configuration');
                setFormData({
                    name: editController.name,
                    description: editController.description || '',
                    macAddress: editController.macAddress || '',
                    connectionType: editController.connection.type,
                    ip: editController.connection.ip || '',
                    port: editController.connection.port || 8888,
                    serialPort: editController.connection.serialPort || '',
                    baudRate: editController.connection.baudRate || 9600,
                    offlineMode: editController.connection.type === 'network' && !editController.connection.ip
                });
                setSelectedTemplate({
                    key: editController.type,
                    label: editController.type,
                    ports: [],
                    communication_by: [],
                    communication_type: []
                });
            } else if (initialData) {
                setStep('type-selection');
                setFormData({
                    name: initialData.name || '',
                    description: initialData.description || '',
                    macAddress: initialData.macAddress || '',
                    connectionType: initialData.connection?.type || 'network',
                    ip: initialData.connection?.ip || '',
                    port: initialData.connection?.port || 8888,
                    serialPort: initialData.connection?.serialPort || '',
                    baudRate: initialData.connection?.baudRate || 9600,
                    offlineMode: false
                });
            } else {
                setStep('type-selection');
                resetForm();
            }
        }
    }, [open, editController, initialData]);

    useEffect(() => {
        if (open && !editController && initialData && templates.length > 0) {
            const name = initialData.name || '';
            const match = name.match(/\((.*?)\)/);
            const modelName = match ? match[1] : name;

            let templateKey = MODEL_MAP[modelName];
            if (!templateKey) {
                const isKey = templates.some(t => t.key === modelName);
                if (isKey) templateKey = modelName;
            }

            if (templateKey) {
                const template = templates.find(t => t.key === templateKey);
                if (template) {
                    setSelectedTemplate(template);
                    setStep('configuration');
                }
            }
        }
    }, [templates, open, editController, initialData]);

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
            port: 8888,
            serialPort: '',
            baudRate: 9600,
            offlineMode: false
        });
    };

    const handleTemplateSelect = (template: IControllerTemplate) => {
        setSelectedTemplate(template);
        setFormData(prev => ({ ...prev, name: template.label }));
        setStep('configuration');
    };

    const handleSubmit = async () => {
        if (!selectedTemplate) return;

        // Validation: If network and NOT offline, IP/Port mandatory
        if (formData.connectionType === 'network' && !formData.offlineMode) {
            if (!formData.ip || formData.ip.length < 7) {
                toast.error('IP Address is required for network controllers');
                return;
            }
            if (!formData.port) {
                toast.error('Port is required');
                return;
            }
        }

        try {
            setLoading(true);
            const connection = {
                type: formData.connectionType,
                ...(formData.connectionType === 'network' ? {
                    ip: formData.offlineMode ? '' : formData.ip,
                    port: formData.offlineMode ? 0 : Number(formData.port)
                } : {
                    serialPort: formData.serialPort,
                    baudRate: Number(formData.baudRate)
                })
            };

            const status = formData.offlineMode ? 'offline' : 'offline'; // Initially offline, service will connect

            if (editController) {
                await hardwareService.updateController(editController._id, {
                    name: formData.name,
                    description: formData.description,
                    macAddress: formData.macAddress || undefined,
                    connection,
                    // If offline mode is toggled on, status should probably be forced/reset, 
                    // but backend handles connection logic.
                });
                toast.success('Controller updated successfully');
            } else {
                const payload = {
                    name: formData.name,
                    type: selectedTemplate.key,
                    description: formData.description,
                    macAddress: formData.macAddress || undefined,
                    connection,
                    status: status as 'offline' | 'online' | 'error',
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
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="offlineMode"
                            checked={formData.offlineMode}
                            onCheckedChange={(checked) => {
                                const isOffline = checked === true;
                                setFormData({
                                    ...formData,
                                    offlineMode: isOffline,
                                    ip: isOffline ? '' : formData.ip
                                });
                            }}
                        />
                        <Label htmlFor="offlineMode" className="cursor-pointer">
                            Offline Mode (Pre-configure without IP)
                        </Label>
                    </div>

                    <div className="grid gap-2">
                        <Label className={formData.offlineMode ? "text-muted-foreground" : ""}>
                            IP Address {formData.offlineMode ? '(Optional)' : '(Required)'}
                        </Label>
                        <Input
                            value={formData.ip}
                            onChange={e => setFormData({ ...formData, ip: e.target.value })}
                            placeholder="192.168.1.100"
                            disabled={formData.offlineMode}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label className={formData.offlineMode ? "text-muted-foreground" : ""}>
                            Port (UDP) {formData.offlineMode ? '(Optional)' : '(Required)'}
                        </Label>
                        <Input
                            type="number"
                            value={formData.port}
                            onChange={e => setFormData({ ...formData, port: Number(e.target.value) })}
                            placeholder="8888"
                            disabled={formData.offlineMode}
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
                                        serialPorts.find(p => p.path === formData.serialPort) || commonPorts.find(p => p.path === formData.serialPort)
                                            ? formData.serialPort
                                            : (formData.serialPort ? "custom" : "")
                                    }
                                    onValueChange={(val) => {
                                        if (val === "custom") {
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
                        {formData.connectionType === 'network'
                            ? (formData.offlineMode ? "Offline Mode (No IP)" : `${formData.ip}:${formData.port}`)
                            : formData.serialPort}
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
                    : "Click Create to register this controller."}
            </p>
        </div>
    );

    return (
        <Dialog open={open} onOpenChange={setOpen} modal={false}>
            {!editController && !hideTrigger && (
                <DialogTrigger asChild>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Controller
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent
                className="sm:max-w-[600px]"
                onPointerDownOutside={(e) => e.preventDefault()}
                onInteractOutside={(e) => e.preventDefault()}
            >
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
