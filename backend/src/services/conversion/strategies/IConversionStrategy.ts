import { IDevice } from '../../../models/Device';



export interface IConversionStrategy {
    /**
     * Converts a raw value to a physical value based on device configuration.
     * @param raw The raw value from the sensor (e.g., voltage, ADC).
     * @param device The device configuration containing calibration data.
     */
    convert(rawValue: number, device: IDevice, strategyOverride?: string): number;
    reverseConvert?(targetValue: number, device: IDevice, strategyOverride?: string): number; // For actuators (Value -> Raw/Duration)
}
