import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

interface SensorValueCardProps {
    label: string;
    value: string | number | null;
    unit?: string;
    subValue?: string | number | null;
    variant?: 'primary' | 'secondary' | 'raw';
}

export const SensorValueCard: React.FC<SensorValueCardProps> = ({
    label,
    value,
    unit,
    subValue,
    variant = 'primary'
}) => {
    const isRaw = variant === 'raw';
    const isSecondary = variant === 'secondary';

    return (
        <Card className={`overflow-hidden ${isRaw ? 'bg-muted/30 border-dashed' : 'bg-card'}`}>
            <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full min-h-[140px]">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    {label}
                </span>

                <div className={`font-mono font-bold flex items-baseline gap-1 ${isRaw ? 'text-2xl text-muted-foreground' :
                        isSecondary ? 'text-3xl text-foreground' :
                            'text-4xl text-primary'
                    }`}>
                    {value !== null && value !== undefined ? value : '--'}
                    {unit && <span className="text-base font-normal text-muted-foreground ml-1">{unit}</span>}
                </div>

                {subValue !== undefined && subValue !== null && (
                    <div className="mt-2 text-xs text-muted-foreground font-mono bg-muted/50 px-2 py-1 rounded">
                        Raw: {subValue}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
