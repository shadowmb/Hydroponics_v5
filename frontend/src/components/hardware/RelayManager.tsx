import React, { useState, useEffect } from 'react';
import { hardwareService, type IController } from '../../services/hardwareService';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trash2, Pencil, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { RelayWizard } from './RelayWizard';
import { ExpandedRelayView } from '../../pages/relays/ExpandedRelayView';
import { DeviceWizard } from './DeviceWizard';
import { DeviceTestDialog } from '../devices/test/DeviceTestDialog';

interface IRelay {
    _id: string;
    name: string;
    controllerId: IController; // Populated
    type: '1-channel' | '2-channel' | '4-channel' | '8-channel' | '16-channel';
    channels: any[];
}

export const RelayManager: React.FC = () => {
    const [relays, setRelays] = useState<IRelay[]>([]);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    // Relay Wizard State
    const [wizardOpen, setWizardOpen] = useState(false);
    const [relayToEdit, setRelayToEdit] = useState<IRelay | null>(null);

    // Delete Dialog State
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [relayToDelete, setRelayToDelete] = useState<string | null>(null);

    // Device Dialogs State
    const [deviceWizardOpen, setDeviceWizardOpen] = useState(false);
    const [deviceToEdit, setDeviceToEdit] = useState<any | null>(null);
    const [deviceTestOpen, setDeviceTestOpen] = useState(false);
    const [testDevice, setTestDevice] = useState<any | null>(null);

    const fetchData = async () => {
        try {
            const relaysData = await hardwareService.getRelays();
            setRelays(relaysData);
        } catch (error) {
            toast.error('Failed to fetch data');
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const toggleRow = (id: string) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedRows(newExpanded);
    };

    // Relay Wizard Handlers
    const handleOpenWizard = (relay?: IRelay) => {
        if (relay) {
            setRelayToEdit(relay);
        } else {
            setRelayToEdit(null);
        }
        setWizardOpen(true);
    };

    const handleWizardSuccess = () => {
        fetchData();
    };

    // Delete Handlers
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

    // Device Handlers
    const handleAddDevice = (relayId: string, channelIndex: number) => {
        // Pre-fill data for creating a device on this relay slot
        setDeviceToEdit({
            hardware: {
                relayId: relayId,
                channel: channelIndex,
                parentId: relays.find(r => r._id === relayId)?.controllerId?._id // Auto-link logic if needed backend handles checks
            }
        });
        setDeviceWizardOpen(true);
    };

    const handleEditDevice = (device: any) => {
        setDeviceToEdit(device);
        setDeviceWizardOpen(true);
    };

    const handleDeviceSaved = () => {
        fetchData(); // Refresh relays to show new occupation
    };

    const handleTestDevice = (device: any) => {
        setTestDevice(device);
        setDeviceTestOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold tracking-tight">Relay Modules</h2>
                <div className="flex gap-2">
                    <RelayWizard
                        open={wizardOpen}
                        onOpenChange={setWizardOpen}
                        onSuccess={handleWizardSuccess}
                        editRelay={relayToEdit || undefined}
                    />
                </div>
            </div>

            {/* Device Dialogs */}
            <DeviceWizard
                open={deviceWizardOpen}
                onOpenChange={setDeviceWizardOpen}
                onSuccess={handleDeviceSaved}
                initialData={deviceToEdit}
            />

            {testDevice && (
                <DeviceTestDialog
                    open={deviceTestOpen}
                    onOpenChange={setDeviceTestOpen}
                    device={testDevice}
                />
            )}

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
                                <TableHead className="w-[50px]"></TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Controller</TableHead>
                                <TableHead>Trigger Logic</TableHead>
                                <TableHead>Channels (Mapped Ports)</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {relays.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                        No relays found. Add one to expand your system.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                relays.map(relay => (
                                    <React.Fragment key={relay._id}>
                                        <TableRow
                                            className="cursor-pointer hover:bg-muted/50 transition-colors"
                                            onClick={() => toggleRow(relay._id)}
                                        >
                                            <TableCell>
                                                {expandedRows.has(relay._id) ?
                                                    <ChevronUp className="h-4 w-4 text-muted-foreground" /> :
                                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                                }
                                            </TableCell>
                                            <TableCell className="font-medium">{relay.name}</TableCell>
                                            <TableCell><Badge variant="outline">{relay.type}</Badge></TableCell>
                                            <TableCell>
                                                {relay.controllerId ? (
                                                    (relay.controllerId as any).name || 'Unknown'
                                                ) : (
                                                    <Badge variant="destructive" className="bg-yellow-500 hover:bg-yellow-600 text-white border-0">
                                                        Unassigned
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">
                                                    {(relay as any).triggerLogic || 'HIGH'}
                                                </Badge>
                                            </TableCell>
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
                                                <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
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

                                        {/* EXPANDED ROW */}
                                        {expandedRows.has(relay._id) && (
                                            <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 dark:bg-slate-900/20 dark:hover:bg-slate-900/20">
                                                <TableCell colSpan={7} className="p-0 border-t-0">
                                                    <ExpandedRelayView
                                                        relay={relay}
                                                        onAddDevice={handleAddDevice}
                                                        onEditDevice={handleEditDevice}
                                                        onTestDevice={handleTestDevice}
                                                        onRefresh={fetchData}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </React.Fragment>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};
