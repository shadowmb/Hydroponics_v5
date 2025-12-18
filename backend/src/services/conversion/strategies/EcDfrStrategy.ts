import { IDevice } from '../../../models/Device';
import { IConversionStrategy, ConversionContext } from './IConversionStrategy';

export class EcDfrStrategy implements IConversionStrategy {
    convert(raw: number, device: IDevice, strategyOverride?: string, context?: ConversionContext): { value: number; unit: string } {
        // 1. Convert ADC (0-1023) to Voltage (mV)
        // Assuming 5V reference and 10-bit ADC. 
        // TODO: Make reference voltage configurable via context or config
        const vRef = (context?.voltage ? context.voltage * 1000 : 5000); // Convert V to mV
        const adcMax = context?.adcMax || 1024;
        const voltage = (raw / adcMax) * vRef;

        // 2. Convert Voltage to EC
        // DFRobot EC Formula (Simplified for K=1.0)
        // EC = Voltage / 1000.0 * K (approximate)
        let ec = voltage / 1000.0;

        // 3. Apply K factor from calibration
        const calibration = device.config.calibrations?.['ec-dfr-analog']?.data || (device.config as any).calibration || {};
        const k = calibration.multiplier || 1.0;
        ec = ec * k;

        // 4. Temperature Compensation
        // Standard formula: EC_25 = EC_measured / (1 + beta * (T - 25))
        // beta is usually 0.02 (2.0% per °C)
        const temperature = context?.temperature ?? 25.0;
        const beta = 0.02; // Temperature coefficient

        // If temperature is available and valid, apply compensation
        let ec25 = ec;
        if (context?.temperature !== undefined) {
            ec25 = ec / (1.0 + beta * (temperature - 25.0));
        }

        const result = parseFloat(ec25.toFixed(2));
        console.log(`⚡ [EcDfrStrategy] Raw:${raw} | V:${voltage.toFixed(0)}mV | T:${temperature.toFixed(1)}°C | K:${k} | EC_raw:${ec.toFixed(2)} | EC_25:${result} mS/cm`);
        return { value: result, unit: 'mS/cm' };
    }
}
