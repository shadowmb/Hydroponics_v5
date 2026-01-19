import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Activity, AlertCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

export type SensorStatus = 'normal' | 'warning' | 'critical' | 'error';
export type TrendDirection = 'up' | 'down' | 'flat' | null;

interface SensorCardProps {
    name: string;
    alias?: string;
    value: number | string;
    unit?: string;
    icon?: React.ReactNode;
    lastUpdate?: Date | string; // Allow string date from JSON
    status?: SensorStatus;
    trend?: TrendDirection;
    showTrend?: boolean;

    // Config details for Tooltip
    config?: {
        min?: number;
        max?: number;
        tolerance?: number;
    }
}

export const SensorCard: React.FC<SensorCardProps> = ({
    name,
    alias,
    value,
    unit,
    icon,
    lastUpdate,
    status = 'normal',
    trend = null,
    showTrend = true,
    config
}) => {
    const [timeSince, setTimeSince] = useState<string>('Syncing...');
    const [isStale, setIsStale] = useState(false);

    // Safe Date Parsing
    const lastUpdateDate = lastUpdate ? new Date(lastUpdate) : null;

    useEffect(() => {
        if (!lastUpdateDate || isNaN(lastUpdateDate.getTime())) {
            setTimeSince('No data');
            setIsStale(true);
            return;
        }

        const updateTime = () => {
            const diff = Date.now() - lastUpdateDate.getTime();
            const seconds = Math.floor(diff / 1000);

            setIsStale(diff > 60000); // Stale after 1 minute

            if (seconds < 10) setTimeSince('just now');
            else if (seconds < 60) setTimeSince(`${seconds}s ago`);
            else if (seconds < 3600) setTimeSince(`${Math.floor(seconds / 60)}m ago`);
            else setTimeSince(`${Math.floor(seconds / 3600)}h ago`);
        };

        updateTime();
        const interval = setInterval(updateTime, 5000); // Updates every 5 sec
        return () => clearInterval(interval);
    }, [lastUpdate]); // Dependency on the raw prop is fine as long as we parse inside

    // Color Logic
    let cardClass = "border-border";
    let textClass = "text-foreground";
    let statusIcon = null;

    if (status === 'critical') {
        cardClass = "border-destructive bg-destructive/10 animate-in fade-in";
        textClass = "text-destructive";
        statusIcon = <AlertCircle className="h-4 w-4 text-destructive animate-pulse" />;
    } else if (status === 'warning') {
        cardClass = "border-amber-500 bg-amber-500/10";
        textClass = "text-amber-500";
    }

    // Trend Logic
    const renderTrend = () => {
        if (!showTrend) return null;

        // Show Flat (-) if null or explicit flat
        if (trend === 'up') return <TrendingUp className="h-4 w-4 text-emerald-500 animate-pulse" />;
        if (trend === 'down') return <TrendingDown className="h-4 w-4 text-rose-500 animate-pulse" />;

        // Default / Flat state
        return <Minus className="h-4 w-4 text-muted-foreground/30" />;
    };

    const StatusCard = (
        <Card className={`transition-all duration-300 hover:shadow-md cursor-help ${cardClass}`}>
            <CardContent className="p-3 pb-4">
                <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2">
                        {icon || <Activity className="h-3 w-3 text-muted-foreground" />}
                        <span className="text-xs font-medium text-muted-foreground truncate max-w-[150px]" title={name}>
                            {alias || name}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {statusIcon}
                    </div>
                </div>

                <div className="flex items-center justify-center gap-2">
                    {/* Render Trend Left of Value */}
                    <div className="flex items-center">
                        {renderTrend()}
                    </div>

                    {/* Value */}
                    <div className="flex items-baseline gap-1">
                        <span className={`text-xl font-bold tracking-tight ${textClass}`}>
                            {typeof value === 'number' ? value.toFixed(2) : value}
                        </span>
                        {unit && (
                            <span className="text-xs text-muted-foreground font-medium opacity-80">{unit}</span>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-center gap-2 mt-1">
                    <span className={`text-[10px] uppercase font-bold tracking-wider ${isStale ? 'text-amber-500' : 'text-muted-foreground/60'}`}>
                        {isStale ? '⚠️ No recent data' : timeSince}
                    </span>
                </div>
            </CardContent>
        </Card>
    );

    // If no config, don't wrap in tooltip
    if (!config || (config.min === undefined && config.max === undefined)) {
        return StatusCard;
    }

    return (
        <TooltipProvider delayDuration={300}>
            <Tooltip>
                <TooltipTrigger asChild>
                    {StatusCard}
                </TooltipTrigger>
                <TooltipContent className="p-3 max-w-[250px] border-l-4 border-l-primary bg-popover/95 backdrop-blur-sm">
                    <div className="space-y-2">
                        <div>
                            <p className="font-semibold text-sm">{alias || name}</p>
                            {alias && <p className="text-xs text-muted-foreground italic">{name}</p>}
                        </div>

                        <div className="space-y-1 text-xs">
                            <div className="flex justify-between items-center text-muted-foreground">
                                <span>Target Range:</span>
                                <span className="font-mono text-foreground font-medium">
                                    {config.min ?? '-'} - {config.max ?? '-'}
                                </span>
                            </div>
                            {config.tolerance && (
                                <div className="flex justify-between items-center text-muted-foreground">
                                    <span>Tolerance:</span>
                                    <span className="font-mono text-warning font-medium">± {config.tolerance}</span>
                                </div>
                            )}
                        </div>

                        {/* Status Explanation */}
                        {status !== 'normal' && (
                            <div className={`mt-2 pt-2 border-t border-border flex items-center gap-2 text-xs font-bold ${status === 'critical' ? 'text-destructive' : 'text-amber-500'}`}>
                                {status === 'critical' ? <AlertCircle className="h-3 w-3" /> : <Activity className="h-3 w-3" />}
                                <span>
                                    {status === 'critical' ? 'Value Critical (Out of bounds)' : 'Warning (Tolerance Zone)'}
                                </span>
                            </div>
                        )}

                        {lastUpdateDate && !isNaN(lastUpdateDate.getTime()) && (
                            <div className="pt-1 text-[10px] text-muted-foreground text-right opacity-70">
                                Updated: {lastUpdateDate.toLocaleTimeString()}
                            </div>
                        )}
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};
