import { useState, useEffect } from 'react';
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
import { Radar, Loader2, Wifi, Plus, Check, Code, RefreshCw, AlertTriangle, Network } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from 'sonner';
import { hardwareService, type INetworkInterface } from '../../services/hardwareService';

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
    const [processedMacs, setProcessedMacs] = useState<Set<string>>(new Set());

    // Network Diagnostics
    const [interfaces, setInterfaces] = useState<INetworkInterface[]>([]);
    const [selectedInterface, setSelectedInterface] = useState<string>('');

    // Fetch existing controllers & network info when dialog opens
    useEffect(() => {
        if (isOpen) {
            hardwareService.getControllers().then(controllers => {
                setExistingControllers(controllers);
                setProcessedMacs(new Set()); // Reset processed state on open
            }).catch(console.error);

            hardwareService.getNetworkInterfaces().then(ifaces => {
                setInterfaces(ifaces);
                // Auto-select broadcast IP if only one valid interface found, or keep default
                if (ifaces.length === 1 && !broadcastIp.endsWith('.255')) {
                    // Logic to prioritize non-docker if possible, but for UX simple is better
                }
            }).catch(console.error);
        }
    }, [isOpen]);

    const handleInterfaceSelect = (address: string) => {
        const iface = interfaces.find(i => i.address === address);
        if (iface) {
            setSelectedInterface(address);
            setBroadcastIp(iface.broadcast);
            toast.info(`Set Broadcast IP to ${iface.broadcast} based on ${iface.name}`);
        }
    };

    const isDockerBridge = (ip: string) => {
        return ip.startsWith('172.17.') || ip.startsWith('172.18.') || ip.startsWith('172.19.');
    };

    const getActionState = (device: DiscoveredDevice) => {
        // 0. Check if already processed in this session
        if (processedMacs.has(device.mac)) {
            return { type: 'synced', label: 'Synced', color: 'text-green-600', icon: Check, tooltip: 'Device is synchronized.' };
        }

        // 1. Find by MAC
        const existingByMac = existingControllers.find(c => c.macAddress === device.mac);
        if (existingByMac) {
            // Check Network Info
            const currentIp = existingByMac.connection?.ip;
            const currentPort = existingByMac.connection?.port;

            if (currentIp === device.ip && currentPort === device.port) {
                return { type: 'synced', label: 'Synced', color: 'text-green-600', icon: Check, tooltip: 'Device matches recorded configuration.' };
            } else {
                return {
                    type: 'update_ip',
                    label: 'Update IP',
                    color: 'text-amber-600',
                    icon: RefreshCw,
                    controllerId: existingByMac._id,
                    tooltip: `Update controller '${existingByMac.name}' IP from ${currentIp} to ${device.ip}`
                };
            }
        }

        // 2. Find by IP (if MAC not found) -> Legacy Link or Conflict
        const existingByIp = existingControllers.find(c => c.connection?.ip === device.ip);

        if (existingByIp) {
            if (!existingByIp.macAddress) {
                // Legacy Case: No MAC in DB, but matches IP
                return {
                    type: 'link',
                    label: 'Link MAC',
                    color: 'text-purple-600',
                    icon: Code,
                    controllerId: existingByIp._id,
                    tooltip: `Assign MAC ${device.mac} to existing controller '${existingByIp.name}'`
                };
            } else {
                // Conflict Case: IP matches, but DB has different MAC
                return {
                    type: 'conflict',
                    label: 'Replace',
                    color: 'text-red-500',
                    icon: AlertTriangle,
                    controllerId: existingByIp._id, // The one to replace/overwrite or just warn
                    tooltip: `Warning: IP ${device.ip} is currently assigned to '${existingByIp.name}' (MAC: ${existingByIp.macAddress}). Adding will disconnect the old controller.`
                };
            }
        }

        // 3. New Device
        return { type: 'add', label: 'Add', color: '', icon: Plus, tooltip: 'Add as a new controller.' };
    };

    const handleScan = async () => {
        setIsScanning(true);
        setDevices([]);
        setProcessedMacs(new Set()); // Reset on new scan

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

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
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

                {/* Server Network Context */}
                {interfaces.length > 0 && (
                    <div className="bg-muted/30 p-3 rounded-md border text-sm space-y-2 mb-2">
                        <div className="flex items-center gap-2 mb-1">
                            <Network className="h-4 w-4 text-primary" />
                            <span className="font-semibold">Server Network Context</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label className="text-xs text-muted-foreground mb-1 block">Select Server Interface</Label>
                                <Select value={selectedInterface} onValueChange={handleInterfaceSelect}>
                                    <SelectTrigger className="h-8">
                                        <SelectValue placeholder="Select Interface..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {interfaces.map(iface => (
                                            <SelectItem key={iface.address} value={iface.address}>
                                                <span className="font-mono">{iface.address}</span> ({iface.name})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {selectedInterface && (
                                <div className="text-xs text-muted-foreground flex flex-col justify-center">
                                    {isDockerBridge(selectedInterface) && (
                                        <span className="text-amber-600 font-medium flex items-center gap-1">
                                            <AlertTriangle className="h-3 w-3" />
                                            Docker Bridge Detected! (Isolation)
                                        </span>
                                    )}
                                    <span>If devices are not found, try using Host Network mode on the server.</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

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
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <Button
                                                                        size="sm"
                                                                        variant={action.type === 'add' || action.type === 'conflict' ? 'default' : 'secondary'}
                                                                        className={`h-7 gap-1 ${action.type === 'conflict' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}`}
                                                                        onClick={() => {
                                                                            if (action.type === 'add' && onAddController) {
                                                                                setIsOpen(false);
                                                                                onAddController(device);
                                                                            } else if (action.type === 'conflict' && onAddController) {
                                                                                setIsOpen(false);
                                                                                onAddController(device);
                                                                            }
                                                                            else if (action.type === 'update_ip' && onUpdateIp && action.controllerId) {
                                                                                onUpdateIp(action.controllerId, device.ip, device.port);
                                                                                setProcessedMacs(prev => new Set(prev).add(device.mac));
                                                                            } else if (action.type === 'link' && onLinkController && action.controllerId) {
                                                                                onLinkController(action.controllerId, device.mac);
                                                                                setProcessedMacs(prev => new Set(prev).add(device.mac));
                                                                            }
                                                                        }}
                                                                    >
                                                                        <Icon className="h-3 w-3" />
                                                                        {action.label}
                                                                    </Button>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p className="max-w-[300px] text-xs">{action.tooltip}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
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
