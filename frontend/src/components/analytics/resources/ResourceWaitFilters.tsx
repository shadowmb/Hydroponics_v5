import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Button } from '../../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';
import { Calendar } from '../../ui/calendar';
import { Loader2, Filter, CalendarIcon } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { cn } from '../../../lib/utils';
import type { DateRange } from 'react-day-picker';
import { analyticsService } from '../../../services/analyticsService';
import { toast } from 'sonner';

interface ResourceWaitFiltersProps {
    onFilterChange: (filters: { programId: string; windowName: string }) => void;
    activeFilters: { programId: string; windowName: string };
    dateRange?: DateRange;
    onDateRangeChange: (range: DateRange | undefined) => void;
}

// Special value for "All Programs"
const ALL_PROGRAMS = '__all__';

export function ResourceWaitFilters({ onFilterChange, activeFilters, dateRange, onDateRangeChange }: ResourceWaitFiltersProps) {
    const [programs, setPrograms] = useState<any[]>([]);
    const [loadingPrograms, setLoadingPrograms] = useState(true);
    const [availableWindows, setAvailableWindows] = useState<string[]>([]);
    const [loadingWindows, setLoadingWindows] = useState(false);

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
                    windowName: '__all__'
                });
            }
        } catch (error) {
            console.error('Failed to load programs:', error);
            toast.error('Грешка при зареждане на списъка с програми');
        } finally {
            setLoadingPrograms(false);
        }
    };

    // Load windows when program changes
    useEffect(() => {
        loadWindows();
    }, [activeFilters.programId]);

    const loadWindows = async () => {
        try {
            setLoadingWindows(true);
            const pid = activeFilters.programId !== ALL_PROGRAMS ? activeFilters.programId : undefined;
            const windows = await analyticsService.getAvailableWindows(pid);
            setAvailableWindows(windows);
        } catch (error) {
            console.error('Failed to load windows:', error);
            toast.error('Грешка при зареждане на прозорците');
        } finally {
            setLoadingWindows(false);
        }
    };

    const handleProgramChange = (val: string) => {
        onFilterChange({
            programId: val,
            windowName: '__all__' // Reset window filter
        });
    };

    const handleWindowChange = (val: string) => {
        onFilterChange({
            ...activeFilters,
            windowName: val
        });
    };


    return (
        <Card>
            <CardHeader className="py-3 px-4 border-b border-border/50">
                <h3 className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider flex items-center gap-2">
                    <Filter className="h-3.5 w-3.5" />
                    Филтри
                </h3>
            </CardHeader>
            <CardContent className="p-4">
                <div className="flex flex-wrap gap-4 items-end">

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

                    {/* Window Selector */}
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">Прозорец/Цикъл</label>
                        <Select
                            value={activeFilters.windowName || '__all__'}
                            onValueChange={handleWindowChange}
                            disabled={loadingWindows}
                        >
                            <SelectTrigger className="w-[200px]">
                                {loadingWindows ? (
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        <span>Зареждане...</span>
                                    </div>
                                ) : (
                                    <SelectValue placeholder="Всички прозорци" />
                                )}
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__all__" className="font-medium">
                                    📊 Всички прозорци
                                </SelectItem>
                                {availableWindows.length > 0 && (
                                    <div className="h-px bg-border my-1" />
                                )}
                                {availableWindows.map(w => (
                                    <SelectItem key={w} value={w}>
                                        {w}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Date Range Picker */}
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-muted-foreground">Период</label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    id="date"
                                    variant={"outline"}
                                    className={cn(
                                        "w-[240px] justify-start text-left font-normal",
                                        !dateRange && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateRange?.from ? (
                                        dateRange.to ? (
                                            <>
                                                {format(dateRange.from, "dd.MM.yyyy")} -{" "}
                                                {format(dateRange.to, "dd.MM.yyyy")}
                                            </>
                                        ) : (
                                            format(dateRange.from, "dd.MM.yyyy")
                                        )
                                    ) : (
                                        <span>Избери период</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                                <div className="p-2 border-b grid grid-cols-2 gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => onDateRangeChange({ from: new Date(), to: new Date() })}>
                                        Днес
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => onDateRangeChange({ from: subDays(new Date(), 1), to: subDays(new Date(), 1) })}>
                                        Вчера
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => onDateRangeChange({ from: subDays(new Date(), 7), to: new Date() })}>
                                        Последни 7 дни
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => onDateRangeChange({ from: subDays(new Date(), 30), to: new Date() })}>
                                        Последни 30 дни
                                    </Button>
                                </div>
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={dateRange?.from}
                                    selected={dateRange}
                                    onSelect={onDateRangeChange}
                                    numberOfMonths={2}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            </CardContent>
        </Card >
    );
}

// Export the constant so Dashboard can use it
export { ALL_PROGRAMS };
