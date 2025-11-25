import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Radar, Loader2, Wifi, Plus, Check } from 'lucide-react';
import { toast } from 'sonner';
import { hardwareService } from '../../services/hardwareService';

interface DiscoveredDevice {
    ip: string;
    mac: string;
    model: string;
    firmware: string;
}

interface NetworkScannerProps {
    onAddController?: (device: DiscoveredDevice) => void;
}

export function NetworkScanner({ onAddController }: NetworkScannerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [port, setPort] = useState('44444');
    const [broadcastIp, setBroadcastIp] = useState('255.255.255.255');
    const [devices, setDevices] = useState<DiscoveredDevice[]>([]);
    const [existingMacs, setExistingMacs] = useState<Set<string>>(new Set());

    // Fetch existing controllers when dialog opens
    React.useEffect(() => {
        if (isOpen) {
            hardwareService.getControllers().then(controllers => {
                const macs = new Set(controllers.map(c => c.macAddress).filter(Boolean) as string[]);
                setExistingMacs(macs);
            }).catch(console.error);
        }
    }, [isOpen]);

    const handleScan = async () => {
        setIsScanning(true);
        setDevices([]);

        try {
            // Use relative path to leverage Vite proxy (targets backend port 3000)
            const response = await fetch('/api/discovery/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    port: parseInt(port),
                    broadcastAddress: broadcastIp,
                    timeout: 3000
                })
            });

            const result = await response.json();

            if (result.success) {
                setDevices(result.data);
                if (result.data.length === 0) {
                    toast.info('No devices found');
                } else {
                    toast.success(`Found ${result.data.length} devices`);
                }
            } else {
                toast.error('Scan failed: ' + result.error);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to connect to scanner service');
        } finally {
            setIsScanning(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Radar className="h-4 w-4" />
                    Scan Network
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Network Scanner</DialogTitle>
                    <DialogDescription>
                        Broadcasts a UDP discovery packet to find Hydroponics controllers on the local network.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="port">UDP Port</Label>
                            <Input
                                id="port"
                                value={port}
                                onChange={(e) => setPort(e.target.value)}
                                placeholder="44444"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="ip">Broadcast IP</Label>
                            <Input
                                id="ip"
                                value={broadcastIp}
                                onChange={(e) => setBroadcastIp(e.target.value)}
                                placeholder="255.255.255.255"
                            />
                        </div>
                    </div>

                    <Button onClick={handleScan} disabled={isScanning} className="w-full">
                        {isScanning ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Scanning...
                            </>
                        ) : (
                            <>
                                <Wifi className="mr-2 h-4 w-4" />
                                Start Scan
                            </>
                        )}
                    </Button>

                    <div className="rounded-md border mt-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>IP Address</TableHead>
                                    <TableHead>MAC Address</TableHead>
                                    <TableHead>Model</TableHead>
                                    <TableHead>Firmware</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {devices.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                            {isScanning ? 'Listening for responses...' : 'No devices found. Check your settings.'}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    devices.map((device) => {
                                        const isAdded = existingMacs.has(device.mac);
                                        return (
                                            <TableRow key={device.mac}>
                                                <TableCell className="font-medium">{device.ip}</TableCell>
                                                <TableCell>{device.mac}</TableCell>
                                                <TableCell>{device.model}</TableCell>
                                                <TableCell>{device.firmware}</TableCell>
                                                <TableCell className="text-right">
                                                    {isAdded ? (
                                                        <div className="flex items-center justify-end gap-1 text-green-600">
                                                            <Check className="h-4 w-4" />
                                                            <span className="text-xs font-medium">Added</span>
                                                        </div>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="h-7 gap-1"
                                                            onClick={() => {
                                                                setIsOpen(false);
                                                                if (onAddController) onAddController(device);
                                                            }}
                                                        >
                                                            <Plus className="h-3 w-3" />
                                                            Add
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
