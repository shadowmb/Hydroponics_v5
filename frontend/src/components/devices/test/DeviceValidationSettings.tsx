import { useState, useEffect } from 'react';
import { Square, Play, AlertTriangle, Save, ChevronDown, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface DeviceValidationSettingsProps {
    device: any;
    onSave: (config: any) => Promise<void>;
    hardwareLimits?: { min?: number, max?: number, unit?: string };
    samplingDefaults?: { count: number, delayMs: number };
}

export function DeviceValidationSettings({ device, onSave, hardwareLimits, samplingDefaults }: DeviceValidationSettingsProps) {
    // Local state for validation config
    // Initialize with existing config or defaults
    const [config, setConfig] = useState<any>({
        range: {
            min: device.config?.validation?.range?.min ?? '',
            max: device.config?.validation?.range?.max ?? ''
        },
        retryCount: device.config?.validation?.retryCount ?? 3,
        retryDelayMs: device.config?.validation?.retryDelayMs ?? 100,
        fallbackAction: device.config?.validation?.fallbackAction ?? 'error',
        staleLimit: device.config?.validation?.staleLimit ?? 1,
        staleTimeoutMs: device.config?.validation?.staleTimeoutMs ?? 30000,
        defaultValue: device.config?.validation?.defaultValue ?? ''
    });

    const [sampling, setSampling] = useState<any>({
        count: device.config?.sampling?.count ?? samplingDefaults?.count ?? '',
        delayMs: device.config?.sampling?.delayMs ?? samplingDefaults?.delayMs ?? ''
    });

    // Sync state with defaults when they load (async) if no user config exists
    useEffect(() => {
        if (!device.config?.sampling && samplingDefaults) {
            setSampling({
                count: samplingDefaults.count,
                delayMs: samplingDefaults.delayMs
            });
        }
    }, [samplingDefaults, device.config?.sampling]);

    const [openSections, setOpenSections] = useState({
        range: true,
        retry: false,
        fallback: false,
        noise: false
    });

    const [isSaving, setIsSaving] = useState(false);

    // Update handlers
    const updateRange = (field: 'min' | 'max', value: string) => {
        setConfig((prev: any) => ({
            ...prev,
            range: {
                ...prev.range,
                [field]: value === '' ? undefined : Number(value)
            }
        }));
    };

    const updateField = (field: string, value: any) => {
        setConfig((prev: any) => ({
            ...prev,
            [field]: value
        }));
    };

    const updateSampling = (field: string, value: any) => {
        setSampling((prev: any) => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        const cleanConfig = {
            ...config,
            range: {
                min: config.range.min === '' ? undefined : Number(config.range.min),
                max: config.range.max === '' ? undefined : Number(config.range.max)
            },
            defaultValue: config.defaultValue === '' ? undefined : Number(config.defaultValue)
        };

        const cleanSampling = {
            count: sampling.count === '' ? undefined : Number(sampling.count),
            delayMs: sampling.delayMs === '' ? undefined : Number(sampling.delayMs)
        };

        await onSave({ ...cleanConfig, sampling: cleanSampling });
        setIsSaving(false);
    };

    const baseUnit = hardwareLimits?.unit || 'raw';
    const limitInfo = hardwareLimits?.min !== undefined && hardwareLimits?.max !== undefined
        ? ` ${hardwareLimits.min} - ${hardwareLimits.max} ${baseUnit}`
        : '';

    return (
        <div className="space-y-4 max-w-2xl mx-auto pb-10">
            {/* --- Noise Filtering --- */}
            <Collapsible open={openSections.noise} onOpenChange={(open: boolean) => setOpenSections(prev => ({ ...prev, noise: open }))}>
                <div className="border rounded-lg bg-card">
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-accent/50 transition-colors">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded bg-purple-500/10 flex items-center justify-center text-purple-500">
                                <Filter className="h-4 w-4" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-medium">Noise Filtering</h3>
                                <p className="text-sm text-muted-foreground">Burst read with median to eliminate spikes</p>
                            </div>
                        </div>
                        <ChevronDown className={`h-4 w-4 transition-transform ${openSections.noise ? 'rotate-180' : ''}`} />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-4 pb-4">
                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div className="space-y-2">
                                <label className="text-xs font-medium">Sample Count</label>
                                <input
                                    type="number"
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    placeholder={`${samplingDefaults?.count ?? 1} (Default)`}
                                    value={sampling.count}
                                    min={1} max={10}
                                    onChange={(e) => updateSampling('count', e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">Number of readings to take (1-10)</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium">Sample Delay (ms)</label>
                                <input
                                    type="number"
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    placeholder={`${samplingDefaults?.delayMs ?? 0} (Default)`}
                                    value={sampling.delayMs}
                                    min={0} max={500} step={10}
                                    onChange={(e) => updateSampling('delayMs', e.target.value)}
                                />
                                <p className="text-xs text-muted-foreground">Pause between samples (0-500ms)</p>
                            </div>
                        </div>
                    </CollapsibleContent>
                </div>
            </Collapsible>

            {/* --- Range Validation --- */}
            <Collapsible open={openSections.range} onOpenChange={(open: boolean) => setOpenSections(prev => ({ ...prev, range: open }))}>
                <div className="border rounded-lg bg-card">
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-accent/50 transition-colors">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded bg-blue-500/10 flex items-center justify-center text-blue-500">
                                <Square className="h-4 w-4" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-medium">Valid Range (Base Unit)</h3>
                                <p className="text-sm text-muted-foreground">
                                    Values are validated against the sensor's base output ({baseUnit}).
                                    {limitInfo && <span className="block text-xs opacity-80">Hardware Range:{limitInfo}</span>}
                                </p>
                            </div>
                        </div>
                        <ChevronDown className={`h-4 w-4 transition-transform ${openSections.range ? 'rotate-180' : ''}`} />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-4 pb-4">
                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div className="space-y-2">
                                <label className="text-xs font-medium">Min Value ({baseUnit})</label>
                                <input
                                    type="number"
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    placeholder={hardwareLimits?.min?.toString() || "No Limit"}
                                    value={config.range.min}
                                    onChange={(e) => updateRange('min', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium">Max Value ({baseUnit})</label>
                                <input
                                    type="number"
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    placeholder={hardwareLimits?.max?.toString() || "No Limit"}
                                    value={config.range.max}
                                    onChange={(e) => updateRange('max', e.target.value)}
                                />
                            </div>
                        </div>
                    </CollapsibleContent>
                </div>
            </Collapsible>

            {/* --- Retry Strategy --- */}
            <Collapsible open={openSections.retry} onOpenChange={(open: boolean) => setOpenSections(prev => ({ ...prev, retry: open }))}>
                <div className="border rounded-lg bg-card">
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-accent/50 transition-colors">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded bg-orange-500/10 flex items-center justify-center text-orange-500">
                                <Play className="h-4 w-4" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-medium">Retry Strategy</h3>
                                <p className="text-sm text-muted-foreground">Behavior when reading fails or is invalid</p>
                            </div>
                        </div>
                        <ChevronDown className={`h-4 w-4 transition-transform ${openSections.retry ? 'rotate-180' : ''}`} />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-4 pb-4">
                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div className="space-y-2">
                                <label className="text-xs font-medium">Retry Count</label>
                                <input
                                    type="number"
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    value={config.retryCount}
                                    min={0} max={10}
                                    onChange={(e) => updateField('retryCount', Number(e.target.value))}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium">Retry Delay (ms)</label>
                                <input
                                    type="number"
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                    value={config.retryDelayMs}
                                    step={50} min={0}
                                    onChange={(e) => updateField('retryDelayMs', Number(e.target.value))}
                                />
                            </div>
                        </div>
                    </CollapsibleContent>
                </div>
            </Collapsible>

            {/* --- Fallback Action --- */}
            <Collapsible open={openSections.fallback} onOpenChange={(open: boolean) => setOpenSections(prev => ({ ...prev, fallback: open }))}>
                <div className="border rounded-lg bg-card">
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-accent/50 transition-colors">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded bg-red-500/10 flex items-center justify-center text-red-500">
                                <AlertTriangle className="h-4 w-4" />
                            </div>
                            <div className="text-left">
                                <h3 className="font-medium">On Failure (Fallback)</h3>
                                <p className="text-sm text-muted-foreground">What to do after all retries fail</p>
                            </div>
                        </div>
                        <ChevronDown className={`h-4 w-4 transition-transform ${openSections.fallback ? 'rotate-180' : ''}`} />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="px-4 pb-4">
                        <div className="space-y-4 pt-2">
                            <Select
                                value={config.fallbackAction}
                                onValueChange={(val: string) => updateField('fallbackAction', val)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="error">check Report Error (Safest)</SelectItem>
                                    <SelectItem value="useLastValid">⚠️ Use Last Valid Value</SelectItem>
                                    <SelectItem value="useDefault">⚠️ Use Default Value</SelectItem>
                                    <SelectItem value="skip">⚠️ Skip (Loop Only)</SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Conditional Fields based on Fallback */}
                            {['useLastValid', 'useDefault', 'skip'].includes(config.fallbackAction) && (
                                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md space-y-3">
                                    <p className="text-xs text-yellow-500 font-medium flex items-center gap-2">
                                        <AlertTriangle className="h-3 w-3" />
                                        Warning: This strategy can mask invalid sensor data.
                                    </p>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium">Stale Limit (Consecutive)</label>
                                            <input type="number" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                                value={config.staleLimit}
                                                min={1}
                                                onChange={(e) => updateField('staleLimit', Number(e.target.value))}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium">Stale Timeout (ms)</label>
                                            <input type="number" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                                value={config.staleTimeoutMs}
                                                step={1000}
                                                onChange={(e) => updateField('staleTimeoutMs', Number(e.target.value))}
                                            />
                                        </div>
                                    </div>

                                    {config.fallbackAction === 'useDefault' && (
                                        <div className="space-y-2">
                                            <label className="text-xs font-medium">Default Value</label>
                                            <input type="number" className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                                value={config.defaultValue}
                                                onChange={(e) => updateField('defaultValue', e.target.value)}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </CollapsibleContent>
                </div>
            </Collapsible>

            {/* --- Save Button --- */}
            <div className="flex justify-end pt-4 border-t">
                <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto">
                    {isSaving ? (
                        <>Saving...</>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" /> Save Settings
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
