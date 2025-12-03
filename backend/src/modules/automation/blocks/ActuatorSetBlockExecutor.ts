import { IBlockExecutor, ExecutionContext, BlockResult } from '../interfaces';
import { hardware } from '../../hardware/HardwareService';
import { deviceRepository } from '../../persistence/repositories/DeviceRepository';

export class ActuatorSetBlockExecutor implements IBlockExecutor {
    type = 'ACTUATOR_SET';

    async execute(ctx: ExecutionContext, params: any): Promise<BlockResult> {
        const { deviceId, value, action = 'ON', duration, amount } = params;

        if (!deviceId) {
            return { success: false, error: 'Missing required param: deviceId' };
        }

        try {
            // 1. Fetch Device to get Driver ID
            const device = await deviceRepository.findById(deviceId);
            if (!device) {
                return { success: false, error: `Device ${deviceId} not found` };
            }

            const driverId = device.config?.driverId;
            if (!driverId) {
                return { success: false, error: `Device ${deviceId} has no driver configured` };
            }

            // 2. Determine Action Logic
            let targetState = 0;
            let pulseDuration = 0;

            // Handle Legacy 'value' (boolean) if 'action' is not set or default
            if (params.value !== undefined && params.action === undefined) {
                targetState = params.value ? 1 : 0;
            } else {
                switch (action) {
                    case 'ON': targetState = 1; break;
                    case 'OFF': targetState = 0; break;
                    case 'PULSE_ON':
                        targetState = 1;
                        pulseDuration = Number(duration);
                        break;
                    case 'PULSE_OFF':
                        targetState = 0;
                        pulseDuration = Number(duration);
                        break;
                    case 'DOSE':
                        targetState = 1;
                        // Calculate Duration from Calibration
                        const calibration = device.config?.calibrations?.volumetric_flow?.data;
                        if (!calibration || !calibration.flowRate) {
                            return { success: false, error: `Device ${device.name} is not calibrated for dosing` };
                        }
                        // flowRate is usually in unit/sec (e.g., ml/sec)
                        // amount is in unit (e.g., ml)
                        // duration = amount / flowRate
                        const flowRate = Number(calibration.flowRate);
                        const targetAmount = Number(amount);
                        if (flowRate <= 0) return { success: false, error: 'Invalid flow rate' };

                        pulseDuration = (targetAmount / flowRate) * 1000; // Convert to ms
                        break;
                    default:
                        return { success: false, error: `Unknown action: ${action}` };
                }
            }

            const command = 'RELAY_SET';

            // 3. Execute Command
            if (pulseDuration > 0) {
                // PULSE Logic
                // Turn to Target State
                await hardware.sendCommand(deviceId, driverId, command, { state: targetState });

                // Wait
                await new Promise(resolve => setTimeout(resolve, pulseDuration));

                // Revert State (Toggle)
                const revertState = targetState === 1 ? 0 : 1;
                await hardware.sendCommand(deviceId, driverId, command, { state: revertState });
            } else {
                // SIMPLE Logic
                await hardware.sendCommand(deviceId, driverId, command, { state: targetState });
            }

            return { success: true };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }
}
