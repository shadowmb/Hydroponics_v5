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

                if (varDef && varDef.unit) {
                    // We need the Source Unit from the Driver
                    // Note: 'hardware' service gives us values, but not metadata easily directly here 
                    // without querying the template.
                    // Ideally, hardware.readSensorValue could return the unit too, 
                    // but for now let's look it up or rely on the normalized value's implied unit 
                    // (which is usually the base unit of the driver).

                    // Actually, hardware.readSensorValue ALREADY normalizes to the Driver's Base Unit 
                    // if 'sourceUnit' is defined in the driver.
                    // So we just need to know what that Base Unit is, OR what the Driver says it is.

                    // Let's get the device to find the driver
                    // This is a bit expensive to do in the loop, but robust.
                    // Optimization: Cache this or pass it?
                    // For now, let's fetch it.
                    const { templates } = await import('../../hardware/DeviceTemplateManager');
                    // We need device config to get driverId. 
                    // We don't have the full device object here easily without querying DB or HardwareService.
                    // HardwareService has a cache.

                    // Let's rely on 'hardware' service to provide metadata or helper?
                    // Or... retrieve device from HardwareService's memory
                    const device = hardware['devices'].get(deviceId); // Accessing private property? No, let's use public getter or find.
                    // HardwareService doesn't expose 'getDevice'.
                    // But we can assume the value returned by `readSensorValue` is in the unit defined by the driver.

                    if (device) {
                        const driver = templates.getDriver(device.driverId);
                        // @ts-ignore
                        const sourceUnit = driver.commands?.READ?.sourceUnit;

                        if (sourceUnit) {
                            const { unitConversionService } = await import('../../../services/conversion/UnitConversionService');
                            try {
                                const converted = unitConversionService.convert(valueToSave, sourceUnit, varDef.unit);
                                // Check if conversion actually happened (different values)
                                if (Math.abs(converted - valueToSave) > 0.0001) {
                                    console.log(`[SensorRead] Converted ${valueToSave} ${sourceUnit} -> ${converted} ${varDef.unit}`);
                                }
                                valueToSave = converted;
                            } catch (convErr) {
                                console.warn(`[SensorRead] Conversion failed: ${convErr.message}`);
                            }
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
