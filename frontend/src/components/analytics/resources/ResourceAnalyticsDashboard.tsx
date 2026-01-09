import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '../../ui/button';
import type { DateRange } from 'react-day-picker';

import { ResourceWaitFilters, ALL_PROGRAMS } from './ResourceWaitFilters';
import { ResourceSummaryCards } from './ResourceSummaryCards';
import { ResourceHistoryChart } from './ResourceHistoryChart';
import { ResourceDetailsTable } from './ResourceDetailsTable';

import {
    resourceAnalyticsService,
    type ResourceTotalsResponse,
    type PeriodSummaryResponse,
    type DailyResourceData
} from '../../../services/api/resourceAnalytics.service';

import { resourceRoleService, type ResourceRole } from '../../../services/resourceRoleService';

export function ResourceAnalyticsDashboard() {
    // STATE: Filters
    const [filters, setFilters] = useState({
        programId: '',
        windowName: '__all__'
    });

    // STATE: Date Range (Default last 7 days)
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: new Date(),
        to: new Date()
    });

    // STATE: Resource Roles (from Settings)
    const [allRoles, setAllRoles] = useState<ResourceRole[]>([]);
    const [enabledRoleKeys, setEnabledRoleKeys] = useState<string[]>([]);

    // STATE: Data
    const [loading, setLoading] = useState(false);
    const [allTotals, setAllTotals] = useState<ResourceTotalsResponse | null>(null);
    const [periodTotals, setPeriodTotals] = useState<PeriodSummaryResponse | null>(null);
    const [dailyData, setDailyData] = useState<DailyResourceData[]>([]);

    // Load Resource Roles on mount (to know which to show)
    useEffect(() => {
        const loadRoles = async () => {
            try {
                const roles = await resourceRoleService.getAll();
                setAllRoles(roles);

                // Filter to only roles with showInSummary === true
                const enabled = roles
                    .filter(r => r.showInSummary === true)
                    .map(r => r.key);
                setEnabledRoleKeys(enabled);
            } catch (error) {
                console.error('Failed to load resource roles:', error);
            }
        };
        loadRoles();
    }, []);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const effectiveProgramId = filters.programId === ALL_PROGRAMS ? '' : filters.programId;

            const apiFilters = {
                programId: effectiveProgramId || undefined,
                windowName: filters.windowName !== '__all__' ? filters.windowName : undefined
            };

            const fromStr = dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : '';
            const toStr = dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : '';

            // 1. Fetch All-Time Totals
            const allRes = await resourceAnalyticsService.getAllTotals(apiFilters);
            setAllTotals(allRes);

            // 2. Fetch Period Totals (only if dates valid)
            if (fromStr && toStr) {
                const periodRes = await resourceAnalyticsService.getPeriodTotals(fromStr, toStr, apiFilters);
                setPeriodTotals(periodRes);

                // Get ALL roles from data (for daily breakdown query)
                const allDataRoles = Object.keys(allRes.totals || {});

                if (allDataRoles.length > 0) {
                    // 3. Fetch Daily Breakdown for ALL roles (filter visually later)
                    const dailyRes = await resourceAnalyticsService.getDailyBreakdown(fromStr, toStr, allDataRoles, apiFilters);
                    setDailyData(dailyRes);
                } else {
                    setDailyData([]);
                }
            } else {
                setPeriodTotals(null);
                setDailyData([]);
            }

        } catch (error: any) {
            console.error('Analytics Fetch Error:', error);
            toast.error('Грешка при зареждане на данни: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    }, [filters, dateRange]);

    // Initial load / Refetch when filters/date change
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Filter data to only show enabled roles
    const filteredAllTotals: ResourceTotalsResponse | null = allTotals ? {
        ...allTotals,
        totals: Object.fromEntries(
            Object.entries(allTotals.totals || {}).filter(([key]) => enabledRoleKeys.includes(key))
        )
    } : null;

    const filteredPeriodTotals: PeriodSummaryResponse | null = periodTotals ? {
        ...periodTotals,
        current: Object.fromEntries(
            Object.entries(periodTotals.current || {}).filter(([key]) => enabledRoleKeys.includes(key))
        )
    } : null;

    // Create role labels map: key -> label
    const roleLabels: Record<string, string> = {};
    allRoles.forEach(role => {
        roleLabels[role.key] = role.label;
    });

    // Create role units map: key -> unit (from periodTotals or allTotals)
    const roleUnits: Record<string, string> = {};
    const totalsSource = periodTotals?.current || allTotals?.totals || {};
    Object.entries(totalsSource).forEach(([key, data]) => {
        roleUnits[key] = data.unit || '';
    });

    return (

        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header / Controls */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-end justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Ресурсен Анализ</h2>
                    <p className="text-muted-foreground">
                        Агрегирани данни за консумация на ресурси и сензорни стойности.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={fetchData} disabled={loading}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <ResourceWaitFilters
                activeFilters={filters}
                onFilterChange={setFilters}
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
            />

            {/* Info about enabled roles */}
            {enabledRoleKeys.length === 0 && !loading && (
                <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                    <p>Няма избрани ресурси за показване.</p>
                    <p className="text-sm mt-1">
                        Отидете в <strong>Settings → Roles & Analytics</strong> и включете "Show" за желаните ресурси.
                    </p>
                </div>
            )}

            {/* Main Content - Only show if we have enabled roles */}
            {enabledRoleKeys.length > 0 && (
                <>
                    {/* Cards - Filtered by enabled roles */}
                    <ResourceSummaryCards
                        allData={filteredAllTotals}
                        periodData={filteredPeriodTotals}
                        loading={loading}
                        roleLabels={roleLabels}
                        dateRange={dateRange}
                    />


                    {/* Chart - Pass only enabled roles, default to none selected */}
                    {dailyData.length > 0 && (
                        <ResourceHistoryChart
                            data={dailyData}
                            loading={loading}
                            availableRoles={enabledRoleKeys}
                            defaultSelected={[]}
                            roleLabels={roleLabels}
                            roleUnits={roleUnits}
                        />
                    )}

                    {/* Table - Only show enabled role columns */}
                    {dailyData.length > 0 && (
                        <ResourceDetailsTable
                            data={dailyData}
                            loading={loading}
                            columns={enabledRoleKeys}
                            roleLabels={roleLabels}
                            roleUnits={roleUnits}
                        />
                    )}
                </>
            )}
        </div>
    );
}
