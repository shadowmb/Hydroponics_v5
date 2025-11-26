import React, { useState, useEffect } from 'react';
import {
    ChevronDown,
    ChevronRight,
    RefreshCw,
    Wifi,
    Usb,
    Code,
    Trash2,
    Plus,
    Pencil
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { toast } from 'sonner';

import { ControllerWizard } from '../components/hardware/ControllerWizard';
import { PortManager } from '../components/hardware/PortManager';
import { hardwareService, type IController } from '../services/hardwareService';
import { NetworkScanPrompt } from '../components/hardware/NetworkScanPrompt';

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
                                <span className="text-muted-foreground text-xs">
                                    {device.hardware?.port ? (
                                        `Port: ${device.hardware.port}`
                                    ) : device.hardware?.pins && Object.keys(device.hardware.pins).length > 0 ? (
                                        `Pins: ${Object.entries(device.hardware.pins).map(([k, v]) => `${k}:${v}`).join(', ')}`
                                    ) : (
                                        'No Port'
                                    )}
                                </span>
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

    const [selectedController, setSelectedController] = useState<IController | null>(null);
    const [portManagerOpen, setPortManagerOpen] = useState(false);
    const [editWizardOpen, setEditWizardOpen] = useState(false);
    const [controllerToEdit, setControllerToEdit] = useState<IController | undefined>(undefined);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [controllerToDelete, setControllerToDelete] = useState<string | null>(null);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [isScanPromptOpen, setIsScanPromptOpen] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [refreshingIds, setRefreshingIds] = useState<Set<string>>(new Set());

    const toggleRow = (id: string) => {
        setExpandedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const fetchControllers = React.useCallback(async () => {
        try {
            const data = await hardwareService.getControllers();
            setControllers(data);

            // Update selected controller if it exists (to keep PortManager in sync)
            if (selectedController) {
                const updated = data.find(c => c._id === selectedController._id);
                if (updated) {
                    setSelectedController(updated);
                }
            }
        } catch {
            toast.error('Failed to fetch controllers');
        }
    }, [selectedController]);

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

    const handleRefreshController = async (controller: IController, e: React.MouseEvent) => {
        e.stopPropagation();
        if (controller.isActive === false) return;

        setRefreshingIds(prev => new Set(prev).add(controller._id));
        try {
            await hardwareService.refreshController(controller._id);
            toast.success('Controller status refreshed');
            fetchControllers();
        } catch (error) {
            console.error('Failed to refresh controller:', error);
            toast.error('Failed to refresh controller');
        } finally {
            setRefreshingIds(prev => {
                const next = new Set(prev);
                next.delete(controller._id);
                return next;
            });
        }
    };

    const handleToggleActive = async (controller: IController, isActive: boolean) => {
        try {
            await hardwareService.updateController(controller._id, { isActive });
            toast.success(`Controller ${isActive ? 'activated' : 'deactivated'}`);

            if (isActive) {
                // Trigger refresh immediately to check connection
                setRefreshingIds(prev => new Set(prev).add(controller._id));
                try {
                    await hardwareService.refreshController(controller._id);
                } catch {
                    // Ignore error, fetchControllers will update status
                } finally {
                    setRefreshingIds(prev => {
                        const next = new Set(prev);
                        next.delete(controller._id);
                        return next;
                    });
                }
            }

            fetchControllers();
        } catch (error) {
            console.error('Failed to update controller:', error);
            toast.error('Failed to update controller status');
        }
    };

    useEffect(() => {
        fetchControllers();
    }, [refreshTrigger, fetchControllers]);

    useEffect(() => {
        if (initialWizardData) {
            setEditWizardOpen(true);
            // We don't set controllerToEdit because we are creating a new one
            setControllerToEdit(undefined);
        }
    }, [initialWizardData]);

    const formatLastCheck = (dateInput?: string | Date) => {
        if (!dateInput) return '-';
        const date = new Date(dateInput);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return '< 1 min';
        if (diffMins < 60) return `${diffMins} min`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `${diffHours} h`;
        return `${Math.floor(diffHours / 24)} d`;
    };

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
        } catch {
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

    const handleControllerCreated = () => {
        fetchControllers();
        if (onWizardClose) onWizardClose();
        setIsScanPromptOpen(true);
    };

    if (!Array.isArray(controllers)) {
        console.error('CRITICAL: controllers is not an array!', controllers);
        return <div className="p-4 text-red-500">Error: Controllers data is corrupted (not an array). Check console.</div>;
    }

    return (
        <ErrorBoundary>
            <div className="container mx-auto py-6 space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Controllers</h1>
                        <p className="text-muted-foreground">Manage your hardware controllers and gateways.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={handleRefresh} variant="outline" disabled={isSyncing}>
                            <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                            Sync Status
                        </Button>
                        <Button onClick={() => { setControllerToEdit(undefined); setEditWizardOpen(true); }}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Controller
                        </Button>
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
                                    <TableHead>Status</TableHead>
                                    <TableHead>Connection</TableHead>
                                    <TableHead>Commands</TableHead>
                                    <TableHead>Last Check</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {controllers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
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
                                                <TableRow
                                                    className={expandedRows.has(controller._id) ? "bg-muted/50 border-b-0" : ""}
                                                    onClick={() => toggleRow(controller._id)}
                                                >
                                                    <TableCell>
                                                        {expandedRows.has(controller._id) ? (
                                                            <ChevronDown className="h-4 w-4" />
                                                        ) : (
                                                            <ChevronRight className="h-4 w-4" />
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="font-medium">
                                                        <div>{controller.name}</div>
                                                        <div className="text-xs text-muted-foreground">{controller.description}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Badge
                                                                variant={controller.status === 'online' ? 'default' : controller.status === 'error' ? 'destructive' : 'secondary'}
                                                                className={controller.status === 'error' ? 'bg-orange-500 hover:bg-orange-600' : ''}
                                                            >
                                                                {controller.status === 'online' ? 'Online' : controller.status === 'error' ? 'Error' : 'Offline'}
                                                            </Badge>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-6 w-6"
                                                                onClick={(e) => handleRefreshController(controller, e)}
                                                                disabled={controller.isActive === false || refreshingIds.has(controller._id)}
                                                                title={controller.isActive === false ? "Controller inactive" : "Refresh Status & Commands"}
                                                            >
                                                                <RefreshCw className={`h-3 w-3 ${refreshingIds.has(controller._id) ? "animate-spin" : ""}`} />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col text-sm">
                                                            <div className="flex items-center gap-1">
                                                                {controller.connection?.type === 'network' ? (
                                                                    <Wifi className="h-3 w-3" />
                                                                ) : (
                                                                    <Usb className="h-3 w-3" />
                                                                )}
                                                                <span className="font-mono">
                                                                    {controller.connection?.type === 'network'
                                                                        ? controller.connection?.ip
                                                                        : controller.connection?.serialPort}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {controller.capabilities && controller.capabilities.length > 0 ? (
                                                            <div className="flex items-center gap-2">
                                                                <TooltipProvider>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <div className="flex items-center gap-1 cursor-help w-fit">
                                                                                <Code className="h-4 w-4 text-muted-foreground" />
                                                                                <span className="text-xs text-muted-foreground">
                                                                                    {controller.capabilities.length}
                                                                                </span>
                                                                            </div>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            <div className="flex flex-col gap-1">
                                                                                <p className="font-semibold text-xs mb-1">Supported Commands:</p>
                                                                                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                                                                    {controller.capabilities.map((cap, idx) => (
                                                                                        <span key={idx} className="text-xs font-mono">
                                                                                            {cap}
                                                                                        </span>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            </div>
                                                        ) : (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-7 gap-1 text-xs"
                                                                onClick={(e) => handleRefreshController(controller, e)}
                                                            >
                                                                <RefreshCw className="h-3 w-3" />
                                                                Fetch
                                                            </Button>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {formatLastCheck(controller.lastConnectionCheck)}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                                            <div className="flex items-center gap-2 mr-2">
                                                                <Switch
                                                                    checked={controller.isActive !== false}
                                                                    onCheckedChange={(checked) => handleToggleActive(controller, checked)}
                                                                />
                                                                <span className="text-xs text-muted-foreground w-12 text-left">
                                                                    {controller.isActive !== false ? 'Active' : 'Inactive'}
                                                                </span>
                                                            </div>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => openPortManager(controller)}
                                                                title="Manage Ports"
                                                            >
                                                                <Usb className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => openEditWizard(controller)}
                                                                title="Edit Controller"
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="text-destructive hover:text-destructive"
                                                                onClick={() => handleDeleteClick(controller._id)}
                                                                title="Delete Controller"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                                {expandedRows.has(controller._id) && (
                                                    <TableRow>
                                                        <TableCell colSpan={7} className="p-0">
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
                    onControllerCreated={handleControllerCreated}
                    editController={controllerToEdit}
                    initialData={initialWizardData || undefined}
                    open={editWizardOpen}
                    hideTrigger={true}
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

                <NetworkScanPrompt
                    open={isScanPromptOpen}
                    onOpenChange={setIsScanPromptOpen}
                    onConfirm={handleRefresh}
                />
            </div>
            {isSyncing && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <RefreshCw className="h-12 w-12 animate-spin text-white" />
                        <p className="text-lg font-medium text-white">Checking Hardware Status...</p>
                    </div>
                </div>
            )}
        </ErrorBoundary>
    );
};

export default Controllers;
