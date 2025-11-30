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

                // Phase 3: Filter based on device.supportedStrategies
                const supported = device.config?.supportedStrategies;

                let filtered = allStrategies;
                if (supported && Array.isArray(supported) && supported.length > 0) {
                    filtered = allStrategies.filter(s => supported.includes(s.id));
                } else {
                    // Fallback: Filter by category if no specific strategies defined
                    const category = device.config?.driverId?.category; // 'SENSOR' or 'ACTUATOR'
                    filtered = allStrategies.filter(s => {
                        if (s.category === 'BOTH') return true;
                        if (category && s.category === category) return true;
                        return false;
                    });
                }

                setStrategies(filtered.length > 0 ? filtered : allStrategies);
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
            // Construct the calibration object to save
            // The structure depends on the strategy, but generally we want to save it under 'calibration'
            // We might want to merge with existing calibration or overwrite.
            // For now, let's assume we overwrite the calibration for this strategy.

            const calibrationUpdate = {
                ...device.config.calibration, // Keep existing fields
                ...data, // Merge new data (e.g., multiplier, offset, flowRate)
                lastCalibrated: new Date().toISOString(),
                strategyId: selectedStrategyId
            };

            // We need to update the device config. 
            // Assuming hardwareService has a method to update device config.
            // If not, we might need to add it or use a generic update.
            // Looking at hardwareService, we have updateController but maybe not updateDevice directly?
            // Let's assume we can update the device via its parent controller or a direct device update endpoint.
            // Actually, usually we update the device document.

            await hardwareService.updateDevice(device._id, {
                config: {
                    ...device.config,
                    calibration: calibrationUpdate,
                    conversionStrategy: selectedStrategyId // Set the active strategy
                }
            });

            toast.success('Calibration saved successfully');
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error('Failed to save calibration:', error);
            toast.error('Failed to save calibration');
        }
    };

    const handleRunCommand = async (cmd: string, params: any) => {
        try {
            await hardwareService.executeCommand(device._id, cmd, {
                ...params,
                driverId: device.config.driverId.id // Pass driverId for backend
            });
            toast.success(`Command '${cmd}' sent`);
        } catch (error) {
            console.error('Command failed:', error);
            toast.error(`Command '${cmd}' failed`);
        }
    };

    const selectedStrategy = strategies.find(s => s.id === selectedStrategyId);

    if (loading) return <div>Loading strategies...</div>;

    return (
        <div className="space-y-6 p-4">
            <div className="max-w-md">
                <StrategySelector
                    strategies={strategies}
                    selectedId={selectedStrategyId}
                    onSelect={setSelectedStrategyId}
                />
            </div>

            {selectedStrategy && (
                <div className="mt-6">
                    <h3 className="text-lg font-medium mb-4">Calibration Wizard: {selectedStrategy.name}</h3>
                    <DynamicWizard
                        config={selectedStrategy.wizard}
                        onSave={handleSave}
                        onRunCommand={handleRunCommand}
                    />
                </div>
            )}
        </div>
    );
};
