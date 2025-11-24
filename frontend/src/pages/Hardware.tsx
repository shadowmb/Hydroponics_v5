import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Controllers from './Controllers';
import { RelayManager } from '../components/hardware/RelayManager';
import { Settings2, Cpu, Lightbulb } from 'lucide-react';

import { DeviceList } from '../components/hardware/DeviceList';
import { DeviceWizard } from '../components/hardware/DeviceWizard';
import { Button } from "@/components/ui/button";
import { Plus } from 'lucide-react';

const Hardware: React.FC = () => {
    const [activeTab, setActiveTab] = useState("devices");
    const [isDeviceWizardOpen, setIsDeviceWizardOpen] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState<any>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

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

    return (
        <div className="container mx-auto p-6 space-y-6">
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
                {activeTab === "devices" && (
                    <div className="pb-2">
                        <Button onClick={() => { setSelectedDevice(null); setIsDeviceWizardOpen(true); }} size="sm">
                            <Plus className="mr-2 h-4 w-4" /> Add Device
                        </Button>
                    </div>
                )}
            </div>

            <div className="mt-6">
                {activeTab === "controllers" && <Controllers />}

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
                onSuccess={() => setRefreshTrigger(prev => prev + 1)}
                initialData={selectedDevice}
            />
        </div>
    );
};

export default Hardware;
