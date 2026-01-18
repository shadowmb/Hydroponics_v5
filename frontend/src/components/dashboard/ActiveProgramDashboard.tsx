import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { activeProgramService } from '../../services/activeProgramService';
import type { IActiveProgram } from '../../types/ActiveProgram';
import { RunningProgramCard } from './RunningProgramCard';

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

    // Replace old UI with the new RunningProgramCard
    return <RunningProgramCard />;
};
