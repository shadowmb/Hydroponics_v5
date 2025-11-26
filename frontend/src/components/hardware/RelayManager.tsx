
import React, { useState, useEffect } from 'react';
import { hardwareService, type IController } from '../../services/hardwareService';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trash2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { RelayWizard } from './RelayWizard';

interface IRelay {
    _id: string;
    name: string;
    controllerId: IController; // Populated
    type: '1-channel' | '2-channel' | '4-channel' | '8-channel' | '16-channel';
    channels: any[];
}

export const RelayManager: React.FC = () => {
    const [relays, setRelays] = useState<IRelay[]>([]);
    const [wizardOpen, setWizardOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [relayToDelete, setRelayToDelete] = useState<string | null>(null);
    const [relayToEdit, setRelayToEdit] = useState<IRelay | null>(null);

    const fetchData = async () => {
        try {
            // setLoading(true);
            const relaysData = await hardwareService.getRelays();
            setRelays(relaysData);
        } catch (error) {
            toast.error('Failed to fetch data');
        } finally {
            // setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

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



    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold tracking-tight">Relay Modules</h2>
                <RelayWizard
                    open={wizardOpen}
                    onOpenChange={setWizardOpen}
                    onSuccess={handleWizardSuccess}
                    editRelay={relayToEdit || undefined}
                />
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
                                        <TableCell>
                                            {relay.controllerId ? (
                                                relay.controllerId.name
                                            ) : (
                                                <Badge variant="destructive" className="bg-yellow-500 hover:bg-yellow-600 text-white border-0">
                                                    Unassigned
                                                </Badge>
                                            )}
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
