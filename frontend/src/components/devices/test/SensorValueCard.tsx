import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils"; // Assuming cn utility is available

interface SensorValueCardProps {
    label?: string;
    value: string | number | null;
    unit?: string;
    icon?: React.ReactNode;
    lastUpdate?: Date;
    status?: 'normal' | 'warning' | 'error';
    variant?: 'default' | 'primary' | 'raw';

    // New Props for Dual Display
    baseValue?: string | number | null;
    baseUnit?: string;
    subValue?: string | number | null; // Keep for raw compatibility
}

export const SensorValueCard: React.FC<SensorValueCardProps> = ({
    label, value, unit, icon, lastUpdate, status = 'normal', variant = 'default',
    baseValue, baseUnit, subValue
}) => {
    const isConverted = baseValue !== undefined && baseValue !== null && baseUnit && baseUnit !== unit;
    const isRawVariant = variant === 'raw';

    return (
        <Card className={cn(
            "overflow-hidden",
            isRawVariant ? 'bg-muted/30 border-dashed' : 'bg-card'
        )}>
            <CardContent className="p-6 text-center space-y-1">
                {label && <div className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-4">{label}</div>}
                {icon && <div className="mb-2 flex justify-center text-primary/80">{icon}</div>}

                {/* Main Value */}
                <div className="flex items-baseline justify-center gap-1">
                    <span className={cn("text-4xl font-bold tracking-tight",
                        variant === 'primary' ? "text-primary" : "text-foreground",
                        status === 'error' && "text-destructive"
                    )}>
                        {value ?? '--'}
                    </span>
                    {unit && <span className="text-sm text-muted-foreground font-medium">{unit}</span>}
                </div>

                {/* Secondary (Base) Value - Show only if different from main */}
                {isConverted && (
                    <div className="text-xs text-muted-foreground/60 flex items-center justify-center gap-1 mt-1">
                        <span>Raw:</span>
                        <span>{baseValue}</span>
                        <span>{baseUnit}</span>
                    </div>
                )}

                {/* Fallback for old subValue (Raw Input) usage */}
                {!isConverted && subValue !== undefined && subValue !== null && (
                    <div className="text-xs text-muted-foreground/50 mt-1">
                        Raw: {subValue}
                    </div>
                )}

            </CardContent>
        </Card>
    );
};
