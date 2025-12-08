import { IBlockExecutor, ExecutionContext, BlockResult } from '../interfaces';
import { hardware } from '../../hardware/HardwareService';

export class SensorReadBlockExecutor implements IBlockExecutor {
    type = 'SENSOR_READ';

    async execute(ctx: ExecutionContext, params: any): Promise<BlockResult> {
        const { deviceId, variable } = params;

        if (!deviceId) {
            return { success: false, error: 'Missing required param: deviceId' };
        }

        try {
            // 1. Read Sensor Value
            const result = await hardware.readSensorValue(deviceId);

            // 2. Save to Variable (if configured)
            if (variable) {
                let valueToSave = result.value;

                // --- UNIT CONVERSION LOGIC ---
                const varDef = ctx.variableDefinitions ? ctx.variableDefinitions[variable] : undefined;

                if (!ctx.variableDefinitions) {
                    console.warn(`[SensorRead] WARN: ctx.variableDefinitions is MISSING for variable ${variable}`);
                } else if (!varDef) {
                    console.warn(`[SensorRead] WARN: Definition for variable '${variable}' NOT FOUND in context. Keys: ${Object.keys(ctx.variableDefinitions).join(', ')}`);
                }

                if (varDef && varDef.unit) {
                    // Use the unit returned by HardwareService (normalized base unit)
                    const sourceUnit = result.unit;

                    if (sourceUnit) {
                        const { unitConversionService } = await import('../../../services/conversion/UnitConversionService');
                        try {
                            const converted = unitConversionService.convert(valueToSave, sourceUnit, varDef.unit);
                            // FORCE LOG for DEBUGGING
                            console.log(`[SensorRead] DEBUG: Variable '${variable}' Unit: '${varDef.unit}', Source Unit: '${sourceUnit}', Value: ${valueToSave}, Converted: ${converted}`);

                            // Check if conversion actually happened (different values)
                            if (Math.abs(converted - valueToSave) > 0.0001) {
                                console.log(`[SensorRead] Converted ${valueToSave} ${sourceUnit} -> ${converted} ${varDef.unit}`);
                            }
                            valueToSave = converted;
                        } catch (convErr: any) {
                            console.warn(`[SensorRead] Conversion failed: ${convErr.message}`);
                        }
                    }
                }
                // -----------------------------

                ctx.variables[variable] = valueToSave;
            }

            return {
                success: true,
                output: result.value
            };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }
}
