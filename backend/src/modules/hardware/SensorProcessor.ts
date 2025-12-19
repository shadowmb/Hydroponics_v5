import { logger } from '../../core/LoggerService';
import { conversionService } from '../../services/conversion/ConversionService';

export class SensorProcessor {
    private static instance: SensorProcessor;

    private constructor() { }

    public static getInstance(): SensorProcessor {
        if (!SensorProcessor.instance) {
            SensorProcessor.instance = new SensorProcessor();
        }
        return SensorProcessor.instance;
    }

    /**
     * Performs a burst read with sampling and median filtering.
     */
    public async performSampling(
        deviceId: string,
        driverId: string,
        samplingConfig: { count: number; delayMs: number },
        readFn: (context?: any) => Promise<any>,
        valuePath?: string
    ): Promise<number> {
        const { count, delayMs } = samplingConfig;
        const samples: number[] = [];

        logger.info({ deviceId, count, delayMs }, '📊 [SensorProcessor] Starting Burst Read');

        for (let i = 0; i < count; i++) {
            try {
                const response = await readFn();
                const rawValue = this.extractRawValue(response, valuePath);
                if (!isNaN(rawValue)) {
                    samples.push(rawValue);
                }
            } catch (err) {
                logger.warn({ deviceId, iteration: i, err }, '⚠️ [SensorProcessor] Sample failed');
            }

            if (i < count - 1 && delayMs > 0) {
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }

        if (samples.length === 0) return 0;

        samples.sort((a, b) => a - b);
        const mid = Math.floor(samples.length / 2);
        const median = samples.length % 2 === 0
            ? (samples[mid - 1] + samples[mid]) / 2
            : samples[mid];

        logger.debug({ deviceId, samples, median }, '✅ [SensorProcessor] Sampling Complete');
        return median;
    }

    /**
     * Stage 2 & 3: Converts RAW hardware reading to unified BASIC logical value.
     */
    public async processRawToBasic(
        raw: number,
        device: any,
        driverDoc: any,
        context: any,
        strategyOverride?: string
    ): Promise<{ value: number, unit: string, hwValue: number, hwUnit: string, activeStrategy: string, details?: any }> {
        let val = raw;
        let unit = driverDoc.commands?.READ?.sourceUnit || 'raw';

        const templateMeasurements = driverDoc.measurements;
        const activeRole = device.config?.activeRole;
        let measurementKey = activeRole || Object.keys(templateMeasurements || {})[0] || 'distance';

        // @ts-ignore
        const roleConfig = driverDoc.roles?.[activeRole];
        if (roleConfig?.source) measurementKey = roleConfig.source;

        if (templateMeasurements && templateMeasurements[measurementKey] && !isNaN(raw)) {
            const { rawUnit, baseUnit } = templateMeasurements[measurementKey];
            if (rawUnit && baseUnit) {
                const registryPath = require('path').resolve(__dirname, '../../../../shared/UnitRegistry');
                const { convertValue } = require(registryPath);
                const converted = convertValue(raw, rawUnit, baseUnit);
                if (converted !== null) {
                    val = converted;
                    unit = baseUnit;
                }
            }
        }

        // Apply Smart Conversion (Stage 3)
        const smartResult = conversionService.convertSmart(device, val, device.displayUnit, context, strategyOverride);
        let bVal = smartResult.value;
        let bUnit = smartResult.unit && smartResult.unit !== 'any' ? smartResult.unit : unit;

        // Stage 3.5: Calibration Chaining (e.g., mm → L)
        const dUnit = device.displayUnit;
        if (dUnit && (dUnit === 'L' || dUnit === 'l') && smartResult.strategyUsed !== 'tank_volume' && bUnit !== 'L') {
            const tankCal = device.config.calibrations?.['tank_volume'];
            if (tankCal?.data) {
                try {
                    const { LinearInterpolationStrategy } = require('../../services/conversion/strategies/LinearInterpolationStrategy');
                    const tankS = new LinearInterpolationStrategy();
                    const vRes = tankS.convert(bVal, { ...device, config: { ...device.config, conversionStrategy: 'tank_volume' } }, 'tank_volume');
                    bVal = typeof vRes === 'object' ? vRes.value : vRes;
                    bUnit = 'L';
                } catch (err) {
                    logger.warn({ deviceId: device.id, err }, '⚠️ [SensorProcessor] Calibration chaining failed');
                }
            }
        }

        return {
            value: bVal,
            unit: bUnit,
            hwValue: val,
            hwUnit: unit,
            activeStrategy: smartResult.strategyUsed,
            details: smartResult.details
        };
    }

    /**
     * Stage 4: Converts BASIC logical value to user-preferred DISPLAY value.
     */
    public processBasicToDisplay(val: number, unit: string, device: any): { value: number, unit: string } {
        if (!device.displayUnit || isNaN(val)) {
            return { value: val, unit };
        }

        try {
            const registryPath = require('path').resolve(__dirname, '../../../../shared/UnitRegistry');
            const { convertValue } = require(registryPath);
            const converted = convertValue(val, unit, device.displayUnit);
            if (converted !== null) {
                return { value: converted, unit: device.displayUnit };
            }
        } catch (err) {
            logger.warn({ deviceId: device.id, err }, '⚠️ [SensorProcessor] Display conversion failed');
        }

        return { value: val, unit };
    }

    /**
     * Extracts a numerical value from various hardware response formats.
     */
    public extractRawValue(res: any, path?: string): number {
        if (path && typeof res === 'object') {
            const extracted = this.getValueByPath(res, path);
            if (extracted !== undefined) return Number(extracted);
        }

        if (typeof res === 'number') return res;

        if (typeof res === 'object' && res !== null) {
            if (Array.isArray(res) && res.length > 0) return Number(res[0]);
            if ('registers' in res && Array.isArray(res.registers)) return Number(res.registers[0]);
            if ('val' in res) return Number(res.val);
            if ('value' in res) return Number(res.value);
            if ('raw' in res) return Number(res.raw);
        }

        return Number(res);
    }

    private getValueByPath(obj: any, path: string): any {
        return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    }
}

export const sensorProcessor = SensorProcessor.getInstance();
