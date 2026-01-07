import {
    Activity,
    ArrowRight,
    Clock,
    Droplet,
    Info,
    Play,
    Settings,
    XCircle,
    Zap,
    GitBranch,
    Thermometer,
    Sun,
    Waves
} from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { cn } from '../../lib/utils';
import type { ExecutionStep, ExecutionTrace as ExecutionTraceType } from '../../services/analyticsService';

interface ExecutionTraceProps {
    trace: ExecutionTraceType;
}

export function ExecutionTrace({ trace }: ExecutionTraceProps) {
    const formatTime = (isoString: string) => {
        return format(new Date(isoString), 'HH:mm:ss.SSS');
    };

    const getStepIcon = (step: ExecutionStep) => {
        switch (step.type) {
            case 'TRIGGER': return <Play className="h-4 w-4 text-green-500" />;
            case 'ACTION': return <Zap className="h-4 w-4 text-yellow-500" />;
            case 'ENVIRONMENT_SCAN': return <Activity className="h-4 w-4 text-blue-500" />;
            case 'LOGIC': return <GitBranch className="h-4 w-4 text-purple-500" />;
            case 'FLOW_START': return <ArrowRight className="h-4 w-4 text-gray-400" />;
            case 'ERROR': return <XCircle className="h-4 w-4 text-red-500" />;
            default: return <Info className="h-4 w-4 text-gray-400" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'SUCCESS': return 'border-l-4 border-l-green-500';
            case 'FAILURE': return 'border-l-4 border-l-red-500';
            case 'SKIPPED': return 'border-l-4 border-l-gray-300 opacity-70';
            case 'INFO': return 'border-l-4 border-l-blue-500';
            default: return 'border-l-4 border-l-gray-300';
        }
    };

    // Helper to get unit-specific icons for sensor readings
    const getSensorIcon = (unit: string) => {
        if (unit.includes('°')) return <Thermometer className="h-3 w-3" />;
        if (unit === '%') return <Droplet className="h-3 w-3" />;
        if (unit === 'lux') return <Sun className="h-3 w-3" />;
        return <Activity className="h-3 w-3" />;
    };

    const getRoleIcon = (role: string) => {
        if (role.includes('ph')) return <Activity className="h-4 w-4 text-purple-500" />;
        if (role.includes('nutrient')) return <Droplet className="h-4 w-4 text-blue-500" />;
        if (role.includes('water')) return <Waves className="h-4 w-4 text-cyan-500" />;
        return <Zap className="h-4 w-4 text-yellow-500" />;
    };

    return (
        <div className="space-y-4">
            {/* Session Header */}
            <div className="bg-muted/30 p-4 rounded-lg flex flex-wrap gap-4 items-center justify-between text-sm">
                <div className="space-y-1">
                    <div className="font-semibold">{trace.windowName}</div>
                    <div className="text-muted-foreground flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        {trace.durationSeconds.toFixed(1)}s Duration
                    </div>
                </div>

                {trace.triggerInfo && (
                    <Badge variant="outline" className="bg-background">
                        {trace.triggerInfo.type}: {trace.triggerInfo.message}
                    </Badge>
                )}

                <div className="flex gap-4">
                    {/* Render per-role totals */}
                    {trace.totals.byRole && Object.entries(trace.totals.byRole).map(([role, total]) => (
                        <div key={role} className="flex items-center gap-1">
                            {getRoleIcon(role)}
                            <span className="font-medium">
                                <span className="capitalize text-muted-foreground mr-1">{role.replace('_', ' ')}:</span>
                                {total.toFixed(1)} ml
                            </span>
                        </div>
                    ))}

                    {/* Fallback for total if no roles (legacy) */}
                    {(!trace.totals.byRole || Object.keys(trace.totals.byRole).length === 0) && trace.totals.dosedMl > 0 && (
                        <div className="flex items-center gap-1">
                            <Droplet className="h-4 w-4 text-cyan-500" />
                            <span className="font-medium">{trace.totals.dosedMl.toFixed(1)} ml</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Trace Timeline */}
            <div className="relative pl-4 border-l-2 border-muted space-y-3">
                {trace.steps.map((step) => (
                    <div key={step.id} className="relative group">
                        {/* Timeline Dot */}
                        <div className={cn(
                            "absolute -left-[21px] top-3 w-3 h-3 rounded-full border-2 border-background",
                            step.status === 'FAILURE' ? "bg-red-500" :
                                step.status === 'SKIPPED' ? "bg-gray-300" : "bg-primary"
                        )} />

                        {/* Step Card */}
                        <Card className={cn(
                            "transition-all hover:shadow-sm",
                            getStatusColor(step.status)
                        )}>
                            <CardContent className="p-3">
                                <div className="flex items-start gap-3">
                                    <div className="mt-1 bg-muted/50 p-1.5 rounded-md">
                                        {getStepIcon(step)}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <span className="font-semibold text-sm truncate pr-2">
                                                {step.label}
                                            </span>
                                            <span className="text-xs font-mono text-muted-foreground shrink-0">
                                                {formatTime(step.timestamp)}
                                            </span>
                                        </div>

                                        {step.description && (
                                            <div className="text-xs text-muted-foreground mt-0.5 flex items-center flex-wrap gap-2">
                                                {/* Split description to separate details from device name if '•' exists */}
                                                {step.description.includes('•') ? (
                                                    <>
                                                        <span>{step.description.split('•')[0].trim()}</span>
                                                        <Badge variant="outline" className="text-[10px] h-5 bg-muted/50 text-muted-foreground border-border font-normal">
                                                            <Settings className="h-3 w-3 mr-1 opacity-70" />
                                                            {step.description.split('•')[1].trim()}
                                                        </Badge>
                                                    </>
                                                ) : (
                                                    step.description
                                                )}
                                            </div>
                                        )}

                                        {/* Render Sensor Readings for Environment Scan */}
                                        {step.type === 'ENVIRONMENT_SCAN' && step.readings && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {step.readings.map((reading, idx) => (
                                                    <Badge key={idx} variant="secondary" className="text-xs font-normal">
                                                        <span className="text-muted-foreground mr-1">
                                                            {getSensorIcon(reading.unit)}
                                                        </span>
                                                        <span className='font-semibold mr-1'>{reading.device}:</span>
                                                        {reading.value.toFixed(2)} <span className="text-muted-foreground ml-0.5">{reading.unit}</span>
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                ))}
            </div>
        </div>
    );
}
