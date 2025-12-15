import { IDevice } from '../../models/Device';
import { IConversionStrategy } from './strategies/IConversionStrategy';
import { LinearInterpolationStrategy } from './strategies/LinearInterpolationStrategy';
import { EcDfrStrategy } from './strategies/EcDfrStrategy';
import { VolumetricFlowStrategy } from './strategies/VolumetricFlowStrategy';

import { PhDfrStrategy } from './strategies/PhDfrStrategy';
import { Dist_HcSr04 } from './strategies/Dist_HcSr04';

export class ConversionService {
    private strategies: Map<string, IConversionStrategy> = new Map();

    constructor() {
        // Register default strategies
        this.registerStrategy('linear', new LinearInterpolationStrategy());
        this.registerStrategy('ec-dfr-analog', new EcDfrStrategy());
        this.registerStrategy('volumetric_flow', new VolumetricFlowStrategy());
        this.registerStrategy('tank_volume', new LinearInterpolationStrategy());
        this.registerStrategy('ph_dfr', new PhDfrStrategy());
        this.registerStrategy('dist-hcsr04-std', new Dist_HcSr04());
    }

    registerStrategy(name: string, strategy: IConversionStrategy) {
        this.strategies.set(name, strategy);
    }

    convert(device: IDevice, rawValue: number, strategyOverride?: string, context?: any): number | { value: number; unit: string } {
        let strategyName = strategyOverride || device.config.conversionStrategy;

        // Auto-detect strategy if not explicitly set
        if (!strategyName) {
            if (device.config.driverId === 'dfrobot_ec_k1') {
                strategyName = 'ec-dfr-analog';
            } else {
                strategyName = 'linear';
            }
        }

        const strategy = this.strategies.get(strategyName);

        if (!strategy) {
            console.warn(`Conversion strategy '${strategyName}' not found for device ${device.name}. Using raw value.`);
            return rawValue;
        }

        try {
            // Pass context to strategy
            return strategy.convert(rawValue, device, strategyName, context);
        } catch (error) {
            console.error(`Error converting value for device ${device.name}:`, error);
            return rawValue;
        }
    }

    /**
     * Smart conversion that attempts to find a strategy producing the 'targetUnit'.
     * If found, it uses that strategy. If not, it falls back to the default strategy.
     */
    convertSmart(device: IDevice, rawValue: number, context?: any): { value: number, unit?: string, strategyUsed: string } {
        // 1. Identify Default Strategy
        // Just like in convert(), explicit override > device config > default logic
        let defaultStrategyName = device.config.conversionStrategy;
        if (!defaultStrategyName) {
            defaultStrategyName = (device.config.driverId === 'dfrobot_ec_k1') ? 'ec-dfr-analog' : 'linear';
        }

        // 2. Resolve Strategy Registry & Units (Legacy/Meta Logic - Optional)
        let activeStrategyName = defaultStrategyName;
        // ... (StrategyRegistry logic omitted for brevity as it's legacy/complex dependencies) ...

        // 3. Execute
        const result = this.convert(device, rawValue, activeStrategyName, context);

        let val: number;
        let dynamicUnit: string | undefined;

        if (typeof result === 'object' && 'unit' in result) {
            val = result.value;
            dynamicUnit = result.unit;
        } else {
            val = result as number;
        }

        // Resolve static meta unit if dynamic unit not present
        // const registryPath = require('path').resolve(__dirname, '../../../../shared/strategies/StrategyRegistry');
        // const { StrategyRegistry } = require(registryPath);
        // const finalStratDef = StrategyRegistry.get(activeStrategyName);

        return {
            value: val,
            unit: dynamicUnit, // || finalStratDef?.outputUnit, 
            strategyUsed: activeStrategyName
        };
    }
}

export const conversionService = new ConversionService();