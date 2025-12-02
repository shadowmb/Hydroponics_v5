import React, { useEffect, useState } from 'react';
import { Activity, Wifi, WifiOff, Play, Pause, Square, Clock } from 'lucide-react';
import { useStore } from '../core/useStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import { StartFlowDialog } from '../components/dashboard/StartFlowDialog';

export const Dashboard: React.FC = () => {
    const { systemStatus, devices, activeSession, logs } = useStore();
    const [uptime, setUptime] = useState<string>('00:00:00');

    // Mock Uptime Counter
    useEffect(() => {
        const start = Date.now();
        const interval = setInterval(() => {
            const diff = Date.now() - start;
            const seconds = Math.floor((diff / 1000) % 60);
            const minutes = Math.floor((diff / (1000 * 60)) % 60);
            const hours = Math.floor(diff / (1000 * 60 * 60));
            setUptime(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Fetch initial status on mount to ensure UI is in sync
    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await fetch('/api/system/status');
                if (res.ok) {
                    const status = await res.json();
                    useStore.getState().setSystemStatus(status.status);
                    useStore.getState().setActiveSession(status.session);
                }
            } catch (error) {
                console.error('Failed to fetch status:', error);
            }
        };
        fetchStatus();
    }, []);

    const handleControl = async (action: 'LOAD' | 'START' | 'PAUSE' | 'RESUME' | 'STOP' | 'UNLOAD', programId?: string) => {
        try {
            let endpoint = '';
            let body = {};

            switch (action) {
                case 'LOAD':
                    endpoint = '/api/automation/load';
                    body = { programId };
                    break;
                case 'START':
                    endpoint = '/api/automation/start';
                    break;
                case 'PAUSE':
                    endpoint = '/api/automation/pause';
                    break;
                case 'RESUME':
                    endpoint = '/api/automation/resume';
                    break;
                case 'STOP':
                    endpoint = '/api/automation/stop';
                    break;
                case 'UNLOAD':
                    endpoint = '/api/automation/unload';
                    break;
            }

            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                const err = await res.json();
                alert(`Action failed: ${err.message}`);
            }
        } catch (error) {
            console.error('Control error:', error);
            alert('Failed to execute control action');
        }
    };

    return (
        <div className="space-y-6 p-6">
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

                {/* Uptime */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Session Uptime</CardTitle>
                        <Clock className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{uptime}</div>
                        <p className="text-xs text-muted-foreground">Since last refresh</p>
                    </CardContent>
                </Card>
            </div>

            {/* Hero: Active Program */}
            <Card className="overflow-hidden">
                <CardHeader className="bg-muted/30 border-b pb-4">
                    <CardTitle className="flex items-center gap-2">
                        <Play className="h-5 w-5 text-primary" />
                        Active Program
                    </CardTitle>
                    <CardDescription>Manage the currently running automation program</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    {activeSession ? (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-xl font-bold tracking-tight">{activeSession.programId}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-sm text-muted-foreground">Status:</span>
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${activeSession.status === 'running' ? 'bg-green-500/10 text-green-600' :
                                            activeSession.status === 'paused' ? 'bg-yellow-500/10 text-yellow-600' :
                                                activeSession.status === 'error' ? 'bg-red-500/10 text-red-600' :
                                                    'bg-blue-500/10 text-blue-600'
                                            }`}>
                                            {activeSession.status.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {/* LOADED or STOPPED or COMPLETED -> START (Restart) */}
                                    {(activeSession.status === 'loaded' || activeSession.status === 'stopped' || activeSession.status === 'completed') && (
                                        <Button onClick={() => handleControl('START')} variant="default" className="gap-2">
                                            <Play className="h-4 w-4" /> Start
                                        </Button>
                                    )}

                                    {/* RUNNING -> PAUSE */}
                                    {activeSession.status === 'running' && (
                                        <Button onClick={() => handleControl('PAUSE')} variant="outline" className="gap-2">
                                            <Pause className="h-4 w-4" /> Pause
                                        </Button>
                                    )}

                                    {/* PAUSED -> RESUME */}
                                    {activeSession.status === 'paused' && (
                                        <Button onClick={() => handleControl('RESUME')} variant="outline" className="gap-2">
                                            <Play className="h-4 w-4" /> Resume
                                        </Button>
                                    )}

                                    {/* RUNNING or PAUSED -> STOP */}
                                    {(activeSession.status === 'running' || activeSession.status === 'paused') && (
                                        <Button onClick={() => handleControl('STOP')} variant="destructive" className="gap-2">
                                            <Square className="h-4 w-4" /> Stop
                                        </Button>
                                    )}

                                    {/* STOPPED or COMPLETED or LOADED -> UNLOAD (Close) */}
                                    {(activeSession.status === 'stopped' || activeSession.status === 'completed' || activeSession.status === 'loaded') && (
                                        <Button onClick={() => handleControl('UNLOAD')} variant="ghost" className="gap-2 text-muted-foreground hover:text-destructive">
                                            <Square className="h-4 w-4" /> Close
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <Separator />

                            {/* Progress / Current Block */}
                            <div className="bg-muted/50 p-4 rounded-lg border">
                                <div className="text-sm font-medium text-muted-foreground mb-2">Current Block Execution</div>
                                <div className="font-mono text-sm bg-background p-3 rounded border">
                                    {activeSession.currentBlockId || 'Ready to start...'}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            <div className="flex justify-center mb-4">
                                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                                    <Play className="h-6 w-6 text-muted-foreground/50" />
                                </div>
                            </div>
                            <h4 className="font-medium text-lg">No Program Loaded</h4>
                            <p className="text-sm mt-1 max-w-sm mx-auto mb-4">Select a program to load into the automation engine.</p>

                            <div className="flex gap-2 justify-center">
                                <StartFlowDialog onStart={(id) => handleControl('LOAD', id)}>
                                    <Button variant="default">
                                        Load Flow
                                    </Button>
                                </StartFlowDialog>
                                <Button variant="outline" onClick={() => window.location.href = '/editor'}>
                                    Go to Editor
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Recent Logs (Placeholder) */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>System logs and events</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="relative w-full overflow-auto">
                        <table className="w-full text-sm text-left caption-bottom">
                            <thead className="[&_tr]:border-b">
                                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">Time</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">Level</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0">Message</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {logs.length === 0 ? (
                                    <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <td colSpan={3} className="p-4 text-center text-muted-foreground h-24 align-middle">
                                            No recent logs available
                                        </td>
                                    </tr>
                                ) : (
                                    logs.map((log, i) => (
                                        <tr key={i} className="border-b transition-colors hover:bg-muted/50">
                                            <td className="p-4 align-middle font-mono text-xs text-muted-foreground">
                                                {new Date(log.timestamp).toLocaleTimeString()}
                                            </td>
                                            <td className="p-4 align-middle">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${log.level === 'error' ? 'bg-red-500/10 text-red-600' : 'bg-blue-500/10 text-blue-600'}`}>
                                                    {log.level.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="p-4 align-middle text-sm">
                                                {log.message}
                                                {log.data && (
                                                    <pre className="mt-1 text-xs bg-muted p-1 rounded overflow-x-auto">
                                                        {JSON.stringify(log.data, null, 2)}
                                                    </pre>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
