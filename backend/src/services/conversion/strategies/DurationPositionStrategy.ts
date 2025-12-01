import { IConversionStrategy } from './IConversionStrategy';

export class DurationPositionStrategy implements IConversionStrategy {
    id = 'duration_position';

    /**
     * Converts a target position (0-100%) to a duration in milliseconds.
     * 
     * @param value Target position (0-100)
     * @param calibration Calibration data containing durationOpen and durationClose
     * @returns Duration in milliseconds required to reach the target from 0 (if opening) or from 100 (if closing).
     *          NOTE: The actual delta calculation depends on the current state, which this stateless strategy doesn't know.
     *          This strategy returns the *proportional duration* for the given percentage based on the OPEN duration.
     *          The Controller is responsible for calculating the delta.
     */
    convert(value: number, calibration: any): number {
        if (!calibration) return value;

        // Default to durationOpen if specific direction isn't known or for simple scaling
        const durationOpen = Number(calibration.durationOpen) || Number(calibration.totalDuration) || 0;

        // We return the time required to reach this position from 0
        return (value / 100) * durationOpen;
    }

    /**
     * Validates the calibration data.
     */
    validateCalibration(data: any): boolean {
        // Support both new (split) and old (single) formats during transition
        if (data.totalDuration) return typeof data.totalDuration === 'number';

        return (
            typeof data.durationOpen === 'number' &&
            typeof data.durationClose === 'number'
        );
    }
}
