import { IDevice } from '../../../models/Device';
import { IConversionStrategy } from './IConversionStrategy';

export class VolumetricFlowStrategy implements IConversionStrategy {
    convert(rawValue: number, device: IDevice, strategyOverride?: string): { value: number; unit: string } {
        // Usually not needed for pumps (we don't read flow from them directly unless they have a flow meter)
        // But if we did, rawValue (ms) * flowRate (ml/ms) = Volume (ml)
        // But if we did, rawValue (ms) * flowRate (ml/ms) = Volume (ml)
        const calibration = device.config.calibrations?.['volumetric_flow']?.data || (device.config as any).calibration || {};
        const flowRatePerSec = calibration.flowRate ?? 0;
        const unit = calibration.unit || 'L'; // Default to Liters if not specified

        // rawValue is duration in ms
        // flowRate is usually in units/sec (e.g. ml/sec)
        // Volume = (Duration / 1000) * FlowRate
        const result = (rawValue / 1000) * flowRatePerSec;

        return { value: result, unit: unit };
    }

    reverseConvert(targetValue: number, device: IDevice, strategyOverride?: string): number {
        // Target: Volume (ml) -> Output: Duration (ms)
        const calibration = device.config.calibrations?.['volumetric_flow']?.data || (device.config as any).calibration || {};
        const flowRatePerSec = calibration.flowRate ?? 0;

        if (flowRatePerSec === 0) return 0;

        // Duration (ms) = (Volume / FlowRate) * 1000
        return (targetValue / flowRatePerSec) * 1000;
    }
}
