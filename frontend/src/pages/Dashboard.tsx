import React, { useEffect, useState } from 'react';
import { Activity, Wifi, WifiOff, Settings, Cpu, Server, Database, Info, Bell, CheckCircle2 } from 'lucide-react';
import { useStore } from '../core/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '../components/ui/tooltip';
import { Button } from '../components/ui/button';
import { ActiveProgramDashboard } from '../components/dashboard/ActiveProgramDashboard';
import { PinnedSensorsGrid } from '../components/dashboard/PinnedSensorsGrid';
import { DashboardSettingsDialog } from '../components/dashboard/DashboardSettingsDialog';

export const Dashboard: React.FC = () => {
    const { systemStatus, devices } = useStore();
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [controllersCount, setControllersCount] = useState(0);
    const [onlineControllers, setOnlineControllers] = useState(0);
    const [serverUptime, setServerUptime] = useState<string>('00:00:00');
    const [serverStartTime, setServerStartTime] = useState<number | null>(null);

    const onlineDevices = Array.from(devices.values()).filter((d: any) => d.status === 'online').length;
    const offlineDevices = devices.size - onlineDevices;



    // Server Uptime Counter
    useEffect(() => {
        if (!serverStartTime) return;

        const updateServerUptime = () => {
            const diff = Date.now() - serverStartTime;
            const seconds = Math.floor((diff / 1000) % 60);
            const minutes = Math.floor((diff / (1000 * 60)) % 60);
            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));

            const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            setServerUptime(days > 0 ? `${days} дни ${timeStr}` : timeStr);
        };

        updateServerUptime();
        const interval = setInterval(updateServerUptime, 1000);
        return () => clearInterval(interval);
    }, [serverStartTime]);

    // Fetch initial status on mount
    useEffect(() => {
        const fetchStatus = async () => {
            try {
                // Parallel fetch for speed
                const [systemData, devicesList, controllersList] = await Promise.all([
                    fetch('/api/system/status').then(r => r.json()),
                    import('../services/hardwareService').then(m => m.hardwareService.getDevices()),
                    import('../services/hardwareService').then(m => m.hardwareService.getControllers())
                ]);

                const { status: sysStatus, session, uptimeSeconds, dbConnected } = systemData as any;

                useStore.getState().setSystemStatus(sysStatus, dbConnected);
                useStore.getState().setActiveSession(session);
                useStore.getState().setDevices(devicesList);

                setControllersCount(controllersList.length);
                setOnlineControllers(controllersList.filter((c: any) => c.status === 'online').length);

                // Calculate server start time based on uptimeSeconds from backend
                if (uptimeSeconds) {
                    setServerStartTime(Date.now() - (uptimeSeconds * 1000));
                }

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
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-sm font-medium">System Status</CardTitle>
                            <TooltipProvider>
                                <Tooltip delayDuration={0}>
                                    <TooltipTrigger>
                                        <Info className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-[250px] p-4">
                                        <div className="space-y-2">
                                            <h4 className="font-semibold text-sm">System Diagnostics</h4>
                                            <div className="grid grid-cols-[80px_1fr] gap-2 text-xs">
                                                <span className="text-muted-foreground">Status:</span>
                                                <span>Monitoring system health</span>
                                                <span className="text-muted-foreground">Uptime:</span>
                                                <span>Time since last server restart</span>
                                                <span className="text-muted-foreground">Icons:</span>
                                                <span>Backend & DB connectivity</span>
                                            </div>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        {systemStatus === 'online' ? (
                            <Wifi className="h-4 w-4 text-green-500" />
                        ) : systemStatus === 'degraded' ? (
                            <WifiOff className="h-4 w-4 text-yellow-500 animate-pulse" />
                        ) : (
                            <WifiOff className="h-4 w-4 text-destructive" />
                        )}
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline justify-between">
                            <div className={`text-2xl font-bold capitalize ${systemStatus === 'degraded' ? 'text-yellow-500' : ''}`}>
                                {systemStatus === 'degraded' ? 'Warning' : systemStatus}
                            </div>
                            <div className="text-xs font-mono text-muted-foreground">
                                {serverUptime}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 mt-4 pt-2 border-t border-border/50">
                            {/* Backend Status Icon */}
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Server className={`h-4 w-4 ${systemStatus === 'offline' ? 'text-destructive' : 'text-green-500'}`} />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Backend Service Status</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>

                            {/* Database Status Icon */}
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Database className={`h-4 w-4 ${systemStatus === 'degraded' ? 'text-destructive' : 'text-green-500'}`} />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Database Connection Status</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>


                        </div>
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

                {/* System Alerts and Notifications */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">System Alerts</CardTitle>
                        <Bell className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col items-center justify-center py-4 text-center">
                            <CheckCircle2 className="h-10 w-10 text-green-500 mb-3" />
                            <h4 className="font-semibold text-sm">No active alerts</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                                System is running normally
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Pinned Sensors Grid */}
            <PinnedSensorsGrid onSettingsClick={() => setSettingsOpen(true)} />

            {/* Active Program Dashboard */}
            <ActiveProgramDashboard />



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
