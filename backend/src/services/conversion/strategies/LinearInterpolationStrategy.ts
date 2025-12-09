import { IDevice } from '../../../models/Device';
import { IConversionStrategy } from './IConversionStrategy';

export class LinearInterpolationStrategy implements IConversionStrategy {
    convert(rawValue: number, device: IDevice, strategyOverride?: string): number {
        // PRIORITY:
        // 1. strategyOverride (if provided by Flow/Caller)
        // 2. device.config.conversionStrategy (Default for device)
        // 3. 'linear' (Fallback)
        const strategyName = strategyOverride || device.config.conversionStrategy || 'linear';

        // LOOKUP:
        // Try to find calibration data for the resolved strategy name.
        // Fallback to old 'calibration' field for legacy support.
        const calibration = device.config.calibrations?.[strategyName]?.data || (device.config as any).calibration;

        // 1. Basic Multiplier/Offset (Legacy/Simple support)
        // If neither 'points' nor 'data' (alias) are defined, fallback to simple linear: y = mx + c
        const pointsArray = calibration?.points || calibration?.data;

        if (!pointsArray || pointsArray.length === 0) {
            const m = calibration?.multiplier ?? 1;
            const c = calibration?.offset ?? 0;
            return (rawValue * m) + c;
        }

        // 2. Multi-Point Interpolation
        const points = [...pointsArray].sort((a: any, b: any) => a.raw - b.raw);

        // Case A: Raw is below the first point
        if (rawValue <= points[0].raw) {
            // If only 1 point, assume origin (0,0) and interpolate
            if (points.length === 1) {
                return this.interpolate(rawValue, { raw: 0, value: 0 }, points[0]);
            }
            return this.interpolate(rawValue, points[0], points[1]);
        }

        // Case B: Raw is above the last point
        if (rawValue >= points[points.length - 1].raw) {
            // If only 1 point, assume origin (0,0) and extrapolate
            if (points.length === 1) {
                return this.interpolate(rawValue, { raw: 0, value: 0 }, points[0]);
            }
            return this.interpolate(rawValue, points[points.length - 2], points[points.length - 1]);
        }

        // Case C: Raw is between two points
        for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i];
            const p2 = points[i + 1];
            if (rawValue >= p1.raw && rawValue <= p2.raw) {
                return this.interpolate(rawValue, p1, p2);
            }
        }

        return rawValue; // Should not reach here
    }

    reverseConvert(targetValue: number, device: IDevice): number {
        const strategyName = device.config.conversionStrategy || 'linear';
        const calibration = device.config.calibrations?.[strategyName]?.data || (device.config as any).calibration || {};
        const multiplier = calibration.multiplier ?? 1;
        const offset = calibration.offset ?? 0;

        // y = mx + c  =>  x = (y - c) / m
        if (multiplier === 0) return 0; // Avoid division by zero
        return (targetValue - offset) / multiplier;
    }

    private interpolate(x: number, p1: { raw: number, value: number }, p2: { raw: number, value: number }): number {
        if (p2.raw === p1.raw) return p1.value; // Avoid division by zero
        const slope = (p2.value - p1.value) / (p2.raw - p1.raw);
        return p1.value + slope * (x - p1.raw);
    }
}
