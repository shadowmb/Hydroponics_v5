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
import { Radar, Loader2, Wifi, Plus, Check, Code, RefreshCw } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from 'sonner';
import { hardwareService } from '../../services/hardwareService';

interface DiscoveredDevice {
    ip: string;
    port: number;
    mac: string;
    model: string;
    firmware: string;
    capabilities?: string[];
}

interface NetworkScannerProps {
    onAddController?: (device: DiscoveredDevice) => void;
    onUpdateIp?: (controllerId: string, newIp: string, newPort: number) => void;
    onLinkController?: (controllerId: string, mac: string) => void;
}

export function NetworkScanner({ onAddController, onUpdateIp, onLinkController }: NetworkScannerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [startPort, setStartPort] = useState('8888');
    const [endPort, setEndPort] = useState('8890');
    const [broadcastIp, setBroadcastIp] = useState('255.255.255.255');
    const [devices, setDevices] = useState<DiscoveredDevice[]>([]);
    const [existingControllers, setExistingControllers] = useState<any[]>([]);

    // Fetch existing controllers when dialog opens
    React.useEffect(() => {
        if (isOpen) {
            hardwareService.getControllers().then(controllers => {
                setExistingControllers(controllers);
            }).catch(console.error);
        }
    }, [isOpen]);

    const getActionState = (device: DiscoveredDevice) => {
        // 1. Find by MAC
        const existingByMac = existingControllers.find(c => c.macAddress === device.mac);
        if (existingByMac) {
            // Check Network Info
            const currentIp = existingByMac.connection?.ip;
            const currentPort = existingByMac.connection?.port;

            if (currentIp === device.ip && currentPort === device.port) {
                return { type: 'synced', label: 'Synced', color: 'text-green-600', icon: Check };
            } else {
                return { type: 'update_ip', label: 'Update IP', color: 'text-amber-600', icon: RefreshCw, controllerId: existingByMac._id };
            }
        }

        // 2. Find by IP (if MAC not found) -> Legacy Link
        const existingByIp = existingControllers.find(c => c.connection?.ip === device.ip && !c.macAddress);
        if (existingByIp) {
            return { type: 'link', label: 'Link to Existing', color: 'text-purple-600', icon: Code, controllerId: existingByIp._id };
        }

        // 3. New Device
        return { type: 'add', label: 'Add', color: '', icon: Plus };
    };

    // ... handleScan function remains same ...
    const handleScan = async () => {
        setIsScanning(true);
        setDevices([]);

        try {
            // Use relative path to leverage Vite proxy (targets backend port 3000)
            const response = await fetch('/api/discovery/scan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    startPort: parseInt(startPort),
                    endPort: parseInt(endPort),
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


    // ... render return ...

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            {/* ... trigger and header same ... */}
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Radar className="h-4 w-4" />
                    Scan Network
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[1000px]">
                <DialogHeader>
                    <DialogTitle>Network Scanner</DialogTitle>
                    <DialogDescription>
                        Broadcasts a UDP discovery packet to find Hydroponics controllers within the specified port range.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex gap-2">
                            <div className="grid gap-2 flex-1">
                                <Label htmlFor="startPort">Start Port</Label>
                                <Input
                                    id="startPort"
                                    value={startPort}
                                    onChange={(e) => setStartPort(e.target.value)}
                                    placeholder="8888"
                                />
                            </div>
                            <div className="grid gap-2 flex-1">
                                <Label htmlFor="endPort">End Port</Label>
                                <Input
                                    id="endPort"
                                    value={endPort}
                                    onChange={(e) => setEndPort(e.target.value)}
                                    placeholder="8890"
                                />
                            </div>
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

                    <div className="rounded-md border mt-4 overflow-auto max-h-[400px]">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>IP Address</TableHead>
                                    <TableHead>Port</TableHead>
                                    <TableHead>MAC Address</TableHead>
                                    <TableHead>Model</TableHead>
                                    <TableHead>Firmware</TableHead>
                                    <TableHead>Capabilities</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {devices.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                            {isScanning ? 'Listening for responses...' : 'No devices found. Check your settings.'}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    devices.map((device) => {
                                        const action = getActionState(device);
                                        const Icon = action.icon;

                                        return (
                                            <TableRow key={device.mac}>
                                                <TableCell className="font-medium">{device.ip}</TableCell>
                                                <TableCell>{device.port}</TableCell>
                                                <TableCell>{device.mac}</TableCell>
                                                <TableCell>{device.model}</TableCell>
                                                <TableCell>{device.firmware}</TableCell>
                                                <TableCell className="text-center">
                                                    {device.capabilities && device.capabilities.length > 0 ? (
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <div className="flex items-center gap-1 cursor-help w-fit mx-auto">
                                                                        <Code className="h-4 w-4 text-muted-foreground" />
                                                                        <span className="text-xs text-muted-foreground">
                                                                            {device.capabilities.length}
                                                                        </span>
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <div className="flex flex-col gap-1">
                                                                        <p className="font-semibold text-xs mb-1">Supported Commands:</p>
                                                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                                                            {device.capabilities.map((cap, idx) => (
                                                                                <span key={idx} className="text-xs font-mono">
                                                                                    {cap}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    ) : (
                                                        <span className="text-muted-foreground text-xs">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {action.type === 'synced' ? (
                                                        <div className={`flex items-center justify-end gap-1 ${action.color}`}>
                                                            <Icon className="h-4 w-4" />
                                                            <span className="text-xs font-medium">{action.label}</span>
                                                        </div>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            variant={action.type === 'add' ? 'default' : 'secondary'}
                                                            className="h-7 gap-1"
                                                            onClick={() => {
                                                                if (action.type === 'add' && onAddController) {
                                                                    setIsOpen(false);
                                                                    onAddController(device);
                                                                } else if (action.type === 'update_ip' && onUpdateIp && action.controllerId) {
                                                                    onUpdateIp(action.controllerId, device.ip, device.port);
                                                                } else if (action.type === 'link' && onLinkController && action.controllerId) {
                                                                    onLinkController(action.controllerId, device.mac);
                                                                }
                                                            }}
                                                        >
                                                            <Icon className="h-3 w-3" />
                                                            {action.label}
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
