import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Activity, CheckCircle, AlertTriangle, RefreshCw, Power } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/core/config';

interface Mismatch {
    id: string;
    type: 'PROGRAM' | 'CYCLE_SESSION' | 'FLOW_SESSION';
    name: string;
    status: string;
    engineStatus: string;
    isZombie: boolean;
}

export function SystemRecoveryPanel() {
    const [loading, setLoading] = useState(false);
    const [checked, setChecked] = useState(false);
    const [healthy, setHealthy] = useState(false);
    const [mismatches, setMismatches] = useState<Mismatch[]>([]);

    const checkSystemState = async () => {
        setLoading(true);
        try {
            // Fetch directly from API
            const res = await fetch(`${API_BASE_URL}/api/system/state/check`, {
                method: 'POST'
            });
            const json = await res.json();

            if (json.success) {
                setHealthy(json.data.isHealthy);
                setMismatches(json.data.mismatches || []);
                setChecked(true);

                if (json.data.isHealthy) {
                    toast.success('System is healthy');
                } else {
                    toast.warning('System state mismatches detected');
                }
            } else {
                toast.error('Failed to check system state: ' + json.error);
            }
        } catch (err: any) {
            toast.error('Error checking system state: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const fixState = async (id: string, type: 'PROGRAM' | 'CYCLE_SESSION' | 'FLOW_SESSION') => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/system/state/fix`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, type })
            });
            const json = await res.json();
            if (json.success) {
                toast.success('State fixed successfully');
                // Refresh list
                await checkSystemState();
            } else {
                toast.error('Failed to fix state: ' + json.error);
            }
        } catch (err: any) {
            toast.error('Error fixing state: ' + err.message);
        }
    };

    return (
        <Card className="border-orange-500/20 shadow-sm">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Activity className="h-5 w-5 text-orange-500" />
                            System Health & Recovery
                        </CardTitle>
                        <CardDescription>
                            Diagnose and fix "Zombie" sessions left after a power failure or crash.
                        </CardDescription>
                    </div>
                    {checked && healthy && (
                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 flex gap-1 items-center px-3 py-1">
                            <CheckCircle className="h-4 w-4" />
                            Healthy
                        </Badge>
                    )}
                    {checked && !healthy && (
                        <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20 flex gap-1 items-center px-3 py-1">
                            <AlertTriangle className="h-4 w-4" />
                            Mismatch Detected
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {!checked && (
                    <div className="text-center py-6 text-muted-foreground flex flex-col items-center gap-2">
                        <Activity className="h-10 w-10 opacity-20" />
                        <p>Check the system for stalled "Zombie" processes that block execution.</p>
                    </div>
                )}

                {checked && healthy && (
                    <Alert className="bg-green-500/5 border-green-500/20 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <AlertTitle>System logic is synchronized</AlertTitle>
                        <AlertDescription>
                            Database records match the actual running processes. No actions needed.
                        </AlertDescription>
                    </Alert>
                )}

                {checked && !healthy && mismatches.length > 0 && (
                    <div className="space-y-4">
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Zombie Processes Detected</AlertTitle>
                            <AlertDescription>
                                The database thinks these items are running, but the system engine is idle. This usually happens after a crash or power loss.
                            </AlertDescription>
                        </Alert>

                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>DB Status</TableHead>
                                        <TableHead>Engine Status</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {mismatches.map((m) => (
                                        <TableRow key={m.id}>
                                            <TableCell className="font-medium">
                                                <Badge variant="secondary">{m.type}</Badge>
                                            </TableCell>
                                            <TableCell>{m.name}</TableCell>
                                            <TableCell className="text-red-500 font-mono text-xs">{m.status.toUpperCase()}</TableCell>
                                            <TableCell className="text-muted-foreground font-mono text-xs">{m.engineStatus.toUpperCase()}</TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    className="h-7 text-xs"
                                                    onClick={() => fixState(m.id, m.type)}
                                                >
                                                    <Power className="mr-1 h-3 w-3" />
                                                    Force Stop
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}
            </CardContent>
            <CardFooter className="bg-muted/50 border-t flex justify-end p-4">
                <Button variant={checked ? "outline" : "default"} onClick={checkSystemState} disabled={loading}>
                    {loading ? (
                        <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Checking...
                        </>
                    ) : (
                        <>
                            <Activity className="mr-2 h-4 w-4" />
                            {checked ? 'Re-Check Status' : 'Check System State'}
                        </>
                    )}
                </Button>
            </CardFooter>
        </Card>
    );
}
