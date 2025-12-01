import React, { useEffect, useState } from 'react';
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

                const supported = template?.supportedStrategies || device.config?.supportedStrategies;

                let filtered = allStrategies;
                if (supported && Array.isArray(supported) && supported.length > 0) {
                    filtered = allStrategies.filter(s => supported.includes(s.id));
                } else {
                    // Fallback: Filter by category if no specific strategies defined
                    const category = template?.category || device.config?.driverId?.category; // 'SENSOR' or 'ACTUATOR'
                    filtered = allStrategies.filter(s => {
                        if (s.category === 'BOTH') return true;
                        if (category && s.category === category) return true;
                        return false;
                    });
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
            const result = await hardwareService.executeCommand(device._id, cmd, {
                ...params,
                driverId: device.config.driverId._id || device.config.driverId // Fix: use _id or fallback if it's already a string
            });
            toast.success(`Command '${cmd}' sent`);
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
            <div className="max-w-md">
                <StrategySelector
                    strategies={strategies}
                    selectedId={selectedStrategyId}
                    onSelect={setSelectedStrategyId}
                    existingCalibrations={existingCalibrationsList}
                />
            </div>


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
                                {existingCalibration.data && Object.entries(existingCalibration.data).map(([key, value]) => (
                                    <p key={key}><span className="text-muted-foreground">{key}:</span> {String(value)}</p>
                                ))}
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
                            config={selectedStrategy.wizard}
                            onSave={handleSave}
                            onRunCommand={handleRunCommand}
                        />
                    )}
                </div>
            )}
        </div>
    );
};
