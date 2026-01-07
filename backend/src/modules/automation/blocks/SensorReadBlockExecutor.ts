import { IBlockExecutor, ExecutionContext, BlockResult } from '../interfaces';
import { hardware } from '../../hardware/HardwareService';
import { deviceRepository } from '../../persistence/repositories/DeviceRepository';
import { templates } from '../../hardware/DeviceTemplateManager';

export class SensorReadBlockExecutor implements IBlockExecutor {
    type = 'SENSOR_READ';

    async execute(ctx: ExecutionContext, params: any): Promise<BlockResult> {
        const { deviceId, variable } = params;

        if (!deviceId) {
            return { success: false, error: 'Missing required param: deviceId' };
        }

        try {
            // 0. Fetch Device for metadata
            const device = await deviceRepository.findById(deviceId);
            if (!device) {
                return { success: false, error: `Device ${deviceId} not found` };
            }

            // 0.1 Get template for structured measurements
            const driverId = device.config?.driverId;
            const template = driverId ? templates.getDriver(driverId) : null;

            // 1. Read Sensor Value (with optional Strategy Override)
            const strategyOverride = params.readingType === 'raw' ? undefined : params.readingType;
            // If explicit RAW is requested, we might need a way to bypass default strategy. 
            // For now, let's assume 'readingType' IS the strategy name (e.g. 'tank_volume') OR 'raw'.

            // NOTE: If 'raw' is passed, HardwareService currently doesn't inherently support "skip conversion" via this arg alone 
            // unless we handle it here or in HardwareService. 
            // However, the requirement is mainly to switch between "Distance" (Linear/Raw) and "Volume" (Tank).
            // If user selects 'tank_volume', we pass it.
            // If user selects 'distance', we might just want default behavior OR specific 'linear' strategy.

            const startTime = Date.now();
            const result = await hardware.readSensorValue(deviceId, strategyOverride);
            const duration = Date.now() - startTime;

            let valueToSave = result.value;

            // 2. Save to Variable (if configured)
            if (variable) {
                // --- UNIT CONVERSION LOGIC ---
                const varDef = ctx.variableDefinitions ? ctx.variableDefinitions[variable] : undefined;

                if (varDef && varDef.unit) {
                    // Use the unit returned by HardwareService (normalized base unit)
                    const sourceUnit = result.unit;

                    if (sourceUnit && typeof valueToSave === 'number') {
                        const { unitConversionService } = await import('../../../services/conversion/UnitConversionService');
                        try {
                            const converted = unitConversionService.convert(valueToSave, sourceUnit, varDef.unit);
                            // Check if conversion actually happened (different values)
                            if (Math.abs(converted - valueToSave) > 0.0001) {
                                // Silent success
                            }
                            valueToSave = converted;
                        } catch (convErr: any) {
                            console.warn(`[SensorRead] Conversion failed: ${convErr.message}`);
                        }
                    }
                }
                // -----------------------------

                // Ensure ctx.variables is initialized (it should be)
                if (!ctx.variables) ctx.variables = {};
                ctx.variables[variable] = valueToSave;

                const logUnit = (varDef && varDef.unit) ? varDef.unit : (result.unit || '');
                console.log(`[SensorRead] ✔️ Saved to '${variable}': ${valueToSave} ${logUnit}`);
            }

            // Determine unit for summary (prioritize variable unit if variable was used, otherwise sensor unit)
            let finalUnit = result.unit || '';
            if (variable && ctx.variableDefinitions?.[variable]?.unit) {
                finalUnit = ctx.variableDefinitions[variable].unit;
            }

            const formattedValue = (typeof valueToSave === 'number')
                ? valueToSave.toFixed(Number.isInteger(valueToSave) ? 0 : 2)
                : String(valueToSave);

            // 3. Build structured measurements array from template.measurements
            const measurements: { key: string; value: number; unit: string; isPrimary: boolean }[] = [];

            if (template?.measurements && result.details) {
                const templateMeasurementKeys = Object.keys(template.measurements);

                for (const key of templateMeasurementKeys) {
                    // Look for the value in result.details
                    const rawValue = result.details[key];
                    if (typeof rawValue === 'number' && !isNaN(rawValue)) {
                        measurements.push({
                            key,
                            value: rawValue,
                            unit: template.measurements[key]?.baseUnit || '',
                            isPrimary: key === (device.config?.activeRole || templateMeasurementKeys[0])
                        });
                    }
                }

                // Also add converted value if different from raw (e.g., distance -> volume)
                if (result.details.baseLogValue !== undefined && result.details.baseLogUnit) {
                    const convertedKey = device.config?.activeRole || 'converted';
                    const alreadyExists = measurements.some(m => m.key === convertedKey && m.value === result.details.baseLogValue);
                    if (!alreadyExists && result.details.baseLogValue !== result.details.baseHwValue) {
                        measurements.push({
                            key: convertedKey,
                            value: result.details.baseLogValue,
                            unit: result.details.baseLogUnit,
                            isPrimary: true
                        });
                    }
                }
            }

            return {
                success: true,
                output: valueToSave, // Return the FINAL (possibly converted) value as output
                summary: `Read ${formattedValue} ${finalUnit || ''}`.trim(),
                logData: {
                    action: 'READ',
                    primaryValue: typeof valueToSave === 'number' ? valueToSave : undefined,
                    primaryUnit: finalUnit,
                    strategy: strategyOverride || 'default',
                    durationMs: duration,
                    deviceId: device._id?.toString(),
                    deviceName: device.name,
                    resourceRole: (device as any).resourceRole || device.config?.activeRole,
                    measurements, // Structured measurements from template
                    rawContext: result.details // Full context for debugging/calibration
                }
            };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }
}
