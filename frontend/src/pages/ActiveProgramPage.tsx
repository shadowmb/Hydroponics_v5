import { useEffect, useState } from 'react';
import { activeProgramService } from '../services/activeProgramService';
import { Loader2, Zap, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '../core/useStore';

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../components/ui/select";

// Basic mode components
import { ActiveProgramWizard } from '../components/activeProgram/ActiveProgramWizard';
import { ActiveProgramManager } from '../components/activeProgram/ActiveProgramManager';

// Advanced mode components
import { AdvancedProgramWizard } from '../components/activeProgram/AdvancedProgramWizard';
import { AdvancedProgramManager } from '../components/activeProgram/AdvancedProgramManager';

interface ProgramLauncherProps {
    onProgramLoaded: () => void;
}

const ProgramLauncher = ({ onProgramLoaded }: ProgramLauncherProps) => {
    const [availablePrograms, setAvailablePrograms] = useState<any[]>([]);
    const [selectedProgramId, setSelectedProgramId] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const loadPrograms = async () => {
            try {
                const response = await fetch('/api/programs');
                if (!response.ok) throw new Error("Failed to fetch programs");
                const data = await response.json();
                setAvailablePrograms(data || []);
            } catch (e) {
                console.error("Failed to load programs for launcher", e);
                toast.error("Failed to load available programs");
            }
        };
        loadPrograms();
    }, []);

    const handleLoadAndConfigure = async () => {
        if (!selectedProgramId) return;
        setIsLoading(true);
        try {
            await activeProgramService.load(selectedProgramId);
            toast.success("Program loaded. Please configure it now.");
            onProgramLoaded(); // Refresh parent state to show Wizard
        } catch (error) {
            console.error("Failed to load program", error);
            toast.error("Failed to load program");
        } finally {
            setIsLoading(false);
        }
    };

    const selectedProgram = availablePrograms.find(p => p.id === selectedProgramId);

    return (
        <Card className="max-w-4xl mx-auto border-dashed border-slate-700/50 bg-slate-900/20 shadow-sm relative overflow-hidden mt-8">
            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]" />
            <CardHeader className="pb-2 relative z-10 text-center">
                <CardTitle className="text-xl text-muted-foreground flex items-center justify-center gap-2">
                    <Calendar className="h-5 w-5 opacity-50" />
                    Load Active Program
                </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
                <div className="flex flex-col items-center justify-center py-6 space-y-6">

                    {/* 1. SELECTION AREA */}
                    <div className="w-full max-w-sm space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider ml-1">
                            Select Program to Start
                        </label>
                        <Select
                            value={selectedProgramId}
                            onValueChange={setSelectedProgramId}
                        >
                            <SelectTrigger className="w-full bg-slate-950/50 border-slate-700/50 h-11">
                                <SelectValue placeholder="Select a program..." />
                            </SelectTrigger>
                            <SelectContent>
                                {availablePrograms.map((prog) => (
                                    <SelectItem key={prog.id} value={prog.id} className="cursor-pointer">
                                        <span className="font-medium">{prog.name}</span>
                                        <span className="ml-2 text-xs text-muted-foreground opacity-70">
                                            ({prog.type})
                                        </span>
                                    </SelectItem>
                                ))}
                                {availablePrograms.length === 0 && (
                                    <div className="p-2 text-sm text-center text-muted-foreground">
                                        No programs found.
                                    </div>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* 2. PREVIEW AREA (Conditional) */}
                    {selectedProgram ? (
                        <div className="w-full max-w-sm bg-slate-950/40 border border-slate-800 rounded-lg p-4 animate-in fade-in slide-in-from-top-2">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-lg text-white">{selectedProgram.name}</h4>
                                <Badge variant="outline" className="text-[10px] uppercase">{selectedProgram.type}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground italic mb-4 line-clamp-2">
                                {selectedProgram.description || "No description provided."}
                            </p>

                            {/* Timeline Preview */}
                            <div className="space-y-1.5 mb-4">
                                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Schedule Preview</div>
                                {selectedProgram.windows && selectedProgram.windows.length > 0 ? (
                                    selectedProgram.windows.map((win: any) => (
                                        <div key={win.id} className="flex items-center justify-between text-xs bg-slate-900/50 px-2 py-1.5 rounded border border-slate-800/50 text-slate-300">
                                            <span className="font-mono text-amber-500/80">{win.startTime}</span>
                                            <span className="font-medium">{win.name}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-xs text-muted-foreground">No windows defined.</div>
                                )}
                            </div>

                            <Button
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold"
                                onClick={handleLoadAndConfigure}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="animate-spin mr-2 h-4 w-4" /> Loading...
                                    </>
                                ) : (
                                    <>
                                        <Zap className="mr-2 h-4 w-4 fill-current" /> Load & Configure
                                    </>
                                )}
                            </Button>
                        </div>
                    ) : (
                        <div className="text-sm text-muted-foreground/40 italic py-4">
                            Select a program above to see details...
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export const ActiveProgramPage = () => {
    const activeProgram = useStore((state) => state.activeProgram);

    // Trigger a refresh when program is loaded
    const refreshActiveProgram = async () => {
        try {
            const data = await activeProgramService.getActive();
            useStore.getState().setActiveProgram(data);
        } catch (error) {
            console.error('Failed to fetch active program', error);
        }
    };

    // No need for polling - the useActiveProgramSync hook in Layout handles real-time updates

    if (!activeProgram) {
        return <ProgramLauncher onProgramLoaded={refreshActiveProgram} />;
    }

    // Determine program type
    const isAdvanced = (activeProgram as any).type === 'ADVANCED';

    // Route to appropriate component based on status and type
    if (activeProgram.status === 'loaded') {
        return isAdvanced
            ? <AdvancedProgramWizard program={activeProgram} onStart={refreshActiveProgram} />
            : <ActiveProgramWizard program={activeProgram} onStart={refreshActiveProgram} />;
    }

    return isAdvanced
        ? <AdvancedProgramManager program={activeProgram} onUpdate={refreshActiveProgram} />
        : <ActiveProgramManager program={activeProgram} onUpdate={refreshActiveProgram} />;
};
