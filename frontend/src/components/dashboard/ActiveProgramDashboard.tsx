import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Play, Pause, Square, ExternalLink, Loader2, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { activeProgramService } from '../../services/activeProgramService';
import type { IActiveProgram } from '../../types/ActiveProgram';
import { toast } from 'sonner';

export const ActiveProgramDashboard = () => {
    const [program, setProgram] = useState<IActiveProgram | null>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchProgram = async () => {
        try {
            const data = await activeProgramService.getActive();
            setProgram(data);
        } catch (error) {
            console.error('Failed to fetch active program', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProgram();
        const interval = setInterval(fetchProgram, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleStop = async () => {
        try {
            await activeProgramService.stop();
            toast.success('Program stopped');
            fetchProgram();
        } catch (error) {
            toast.error('Failed to stop program');
        }
    };

    const handlePause = async () => {
        try {
            await activeProgramService.pause();
            toast.success('Program paused');
            fetchProgram();
        } catch (error) {
            toast.error('Failed to pause program');
        }
    };

    const handleResume = async () => {
        try {
            await activeProgramService.start();
            toast.success('Program resumed');
            fetchProgram();
        } catch (error) {
            toast.error('Failed to resume program');
        }
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="p-6 flex justify-center">
                    <Loader2 className="animate-spin h-6 w-6" />
                </CardContent>
            </Card>
        );
    }

    if (!program) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Active Program</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center text-muted-foreground py-4">
                        No program active
                    </div>
                    <Button className="w-full" variant="outline" onClick={() => navigate('/programs')}>
                        Load Program
                    </Button>
                </CardContent>
            </Card>
        );
    }

    const nextCycle = program.schedule.find(s => s.status === 'pending');

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active Program</CardTitle>
                <Badge variant={program.status === 'running' ? 'default' : 'secondary'}>
                    {program.status.toUpperCase()}
                </Badge>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold mb-1">{program.name}</div>

                {nextCycle ? (
                    <div className="text-sm text-muted-foreground mb-4">
                        Next cycle at <span className="font-mono font-bold text-foreground">{nextCycle.time}</span>
                    </div>
                ) : (
                    <div className="text-sm text-muted-foreground mb-4">
                        All cycles completed
                    </div>
                )}

                <div className="flex gap-2 mb-4">
                    {program.status === 'running' ? (
                        <Button size="sm" variant="outline" className="flex-1" onClick={handlePause}>
                            <Pause className="h-4 w-4 mr-2" /> Pause
                        </Button>
                    ) : (
                        <Button size="sm" variant="outline" className="flex-1" onClick={handleResume}>
                            <Play className="h-4 w-4 mr-2" /> Resume
                        </Button>
                    )}
                    <Button size="sm" variant="destructive" className="flex-1" onClick={handleStop}>
                        <Square className="h-4 w-4 mr-2" /> Stop
                    </Button>
                    <Button size="sm" variant="ghost" className="flex-1" onClick={async () => {
                        if (!confirm('Remove active program?')) return;
                        try {
                            await activeProgramService.unload();
                            // Refresh logic handled by polling
                        } catch (e) { toast.error('Failed to remove'); }
                    }} title="Remove">
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </div>

                <Button size="sm" variant="ghost" className="w-full" onClick={() => navigate('/active-program')}>
                    <ExternalLink className="h-4 w-4 mr-2" /> Manage Program
                </Button>
            </CardContent>
        </Card>
    );
};
