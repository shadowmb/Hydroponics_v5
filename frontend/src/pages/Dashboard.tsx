import React, { useEffect, useState } from 'react';
import { Activity, Wifi, WifiOff, Clock, Settings, Cpu, Server } from 'lucide-react';
import { useStore } from '../core/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ActiveProgramDashboard } from '../components/dashboard/ActiveProgramDashboard';
import { PinnedSensorsGrid } from '../components/dashboard/PinnedSensorsGrid';
import { AlertsPanel } from '../components/dashboard/AlertsPanel';
import { DashboardSettingsDialog } from '../components/dashboard/DashboardSettingsDialog';

export const Dashboard: React.FC = () => {
    const { systemStatus, devices, activeSession } = useStore();
    const [programUptime, setProgramUptime] = useState<string>('00:00:00');
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [controllersCount, setControllersCount] = useState(0);
    const [onlineControllers, setOnlineControllers] = useState(0);

    const onlineDevices = Array.from(devices.values()).filter((d: any) => d.status === 'online').length;
    const offlineDevices = devices.size - onlineDevices;

    // Program Uptime Counter (if active session exists)
    useEffect(() => {
        if (!activeSession?.startTime) {
            setProgramUptime('00:00:00');
            return;
        }

        const updateUptime = () => {
            const start = new Date(activeSession.startTime).getTime();
            const diff = Date.now() - start;
            const seconds = Math.floor((diff / 1000) % 60);
            const minutes = Math.floor((diff / (1000 * 60)) % 60);
            const hours = Math.floor(diff / (1000 * 60 * 60));
            setProgramUptime(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        };

        updateUptime();
        const interval = setInterval(updateUptime, 1000);
        return () => clearInterval(interval);
    }, [activeSession]);

    // Fetch initial status on mount
    useEffect(() => {
        const fetchStatus = async () => {
            try {
                // Parallel fetch for speed
                const [{ status: sysStatus, session }, devicesList, controllersList] = await Promise.all([
                    fetch('/api/system/status').then(r => r.json()),
                    import('../services/hardwareService').then(m => m.hardwareService.getDevices()),
                    import('../services/hardwareService').then(m => m.hardwareService.getControllers())
                ]);

                useStore.getState().setSystemStatus(sysStatus, (sysStatus as any).dbConnected); // Handle dynamic API response
                useStore.getState().setActiveSession(session);
                useStore.getState().setDevices(devicesList);

                setControllersCount(controllersList.length);
                setOnlineControllers(controllersList.filter((c: any) => c.status === 'online').length);

            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
            }
        };
        fetchStatus();
    }, []);

    return (
        <div className="space-y-6 p-6">
            {/* Header with Settings */}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Control Panel</h1>
                <Button variant="ghost" size="icon" onClick={() => setSettingsOpen(true)}>
                    <Settings className="h-5 w-5" />
                </Button>
            </div>

            {/* Top Row: Status Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                {/* Connection Status */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">System Status</CardTitle>
                        {systemStatus === 'online' ? (
                            <Wifi className="h-4 w-4 text-green-500" />
                        ) : systemStatus === 'degraded' ? (
                            <WifiOff className="h-4 w-4 text-yellow-500 animate-pulse" />
                        ) : (
                            <WifiOff className="h-4 w-4 text-destructive" />
                        )}
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold capitalize ${systemStatus === 'degraded' ? 'text-yellow-500' : ''}`}>
                            {systemStatus === 'degraded' ? 'Warning' : systemStatus}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {systemStatus === 'degraded' ? 'Database Disconnected' : 'Backend connection'}
                        </p>
                    </CardContent>
                </Card>

                {/* Active Hardware */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-center space-y-0 pb-2 relative">
                        <CardTitle className="text-sm font-medium">Hardware Status</CardTitle>
                        <Activity className={`absolute right-6 h-4 w-4 ${offlineDevices > 0 || (controllersCount - onlineControllers) > 0 ? 'text-yellow-500 animate-pulse' : 'text-blue-500'}`} />
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4 text-center mt-2 relative">
                            {/* Vertical Divider */}
                            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border -translate-x-1/2" />

                            {/* Devices Column */}
                            <div className="flex flex-col items-center">
                                <span className="text-xs text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                                    <Cpu className="h-3 w-3" /> Devices
                                </span>
                                <div className="text-2xl font-bold leading-none mb-2">
                                    {devices.size} <span className="text-sm text-muted-foreground font-normal">Total</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm font-medium">
                                    <span className="text-green-500 flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full bg-green-500" />
                                        {onlineDevices}
                                    </span>
                                    <span className="text-muted-foreground/30">|</span>
                                    <span className={offlineDevices > 0 ? "text-destructive flex items-center gap-1" : "text-muted-foreground/50 flex items-center gap-1"}>
                                        <div className={`w-2 h-2 rounded-full ${offlineDevices > 0 ? "bg-destructive" : "bg-muted-foreground/30"}`} />
                                        {offlineDevices}
                                    </span>
                                </div>
                            </div>

                            {/* Controllers Column */}
                            <div className="flex flex-col items-center">
                                <span className="text-xs text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                                    <Server className="h-3 w-3" /> Controllers
                                </span>
                                <div className="text-2xl font-bold leading-none mb-2">
                                    {controllersCount} <span className="text-sm text-muted-foreground font-normal">Total</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm font-medium">
                                    <span className="text-green-500 flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full bg-green-500" />
                                        {onlineControllers}
                                    </span>
                                    <span className="text-muted-foreground/30">|</span>
                                    <span className={(controllersCount - onlineControllers) > 0 ? "text-destructive flex items-center gap-1" : "text-muted-foreground/50 flex items-center gap-1"}>
                                        <div className={`w-2 h-2 rounded-full ${(controllersCount - onlineControllers) > 0 ? "bg-destructive" : "bg-muted-foreground/30"}`} />
                                        {controllersCount - onlineControllers}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Program Uptime */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Program Uptime</CardTitle>
                        <Clock className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{programUptime}</div>
                        <p className="text-xs text-muted-foreground">
                            {activeSession ? 'Active program running' : 'No active program'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Active Program Dashboard */}
            <ActiveProgramDashboard />

            {/* Pinned Sensors Grid */}
            <PinnedSensorsGrid onSettingsClick={() => setSettingsOpen(true)} />

            {/* System Alerts */}
            <AlertsPanel />

            {/* Settings Dialog */}
            <DashboardSettingsDialog
                open={settingsOpen}
                onClose={() => setSettingsOpen(false)}
                onSave={() => {
                    // Trigger refresh of pinned sensors
                    window.location.reload();
                }}
            />
        </div>
    );
};
