import { IDevice } from '../../../models/Device';
import { IConversionStrategy, ConversionContext } from './IConversionStrategy';

/**
 * EcSmartStrategy
 * 
 * A high-precision EC (Conductivity) conversion strategy featuring:
 * - 3-Point Segmented Linear Calibration (Air, Low, High)
 * - Automatic Temperature Compensation (Linear coefficient)
 * - Hardware-Agnostic Context (ADCMax, VRef)
 * - Cell Constant (K-Factor) Diagnostics
 */
export class EcSmartStrategy implements IConversionStrategy {
    id = 'ec_smart';

    convert(raw: number, device: IDevice, strategyOverride?: string, context?: ConversionContext): { value: number; unit: string } {
        // 1. Resolve Hardware Context
        const vRef = context?.voltage || 5.0;
        const adcMax = context?.adcMax || 1023;
        const temperature = context?.temperature ?? 25.0;

        // 2. Convert Raw ADC to Voltage (mV)
        const voltage = (raw / adcMax) * (vRef * 1000);

        // 3. Retrieve Calibration Data
        const calibration = device.config.calibrations?.['ec_smart']?.data ||
            device.config.calibrations?.['ec-dfr-analog']?.data || {};

        const points = calibration.points || [];

        // 4. Calculate EC based on Model
        let ecRaw: number; // EC at current temperature (uS/cm)

        if (points.length >= 2) {
            // Segmented Linear Interpolation
            // Sort points by raw value for reliable interpolation
            const sorted = [...points].sort((a, b) => Number(a.raw) - Number(b.raw));

            // Find segments
            let i = 0;
            while (i < sorted.length - 2 && raw > Number(sorted[i + 1].raw)) {
                i++;
            }

            const p1 = sorted[i];
            const p2 = sorted[i + 1];

            // Linear Interpolation: y = y1 + (x - x1) * (y2 - y1) / (x2 - x1)
            // Note: points.value are stored in uS/cm
            const v1 = Number(p1.value);
            const v2 = Number(p2.value);
            const r1 = Number(p1.raw);
            const r2 = Number(p2.raw);

            if (r2 !== r1) {
                ecRaw = v1 + (raw - r1) * (v2 - v1) / (r2 - r1);
            } else {
                ecRaw = v1;
            }
        } else if (points.length === 1) {
            // 1-Point: Offset/K-Factor Scaling
            const p = points[0];
            const targetUs = Number(p.value);
            const rawCal = Number(p.raw);

            if (rawCal > 0) {
                // K = Target / Theoretical_at_Cal_Point
                // Theoretical = (rawCal / adcMax) * vRef
                const vCal = (rawCal / adcMax) * vRef;
                const kFactor = targetUs / vCal;

                ecRaw = (voltage / 1000) * kFactor;
            } else {
                ecRaw = (voltage / 1000); // Fallback to raw voltage if cal point is zero
            }
        } else {
            // No Calibration: Theoretical K=1.0
            ecRaw = voltage; // Raw voltage in mV as a base estimate or keep it 1:1 for uncalibrated
        }

        // 5. Apply Temperature Compensation
        // Formula: EC_25 = EC_T / (1 + beta * (T - 25))
        // beta is usually 0.02 (2.0% per °C)
        const beta = calibration.beta || 0.02;
        const ec25 = ecRaw / (1.0 + beta * (temperature - 25.0));

        // Result sanitization
        const finalEc = Math.max(0, parseFloat((ec25).toFixed(2)));

        // 6. Debug Logging
        console.log(`⚡ [EcSmart] Raw:${raw} | V:${voltage.toFixed(0)}mV | T:${temperature}°C | EC_raw:${ecRaw.toFixed(1)} | EC_25:${finalEc} uS/cm`);

        return { value: finalEc, unit: 'uS/cm' };
    }
}
