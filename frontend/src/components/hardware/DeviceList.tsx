import React, { useEffect, useState } from 'react';
import { hardwareService } from '../../services/hardwareService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Edit, Play, Activity, Droplet, Thermometer, Zap, Cpu } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export const DeviceList: React.FC = () => {
    const [devices, setDevices] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [testResult, setTestResult] = useState<any>(null);
    const [testDialogOpen, setTestDialogOpen] = useState(false);
    const [testing, setTesting] = useState(false);

    useEffect(() => {
        loadDevices();
    }, []);

    const loadDevices = async () => {
        try {
            setLoading(true);
            const data = await hardwareService.getDevices();
            setDevices(data);
        } catch (error) {
            toast.error('Failed to load devices');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this device?')) return;
        try {
            await hardwareService.deleteDevice(id);
            toast.success('Device deleted');
            loadDevices();
        } catch (error) {
            toast.error('Failed to delete device');
        }
    };

    const handleTest = async (device: any) => {
        try {
            setTesting(true);
            setTestResult(null);
            setTestDialogOpen(true);
            const result = await hardwareService.testDevice(device._id);
            setTestResult(result);
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Test failed');
            setTestDialogOpen(false);
        } finally {
            setTesting(false);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'ph': return <Droplet className="h-4 w-4 text-blue-500" />;
            case 'temp': return <Thermometer className="h-4 w-4 text-red-500" />;
            case 'ec': return <Activity className="h-4 w-4 text-green-500" />;
            case 'relay': return <Zap className="h-4 w-4 text-yellow-500" />;
            default: return <Cpu className="h-4 w-4 text-gray-500" />;
        }
    };

    return (
        <div className="space-y-4">
            <div className="rounded-md border">
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
                        {devices.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                    No devices found. Add one to get started.
                                </TableCell>
                            </TableRow>
                        ) : (
                            devices.map((device) => (
                                <TableRow key={device._id}>
                                    <TableCell className="font-medium flex items-center gap-2">
                                        {getIcon(device.config?.driverId?.physicalType)}
                                        {device.name}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{device.config?.driverId?.name || 'Unknown'}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm">
                                            <span className="text-muted-foreground">Port: </span>
                                            <Badge variant="secondary" className="font-mono">{device.hardware?.port}</Badge>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={device.isEnabled ? 'default' : 'secondary'}>
                                            {device.isEnabled ? 'Active' : 'Disabled'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button size="icon" variant="ghost" onClick={() => handleTest(device)} title="Test Device">
                                                <Play className="h-4 w-4" />
                                            </Button>
                                            <Button size="icon" variant="ghost" title="Edit (Coming Soon)" disabled>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDelete(device._id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Device Test</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 flex flex-col items-center justify-center min-h-[100px]">
                        {testing ? (
                            <div className="flex flex-col items-center gap-2">
                                <Activity className="h-8 w-8 animate-spin text-primary" />
                                <p>Reading from device...</p>
                            </div>
                        ) : testResult ? (
                            <div className="text-center space-y-2">
                                <div className="text-4xl font-bold text-primary">
                                    {testResult.value} <span className="text-xl text-muted-foreground">{testResult.unit}</span>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Raw Value: {testResult.raw}
                                </div>
                            </div>
                        ) : (
                            <p className="text-destructive">Test failed or no result</p>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};
