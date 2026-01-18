import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
    Activity,
    Wifi,
    WifiOff,
    Settings,
    Cpu,
    Server,
    Thermometer,
    Droplets,
    Zap,
    ArrowUpRight,
    ArrowDownRight,
    Minus,
    AlertTriangle,
    Bell
} from 'lucide-react';

const MOCK_SYSTEM_STATUS = {
    status: 'online', // 'online' | 'degraded' | 'offline'
    dbConnected: true,
    lastSync: 'Just now'
};

const MOCK_HARDWARE_STATUS = {
    devices: {
        total: 14,
        online: 14,
        offline: 0
    },
    controllers: {
        total: 2,
        online: 2,
        offline: 0
    }
};

const MOCK_METRICS = [
    {
        id: 'ph-res',
        label: 'pH Reservoir',
        value: 6.2,
        unit: 'pH',
        status: 'optimal', // 'optimal' | 'warning' | 'critical'
        trend: 'stable',   // 'up' | 'down' | 'stable'
        target: '5.8 - 6.5',
        lastRead: '10s ago',
        icon: Droplets,
        color: 'text-blue-500'
    },
    {
        id: 'ec-res',
        label: 'EC Nutrients',
        value: 1.8,
        unit: 'mS/cm',
        status: 'optimal',
        trend: 'up',
        target: '1.5 - 2.0',
        lastRead: '10s ago',
        icon: Zap,
        color: 'text-yellow-500'
    },
    {
        id: 'water-temp',
        label: 'Water Temp',
        value: 22.5,
        unit: '°C',
        status: 'warning',
        trend: 'down',
        target: '20.0 - 24.0',
        lastRead: '1 min ago',
        icon: Thermometer,
        color: 'text-red-500'
    }
];

const MOCK_ALERTS = [
    { id: 1, type: 'warning', message: 'Water Level Low (Reservoir)', time: '10 mins ago' },
    { id: 2, type: 'info', message: 'Dosage Cycle Completed', time: '1 hour ago' }
];

// ==========================================
// COMPONENT
// ==========================================

import { RunningProgramCard } from '../components/dashboard/RunningProgramCard';

// ... (existing imports)

// ==========================================
// COMPONENT
// ==========================================

export const DashboardV2: React.FC = () => {
    // We keep state simple for now, as it's a mock
    const [settingsOpen, setSettingsOpen] = useState(false);

    // Helpers for rendering
    const getTrendIcon = (trend: string) => {
        if (trend === 'up') return <ArrowUpRight className="h-4 w-4" />;
        if (trend === 'down') return <ArrowDownRight className="h-4 w-4" />;
        return <Minus className="h-4 w-4" />;
    };

    const getStatusColor = (status: string) => {
        if (status === 'optimal') return 'text-green-500';
        if (status === 'warning') return 'text-yellow-500';
        return 'text-destructive';
    };

    return (
        <div className="space-y-6 p-6 max-w-7xl mx-auto">
            {/* 1. HEADER ROW: INFRASTRUCTURE (Compact & Clean) */}
            {/* ... */}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 2. MAIN ACTION ZONE (Left - 2 Cols) */}
                <div className="md:col-span-2 space-y-6">
                    {/* A. THE ACTIVE PROGRAM CARD (The "Hero" Component) */}
                    <RunningProgramCard />

                    {/* B. LIVE METRICS GRID */}
                    {/* ... */}
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Mission Control</h1>
                        <p className="text-muted-foreground">System Overview & Management</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setSettingsOpen(!settingsOpen)}>
                            <Settings className="h-4 w-4 mr-2" /> Settings
                        </Button>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                    {/* System Status Card */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">System Connectivity</CardTitle>
                            {MOCK_SYSTEM_STATUS.status === 'online' ? (
                                <Wifi className="h-4 w-4 text-green-500" />
                            ) : (
                                <WifiOff className="h-4 w-4 text-destructive" />
                            )}
                        </CardHeader>
                        <CardContent>
                            <div className="flex justify-between items-baseline">
                                <div className="text-2xl font-bold">Online</div>
                                <span className="text-xs text-muted-foreground">Last sync: {MOCK_SYSTEM_STATUS.lastSync}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Database Connected • API Stable</p>
                        </CardContent>
                    </Card>

                    {/* Hardware Status Card (The one we fixed) */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-center space-y-0 pb-2 relative">
                            <CardTitle className="text-sm font-medium">Hardware Status</CardTitle>
                            <Activity className="absolute right-6 h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4 text-center mt-2 relative">
                                {/* Vertical Divider */}
                                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border -translate-x-1/2" />

                                {/* Devices */}
                                <div className="flex flex-col items-center">
                                    <span className="text-xs text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                                        <Cpu className="h-3 w-3" /> Devices
                                    </span>
                                    <div className="text-2xl font-bold leading-none mb-2">
                                        {MOCK_HARDWARE_STATUS.devices.total} <span className="text-sm text-muted-foreground font-normal">Total</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm font-medium">
                                        <span className="text-green-500 flex items-center gap-1">
                                            <div className="w-2 h-2 rounded-full bg-green-500" />
                                            {MOCK_HARDWARE_STATUS.devices.online}
                                        </span>
                                        <span className="text-muted-foreground/30">|</span>
                                        <span className="text-muted-foreground/50 flex items-center gap-1">
                                            <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                                            {MOCK_HARDWARE_STATUS.devices.offline}
                                        </span>
                                    </div>
                                </div>

                                {/* Controllers */}
                                <div className="flex flex-col items-center">
                                    <span className="text-xs text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                                        <Server className="h-3 w-3" /> Controllers
                                    </span>
                                    <div className="text-2xl font-bold leading-none mb-2">
                                        {MOCK_HARDWARE_STATUS.controllers.total} <span className="text-sm text-muted-foreground font-normal">Total</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm font-medium">
                                        <span className="text-green-500 flex items-center gap-1">
                                            <div className="w-2 h-2 rounded-full bg-green-500" />
                                            {MOCK_HARDWARE_STATUS.controllers.online}
                                        </span>
                                        <span className="text-muted-foreground/30">|</span>
                                        <span className="text-muted-foreground/50 flex items-center gap-1">
                                            <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                                            {MOCK_HARDWARE_STATUS.controllers.offline}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* 2. ACTION ZONE: ACTIVE PROGRAM (Enhanced) */}
                <RunningProgramCard />

                {/* 3. METRICS ZONE: SMART GRID (The New Stuff) */}
                <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Activity className="h-5 w-5" /> Live Metrics
                    </h3>
                    <div className="grid gap-4 md:grid-cols-3">
                        {MOCK_METRICS.map((metric) => (
                            <Card key={metric.id} className="relative overflow-hidden">
                                {metric.status === 'warning' && (
                                    <div className="absolute top-0 right-0 p-2">
                                        <span className="relative flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                                        </span>
                                    </div>
                                )}
                                <CardHeader className="pb-2">
                                    <CardTitle className={`text-sm font-medium flex items-center gap-2 ${getStatusColor(metric.status)}`}>
                                        <metric.icon className="h-4 w-4" />
                                        {metric.label}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-baseline justify-between">
                                        <div className="text-3xl font-bold">
                                            {metric.value} <span className="text-sm font-normal text-muted-foreground">{metric.unit}</span>
                                        </div>
                                        <div className={`flex items-center text-sm font-medium ${metric.trend === 'up' ? 'text-green-500' : metric.trend === 'down' ? 'text-red-500' : 'text-muted-foreground'}`}>
                                            {getTrendIcon(metric.trend)}
                                        </div>
                                    </div>

                                    <div className="mt-3 flex items-center justify-between text-xs">
                                        <div className={`px-2 py-0.5 rounded-full ${metric.status === 'optimal' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                                            Target: {metric.target}
                                        </div>
                                        <span className="text-muted-foreground">{metric.lastRead}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* 4. FOOTER ZONE: Quick Alerts */}
                <Card className="bg-muted/50">
                    <CardHeader className="pb-2 pt-4">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Bell className="h-4 w-4" /> System Alerts
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-4">
                        <div className="space-y-2">
                            {MOCK_ALERTS.map(alert => (
                                <div key={alert.id} className="flex items-center justify-between text-sm bg-background p-2 rounded border">
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className={`h-4 w-4 ${alert.type === 'warning' ? 'text-yellow-500' : 'text-blue-500'}`} />
                                        <span>{alert.message}</span>
                                    </div>
                                    <span className="text-muted-foreground text-xs">{alert.time}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

            </div>
        </div>
    );
};
