import { IDeviceTemplate } from '../models/DeviceTemplate';

interface CalibrationConfig {
    multiplier?: number;
    offset?: number;
    points?: { raw: number; value: number }[];
}

export class ConversionService {

    /**
     * Converts a raw value to a physical value based on the device template and calibration.
     */
    static convert(rawValue: number, template: IDeviceTemplate, calibration?: CalibrationConfig): number {
        let value = rawValue;

        // 1. Apply Template-specific base conversion (if any)
        // For now, we assume the controller returns a "clean" raw value (e.g. ADC or microseconds)
        // In v4, there were specific converters. Here we can add switch cases if needed.
        switch (template.executionConfig.responseMapping?.conversionMethod) {
            case 'ph_dfrobot_pro':
                // Default formula for DFRobot pH Pro (approximate)
                // pH = 7 - (Voltage - 2.5) / 0.18
                // Assuming 5V reference and 10-bit ADC (0-1023)
                // Voltage = (ADC / 1023) * 5.0
                const voltage = (rawValue / 1023.0) * 5.0;
                value = 7.0 + ((2.5 - voltage) / 0.18);
                break;
            case 'ec_dfrobot_k1':
                // Simplified EC conversion
                const ecVoltage = (rawValue / 1023.0) * 5.0;
                value = ecVoltage * 2.0; // Dummy factor
                break;
            case 'dht22':
                // DHT22 usually returns the value directly if using a library, 
                // but if using raw pulses, it needs decoding. 
                // For "dumb controller", let's assume the controller does the timing and returns a decoded number 
                // OR returns raw bits. 
                // If the controller returns the value directly (e.g. 24.5), we just pass it.
                value = rawValue;
                break;
            case 'ds18b20':
                value = rawValue; // Usually returns degrees C directly
                break;
            default:
                value = rawValue;
        }

        // 2. Apply User Calibration
        if (calibration) {
            if (calibration.points && calibration.points.length >= 2) {
                // 2-Point (Linear) Calibration
                // y = mx + c
                // We calculate m and c from the points
                // Sort points by raw value
                const sortedPoints = [...calibration.points].sort((a, b) => a.raw - b.raw);

                // Simple linear interpolation between the two points that bracket the raw value
                // Or just linear regression if we want to be fancy. 
                // Let's stick to 2-point linear for now.

                // If we have exactly 2 points, we define a line.
                if (sortedPoints.length === 2) {
                    const p1 = sortedPoints[0];
                    const p2 = sortedPoints[1];
                    const slope = (p2.value - p1.value) / (p2.raw - p1.raw);
                    const offset = p1.value - (slope * p1.raw);
                    value = (slope * rawValue) + offset;
                }
                // If > 2 points, we could do piecewise. For now, just use the first and last to define range?
                // Or find the segment.
                else {
                    // Piecewise linear
                    for (let i = 0; i < sortedPoints.length - 1; i++) {
                        const p1 = sortedPoints[i];
                        const p2 = sortedPoints[i + 1];
                        if (rawValue >= p1.raw && rawValue <= p2.raw) {
                            const slope = (p2.value - p1.value) / (p2.raw - p1.raw);
                            const offset = p1.value - (slope * p1.raw);
                            value = (slope * rawValue) + offset;
                            break;
                        }
                    }
                }

            } else {
                // Offset / Multiplier Calibration
                if (calibration.multiplier !== undefined && calibration.multiplier !== 1) {
                    value *= calibration.multiplier;
                }
                if (calibration.offset !== undefined && calibration.offset !== 0) {
                    value += calibration.offset;
                }
            }
        }

        return parseFloat(value.toFixed(2));
    }
}
