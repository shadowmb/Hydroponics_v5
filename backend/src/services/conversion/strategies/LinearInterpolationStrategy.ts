import { IDevice } from '../../../models/Device';
import { IConversionStrategy } from './IConversionStrategy';

export class LinearInterpolationStrategy implements IConversionStrategy {
    convert(raw: number, device: IDevice): number {
        const calibration = device.config.calibration;

        // 1. Basic Multiplier/Offset (Legacy/Simple support)
        // If no points are defined, fallback to simple linear: y = mx + c
        if (!calibration?.points || calibration.points.length === 0) {
            const m = calibration?.multiplier ?? 1;
            const c = calibration?.offset ?? 0;
            return (raw * m) + c;
        }

        // 2. Multi-Point Interpolation
        const points = calibration.points.sort((a, b) => a.raw - b.raw);

        // Case A: Raw is below the first point -> Extrapolate or Clamp? 
        // For now, we extrapolate using the first two points (or just the first slope).
        // Case A: Raw is below the first point
        if (raw <= points[0].raw) {
            // If only 1 point, assume origin (0,0) and interpolate
            if (points.length === 1) {
                return this.interpolate(raw, { raw: 0, value: 0 }, points[0]);
            }
            return this.interpolate(raw, points[0], points[1]);
        }

        // Case B: Raw is above the last point
        if (raw >= points[points.length - 1].raw) {
            // If only 1 point, assume origin (0,0) and extrapolate
            if (points.length === 1) {
                return this.interpolate(raw, { raw: 0, value: 0 }, points[0]);
            }
            return this.interpolate(raw, points[points.length - 2], points[points.length - 1]);
        }

        // Case C: Raw is between two points
        for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i];
            const p2 = points[i + 1];
            if (raw >= p1.raw && raw <= p2.raw) {
                return this.interpolate(raw, p1, p2);
            }
        }

        return raw; // Should not reach here
    }

    private interpolate(x: number, p1: { raw: number, value: number }, p2: { raw: number, value: number }): number {
        if (p2.raw === p1.raw) return p1.value; // Avoid division by zero
        const slope = (p2.value - p1.value) / (p2.raw - p1.raw);
        return p1.value + slope * (x - p1.raw);
    }
}
