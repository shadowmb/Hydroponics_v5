import React, { useState, useEffect } from 'react';
import { hardwareService, type IController } from '../../services/hardwareService';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Cpu, Activity, Droplet, Thermometer, Zap } from 'lucide-react';
import { toast } from 'sonner';

interface DeviceWizardProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export const DeviceWizard: React.FC<DeviceWizardProps> = ({ open, onOpenChange, onSuccess }) => {
    const [step, setStep] = useState(1);
    const [templates, setTemplates] = useState<any[]>([]);
    const [controllers, setControllers] = useState<IController[]>([]);
    const [loading, setLoading] = useState(false);

    // Form Data
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        controllerId: '',
        port: ''
    });

    useEffect(() => {
        if (open) {
            setStep(1);
            setFormData({ name: '', description: '', controllerId: '', port: '' });
            setSelectedTemplate(null);
            fetchData();
        }
    }, [open]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [tpls, ctrls] = await Promise.all([
                hardwareService.getDeviceTemplates(),
                hardwareService.getControllers()
            ]);
            setTemplates(tpls);
            setControllers(ctrls);
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
            const payload = {
                name: formData.name,
                type: selectedTemplate.physicalType === 'relay' ? 'ACTUATOR' : 'SENSOR', // Simplified logic
                config: {
                    driverId: selectedTemplate._id,
                    pollInterval: 5000 // Default
                },
                hardware: {
                    parentId: formData.controllerId,
                    port: formData.port
                },
                metadata: {
                    description: formData.description
                }
            };

            await hardwareService.createDevice(payload);
            toast.success('Device created successfully');
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to create device');
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

        // Filter ports based on template requirements
        const req = selectedTemplate?.portRequirements[0]; // Assume single port for now
        if (!req) return [];

        return Object.entries(controller.ports)
            .filter(([id, state]) => {
                // Check if occupied
                if (state.isOccupied) return false;

                // Check type (simple heuristic)
                if (req.type === 'analog' && !id.startsWith('A')) return false;
                if (req.type === 'digital' && !id.startsWith('D')) return false;

                return true;
            })
            .map(([id]) => id)
            .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] h-[500px] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Add New Device - Step {step}</DialogTitle>
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
                            <div className="p-4 bg-muted/50 rounded-lg flex items-center gap-3">
                                {getIcon(selectedTemplate?.uiConfig?.icon)}
                                <div>
                                    <p className="font-medium">{selectedTemplate?.name}</p>
                                    <p className="text-xs text-muted-foreground">Type: {selectedTemplate?.physicalType}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Connect to Controller</Label>
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
                            disabled={!formData.controllerId || !formData.port || loading}
                        >
                            {loading ? 'Creating...' : 'Create Device'}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
