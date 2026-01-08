import { useState, useEffect } from 'react';
import { Card, CardContent } from '../../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Loader2, Filter } from 'lucide-react';
import { analyticsService } from '../../../services/analyticsService';
import { toast } from 'sonner';

interface ResourceWaitFiltersProps {
    onFilterChange: (filters: { programId: string; windowId: string; flowId: string }) => void;
    activeFilters: { programId: string; windowId: string; flowId: string };
}

// Special value for "All Programs"
const ALL_PROGRAMS = '__all__';

export function ResourceWaitFilters({ onFilterChange, activeFilters }: ResourceWaitFiltersProps) {
    const [programs, setPrograms] = useState<any[]>([]);
    const [loadingPrograms, setLoadingPrograms] = useState(true);

    // Load available programs
    useEffect(() => {
        loadPrograms();
    }, []);

    const loadPrograms = async () => {
        try {
            setLoadingPrograms(true);
            const result = await analyticsService.getExecutedPrograms();
            setPrograms(result);

            // Default to "All Programs" if nothing selected
            if (!activeFilters.programId) {
                onFilterChange({
                    programId: ALL_PROGRAMS,
                    windowId: 'all',
                    flowId: 'all'
                });
            }
        } catch (error) {
            console.error('Failed to load programs:', error);
            toast.error('Грешка при зареждане на списъка с програми');
        } finally {
            setLoadingPrograms(false);
        }
    };

    const handleProgramChange = (val: string) => {
        onFilterChange({
            programId: val,
            windowId: 'all', // Reset dependent filters
            flowId: 'all'
        });
    };


    return (
        <Card>
            <CardContent className="pt-6">
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex items-center gap-2 text-muted-foreground mr-2">
                        <Filter className="h-4 w-4" />
                        <span className="text-sm font-medium">Филтри:</span>
                    </div>

                    {/* Program Selector */}
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">Програма</label>
                        <Select
                            value={activeFilters.programId || ALL_PROGRAMS}
                            onValueChange={handleProgramChange}
                            disabled={loadingPrograms}
                        >
                            <SelectTrigger className="w-[220px]">
                                {loadingPrograms ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        <span>Зареждане...</span>
                                    </div>
                                ) : (
                                    <SelectValue placeholder="Всички програми" />
                                )}
                            </SelectTrigger>
                            <SelectContent>
                                {/* "All Programs" option */}
                                <SelectItem value={ALL_PROGRAMS} className="font-medium">
                                    📊 Всички програми
                                </SelectItem>

                                {/* Separator */}
                                {programs.length > 0 && (
                                    <div className="h-px bg-border my-1" />
                                )}

                                {/* Individual programs */}
                                {programs.map(p => (
                                    <SelectItem key={p.programId} value={p.programId}>
                                        {p.name || p.programId}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Placeholder Window Selector (Future) */}
                    <div className="space-y-2 opacity-50 pointer-events-none">
                        <label className="text-xs font-medium text-muted-foreground">Прозорец</label>
                        <Select value="all" disabled>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Всички" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Всички</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Placeholder Flow Selector (Future) */}
                    <div className="space-y-2 opacity-50 pointer-events-none">
                        <label className="text-xs font-medium text-muted-foreground">Поток</label>
                        <Select value="all" disabled>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Всички" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Всички</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// Export the constant so Dashboard can use it
export { ALL_PROGRAMS };
