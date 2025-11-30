import { IDevice } from '../../../models/Device';
import { IConversionStrategy } from './IConversionStrategy';

export class VolumetricFlowStrategy implements IConversionStrategy {
    convert(rawValue: number, device: IDevice): number {
        // Usually not needed for pumps (we don't read flow from them directly unless they have a flow meter)
        // But if we did, rawValue (ms) * flowRate (ml/ms) = Volume (ml)
        const calibration = device.config.calibration || {};
        const flowRatePerSec = calibration.flowRate ?? 0;

        // rawValue is duration in ms
        // flowRate is usually in units/sec (e.g. ml/sec)
        // Volume = (Duration / 1000) * FlowRate
        return (rawValue / 1000) * flowRatePerSec;
    }

    reverseConvert(targetValue: number, device: IDevice): number {
        // Target: Volume (ml) -> Output: Duration (ms)
        const calibration = device.config.calibration || {};
        const flowRatePerSec = calibration.flowRate ?? 0;

        if (flowRatePerSec === 0) return 0;

        // Duration (ms) = (Volume / FlowRate) * 1000
        return (targetValue / flowRatePerSec) * 1000;
    }
}
