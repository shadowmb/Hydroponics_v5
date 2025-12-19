import { IDevice } from '../../../models/Device';
import { IConversionStrategy, ConversionContext } from './IConversionStrategy';

/**
 * PhSmartStrategy
 * 
 * A high-precision pH conversion strategy featuring:
 * - 3-Point Segmented Linear Calibration (4.0, 7.0, 10.0)
 * - Automatic Temperature Compensation (Nernst Equation)
 * - Hardware-Agnostic Context (supports 10-bit, 12-bit ADC and any VRef)
 * - Fallback to Theoretical Ideals if no calibration is present
 */
export class PhSmartStrategy implements IConversionStrategy {
    id = 'ph_smart';

    convert(raw: number, device: IDevice, strategyOverride?: string, context?: ConversionContext): { value: number; unit: string; details?: any } {
        // 1. Resolve Hardware Context
        const vRef = context?.voltage || 5.0; // Default to 5V if not provided
        const adcMax = context?.adcMax || 1023; // Default to 10-bit if not provided
        const temperature = context?.temperature ?? 25.0; // Default to 25°C

        // 2. Convert Raw ADC to Voltage (mV)
        const voltageMs = (raw / adcMax) * (vRef * 1000);

        // 3. Retrieve Calibration Data
        const calibration = device.config.calibrations?.['ph_smart']?.data ||
            device.config.calibrations?.['ph_dfr']?.data || {}; // Backward compatibility

        const points = calibration.points || [];

        // 4. Map Points to Calibration Roles
        // We look for points closest to standard buffers
        // Use Number(p.value) to handle potential string types from database reliably
        const neutralPoint = points.find((p: any) => Math.abs(Number(p.value) - 7.0) < 0.5);
        const acidPoint = points.find((p: any) => Number(p.value) < 6.5);
        const alkaliPoint = points.find((p: any) => Number(p.value) > 7.5);

        // Convert Point Raw to mV (Assuming they were saved with the same ADC/VRef context)
        const getMv = (p: any) => (Number(p.raw) / adcMax) * (vRef * 1000);

        // 5. Establish Neutral Reference (Offset)
        const neutralMv = neutralPoint ? getMv(neutralPoint) : 1500.0; // Ideal 1500mV @ pH 7
        const neutralValue = neutralPoint ? Number(neutralPoint.value) : 7.0;

        // 6. Calculate Slopes with Temperature Compensation
        // Theoretical Nernst Slope @ 25°C is ~59.16 mV/pH
        const theoreticalSlope25 = 59.16;
        const tempCorrection = (temperature + 273.15) / 298.15;

        // Acid Slope (4.0 - 7.0 range)
        let acidSlope;
        if (acidPoint && neutralPoint) {
            acidSlope = Math.abs(getMv(neutralPoint) - getMv(acidPoint)) / Math.abs(neutralValue - Number(acidPoint.value));
        } else {
            acidSlope = theoreticalSlope25;
        }

        // Alkali Slope (7.0 - 10.0 range)
        let alkaliSlope;
        if (alkaliPoint && neutralPoint) {
            alkaliSlope = Math.abs(getMv(alkaliPoint) - getMv(neutralPoint)) / Math.abs(Number(alkaliPoint.value) - neutralValue);
        } else if (points.length === 2 && !alkaliPoint && acidPoint) {
            // If only 2 points (e.g. 7 and 4), use Acid Slope for everything
            alkaliSlope = acidSlope;
        } else {
            alkaliSlope = theoreticalSlope25;
        }

        // Apply Temperature Compensation to Slopes
        const correctedAcidSlope = acidSlope * tempCorrection;
        const correctedAlkaliSlope = alkaliSlope * tempCorrection;

        // 7. Calculate pH using Segmented Linear Model
        let resultPh: number;

        // Detect Polarity: Does higher voltage mean lower pH (Standard) or higher pH?
        let isStandardPolarity = true;
        if (acidPoint && neutralPoint) {
            isStandardPolarity = getMv(acidPoint) > getMv(neutralPoint);
        } else if (alkaliPoint && neutralPoint) {
            isStandardPolarity = getMv(alkaliPoint) < getMv(neutralPoint);
        }

        if (isStandardPolarity) {
            if (voltageMs > neutralMv) {
                // Acidic Range
                resultPh = neutralValue - (voltageMs - neutralMv) / correctedAcidSlope;
            } else {
                // Alkaline Range
                resultPh = neutralValue + (neutralMv - voltageMs) / correctedAlkaliSlope;
            }
        } else {
            // Inverted Polarity (Higher voltage = Higher pH)
            if (voltageMs < neutralMv) {
                // Acidic Range
                resultPh = neutralValue - (neutralMv - voltageMs) / correctedAcidSlope;
            } else {
                // Alkaline Range
                resultPh = neutralValue + (voltageMs - neutralMv) / correctedAlkaliSlope;
            }
        }

        // 7.5. Robust Clamping & Diagnostics
        const diagnostics = {
            vMeas: parseFloat(voltageMs.toFixed(1)),
            vRef: parseFloat(vRef.toFixed(2)),
            neutralMv: parseFloat(neutralMv.toFixed(1)),
            temp: parseFloat(temperature.toFixed(1)),
            isPolStd: isStandardPolarity,
            points: points.length,
            slopeAcid: parseFloat(correctedAcidSlope.toFixed(2)),
            slopeAlkali: parseFloat(correctedAlkaliSlope.toFixed(2)),
            raw_pH: parseFloat(resultPh.toFixed(2))
        };

        // Clamp pH to sane physical range (-2.0 to 16.0)
        const finalPh = Math.max(-2.0, Math.min(16.0, parseFloat(resultPh.toFixed(2))));

        // 8. Debug Logging
        console.log(`🧪 [PhSmart] Raw:${raw} | Points:${points.length} | NeutralMV:${neutralMv.toFixed(1)} | Polarity:${isStandardPolarity ? 'STD' : 'INV'} | V_Meas:${voltageMs.toFixed(1)}mV | Temp:${temperature}°C | pH:${finalPh}`);

        return { value: finalPh, unit: 'pH', details: diagnostics };
    }

    /**
     * Calculates sensor health diagnostics based on calibration data.
     */
    calculateDiagnostics(points: any[], context: ConversionContext) {
        // Implementation for Slope Efficiency % and Offset stability
        // This can be called by the frontend or during calibration save
    }
}
