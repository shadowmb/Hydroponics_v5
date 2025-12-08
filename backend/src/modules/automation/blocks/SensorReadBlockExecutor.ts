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
            let valueToSave = result.value;

            // 2. Save to Variable (if configured)
            if (variable) {
                // --- UNIT CONVERSION LOGIC ---
                const varDef = ctx.variableDefinitions ? ctx.variableDefinitions[variable] : undefined;

                if (varDef && varDef.unit) {
                    // Use the unit returned by HardwareService (normalized base unit)
                    const sourceUnit = result.unit;

                    if (sourceUnit) {
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

                // LOG THE FINAL RESULT FOR USER VISIBILITY
                const finalUnit = (varDef && varDef.unit) ? varDef.unit : (result.unit || '');
                console.log(`[SensorRead] ✔️ Saved to '${variable}': ${valueToSave} ${finalUnit}`);
            }

            return {
                success: true,
                output: valueToSave // Return the FINAL (possibly converted) value as output
            };
        } catch (error: any) {
            return { success: false, error: error.message };
        }
    }
}
