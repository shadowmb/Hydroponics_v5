import React, { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { StrategySelector } from './StrategySelector';
import { DynamicWizard } from './DynamicWizard';
import { calibrationService } from '../../../../services/calibrationService';
import type { CalibrationStrategy } from '../../../../types/Calibration';
import { hardwareService } from '../../../../services/hardwareService';
import { toast } from 'sonner';

interface ActuatorCalibrationProps {
    device: any;
    onUpdate?: () => void;
}

export const ActuatorCalibration: React.FC<ActuatorCalibrationProps> = ({ device, onUpdate }) => {
    const [strategies, setStrategies] = useState<CalibrationStrategy[]>([]);
    const [selectedStrategyId, setSelectedStrategyId] = useState<string | undefined>(undefined);
    const [loading, setLoading] = useState(true);
    const [detectedBaseUnit, setDetectedBaseUnit] = useState<string | undefined>(undefined);



    useEffect(() => {
        const loadStrategies = async () => {
            try {
                const allStrategies = await calibrationService.getStrategies();

                // Phase 3: Filter based on supportedStrategies
                // CRITICAL: Prefer the FRESH template's supportedStrategies over the stale device.config copy.
                // This ensures that file updates (like removing a strategy) are reflected immediately.

                // Always fetch fresh templates first
                let template = device.config?.driverId;
                try {
                    const templates = await hardwareService.getDeviceTemplates();
                    const driverId = typeof device.config?.driverId === 'string'
                        ? device.config.driverId
                        : device.config?.driverId?._id || device.config?.driverId?.id;

                    const freshTemplate = templates.find((t: any) => t._id === driverId || t.id === driverId);
                    if (freshTemplate) {
                        template = freshTemplate;
                    }
                } catch (e) {
                    console.error("Could not fetch templates for capability check", e);
                }

                // NEW: Role-Based Filtering
                // If a role is active, we MUST restrict calibration options to that role's strategies.
                const activeRoleKey = device.config?.activeRole;
                const templateRoles = template?.roles;

                let filtered = allStrategies;

                if (activeRoleKey && templateRoles && templateRoles[activeRoleKey]) {
                    // 1. Strict Role Mode
                    const allowedStrategies = templateRoles[activeRoleKey].strategies || [];
                    filtered = allStrategies.filter(s => allowedStrategies.includes(s.id));
                } else {
                    // 2. Legacy/Fallback Mode
                    const supported = template?.supportedStrategies || device.config?.supportedStrategies;
                    if (supported && Array.isArray(supported) && supported.length > 0) {
                        filtered = allStrategies.filter(s => supported.includes(s.id));
                    } else if (templateRoles) {
                        // If roles exist but none active, allow ALL (Union)
                        const allRoleStrategies = new Set(Object.values(templateRoles).flatMap((r: any) => r.strategies));
                        filtered = allStrategies.filter(s => allRoleStrategies.has(s.id));
                    } else {
                        // 3. Category Fallback
                        const category = template?.category || device.config?.driverId?.category;
                        filtered = allStrategies.filter(s => {
                            if (s.category === 'BOTH') return true;
                            if (category && s.category === category) return true;
                            return false;
                        });
                    }
                }

                const templateCapabilities = template?.capabilities || [];
                const variantCapabilities = device.config?.variantId && template?.variants ?
                    (template.variants.find((v: any) => v.id === device.config.variantId)?.capabilities || [])
                    : [];

                // Merge unique capabilities
                // Merge unique capabilities
                const deviceCapabilities = Array.from(new Set([...templateCapabilities, ...variantCapabilities]));

                // 2. Filter strategies
                const capabilityFiltered = filtered.filter(s => {
                    // If strategy has no specific capability requirements, it passes
                    if (!s.capabilities || s.capabilities.length === 0) return true;

                    // Check if device has ALL required capabilities
                    return s.capabilities.every(cap => deviceCapabilities.includes(cap));
                });

                setStrategies(capabilityFiltered.length > 0 ? capabilityFiltered : []);
            } catch (error) {
                console.error('Failed to load strategies:', error);
                toast.error('Failed to load calibration strategies');
            } finally {
                setLoading(false);
            }
        };
        loadStrategies();
    }, [device]);

    // Detect Base Unit from Template measurements block (NEW: Data-driven)
    // Fallback to heuristic if measurements block not available
    useEffect(() => {
        if (!detectedBaseUnit && device.config?.activeRole) {
            const role = device.config.activeRole;

            // NEW: Try to get from fresh template measurements
            const tryGetFromTemplate = async () => {
                try {
                    const templates = await hardwareService.getDeviceTemplates();
                    const driverId = typeof device.config?.driverId === 'string'
                        ? device.config.driverId
                        : device.config?.driverId?._id || device.config?.driverId?.id;

                    const template = templates.find((t: any) => t._id === driverId || t.id === driverId);

                    if (template?.measurements) {
                        // Check if role has a source (derived role like 'volume' -> 'distance')
                        const roleConfig = template.roles?.[role];
                        const measurementKey = roleConfig?.source || role;

                        const measurement = template.measurements[measurementKey];
                        if (measurement?.baseUnit) {
                            console.log('[ActuatorCalibration] Base unit from template.measurements:', measurement.baseUnit);
                            setDetectedBaseUnit(measurement.baseUnit);
                            return;
                        }
                    }
                } catch (e) {
                    console.warn('[ActuatorCalibration] Could not fetch template for measurements:', e);
                }

                // FALLBACK: Heuristic (for templates without measurements block)
                if (['distance', 'volume'].includes(role)) setDetectedBaseUnit('mm');
                else if (['temperature', 'water_temp', 'air_temp'].includes(role)) setDetectedBaseUnit('°C');
                else if (['humidity'].includes(role)) setDetectedBaseUnit('%');
                else if (['ph'].includes(role)) setDetectedBaseUnit('pH');
                else if (['ec', 'tds'].includes(role)) setDetectedBaseUnit('µS/cm');
            };

            tryGetFromTemplate();
        }
    }, [device, detectedBaseUnit]);

    const handleSave = async (data: any) => {
        try {
            let dataToSave = { ...data };

            // Special handling for Volumetric Flow to calculate flowRate
            if (selectedStrategyId === 'volumetric_flow') {
                const duration = Number(data.duration_seconds);
                const measured = Number(data.measuredValue);

                if (duration > 0 && !isNaN(measured)) {
                    dataToSave.flowRate = measured / duration;
                    dataToSave.unit = 'ml'; // Defaulting to ml for now
                }
            }

            // Use the dedicated calibration service to save
            await calibrationService.saveCalibration(device._id, selectedStrategyId!, dataToSave);

            // We also need to update the local device state if possible, or trigger a refresh
            // The parent component might handle onUpdate by refreshing the device
            if (onUpdate) onUpdate();

            toast.success('Calibration saved successfully');
        } catch (error) {
            console.error('Failed to save calibration:', error);
            toast.error('Failed to save calibration');
        }
    };

    const handleRunCommand = async (cmd: string, params: any) => {
        try {
            let result;

            // For READ command (sensor readings), use testDevice which returns normalized values.
            // FIX: Force 'linear' strategy to get the RAW PHYSICAL value (e.g. mm) instead of converted volume (L).
            if (cmd === 'READ') {
                result = await hardwareService.testDevice(device._id, 'linear');
                console.log('[ActuatorCalibration] testDevice (Linear/Raw) result:', result);

                // Capture Base Unit if available
                if (result.details && result.details.validPhysicalBaseUnit) {
                    setDetectedBaseUnit(result.details.validPhysicalBaseUnit);
                }

                toast.success('Sensor reading captured');
            } else {
                // For other commands (actuator actions), use executeCommand
                result = await hardwareService.executeCommand(device._id, cmd, {
                    ...params,
                    driverId: device.config.driverId._id || device.config.driverId
                });
                toast.success(`Command '${cmd}' sent`);
            }

            return result;
        } catch (error: any) {
            console.error('Command failed:', error);
            // Inspect the error structure deeply
            let errorMessage = 'Unknown error';

            if (error.response && error.response.data) {
                const data = error.response.data;
                // Check if 'error' property exists and is an object or string
                if (data.error) {
                    if (typeof data.error === 'string') errorMessage = data.error;
                    else if (data.error.message) errorMessage = data.error.message;
                } else if (data.message) {
                    errorMessage = data.message;
                } else if (typeof data === 'string') {
                    errorMessage = data;
                }
            } else if (error.message) {
                errorMessage = error.message;
            }

            toast.error(`Command '${cmd}' failed: ${errorMessage}`);
            throw error;
        }
    };

    const handleDelete = async () => {
        if (!selectedStrategyId) return;
        if (!confirm('Are you sure you want to delete this calibration?')) return;

        try {
            await calibrationService.deleteCalibration(device._id, selectedStrategyId);
            toast.success('Calibration deleted');
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error('Failed to delete calibration:', error);
            toast.error('Failed to delete calibration');
        }
    };

    // Check for template roles
    const template = typeof device.config?.driverId === 'object' ? device.config.driverId : null;
    const roles = template?.roles || {};
    const hasRoles = Object.keys(roles).length > 0;
    const activeRole = device.config?.activeRole;

    const handleRoleChange = async (roleKey: string) => {
        try {
            const selectedRole = roles[roleKey];
            const body: any = { "config.activeRole": roleKey };

            // Auto-Update Strategy if Role defines a default
            if (selectedRole?.defaultStrategy) {
                body["config.conversionStrategy"] = selectedRole.defaultStrategy;
                setSelectedStrategyId(selectedRole.defaultStrategy);
            }

            const res = await fetch(`/api/hardware/devices/${device._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!res.ok) throw new Error('Failed to update role');

            toast.success(`Role set to ${selectedRole?.label || roleKey}`);
            if (onUpdate) onUpdate();
        } catch (e) {
            console.error(e);
            toast.error('Failed to update role');
        }
    };

    // Auto-select role if only one exists
    useEffect(() => {
        if (hasRoles && !activeRole && Object.keys(roles).length === 1) {
            handleRoleChange(Object.keys(roles)[0]);
        }
    }, [hasRoles, activeRole, roles]);

    const selectedStrategy = strategies.find(s => s.id === selectedStrategyId);

    // Check if the selected strategy has existing calibration data
    const existingCalibration = selectedStrategyId && device.config?.calibrations?.[selectedStrategyId];
    const existingCalibrationsList = Object.keys(device.config?.calibrations || {});

    // State to toggle between "Info" and "Wizard" modes
    const [isRecalibrating, setIsRecalibrating] = useState(false);

    // Reset recalibrating state when strategy changes
    useEffect(() => {
        setIsRecalibrating(false);
    }, [selectedStrategyId]);

    if (loading) return <div>Loading strategies...</div>;



    return (
        <div className="space-y-6 p-4">
            {/* Header: Role Selection */}
            {hasRoles && (
                <div className="space-y-4 max-w-2xl border rounded-lg p-5 bg-card/50 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-md text-primary">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                        </div>
                        <div>
                            <h4 className="font-semibold">Device Function (Role)</h4>
                            <p className="text-xs text-muted-foreground">Define how this sensor is currently used to unlock specific strategies.</p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <Select
                            value={activeRole || ""}
                            onValueChange={handleRoleChange}
                        >
                            <SelectTrigger className="w-full h-11">
                                <SelectValue placeholder="--- Select Active Role ---" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(roles).map(([key, role]: any) => (
                                    <SelectItem key={key} value={key}>
                                        <div className="flex flex-col items-start py-0.5">
                                            <span className="font-medium text-sm">{role.label}</span>
                                            {role.description && <span className="text-[10px] opacity-70 leading-tight">{role.description}</span>}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            )}

            {!activeRole && hasRoles ? (
                <div className="flex flex-col items-center justify-center p-12 space-y-4 text-center border-2 border-dashed rounded-xl bg-muted/5">
                    <div className="p-4 bg-yellow-500/10 rounded-full text-yellow-500 animate-pulse">
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4" /><path d="M12 16h.01" /></svg>
                    </div>
                    <div className="space-y-2">
                        <h3 className="font-bold text-xl">Action Required: Define Role</h3>
                        <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                            To start calibration, you must first select the <strong>Device Function</strong> above.
                            This tells the system what physics to apply (e.g., pH, EC or Volume).
                        </p>
                    </div>
                </div>
            ) : (
                <div className="max-w-md">
                    <StrategySelector
                        strategies={strategies}
                        selectedId={selectedStrategyId}
                        onSelect={setSelectedStrategyId}
                        existingCalibrations={existingCalibrationsList}
                    />
                </div>
            )}


            {selectedStrategy && (
                <div className="mt-6">
                    <h3 className="text-lg font-medium mb-4">Calibration: {selectedStrategy.name}</h3>

                    {existingCalibration && !isRecalibrating ? (
                        <div className="bg-muted/30 p-4 rounded-lg border space-y-4">
                            <div className="flex items-center gap-2 text-green-600">
                                <span className="text-xl">✓</span>
                                <span className="font-medium">Calibrated</span>
                            </div>

                            <div className="text-sm space-y-1">
                                <p><span className="text-muted-foreground">Last Calibrated:</span> {new Date(existingCalibration.lastCalibrated).toLocaleString()}</p>
                                {existingCalibration.data && Object.entries(existingCalibration.data).map(([key, value]) => {
                                    // Detect if this is the calibration dataset (Array of objects)
                                    if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
                                        // Infer Units based on strategy or device config
                                        let inUnit = 'Raw';
                                        let outUnit = 'Target';

                                        if (selectedStrategy?.id === 'tank_volume') {
                                            inUnit = 'mm';
                                            outUnit = 'L'; // Assuming Liters for volume
                                        } else if (selectedStrategy?.id === 'linear') {
                                            inUnit = 'Raw';
                                            outUnit = device.displayUnit || 'Unit';
                                        }

                                        return (
                                            <div key={key} className="mt-4 border rounded-md overflow-hidden">
                                                <div className="bg-muted/50 px-3 py-2 border-b flex justify-between items-center">
                                                    <span className="font-medium text-sm">Calibration Table ({key})</span>
                                                    <span className="text-xs text-muted-foreground">{value.length} points</span>
                                                </div>
                                                <div className="max-h-60 overflow-y-auto">
                                                    <table className="w-full text-sm">
                                                        <thead className="bg-muted/20 text-xs text-muted-foreground uppercase sticky top-0 backdrop-blur-sm">
                                                            <tr>
                                                                <th className="px-3 py-2 text-left font-medium">Input ({inUnit})</th>
                                                                <th className="px-3 py-2 text-left font-medium">Arrow</th>
                                                                <th className="px-3 py-2 text-right font-medium">Output ({outUnit})</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y">
                                                            {value.map((pt: any, i: number) => {
                                                                // Infer keys
                                                                const inVal = pt.x ?? pt.input ?? pt.raw;
                                                                const outVal = pt.y ?? pt.output ?? pt.value;

                                                                return (
                                                                    <tr key={i} className="hover:bg-muted/30 transition-colors">
                                                                        <td className="px-3 py-2 font-mono text-muted-foreground">{inVal}</td>
                                                                        <td className="px-3 py-2 text-muted-foreground/30">→</td>
                                                                        <td className="px-3 py-2 text-right font-medium">{outVal}</td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        );
                                    }
                                    // Skip rendering empty arrays or non-object arrays differently if needed, 
                                    // or just fall through to default.

                                    return (
                                        <div key={key} className="flex justify-between py-1 border-b border-muted/20 last:border-0">
                                            <span className="text-muted-foreground capitalize">{key}:</span>
                                            <span className="font-medium">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setIsRecalibrating(true)}
                                    className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
                                >
                                    Recalibrate
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="px-3 py-1.5 bg-destructive text-destructive-foreground rounded-md text-sm hover:bg-destructive/90"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ) : (
                        <DynamicWizard
                            strategyId={selectedStrategy.id}
                            onSave={handleSave}
                            onRunCommand={handleRunCommand}
                            baseUnit={detectedBaseUnit}
                            targetUnit={selectedStrategy.id === 'linear' ? detectedBaseUnit : (device.displayUnit || selectedStrategy.outputUnit)}
                            device={device}
                            template={template}
                        />
                    )}
                </div>
            )}
        </div>
    );
};
