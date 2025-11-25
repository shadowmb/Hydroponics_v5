import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Controllers from './Controllers';
import { RelayManager } from '../components/hardware/RelayManager';
import { Settings2, Cpu, Lightbulb, Code, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';


import { DeviceList } from '../components/hardware/DeviceList';
import { DeviceWizard } from '../components/hardware/DeviceWizard';
import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';

import { NetworkScanner } from '../components/hardware/NetworkScanner';
import { FirmwareGeneratorDialog } from '../components/hardware/FirmwareGeneratorDialog';
import { NetworkScanPrompt } from '../components/hardware/NetworkScanPrompt';

const Hardware: React.FC = () => {
    const [activeTab, setActiveTab] = useState("devices");
    const [isDeviceWizardOpen, setIsDeviceWizardOpen] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState<any>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [pendingControllerData, setPendingControllerData] = useState<any>(null);
    const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
    const [controllerRefreshTrigger, setControllerRefreshTrigger] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isScanPromptOpen, setIsScanPromptOpen] = useState(false);

    const handleRefreshStatus = async () => {
        try {
            setIsSyncing(true);

            // Allow React to render the overlay before starting the work
            await new Promise(resolve => setTimeout(resolve, 100));

            toast.info('Syncing controller status...');

            // Run sync and a 1-second timer in parallel. 
            await Promise.allSettled([
                fetch('/api/hardware/sync-status', { method: 'POST' }),
                new Promise(resolve => setTimeout(resolve, 1000))
            ]);

            toast.success('Status synced');
            setControllerRefreshTrigger(prev => prev + 1);
        } catch (error) {
            console.error('Sync failed', error);
            toast.error('Failed to sync status');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleEditDevice = (device: any) => {
        setSelectedDevice(device);
        setIsDeviceWizardOpen(true);
    };

    const handleWizardOpenChange = (open: boolean) => {
        setIsDeviceWizardOpen(open);
        if (!open) {
            setSelectedDevice(null);
        }
    };

    const handleScannerAdd = (device: any) => {
        setPendingControllerData({
            name: `New Controller (${device.model || 'Unknown'})`,
            description: `Discovered at ${device.ip}`,
            macAddress: device.mac,
            connection: {
                type: 'network',
                ip: device.ip,
                port: 80 // Default port, user can change
            }
        });
        setActiveTab("controllers");
    };

    const handleDeviceWizardSuccess = () => {
        setRefreshTrigger(prev => prev + 1);
        setIsScanPromptOpen(true);
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            {isSyncing && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <RefreshCw className="h-12 w-12 animate-spin text-white" />
                        <p className="text-lg font-medium text-white">Checking Hardware Status...</p>
                    </div>
                </div>
            )}
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Hardware Management</h1>
                <p className="text-muted-foreground">
                    Manage your controllers, relays, and connected devices.
                </p>
            </div>

            <div className="flex items-center justify-between border-b">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setActiveTab("devices")}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors hover:text-primary ${activeTab === "devices"
                            ? "border-b-2 border-primary text-primary"
                            : "text-muted-foreground"
                            }`}
                    >
                        <Lightbulb className="h-4 w-4" />
                        Devices
                    </button>
                    <button
                        onClick={() => setActiveTab("relays")}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors hover:text-primary ${activeTab === "relays"
                            ? "border-b-2 border-primary text-primary"
                            : "text-muted-foreground"
                            }`}
                    >
                        <Settings2 className="h-4 w-4" />
                        Relays
                    </button>
                    <button
                        onClick={() => setActiveTab("controllers")}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors hover:text-primary ${activeTab === "controllers"
                            ? "border-b-2 border-primary text-primary"
                            : "text-muted-foreground"
                            }`}
                    >
                        <Cpu className="h-4 w-4" />
                        Controllers
                    </button>
                </div>
                <div className="pb-2 flex gap-2">
                    {activeTab === "controllers" && (
                        <Button onClick={handleRefreshStatus} size="sm" variant="outline">
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Refresh Status
                        </Button>
                    )}
                    <NetworkScanner onAddController={handleScannerAdd} />

                    <Button onClick={() => setIsGeneratorOpen(true)} size="sm" variant="outline">
                        <Code className="mr-2 h-4 w-4" />
                        Generate Firmware
                    </Button>
                    {activeTab === "devices" && (
                        <Button onClick={() => { setSelectedDevice(null); setIsDeviceWizardOpen(true); }} size="sm">
                            <Plus className="mr-2 h-4 w-4" /> Add Device
                        </Button>
                    )}
                </div>
            </div>

            <div className="mt-6">
                {activeTab === "controllers" && (
                    <Controllers
                        initialWizardData={pendingControllerData}
                        onWizardClose={() => setPendingControllerData(null)}
                        refreshTrigger={controllerRefreshTrigger}
                    />

                )}

                {activeTab === "relays" && <RelayManager />}

                {activeTab === "devices" && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Devices</CardTitle>
                            <CardDescription>
                                Manage sensors and actuators connected to your system.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <DeviceList key={refreshTrigger} onEdit={handleEditDevice} />
                        </CardContent>
                    </Card>
                )}
            </div>

            <DeviceWizard
                open={isDeviceWizardOpen}
                onOpenChange={handleWizardOpenChange}
                onSuccess={handleDeviceWizardSuccess}
                initialData={selectedDevice}
            />
            <FirmwareGeneratorDialog
                open={isGeneratorOpen}
                onOpenChange={setIsGeneratorOpen}
            />

            <NetworkScanPrompt
                open={isScanPromptOpen}
                onOpenChange={setIsScanPromptOpen}
                onConfirm={handleRefreshStatus}
            />
        </div>
    );
};

export default Hardware;
