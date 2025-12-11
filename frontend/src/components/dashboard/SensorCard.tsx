import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Activity, AlertCircle } from 'lucide-react';

interface SensorCardProps {
    name: string;
    value: number | string;
    unit?: string;
    icon?: React.ReactNode;
    lastUpdate?: Date;
    status?: 'normal' | 'stale' | 'error';
}

export const SensorCard: React.FC<SensorCardProps> = ({
    name,
    value,
    unit,
    icon,
    lastUpdate,
    status = 'normal'
}) => {
    const getTimeSince = (date?: Date) => {
        if (!date) return 'No data';
        const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
        if (seconds < 60) return `${seconds}s ago`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        return `${Math.floor(seconds / 3600)}h ago`;
    };

    const isStale = lastUpdate && (Date.now() - new Date(lastUpdate).getTime()) > 5 * 60 * 1000;

    return (
        <Card className={`
            ${status === 'error' ? 'border-destructive bg-destructive/5' : ''}
            ${isStale ? 'opacity-60' : ''}
            transition-all hover:shadow-md
        `}>
            <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                        {icon || <Activity className="h-4 w-4 text-muted-foreground" />}
                        <span className="text-sm font-medium text-muted-foreground">{name}</span>
                    </div>
                    {status === 'error' && (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                    )}
                </div>

                <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold">
                        {typeof value === 'number' ? value.toFixed(2) : value}
                    </span>
                    {unit && (
                        <span className="text-sm text-muted-foreground">{unit}</span>
                    )}
                </div>

                <div className="text-xs text-muted-foreground mt-1">
                    {isStale ? '⚠️ No recent data' : getTimeSince(lastUpdate)}
                </div>
            </CardContent>
        </Card>
    );
};
