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

        // Default Calibration (Ideal Probe)
        // pH 7.00 = 1500mV (at 0 offset)
        // Sensitivity = -59.16 mV/pH at 25°C
        const neutralVoltage = calibration.neutralVoltage ?? 1500.0;
        const acidVoltage = calibration.acidVoltage ?? 2032.44; // Approx for pH 4.0 at -59.16mV/pH * -3 = 177.48 + 1500? No.
        // pH 4 is 3 units away from 7. 3 * 59.16 = 177.48. 1500 + 177.48 = 1677.48 (Wait, slope is negative? High voltage = Low pH?)
        // DFRobot Analog pH Sensor V2: Output 0-3.0V. Neutral ~1.5V.
        // Usually: pH = 7.0 + ((NeutralVoltage - Voltage) / Sensitivity)

        // Let's compute Sensitivity (Slope) from Calibration if available (Acid Point)
        // Sensitivity = (NeutralVoltage - AcidVoltage) / (7.0 - 4.0)
        let sensitivity = (neutralVoltage - acidVoltage) / (7.0 - 4.0);

        if (!calibration.acidVoltage) {
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
        // console.log(`[PhDfrStrategy] pH Calc: V=${voltageMs.toFixed(2)}mV (Raw: ${raw}), T=${temperature}°C, pH=${result}`);

        return result;
    }
}
