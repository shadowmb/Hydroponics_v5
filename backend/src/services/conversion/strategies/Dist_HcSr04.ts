import { IDevice } from '../../../models/Device';
import { IConversionStrategy, ConversionContext } from './IConversionStrategy';

export class Dist_HcSr04 implements IConversionStrategy {
    /**
     * Converts raw data from HC-SR04 to System Base Unit (mm).
     * 
     * @param raw - The raw value from firmware. Currently firmware returns Distance in CM.
     * @param device - The device interacting with.
     * @param strategyOverride - Optional override.
     * @param context - Optional context (temp, voltage).
     */
    convert(raw: number, device: IDevice, strategyOverride?: string, context?: ConversionContext): number | { value: number; unit: string } {
        // 1. Get Source Unit (what the firmware sends)
        // Ideally this comes from the request/template, but for this specific hardware strategy
        // we "know" the hardware emits CM based on the current Firmware implementation (Ultrasound.cpp).
        // To be robust, we could check context or template, but the Strategy itself represents the Hardware Driver.
        const sourceUnit = 'cm';

        // 2. Factory Transformation (Physics/Datasheet)
        // Current Firmware: Smartly calculates CM internally. 
        // We just need to Normalizing it to our System Base Unit (mm).

        let valueInMm = raw;

        if (sourceUnit === 'cm') {
            valueInMm = raw * 10;
        }

        // TODO: If we switch firmware to return raw Microseconds (Time), 
        // we would implement the Speed of Sound formula here:
        // const speedOfSound = 331.3 + 0.606 * (context?.temperature || 20);
        // valueInMm = (raw * speedOfSound) / 2000; // rough example

        // 3. User Calibration (Optional)
        // If the user has calibrated "Distance", we apply it here.
        // NOTE: This applies to the SENSOR accuracy (e.g. it reads 100mm as 102mm).
        // It does NOT apply to "Tank Volume", which is Phase 2.
        const calibration = device.config.calibrations?.['dist-hcsr04-std']?.data;
        if (calibration) {
            // Simple offset/linear calibration if present
            if (calibration.offset) valueInMm += calibration.offset;
            if (calibration.multiplier) valueInMm *= calibration.multiplier;
        }

        console.log(`⚡ [Dist_HcSr04] Raw: ${raw} (${sourceUnit}) -> ${valueInMm} mm`);

        return {
            value: parseFloat(valueInMm.toFixed(2)),
            unit: 'mm'
        };
    }
}
