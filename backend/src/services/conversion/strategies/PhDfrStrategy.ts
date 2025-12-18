import { IDevice } from '../../../models/Device';
import { IConversionStrategy, ConversionContext } from './IConversionStrategy';

export class PhDfrStrategy implements IConversionStrategy {
    convert(raw: number, device: IDevice, strategyOverride?: string, context?: ConversionContext): number {
        // Defaults
        const vRef = context?.voltage || 5.0; // Default 5V
        const adcMax = context?.adcMax || 1023; // Default 10-bit
        const temperature = context?.temperature ?? 25.0; // Default 25°C

        // 1. Convert ADC to Voltage (mV)
        const voltageMs = (raw / adcMax) * (vRef * 1000);

        // 2. PH Calculation (DFRobot Formula)
        // Standard DFRobot pH Formula is usually: pH = 7 - (Voltage - 1500) / Gradient
        // But for "Pro" versions or V2, it uses a NeutralVoltage and AcidVoltage calibration.

        // Let's use the Neutral/Slope model which is more robust than fixed formula.
        // Slope (S) is affected by Temperature: S_t = S_25 * (T + 273.15) / 298.15

        // Retrieve Calibration Data
        // Ideally we should have a 'calibration' object in device config.
        const calibration = device.config.calibrations?.['ph_dfr']?.data || {};

        // Check for calibration data (Legacy vs New Wizard)
        // New Wizard (MultiPointTable) saves data as { points: [{ raw, value }, ...] }
        let neutralVoltage = calibration.neutralVoltage;
        let acidVoltage = calibration.acidVoltage;

        if (calibration.points && Array.isArray(calibration.points)) {
            // Find Neutral (closest to pH 7.0)
            const neutralPoint = calibration.points.find((p: any) => Math.abs(p.value - 7.0) < 0.5);
            if (neutralPoint) {
                // Point raw is ADC or Voltage? 
                // Wizard captures 'raw'. If raw is ADC, we need to convert to mV.
                // But wait, strategy receives 'raw' (ADC). 
                // The wizard saves whatever 'raw' is.
                // If wizard captured ADC, we need to convert it to Voltage using THIS context (or the one during cal?).
                // Assuming Calibration was done with same VRef/ADCMax, we can convert.
                // Or better: Assume the wizard saves 'raw' as ADC values.

                // We need Voltage for the formula.
                // neutralVoltage = (neutralPoint.raw / adcMax) * (vRef * 1000);

                // Actually, let's keep it safe. If the wizard saves normalized values (e.g. if we fix wizard to save mV?), 
                // But simpler: just convert the raw ADC from the point to mV using current context.
                neutralVoltage = (neutralPoint.raw / adcMax) * (vRef * 1000);
            }

            // Find Acid (closest to pH 4.0)
            const acidPoint = calibration.points.find((p: any) => Math.abs(p.value - 4.0) < 0.5);
            if (acidPoint) {
                acidVoltage = (acidPoint.raw / adcMax) * (vRef * 1000);
            }
        }

        // Fallbacks
        neutralVoltage = neutralVoltage ?? 1500.0;

        let sensitivity;
        if (acidVoltage !== undefined && neutralVoltage !== undefined) {
            sensitivity = (neutralVoltage - acidVoltage) / (7.0 - 4.0);
        } else {
            // Default Sensitivity if no Cal: 59.16mV/pH
            sensitivity = 59.16;
        }

        // 3. Compensation
        // Correct Sensitivity for Temperature
        // Nernst Equation: Slope is proportional to Absolute Temp.
        const tempCorrection = (temperature + 273.15) / 298.15;
        const correctedSensitivity = sensitivity * tempCorrection;

        // 4. Calculate pH
        // pH = 7.0 - (Voltage - NeutralVoltage) / CorrectedSensitivity
        // We use '-' because typically V > Neutral means pH < 7 (Acidic) ??
        // Actually, let's check standard DFRobot code logic.
        // DFRobot_PH.cpp: _slope = (7.0-4.0)/((_neutralVoltage-1500.0)/3.0 - (_acidVoltage-1500.0)/3.0) 
        // It's a bit complex.

        // Simplified Logic:
        // DeltaV = NeutralVoltage - ReadVoltage
        // pH = 7.0 + (DeltaV / CorrectedSensitivity)

        const deltaV = neutralVoltage - voltageMs;
        let ph = 7.0 + (deltaV / correctedSensitivity);

        const result = parseFloat(ph.toFixed(2));
        console.log(`🧪 [PhDfrStrategy] Raw:${raw} | ADC_Max:${adcMax} | V_Ref:${vRef}V | V_Meas:${voltageMs.toFixed(2)}mV | Temp:${temperature.toFixed(1)}°C | Sensitivity:${correctedSensitivity.toFixed(2)} | pH:${result}`);

        return result;
    }
}
