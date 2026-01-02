import { IBlockExecutor, ExecutionContext, BlockResult } from '../interfaces';
import { hardware } from '../../hardware/HardwareService';
import { deviceRepository } from '../../persistence/repositories/DeviceRepository';

export class ActuatorSetBlockExecutor implements IBlockExecutor {
    type = 'ACTUATOR_SET';

    async execute(ctx: ExecutionContext, params: any, signal?: AbortSignal): Promise<BlockResult> {
        const { deviceId, value, action = 'ON', duration, amount } = params;


        if (!deviceId) {
            return { success: false, error: 'Missing required param: deviceId' };
        }

        // --- SAFETY STOP REGISTRY ---
        // Register device usage if not already present
        if (!ctx.activeResources) ctx.activeResources = {};

        if (!ctx.activeResources[deviceId]) {
            // First touch: Recorcd Initial State
            const currentVal = ctx.devices[deviceId]?.value;
            // Default to 0 (OFF) if unknown, otherwise trust the snapshot
            const initialState = (typeof currentVal === 'number') ? currentVal : (currentVal ? 1 : 0);

            ctx.activeResources[deviceId] = {
                deviceId,
                driverId: '', // Placeholder, populated below
                initialState: initialState,
                lastCommand: action,
                revertOnStop: true
            };
        } else {
            // Update tracking
            ctx.activeResources[deviceId].lastCommand = action;
            // Update policy if optionally passed (future proofing)
            if (params.revertOnStop !== undefined) {
                ctx.activeResources[deviceId].revertOnStop = params.revertOnStop;
            }
        }
        // ----------------------------

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

            // Update Registry with valid Driver ID
            if (ctx.activeResources[deviceId]) {
                ctx.activeResources[deviceId].driverId = driverId;
            }

            // 2. Determine Action Logic
            let targetState = 0;
            let pulseDuration = 0; // Internal duration in milliseconds
            let logUnit = '';

            // --- UNIT CONVERSION FOR DURATION ---
            // Duration field expects seconds (s). Convert from variable unit if needed.
            // Final output to controller is milliseconds.
            let inputDurationSec = 0;
            if (params.duration !== undefined && params.duration !== null) {
                const rawDuration = Number(params.duration);

                // Check if duration came from a variable with a different unit
                if (params._durationSourceUnit && params._durationSourceUnit !== 's') {
                    // Import conversion service dynamically
                    const { unitConversionService } = await import('../../../services/conversion/UnitConversionService');
                    try {
                        inputDurationSec = unitConversionService.convert(rawDuration, params._durationSourceUnit, 's');
                        console.log(`[ActuatorSet] ⏱️ Duration converted: ${rawDuration} ${params._durationSourceUnit} → ${inputDurationSec} s`);
                    } catch (convErr: any) {
                        console.warn(`[ActuatorSet] Duration conversion failed: ${convErr.message}. Using raw value as seconds.`);
                        inputDurationSec = rawDuration;
                    }
                } else {
                    // Already in seconds or no unit info
                    inputDurationSec = rawDuration;
                }
            }

            // Handle Legacy 'value' (boolean) if 'action' is not set or default
            if (params.value !== undefined && params.action === undefined) {
                targetState = params.value ? 1 : 0;
            } else {
                switch (action) {
                    case 'ON': targetState = 1; break;
                    case 'OFF': targetState = 0; break;
                    case 'PULSE_ON':
                        targetState = 1;
                        pulseDuration = inputDurationSec * 1000;
                        break;
                    case 'PULSE_OFF':
                        targetState = 0;
                        pulseDuration = inputDurationSec * 1000;
                        break;
                    case 'DOSE':
                        targetState = 1;
                        // Calculate Duration from Calibration
                        const calibration = device.config?.calibrations?.volumetric_flow?.data;
                        if (!calibration || !calibration.flowRate) {
                            return { success: false, error: `Device ${device.name} is not calibrated for dosing` };
                        }
                        // flowRate is usually in unit/sec (e.g., ml/sec)
                        const flowRate = Number(calibration.flowRate);
                        if (flowRate <= 0) return { success: false, error: 'Invalid flow rate calibration' };

                        let targetAmount = Number(amount);
                        if (isNaN(targetAmount) || targetAmount <= 0) {
                            return { success: false, error: `Invalid amount: ${amount}` };
                        }

                        // Unit Conversion (Default to 'ml' if not specified)
                        const unit = params.amountUnit || 'ml';
                        logUnit = unit;
                        if (unit === 'l') targetAmount *= 1000;
                        else if (unit === 'gal') targetAmount *= 3785.41;

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
                if (action === 'DOSE') {
                    console.log(`[ActuatorSet] ⏳ Starting Dose: ${amount}${logUnit || ''} (~${(pulseDuration / 1000).toFixed(1)}s)...`);
                } else {
                    console.log(`[ActuatorSet] ⏳ Starting Pulse: ${inputDurationSec}s (${pulseDuration}ms)...`);
                }

                // Turn to Target State
                await hardware.sendCommand(deviceId, driverId, command, { state: targetState });

                // Wait (Abortable)
                try {
                    await new Promise<void>((resolve, reject) => {
                        if (signal?.aborted) return reject(new Error('Aborted'));
                        const timer = setTimeout(resolve, pulseDuration);
                        signal?.addEventListener('abort', () => {
                            clearTimeout(timer);
                            reject(new Error('Aborted'));
                        });
                    });
                } catch (err: any) {
                    if (err.message === 'Aborted') {
                        console.log(`[ActuatorSet] 🛑 Operation Aborted! Turning OFF.`);
                        const revertState = targetState === 1 ? 0 : 1;
                        // Attempt to revert state even if aborted
                        try {
                            await hardware.sendCommand(deviceId, driverId, command, { state: revertState });
                        } catch (revertErr) {
                            console.error('Failed to revert actuator state during abort', revertErr);
                        }
                        throw err;
                    }
                    throw err;
                }

                // Revert State (Toggle)
                const revertState = targetState === 1 ? 0 : 1;
                await hardware.sendCommand(deviceId, driverId, command, { state: revertState });

                console.log(`[ActuatorSet] ✔️ Pulsed '${action}' for ${(pulseDuration / 1000).toFixed(2)}s`);
            } else {
                // SIMPLE Logic
                await hardware.sendCommand(deviceId, driverId, command, { state: targetState });
                console.log(`[ActuatorSet] ✔️ Set '${action}' (State: ${targetState})`);
            }

            // 4. Construct Summary
            let summary = '';
            if (action === 'DOSE') {
                summary = `Dosed ${amount}${logUnit}`;
            } else if (action === 'PULSE_ON' || action === 'PULSE_OFF') {
                summary = `Pulsed ${action === 'PULSE_ON' ? 'ON' : 'OFF'} for ${(pulseDuration / 1000).toFixed(1)}s`;
            } else {
                summary = `Set ${action} (State: ${targetState})`;
            }

            return { success: true, summary };
        } catch (error: any) {
            // If aborted, error is caught here too. Ensure we distinguish logic errors from Abort.
            if (error.message === 'Aborted') throw error; // Let AutomationEngine handle abort
            return { success: false, error: error.message };
        }
    }
}
