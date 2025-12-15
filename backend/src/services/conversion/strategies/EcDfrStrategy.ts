import { IDevice } from '../../../models/Device';
import { IConversionStrategy } from './IConversionStrategy';

export class EcDfrStrategy implements IConversionStrategy {
    convert(raw: number, device: IDevice, strategyOverride?: string): number {
        // 1. Convert ADC (0-1023) to Voltage (mV)
        // Assuming 5V reference and 10-bit ADC. 
        // TODO: Make reference voltage configurable
        const voltage = (raw / 1024.0) * 5000;

        // 2. Convert Voltage to EC
        // DFRobot EC Formula (Simplified for K=1.0)
        // EC = Voltage / 1000.0 * K (approximate)
        // Real formula requires temperature compensation.

        // For now, return a value that looks like EC (mS/cm)
        // If raw=93 -> voltage=454mV -> EC=0.45 mS/cm

        let ec = voltage / 1000.0;

        // Apply K factor if present in calibration
        const calibration = device.config.calibrations?.['ec-dfr-analog']?.data || (device.config as any).calibration || {};
        const k = calibration.multiplier || 1.0;
        ec = ec * k;

        const result = parseFloat(ec.toFixed(2));
        console.log(`⚡ [EcDfrStrategy] Raw:${raw} | V_Calc:${voltage.toFixed(2)}mV | K:${k} | EC:${result} mS/cm`);
        return result;
    }
}
