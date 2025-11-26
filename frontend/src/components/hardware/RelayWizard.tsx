import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { toast } from 'sonner';
import { hardwareService, type IController } from '../../services/hardwareService';

interface IRelay {
    _id: string;
    name: string;
    controllerId: IController;
    type: '1-channel' | '2-channel' | '4-channel' | '8-channel' | '16-channel';
    channels: any[];
}

interface RelayWizardProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
    editRelay?: IRelay | null; // If provided, we are in edit mode
}

export const RelayWizard: React.FC<RelayWizardProps> = ({ open, onOpenChange, onSuccess, editRelay }) => {
    const [step, setStep] = useState(1);
    const [controllers, setControllers] = useState<IController[]>([]);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        type: '4-channel',
        controllerId: '',
        channelMapping: {} as Record<number, string> // channelIndex -> portId
    });

    useEffect(() => {
        if (open) {
            loadControllers();
            if (editRelay) {
                // Edit Mode
                const mapping: Record<number, string> = {};
                editRelay.channels.forEach((ch: any) => {
                    mapping[ch.channelIndex] = ch.controllerPortId;
                });
                setFormData({
                    name: editRelay.name,
                    type: editRelay.type,
                    controllerId: editRelay.controllerId?._id || '',
                    channelMapping: mapping
                });
            } else {
                // Create Mode
                setFormData({ name: '', type: '4-channel', controllerId: '', channelMapping: {} });
            }
            setStep(1);
        }
    }, [open, editRelay]);

    const loadControllers = async () => {
        try {
            const data = await hardwareService.getControllers();
            setControllers(data);
        } catch (error) {
            console.error('Failed to load controllers', error);
            toast.error('Failed to load controllers');
        }
    };

    const getPortsForDropdown = (controllerId: string, currentChannelIndex: number) => {
        const controller = controllers.find(c => c._id === controllerId);
        if (!controller) return [];

        // Ports already selected in THIS wizard session (for other channels)
        const usedInWizard = Object.entries(formData.channelMapping)
            .filter(([chIdx]) => parseInt(chIdx) !== currentChannelIndex)
            .map(([, portId]) => portId);

        return Object.entries(controller.ports || {})
            .map(([portId, state]) => {
                let isDisabled = false;
                let occupiedText = '';

                if (state.isOccupied) {
                    // If occupied by THIS relay (in edit mode), it's fine
                    if (editRelay && editRelay._id && state.occupiedBy?.id === editRelay._id) {
                        isDisabled = false;
                    } else {
                        isDisabled = true;
                        occupiedText = `(Occupied by ${state.occupiedBy?.name || 'Unknown'})`;
                    }
                }

                if (usedInWizard.includes(portId)) {
                    isDisabled = true;
                    occupiedText = '(Selected for another channel)';
                }

                return {
                    id: portId,
                    disabled: isDisabled,
                    text: `${portId} ${occupiedText}`
                };
            })
            .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' }));
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            const channelCount = parseInt(formData.type.split('-')[0]);
            const channels = [];

            let hasMappedPort = false;
            for (let i = 1; i <= channelCount; i++) {
                const portId = formData.channelMapping[i];
                if (portId) {
                    hasMappedPort = true;
                }
                channels.push({
                    channelIndex: i,
                    controllerPortId: portId || null
                });
            }

            if (!hasMappedPort) {
                toast.error('Please map at least one channel to a controller port');
                setLoading(false);
                return;
            }

            const payload = {
                name: formData.name,
                type: formData.type,
                controllerId: formData.controllerId,
                channels
            };

            if (editRelay) {
                await hardwareService.updateRelay(editRelay._id, payload);
                toast.success('Relay updated successfully');
            } else {
                await hardwareService.createRelay(payload);
                toast.success('Relay created successfully');
            }

            onOpenChange(false);
            onSuccess();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to save relay');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{editRelay ? 'Edit Relay' : 'Add Relay Module'} - Step {step}</DialogTitle>
                </DialogHeader>

                {step === 1 && (
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g. Main Light Relay"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Type</Label>
                            <Select
                                value={formData.type}
                                onValueChange={v => setFormData({ ...formData, type: v })}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1-channel">1-Channel Relay</SelectItem>
                                    <SelectItem value="2-channel">2-Channel Relay</SelectItem>
                                    <SelectItem value="4-channel">4-Channel Relay</SelectItem>
                                    <SelectItem value="8-channel">8-Channel Relay</SelectItem>
                                    <SelectItem value="16-channel">16-Channel Relay</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Connected Controller</Label>
                            <Select
                                value={formData.controllerId}
                                onValueChange={v => setFormData({ ...formData, controllerId: v, channelMapping: {} })}
                            >
                                <SelectTrigger><SelectValue placeholder="Select Controller" /></SelectTrigger>
                                <SelectContent>
                                    {controllers.map(c => (
                                        <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button
                                className="w-full sm:w-auto"
                                disabled={!formData.name || !formData.controllerId}
                                onClick={() => setStep(2)}
                            >
                                Next <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </DialogFooter>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4 py-4">
                        <p className="text-sm text-muted-foreground">
                            Map each relay channel to a physical port on the controller.
                        </p>
                        <div className="grid gap-4 max-h-[300px] overflow-y-auto pr-2">
                            {Array.from({ length: parseInt(formData.type.split('-')[0]) }).map((_, i) => {
                                const channelIndex = i + 1;
                                const ports = getPortsForDropdown(formData.controllerId, channelIndex);

                                return (
                                    <div key={channelIndex} className="flex items-center gap-4">
                                        <Label className="w-24">Channel {channelIndex}</Label>
                                        <Select
                                            value={formData.channelMapping[channelIndex] || ''}
                                            onValueChange={v => setFormData({
                                                ...formData,
                                                channelMapping: { ...formData.channelMapping, [channelIndex]: v }
                                            })}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select Port" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {ports.map(p => (
                                                    <SelectItem key={p.id} value={p.id} disabled={p.disabled} className={p.disabled ? "text-muted-foreground opacity-50" : ""}>
                                                        {p.text}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                );
                            })}
                        </div>
                        <DialogFooter className="flex justify-between sm:justify-between">
                            <Button variant="outline" onClick={() => setStep(1)}>
                                <ArrowLeft className="mr-2 h-4 w-4" /> Back
                            </Button>
                            <Button onClick={handleSubmit} disabled={loading}>
                                {loading ? 'Saving...' : (editRelay ? 'Save Changes' : 'Create Relay')}
                                {!loading && <Check className="ml-2 h-4 w-4" />}
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};
