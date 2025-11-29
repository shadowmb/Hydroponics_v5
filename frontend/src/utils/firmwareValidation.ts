import type { BoardDefinition, DeviceTemplate } from '@/services/firmwareBuilderService';

export interface ValidationResult {
    compatible: boolean;
    reason?: string;
}

export interface ResourceUsage {
    digital: number;
    analog: number;
    uart: number;
    i2c: number;
}

export const checkCompatibility = (
    board: BoardDefinition,
    device: DeviceTemplate,
    currentUsage: ResourceUsage
): ValidationResult => {
    if (!device.requirements) {
        // If no requirements defined, assume compatible (legacy behavior)
        return { compatible: true };
    }

    const req = device.requirements;

    // 1. Voltage Check
    // We assume board.electrical_specs.logic_voltage is like "5V" or "3.3V"
    // We assume device.requirements.voltage is like "5V", "3.3V", or "3.3V-5V"
    const boardVoltage = board.electrical_specs?.logic_voltage;
    if (boardVoltage && req.voltage) {
        if (req.voltage !== '3.3V-5V' && req.voltage !== boardVoltage) {
            // Strict mismatch: Board 5V vs Device 3.3V (or vice versa)
            return {
                compatible: false,
                reason: `Voltage Mismatch: Board is ${boardVoltage}, Device requires ${req.voltage}`
            };
        }
    }

    // 2. Interface Check
    if (req.interface) {
        const boardInterfaces = board.interfaces || {};

        if (req.interface === 'i2c') {
            if (!boardInterfaces.i2c || boardInterfaces.i2c.length === 0) {
                return { compatible: false, reason: 'Board does not support I2C' };
            }
        }

        if (req.interface === 'uart') {
            // Check if board has enough UART ports
            const totalHwUarts = board.interfaces?.serial?.hardware?.length || 0;

            // If we have free HW UARTs, use them
            if (currentUsage.uart < totalHwUarts) {
                // OK, uses HW UART
            } else {
                // No free HW UART, try SoftwareSerial (needs 2 Digital Pins)
                // We treat this as consuming 2 digital pins effectively
                const totalDigital = board.pins?.digital_count || 0;

                // For THIS device, if we are falling back to SoftSerial, we need 2 pins.
                if (currentUsage.digital + 2 > totalDigital) {
                    return { compatible: false, reason: 'No free UART ports and not enough Digital pins for SoftwareSerial' };
                }
            }
        }
    }

    // 3. Pin Budget Check
    if (req.pin_count) {
        const totalDigital = board.pins?.digital_count || 0;
        const totalAnalog = board.pins?.analog_input_count || 0;

        const requiredDigital = req.pin_count.digital || 0;
        if (requiredDigital > 0) {
            if (currentUsage.digital + requiredDigital > totalDigital) {
                return { compatible: false, reason: 'Not enough Digital pins' };
            }
        }

        const requiredAnalog = req.pin_count.analog || 0;
        if (requiredAnalog > 0) {
            if (currentUsage.analog + requiredAnalog > totalAnalog) {
                return { compatible: false, reason: 'Not enough Analog pins' };
            }
        }
    }

    return { compatible: true };
};

export const calculateResourceUsage = (devices: DeviceTemplate[], board?: BoardDefinition): ResourceUsage => {
    const usage: ResourceUsage = { digital: 0, analog: 0, uart: 0, i2c: 0 };
    const hwUartCount = board?.interfaces?.serial?.hardware?.length || 0;

    devices.forEach(d => {
        if (!d.requirements) return;

        if (d.requirements.pin_count) {
            usage.digital += d.requirements.pin_count.digital || 0;
            usage.analog += d.requirements.pin_count.analog || 0;
        }

        if (d.requirements.interface === 'uart') {
            // If we have room in HW UARTs, consume one
            if (usage.uart < hwUartCount) {
                usage.uart += 1;
            } else {
                // Spillover to SoftwareSerial -> Consumes 2 Digital Pins
                // We don't increment usage.uart (which tracks HW UARTs used), 
                // but we DO increment digital usage.
                usage.digital += 2;
            }
        }

        if (d.requirements.interface === 'i2c') {
            usage.i2c += 1;
        }
    });

    return usage;
};
