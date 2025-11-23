import React, { useEffect, useState } from 'react';
import { hardwareService, type IController } from '../services/hardwareService';
import { ControllerWizard } from '../components/hardware/ControllerWizard';
import { PortManager } from '../components/hardware/PortManager';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Wifi, Usb, RefreshCw, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

const Controllers: React.FC = () => {
    const [controllers, setControllers] = useState<IController[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedController, setSelectedController] = useState<IController | null>(null);
    const [portManagerOpen, setPortManagerOpen] = useState(false);
    const [editWizardOpen, setEditWizardOpen] = useState(false);
    const [controllerToEdit, setControllerToEdit] = useState<IController | undefined>(undefined);

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
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this controller?')) return;
        try {
            await hardwareService.deleteController(id);
            toast.success('Controller deleted');
            fetchControllers();
        } catch (error) {
            toast.error('Failed to delete controller');
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

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Controllers</h1>
                    <p className="text-muted-foreground">Manage your hardware controllers and gateways.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={fetchControllers}>
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
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
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        No controllers found. Add one to get started.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                controllers.map((controller) => (
                                    <TableRow key={controller._id}>
                                        <TableCell className="font-medium">
                                            <div>{controller.name}</div>
                                            <div className="text-xs text-muted-foreground">{controller.description}</div>
                                        </TableCell>
                                        <TableCell>{controller.type}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {controller.connection.type === 'network' ? (
                                                    <Wifi className="h-4 w-4 text-blue-500" />
                                                ) : (
                                                    <Usb className="h-4 w-4 text-orange-500" />
                                                )}
                                                <span className="text-sm">
                                                    {controller.connection.type === 'network'
                                                        ? `${controller.connection.ip}:${controller.connection.port}`
                                                        : controller.connection.serialPort}
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
                                                    onClick={() => handleDelete(controller._id)}
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

            <PortManager
                controller={selectedController}
                open={portManagerOpen}
                onOpenChange={setPortManagerOpen}
                onUpdate={fetchControllers}
            />

            <ControllerWizard
                onControllerCreated={fetchControllers}
                editController={controllerToEdit}
                open={editWizardOpen}
                onOpenChange={setEditWizardOpen}
            />
        </div>
    );
};

export default Controllers;
