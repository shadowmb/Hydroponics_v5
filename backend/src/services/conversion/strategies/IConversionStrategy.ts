import { IDevice } from '../../../models/Device';



export interface ConversionContext {
    temperature?: number; // Pre-resolved temperature
    voltage?: number;     // Resolved System Voltage (inc. override)
    adcMax?: number;      // Resolved ADC Resolution from Controller
}

export interface IConversionStrategy {
    /**
     * Converts a raw value to a physical value based on device configuration.
     * @param raw The raw value from the sensor (e.g., voltage, ADC).
     * @param device The device configuration containing calibration data.
     * @param context Context providing runtime values like Temperature, Voltage, ADC Max.
     */
    convert(rawValue: number, device: IDevice, strategyOverride?: string, context?: ConversionContext): number | { value: number; unit: string };
    reverseConvert?(targetValue: number, device: IDevice, strategyOverride?: string, context?: ConversionContext): number; // For actuators
}
