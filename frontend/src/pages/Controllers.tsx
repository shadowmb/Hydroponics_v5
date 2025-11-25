import React, { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronDown, ChevronRight, Pencil, RefreshCw, Trash2, Usb, Wifi } from 'lucide-react';
import { toast } from 'sonner';
import { ControllerWizard } from '../components/hardware/ControllerWizard';
import { PortManager } from '../components/hardware/PortManager';
import { hardwareService, type IController } from '../services/hardwareService';

// Component to show connected devices/relays when row is expanded
const ExpandedControllerRow: React.FC<{ controllerId: string }> = ({ controllerId }) => {
    const [devices, setDevices] = useState<any[]>([]);
    const [relays, setRelays] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [allDevices, allRelays] = await Promise.all([
                    hardwareService.getDevices(),
                    hardwareService.getRelays()
                ]);

                // Filter for this controller
                setDevices(allDevices.filter((d: any) => d.hardware?.parentId === controllerId));
                // Handle both populated object and string ID for controllerId
                setRelays(allRelays.filter((r: any) => (r.controllerId?._id || r.controllerId) === controllerId));
            } catch (err) {
                console.error("Failed to fetch details for expanded row", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [controllerId]);

    if (loading) return <div className="p-4 text-center text-sm text-muted-foreground">Loading details...</div>;
    if (devices.length === 0 && relays.length === 0) return <div className="p-4 text-center text-sm text-muted-foreground">No connected devices or relays.</div>;

    return (
        <div className="p-4 bg-muted/30 space-y-4">
            {relays.length > 0 && (
                <div>
                    <h4 className="text-sm font-semibold mb-2">Connected Relays</h4>
                    <div className="grid gap-2">
                        {relays.map(relay => (
                            <div key={relay._id} className="flex items-center gap-2 text-sm border p-2 rounded bg-background">
                                <Badge variant="outline">Relay</Badge>
                                <span className="font-medium">{relay.name}</span>
                                <span className="text-muted-foreground text-xs">({relay.type})</span>
                                <span className="text-xs text-muted-foreground ml-2">
                                    Ports: {relay.channels
                                        .map((c: any) => c.controllerPortId)
                                        .filter((p: any) => p) // Filter out null/undefined
                                        .join(', ')}
                                </span>
                                <span className="ml-auto text-xs text-muted-foreground">{relay.channels.length} Channels</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {devices.length > 0 && (
                <div>
                    <h4 className="text-sm font-semibold mb-2">Connected Devices</h4>
                    <div className="grid gap-2">
                        {devices.map(device => (
                            <div key={device._id} className="flex items-center gap-2 text-sm border p-2 rounded bg-background">
                                <Badge variant="outline">Device</Badge>
                                <span className="font-medium">{device.name}</span>
                                <span className="text-muted-foreground text-xs">Port: {device.hardware?.port}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("Controllers Error Boundary caught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-4 border border-red-500 bg-red-50 text-red-900 rounded m-4">
                    <h2 className="font-bold text-lg">Something went wrong in Controllers Component</h2>
                    <p className="font-mono text-sm mt-2">{this.state.error?.message}</p>
                    <details className="mt-2">
                        <summary>Stack Trace</summary>
                        <pre className="text-xs overflow-auto mt-2 p-2 bg-white rounded border">
                            {this.state.error?.stack}
                        </pre>
                    </details>
                </div>
            );
        }

        return this.props.children;
    }
}

interface ControllersProps {
    initialWizardData?: Partial<IController> | null;
    onWizardClose?: () => void;
    refreshTrigger?: number;
}


const Controllers: React.FC<ControllersProps> = ({ initialWizardData, onWizardClose, refreshTrigger }) => {

    const [controllers, setControllers] = useState<IController[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedController, setSelectedController] = useState<IController | null>(null);
    const [portManagerOpen, setPortManagerOpen] = useState(false);
    const [editWizardOpen, setEditWizardOpen] = useState(false);
    const [controllerToEdit, setControllerToEdit] = useState<IController | undefined>(undefined);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [controllerToDelete, setControllerToDelete] = useState<string | null>(null);
    const [expandedControllerId, setExpandedControllerId] = useState<string | null>(null);

    const toggleExpand = (id: string) => {
        setExpandedControllerId(prev => prev === id ? null : id);
    };

    const [isSyncing, setIsSyncing] = useState(false);

    const handleRefresh = async () => {
        try {
            setIsSyncing(true);

            // Allow React to render the overlay before starting the work
            await new Promise(resolve => setTimeout(resolve, 100));

            // Run sync and a 1-second timer in parallel. 
            // Use allSettled so we wait for the timer even if sync fails immediately.
            await Promise.allSettled([
                hardwareService.syncStatus(),
                new Promise(resolve => setTimeout(resolve, 1000))
            ]);

            await fetchControllers();
            toast.success('Hardware status updated');
        } catch (error) {
            console.error('Sync failed', error);
            toast.error('Failed to sync hardware status');
        } finally {
            setIsSyncing(false);
        }
    };

    const fetchControllers = async () => {
        try {
            setLoading(true);
            const data = await hardwareService.getControllers();
            setControllers(data);

            // Update selected controller if it exists (to keep PortManager in sync)
            if (selectedController) {
                const updated = data.find(c => c._id === selectedController._id);
                if (updated) {
                    setSelectedController(updated);
                }
            }
        } catch (error) {
            toast.error('Failed to fetch controllers');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchControllers();
    }, [refreshTrigger]);


    useEffect(() => {
        if (initialWizardData) {
            setEditWizardOpen(true);
            // We don't set controllerToEdit because we are creating a new one
            setControllerToEdit(undefined);
        }
    }, [initialWizardData]);

    const handleDeleteClick = (id: string) => {
        setControllerToDelete(id);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!controllerToDelete) return;
        try {
            await hardwareService.deleteController(controllerToDelete);
            toast.success('Controller deleted');
            fetchControllers();
        } catch (error) {
            toast.error('Failed to delete controller');
        } finally {
            setDeleteDialogOpen(false);
            setControllerToDelete(null);
        }
    };

    const openPortManager = (controller: IController) => {
        setSelectedController(controller);
        setPortManagerOpen(true);
    };

    const openEditWizard = (controller: IController) => {
        setControllerToEdit(controller);
        setEditWizardOpen(true);
    };

    if (!Array.isArray(controllers)) {
        console.error('CRITICAL: controllers is not an array!', controllers);
        return <div className="p-4 text-red-500">Error: Controllers data is corrupted (not an array). Check console.</div>;
    }

    return (
        <ErrorBoundary>
            {isSyncing && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <RefreshCw className="h-12 w-12 animate-spin text-white" />
                        <p className="text-lg font-medium text-white">Checking Hardware Status...</p>
                    </div>
                </div>
            )}
            <div className="container mx-auto py-6 space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Controllers</h1>
                        <p className="text-muted-foreground">Manage your hardware controllers and gateways.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isSyncing}>
                            <RefreshCw className={`h-4 w-4 ${loading && !isSyncing ? 'animate-spin' : ''}`} />
                        </Button>
                        <ControllerWizard onControllerCreated={fetchControllers} />
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Connected Controllers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]"></TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Connection</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {controllers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                            No controllers found. Add one to get started.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    controllers.map((controller) => {
                                        if (!controller) {
                                            console.error('Found null controller in list');
                                            return null;
                                        }
                                        return (
                                            <React.Fragment key={controller._id}>
                                                <TableRow className={expandedControllerId === controller._id ? "bg-muted/50 border-b-0" : ""}>
                                                    <TableCell>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0"
                                                            onClick={() => toggleExpand(controller._id)}
                                                        >
                                                            {expandedControllerId === controller._id ? (
                                                                <ChevronDown className="h-4 w-4" />
                                                            ) : (
                                                                <ChevronRight className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    </TableCell>
                                                    <TableCell className="font-medium">
                                                        <div>{controller.name}</div>
                                                        <div className="text-xs text-muted-foreground">{controller.description}</div>
                                                    </TableCell>
                                                    <TableCell>{controller.type}</TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            {controller.connection?.type === 'network' ? (
                                                                <Wifi className="h-4 w-4 text-blue-500" />
                                                            ) : (
                                                                <Usb className="h-4 w-4 text-orange-500" />
                                                            )}
                                                            <span className="text-sm">
                                                                {controller.connection?.type === 'network'
                                                                    ? `${controller.connection?.ip}:${controller.connection?.port}`
                                                                    : (controller.connection?.serialPort || 'N/A')}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={controller.status === 'online' ? 'default' : 'secondary'}>
                                                            {controller.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => openPortManager(controller)}
                                                            >
                                                                Manage Ports
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => openEditWizard(controller)}
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                                onClick={() => handleDeleteClick(controller._id)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                                {expandedControllerId === controller._id && (
                                                    <TableRow>
                                                        <TableCell colSpan={6} className="p-0">
                                                            <ExpandedControllerRow controllerId={controller._id} />
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </React.Fragment>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <PortManager
                    controller={selectedController}
                    open={portManagerOpen}
                    onOpenChange={setPortManagerOpen}
                    onUpdate={fetchControllers}
                />

                <ControllerWizard
                    onControllerCreated={() => {
                        fetchControllers();
                        if (onWizardClose) onWizardClose();
                    }}
                    editController={controllerToEdit}
                    initialData={initialWizardData || undefined}
                    open={editWizardOpen}
                    onOpenChange={(open) => {
                        setEditWizardOpen(open);
                        if (!open && onWizardClose) onWizardClose();
                    }}
                />

                <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Delete Controller</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete this controller?
                                <br /><br />
                                <span className="font-bold text-destructive">Warning:</span> Any connected devices or relays will be <strong>detached</strong> (unassigned) but not deleted.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </ErrorBoundary>
    );
};

export default Controllers;
