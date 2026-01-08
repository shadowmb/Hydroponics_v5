import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import {
    Droplets, FlaskConical, Thermometer, Activity,
    TrendingUp, TrendingDown, Minus, Database
} from 'lucide-react';
import type { ResourceTotalsResponse, PeriodSummaryResponse, ResourceTotal } from '../../../services/api/resourceAnalytics.service';
import { cn } from '../../../lib/utils';

interface ResourceSummaryCardsProps {
    allData: ResourceTotalsResponse | null;
    periodData: PeriodSummaryResponse | null;
    loading: boolean;
}

export function ResourceSummaryCards({ allData, periodData, loading }: ResourceSummaryCardsProps) {
    if (loading) {
        return <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-muted rounded-lg"></div>)}
        </div>;
    }

    if (!allData && !periodData) return null;

    // Helper to get icon
    const getIcon = (role: string) => {
        if (role.toLowerCase().includes('water') || role.toLowerCase().includes('volume')) return <Droplets className="h-4 w-4 text-blue-500" />;
        if (role.toLowerCase().includes('ph')) return <FlaskConical className="h-4 w-4 text-purple-500" />;
        if (role.toLowerCase().includes('temp')) return <Thermometer className="h-4 w-4 text-red-500" />;
        if (role.toLowerCase().includes('ec')) return <Activity className="h-4 w-4 text-yellow-500" />;
        return <Database className="h-4 w-4 text-gray-500" />;
    };

    // Helper to render value card
    const RenderCard = ({ title, data, trend }: { title: string, data: ResourceTotal, trend?: { direction: string; percentage: number } }) => {
        return (
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {getIcon(title)}
                            <span className="capitalize">{title}</span>
                        </div>
                        {data.type === 'SUM' && <Badge variant="outline" className="text-[10px]">TOTAL</Badge>}
                        {data.type === 'DELTA' && <Badge variant="secondary" className="text-[10px]">DELTA</Badge>}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {data.value?.toFixed(2)} <span className="text-sm font-normal text-muted-foreground">{data.unit}</span>
                    </div>

                    {/* Stats Row */}
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        {data.count > 0 && <span>Obs: {data.count}</span>}
                        {data.min !== undefined && <span>Min: {data.min.toFixed(1)}</span>}
                        {data.max !== undefined && <span>Max: {data.max.toFixed(1)}</span>}
                    </div>

                    {/* Trend Row (Only for Period) */}
                    {trend && (
                        <div className={cn(
                            "flex items-center gap-1 mt-2 text-xs font-medium",
                            trend.direction === 'up' ? "text-red-500" :
                                trend.direction === 'down' ? "text-green-500" : "text-gray-500"
                        )}>
                            {trend.direction === 'up' && <TrendingUp className="h-3 w-3" />}
                            {trend.direction === 'down' && <TrendingDown className="h-3 w-3" />}
                            {trend.direction === 'flat' && <Minus className="h-3 w-3" />}

                            {trend.direction !== 'flat' && <span>{Math.abs(trend.percentage).toFixed(1)}%</span>}
                            <span className="text-muted-foreground font-normal ml-1">vs All-Time Avg</span>
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="space-y-8">
            {/* ALL TIME SECTION */}
            {allData?.totals && Object.keys(allData.totals).length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        All Time Summary
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {Object.entries(allData.totals).map(([role, data]) => (
                            <RenderCard key={role} title={role} data={data} />
                        ))}
                    </div>
                </div>
            )}

            {/* PERIOD SECTION */}
            {periodData?.current && Object.keys(periodData.current).length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Selected Period Summary
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {Object.entries(periodData.current).map(([role, data]) => (
                            <RenderCard
                                key={role}
                                title={role}
                                data={data}
                                trend={periodData.trends?.[role]}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
