import { Card, CardContent } from '../../ui/card';
import { Droplets, FlaskConical, Thermometer, Activity, Database } from 'lucide-react';
import type { ResourceTotalsResponse, PeriodSummaryResponse, ResourceTotal } from '../../../services/api/resourceAnalytics.service';

interface ResourceSummaryCardsProps {
    allData: ResourceTotalsResponse | null;
    periodData: PeriodSummaryResponse | null;
    loading: boolean;
    roleLabels?: Record<string, string>; // Map: key -> display label
}

export function ResourceSummaryCards({ allData, periodData, loading, roleLabels = {} }: ResourceSummaryCardsProps) {
    if (loading) {
        return <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 animate-pulse">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-muted rounded-lg"></div>)}
        </div>;
    }

    if (!allData && !periodData) return null;

    // Helper to get icon based on role key
    const getIcon = (role: string) => {
        const r = role.toLowerCase();
        if (r.includes('water') || r.includes('volume') || r.includes('level')) return <Droplets className="h-4 w-4 text-blue-500" />;
        if (r.includes('ph')) return <FlaskConical className="h-4 w-4 text-purple-500" />;
        if (r.includes('temp')) return <Thermometer className="h-4 w-4 text-red-500" />;
        if (r.includes('ec')) return <Activity className="h-4 w-4 text-yellow-500" />;
        if (r.includes('nutrient') || r.includes('dose')) return <FlaskConical className="h-4 w-4 text-green-500" />;
        return <Database className="h-4 w-4 text-gray-500" />;
    };

    // Get display name from roleLabels or fallback to key
    const getDisplayName = (key: string) => roleLabels[key] || key;

    // Single compact card
    const RenderCard = ({ roleKey, data }: { roleKey: string, data: ResourceTotal }) => (
        <Card className="hover:bg-muted/30 transition-colors">
            <CardContent className="p-2 text-center">
                {/* Header: Icon + Name */}
                <div className="flex items-center justify-center gap-1 mb-0.5">
                    {getIcon(roleKey)}
                    <span className="text-[10px] font-medium text-muted-foreground truncate">
                        {getDisplayName(roleKey)}
                    </span>
                </div>

                {/* Value */}
                <div className="text-lg font-bold leading-tight">
                    {data.value?.toFixed(2)}
                    <span className="text-[10px] font-normal text-muted-foreground ml-0.5">{data.unit}</span>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-6">
            {/* ALL TIME SECTION */}
            {allData?.totals && Object.keys(allData.totals).length > 0 && (
                <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <Database className="h-3 w-3" />
                        All Time Summary
                    </h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-5">
                        {Object.entries(allData.totals).map(([role, data]) => (
                            <RenderCard key={role} roleKey={role} data={data} />
                        ))}
                    </div>
                </div>
            )}

            {/* PERIOD SECTION */}
            {periodData?.current && Object.keys(periodData.current).length > 0 && (
                <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <Activity className="h-3 w-3" />
                        Selected Period
                    </h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-6">
                        {Object.entries(periodData.current).map(([role, data]) => (
                            <RenderCard key={role} roleKey={role} data={data} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
