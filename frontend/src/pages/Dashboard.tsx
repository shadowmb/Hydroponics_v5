import React, { useEffect, useState } from 'react';
import { Activity, Wifi, WifiOff, Clock, Settings } from 'lucide-react';
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
                const sysRes = await fetch('/api/system/status');
                if (sysRes.ok) {
                    const status = await sysRes.json();
                    useStore.getState().setSystemStatus(status.status);
                    useStore.getState().setActiveSession(status.session);
                }
            } catch (error) {
                console.error('Failed to fetch status:', error);
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
                        {systemStatus === 'online' ? <Wifi className="h-4 w-4 text-green-500" /> : <WifiOff className="h-4 w-4 text-destructive" />}
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold capitalize">{systemStatus}</div>
                        <p className="text-xs text-muted-foreground">Backend connection</p>
                    </CardContent>
                </Card>

                {/* Active Devices */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Devices</CardTitle>
                        <Activity className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{devices.size}</div>
                        <p className="text-xs text-muted-foreground">Connected hardware</p>
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
