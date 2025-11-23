import React, { useEffect, useState } from 'react';
import { Activity, Wifi, WifiOff, Play, Pause, Square, Clock } from 'lucide-react';
import { useStore } from '../core/useStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import { StartProgramDialog } from '../components/dashboard/StartProgramDialog';

export const Dashboard: React.FC = () => {
    const { systemStatus, devices, activeSession } = useStore();
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

    const handleControl = async (action: 'START' | 'PAUSE' | 'RESUME' | 'STOP', programId?: string) => {
        try {
            let endpoint = '';
            let body = {};

            switch (action) {
                case 'START':
                    endpoint = '/api/automation/start';
                    body = { programId };
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
                                                'bg-red-500/10 text-red-600'
                                            }`}>
                                            {activeSession.status.toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {activeSession.status === 'running' && (
                                        <Button onClick={() => handleControl('PAUSE')} variant="outline" className="gap-2">
                                            <Pause className="h-4 w-4" /> Pause
                                        </Button>
                                    )}
                                    {activeSession.status === 'paused' && (
                                        <Button onClick={() => handleControl('RESUME')} variant="outline" className="gap-2">
                                            <Play className="h-4 w-4" /> Resume
                                        </Button>
                                    )}
                                    <Button onClick={() => handleControl('STOP')} variant="destructive" className="gap-2">
                                        <Square className="h-4 w-4" /> Stop
                                    </Button>
                                </div>
                            </div>

                            <Separator />

                            {/* Progress / Current Block */}
                            <div className="bg-muted/50 p-4 rounded-lg border">
                                <div className="text-sm font-medium text-muted-foreground mb-2">Current Block Execution</div>
                                <div className="font-mono text-sm bg-background p-3 rounded border">
                                    {activeSession.currentBlockId || 'Initializing...'}
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
                            <h4 className="font-medium text-lg">No Program Running</h4>
                            <p className="text-sm mt-1 max-w-sm mx-auto mb-4">Select a program to start a new automation session.</p>

                            <div className="flex gap-2 justify-center">
                                <StartProgramDialog onStart={(id) => handleControl('START', id)}>
                                    <Button variant="default">
                                        Start Program
                                    </Button>
                                </StartProgramDialog>
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
                                {/* Empty State for now */}
                                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <td colSpan={3} className="p-4 text-center text-muted-foreground h-24 align-middle">
                                        No recent logs available
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
