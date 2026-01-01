import { useEffect, useState } from 'react';
import { activeProgramService } from '../services/activeProgramService';
import type { IActiveProgram } from '../types/ActiveProgram';
import { Loader2 } from 'lucide-react';

// Basic mode components
import { ActiveProgramWizard } from '../components/activeProgram/ActiveProgramWizard';
import { ActiveProgramManager } from '../components/activeProgram/ActiveProgramManager';

// Advanced mode components
import { AdvancedProgramWizard } from '../components/activeProgram/AdvancedProgramWizard';
import { AdvancedProgramManager } from '../components/activeProgram/AdvancedProgramManager';

const EmptyState = () => <div className="p-8 text-center text-muted-foreground">No active program loaded. Go to Programs to load one.</div>;

export const ActiveProgramPage = () => {
    const [activeProgram, setActiveProgram] = useState<IActiveProgram | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchActiveProgram = async () => {
        try {
            const data = await activeProgramService.getActive();
            setActiveProgram(data);
        } catch (error) {
            console.error('Failed to fetch active program', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActiveProgram();
        // Poll for updates every 5 seconds
        const interval = setInterval(fetchActiveProgram, 5000);
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
    }

    if (!activeProgram) {
        return <EmptyState />;
    }

    // Determine program type
    const isAdvanced = (activeProgram as any).type === 'ADVANCED';

    // Route to appropriate component based on status and type
    if (activeProgram.status === 'loaded') {
        return isAdvanced
            ? <AdvancedProgramWizard program={activeProgram} onStart={fetchActiveProgram} />
            : <ActiveProgramWizard program={activeProgram} onStart={fetchActiveProgram} />;
    }

    return isAdvanced
        ? <AdvancedProgramManager program={activeProgram} onUpdate={fetchActiveProgram} />
        : <ActiveProgramManager program={activeProgram} onUpdate={fetchActiveProgram} />;
};
