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
    Waves,
    RefreshCw,
    ChevronDown,
    ChevronRight,
    Cpu // Added CPU icon for Device
} from 'lucide-react';
import { CardHeader } from '../ui/card';
import { format } from 'date-fns';
import { Badge } from '../ui/badge';
import { Card, CardContent } from '../ui/card';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '../ui/collapsible';
import { cn } from '../../lib/utils';
import type { ExecutionStep, ExecutionTrace as ExecutionTraceType } from '../../services/analyticsService';
import { useState } from 'react';

interface ExecutionTraceProps {
    trace: ExecutionTraceType;
}

// Helper Component for Recursive Steps (Defined outside to avoid re-creation)
function StepItem({ step, depth = 0, getIcon, getStatusColor, getRoleColor, getSensorIcon, getRoleIcon, formatTime }: any) {
    const isLoop = step.type === 'LOOP_SUMMARY';
    const [isOpen, setIsOpen] = useState(false); // Collapsed by default

    // If it's a loop summary, render a special collapsible card
    if (isLoop) {
        return (
            <div className="relative group ml-0 mt-4 mb-4">
                {/* Loop Line Connection */}
                <div className="absolute -left-[21px] top-3 w-3 h-3 rounded-full border-2 border-background bg-indigo-500 z-10" />

                <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                    <Card className="border-indigo-200 bg-indigo-50/30">
                        <CollapsibleTrigger asChild>
                            <CardHeader className="py-2 px-3 bg-indigo-100/50 rounded-t-lg flex flex-row items-center justify-between space-y-0 cursor-pointer hover:bg-indigo-100/70 transition-colors">
                                <div className="flex items-center gap-2 font-semibold text-sm text-indigo-900">
                                    {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                    <RefreshCw className="h-3.5 w-3.5" />
                                    {step.label}
                                    <Badge variant="outline" className="bg-white text-xs h-5 ml-2 font-normal text-indigo-700">
                                        {step.loopStats?.iterations || 0} Iterations
                                    </Badge>
                                </div>

                                {/* Loop Stats Summary in Header (Visible always) */}
                                <div className="flex gap-2">
                                    {step.loopStats && step.loopStats.resources && Object.values(step.loopStats.resources).map((res: any) => (
                                        <Badge key={res.role} variant="secondary" className="bg-white border-indigo-100 text-indigo-800 text-xs font-normal">
                                            {getRoleIcon(res.role)}
                                            <span className="ml-1 font-mono">
                                                {res.type === 'DELTA' ? (res.value > 0 ? '+' : '') : ''}
                                                {res.value.toFixed(1)} {res.unit}
                                            </span>
                                        </Badge>
                                    ))}
                                    <span className="text-xs font-mono text-muted-foreground ml-2">
                                        {formatTime(step.timestamp)}
                                    </span>
                                </div>
                            </CardHeader>
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                            <CardContent className="p-3 pt-2">
                                {/* Nested Steps */}
                                <div className="mt-1 pl-4 border-l-2 border-indigo-200 space-y-3">
                                    {step.children?.map((child: any) => (
                                        <StepItem
                                            key={child.id}
                                            step={child}
                                            depth={depth + 1}
                                            getIcon={getIcon}
                                            getStatusColor={getStatusColor}
                                            getRoleColor={getRoleColor}
                                            getSensorIcon={getSensorIcon}
                                            getRoleIcon={getRoleIcon}
                                            formatTime={formatTime}
                                        />
                                    ))}
                                </div>
                            </CardContent>
                        </CollapsibleContent>
                    </Card>
                </Collapsible>
            </div>
        );
    }

    // Normal Step (Action, Trigger, etc)
    const isActuator = step.type === 'ACTION';

    // Determine Actuator Values
    let displayValue = '';

    if (isActuator && step.metadata) {
        const primVal = step.metadata.primaryValue;
        const primUnit = step.metadata.unit || step.metadata.primaryUnit;
        const calcVol = step.metadata.calculatedVolumeMl;

        if (primUnit === 'doses' && calcVol !== undefined) {
            // Case: Doses + Calculated Volume -> "2 doses (100 ml)"
            displayValue = `${primVal} doses (${parseFloat(calcVol).toFixed(1)} ml)`;
        } else if (calcVol !== undefined && primUnit !== 'ml') {
            // Case: Other unit + Calculated Volume -> "X unit (Y ml)"
            displayValue = `${primVal} ${primUnit} (${parseFloat(calcVol).toFixed(1)} ml)`;
        } else if (calcVol !== undefined) {
            // Case: Volume only
            displayValue = `${parseFloat(calcVol).toFixed(1)} ml`;
        } else if (primVal !== undefined) {
            // Case: Primary value only
            displayValue = `${primVal} ${primUnit || ''}`;
        } else if (step.metadata.amount !== undefined) {
            // Legacy fallback
            displayValue = `${step.metadata.amount} ${step.metadata.unit || ''}`;
        }
    }

    const deviceName = step.metadata?.deviceName;
    const showDeviceName = deviceName && deviceName !== step.label;

    return (
        <div className="relative group">
            {/* Timeline Dot */}
            <div className={cn(
                "absolute -left-[29px] top-3 w-3 h-3 rounded-full border-2 border-background",
                step.status === 'FAILURE' ? "bg-red-500" :
                    step.status === 'SKIPPED' ? "bg-gray-300" : "bg-primary"
            )} />

            {/* Step Card */}
            <Card className={cn(
                "transition-all hover:shadow-sm",
                step.type === 'ACTION' ? getRoleColor(step.resourceRole) : getStatusColor(step.status)
            )}>
                <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                        <div className="mt-1 bg-muted/50 p-1.5 rounded-md">
                            {getIcon(step)}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <div className="flex flex-col">
                                    <span className="font-semibold text-sm truncate pr-2 flex items-center gap-2">
                                        {step.label}
                                        {step.description && step.description.includes('•') && (
                                            <Badge variant="outline" className="text-[10px] h-5 bg-muted/50 text-muted-foreground border-border font-normal">
                                                <Settings className="h-3 w-3 mr-1 opacity-70" />
                                                {step.description.split('•')[1].trim()}
                                            </Badge>
                                        )}
                                    </span>

                                    {/* Device Name Display */}
                                    {showDeviceName && (
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                                            <Cpu className="h-3 w-3 opacity-70" />
                                            <span>{deviceName}</span>
                                        </div>
                                    )}
                                </div>

                                <span className="text-xs font-mono text-muted-foreground shrink-0">
                                    {formatTime(step.timestamp)}
                                </span>
                            </div>

                            <div className="text-xs text-muted-foreground mt-1 flex items-center flex-wrap gap-2">
                                {/* Resource Role Badge */}
                                {step.resourceRole && (
                                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-medium border-0 bg-secondary/80">
                                        {getRoleIcon(step.resourceRole)}
                                        <span className="ml-1 capitalize">{step.resourceRole.replace('_', ' ')}</span>
                                    </Badge>
                                )}

                                {/* Actuator Details (Enhanced) */}
                                {isActuator && displayValue && (
                                    <span className="font-mono font-medium text-foreground bg-muted/30 px-1.5 py-0.5 rounded border border-border/50">
                                        {displayValue}
                                    </span>
                                )}

                                <span>
                                    {step.description && !step.description.includes('•') && step.description}
                                    {step.description && step.description.includes('•') && step.description.split('•')[0].trim()}
                                </span>
                            </div>

                            {step.type === 'ENVIRONMENT_SCAN' && step.readings && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {step.readings.map((reading: any, idx: number) => (
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
    );
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
            case 'LOOP_SUMMARY': return <RefreshCw className="h-4 w-4 text-indigo-500" />;
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

    const getRoleColor = (role?: string) => {
        if (!role) return 'border-l-yellow-500';
        if (role.includes('ph')) return 'border-l-purple-500';
        if (role.includes('nutrient')) return 'border-l-blue-500';
        if (role.includes('water')) return 'border-l-cyan-500';
        return 'border-l-yellow-500';
    };

    const getSensorIcon = (unit: string) => {
        if (unit.includes('°')) return <Thermometer className="h-3 w-3" />;
        if (unit === '%') return <Droplet className="h-3 w-3" />;
        if (unit === 'lux') return <Sun className="h-3 w-3" />;
        return <Activity className="h-3 w-3" />;
    };

    const getRoleIcon = (role: string) => {
        if (!role) return <Zap className="h-3 w-3" />;
        if (role.includes('ph')) return <Activity className="h-3 w-3" />;
        if (role.includes('nutrient')) return <Droplet className="h-3 w-3" />;
        if (role.includes('water')) return <Waves className="h-3 w-3" />;
        return <Zap className="h-3 w-3" />;
    };

    return (
        <div className="space-y-4">
            {/* Sessions */}
            {trace.sessions.map((session) => (
                <div key={session.id} className="relative pl-6 pb-2">
                    {/* Session Line */}
                    <div className="absolute top-0 bottom-0 left-[9px] w-0.5 bg-muted"></div>

                    {/* Session Anchor */}
                    <div className="absolute top-0 left-0 w-[20px] h-[20px] bg-background border-2 border-primary rounded-full flex items-center justify-center z-10">
                        {session.type === 'TRIGGER_MATCH' ? <Play className="h-2.5 w-2.5 text-primary" /> :
                            session.type === 'FALLBACK' ? <Activity className="h-2.5 w-2.5 text-orange-500" /> :
                                <Clock className="h-2.5 w-2.5 text-gray-400" />}
                    </div>

                    <div className="mb-4">
                        <div className="font-medium text-sm flex items-center gap-2 mb-2">
                            <span className={cn(
                                "text-xs px-2 py-0.5 rounded uppercase font-bold tracking-wider",
                                session.type === 'TRIGGER_MATCH' ? 'bg-green-100 text-green-700' :
                                    session.type === 'FALLBACK' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'
                            )}>
                                {session.type.replace('_', ' ')}
                            </span>
                            <span className="text-muted-foreground">- {session.description}</span>
                        </div>

                        {/* Session Steps (Recursive) */}
                        <div className="space-y-3 relative pl-2 border-l-2 border-transparent">
                            {/* Dashed line for step timeline inside session */}
                            <div className="absolute top-2 bottom-0 left-[7px] w-px border-l-2 border-dashed border-muted/50"></div>

                            {session.steps.map((step) => (
                                <StepItem
                                    key={step.id}
                                    step={step}
                                    depth={0}
                                    getIcon={getStepIcon}
                                    getStatusColor={getStatusColor}
                                    getRoleColor={getRoleColor}
                                    getSensorIcon={getSensorIcon}
                                    getRoleIcon={getRoleIcon}
                                    formatTime={formatTime}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}


