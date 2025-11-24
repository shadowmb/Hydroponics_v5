
import React, { useState, useEffect } from 'react';
import { hardwareService, type IController } from '../../services/hardwareService';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Trash2, Pencil, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

interface IRelay {
    _id: string;
    name: string;
    controllerId: IController; // Populated
    type: '1-channel' | '2-channel' | '4-channel' | '8-channel' | '16-channel';
    channels: any[];
}

export const RelayManager: React.FC = () => {
    const [relays, setRelays] = useState<IRelay[]>([]);
    const [controllers, setControllers] = useState<IController[]>([]);
    const [loading, setLoading] = useState(true);
    const [wizardOpen, setWizardOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editingRelayId, setEditingRelayId] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [relayToDelete, setRelayToDelete] = useState<string | null>(null);

    // Wizard State
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        type: '4-channel',
        controllerId: '',
        channelMapping: {} as Record<number, string> // channelIndex -> portId
    });

    const fetchData = async () => {
        try {
            setLoading(true);
            const [relaysData, controllersData] = await Promise.all([
                hardwareService.getRelays(),
                hardwareService.getControllers()
            ]);
            setRelays(relaysData);
            setControllers(controllersData);
        } catch (error) {
            toast.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenWizard = (relay?: IRelay) => {
        if (relay) {
            setEditMode(true);
            setEditingRelayId(relay._id);
            const mapping: Record<number, string> = {};
            relay.channels.forEach((ch: any) => {
                mapping[ch.channelIndex] = ch.controllerPortId;
            });
            setFormData({
                name: relay.name,
                type: relay.type,
                controllerId: relay.controllerId._id,
                channelMapping: mapping
            });
        } else {
            setEditMode(false);
            setEditingRelayId(null);
            setFormData({ name: '', type: '4-channel', controllerId: '', channelMapping: {} });
        }
        setStep(1);
        setWizardOpen(true);
    };

    const handleSubmit = async () => {
        try {
            const channelCount = parseInt(formData.type.split('-')[0]);
            const channels = [];

            for (let i = 1; i <= channelCount; i++) {
                const portId = formData.channelMapping[i];
                if (!portId) {
                    toast.error(`Please map Channel ${i} to a controller port`);
                    return;
                }
                channels.push({
                    channelIndex: i,
                    controllerPortId: portId
                });
            }

            const payload = {
                name: formData.name,
                type: formData.type,
                controllerId: formData.controllerId,
                channels
            };

            if (editMode && editingRelayId) {
                await hardwareService.updateRelay(editingRelayId, payload);
                toast.success('Relay updated successfully');
            } else {
                await hardwareService.createRelay(payload);
                toast.success('Relay created successfully');
            }

            setWizardOpen(false);
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to save relay');
        }
    };

    const handleDeleteClick = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setRelayToDelete(id);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!relayToDelete) return;
        try {
            await hardwareService.deleteRelay(relayToDelete);
            toast.success('Relay deleted');
            setDeleteDialogOpen(false);
            setRelayToDelete(null);
            fetchData();
        } catch (error) {
            console.error('Delete failed:', error);
            toast.error('Failed to delete relay');
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
                // A port is "disabled" if:
                // 1. It is occupied by something else (NOT this relay if we are editing)
                // 2. It is selected for another channel in the current wizard

                let isDisabled = false;
                let occupiedText = '';

                if (state.isOccupied) {
                    // If occupied by THIS relay, it's fine (we are re-mapping or keeping it)
                    // But wait, if we are editing, the port is occupied by US.
                    // We need to know if it's occupied by *another* entity.
                    // Since we don't have easy access to "original" state here without complex logic,
                    // we rely on the fact that if we are editing, we might be selecting a port we already own.

                    // Ideally: check if occupiedBy.id !== editingRelayId
                    // But occupiedBy might not have the relay ID directly if it's just { type: 'relay', name: ... }
                    // Our backend stores ID. Let's assume state.occupiedBy.id exists.

                    if (editMode && editingRelayId && state.occupiedBy?.id === editingRelayId) {
                        // Occupied by us, so it's available to select
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

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold tracking-tight">Relay Modules</h2>
                <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => handleOpenWizard()}><Plus className="mr-2 h-4 w-4" /> Add Relay</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>{editMode ? 'Edit Relay' : 'Add Relay Module'} - Step {step}</DialogTitle>
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
                                <Button
                                    className="w-full"
                                    disabled={!formData.name || !formData.controllerId}
                                    onClick={() => setStep(2)}
                                >
                                    Next <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
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
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                                    <Button className="flex-1" onClick={handleSubmit}>{editMode ? 'Save Changes' : 'Create Relay'}</Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Relay</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p>Are you sure you want to delete this relay? This will free up the controller ports.</p>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Card>
                <CardHeader>
                    <CardTitle>Installed Relays</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Controller</TableHead>
                                <TableHead>Channels (Mapped Ports)</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {relays.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        No relays found. Add one to expand your system.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                relays.map(relay => (
                                    <TableRow key={relay._id}>
                                        <TableCell className="font-medium">{relay.name}</TableCell>
                                        <TableCell><Badge variant="outline">{relay.type}</Badge></TableCell>
                                        <TableCell>{relay.controllerId?.name || 'Unknown'}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {relay.channels.map((ch: any) => (
                                                    <TooltipProvider key={ch.channelIndex}>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Badge
                                                                    variant={ch.isOccupied ? "default" : "secondary"}
                                                                    className="cursor-help"
                                                                >
                                                                    {ch.controllerPortId}
                                                                </Badge>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Channel {ch.channelIndex}</p>
                                                                {ch.isOccupied && <p className="text-xs text-muted-foreground">Connected to: {ch.occupiedBy?.name || 'Device'}</p>}
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                ))}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleOpenWizard(relay)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                    onClick={(e) => handleDeleteClick(relay._id, e)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};
