import { IDevice } from '../../models/Device';
import { IConversionStrategy } from './strategies/IConversionStrategy';
import { LinearInterpolationStrategy } from './strategies/LinearInterpolationStrategy';
import { EcDfrStrategy } from './strategies/EcDfrStrategy';
import { VolumetricFlowStrategy } from './strategies/VolumetricFlowStrategy';
import { PhDfrStrategy } from './strategies/PhDfrStrategy';

export class ConversionService {
    private strategies: Map<string, IConversionStrategy> = new Map();

    constructor() {
        // Register strategies
        // Simple sensors use 'linear' (default) - UnitRegistry handles unit normalization
        this.registerStrategy('linear', new LinearInterpolationStrategy());
        this.registerStrategy('tank_volume', new LinearInterpolationStrategy());
        this.registerStrategy('volumetric_flow', new VolumetricFlowStrategy());

        // Complex sensors with special physics need dedicated strategies
        this.registerStrategy('ec-dfr-analog', new EcDfrStrategy());
        this.registerStrategy('ph_dfr', new PhDfrStrategy());
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
            // Strategy not found - fallback to 'linear' instead of returning raw
            console.warn(`Conversion strategy '${strategyName}' not found for device ${device.name}. Falling back to 'linear'.`);
            const linearStrategy = this.strategies.get('linear');
            if (linearStrategy) {
                return linearStrategy.convert(rawValue, device, 'linear', context);
            }
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

        // 2. Fallback if strategy doesn't exist
        let activeStrategyName = defaultStrategyName;
        if (!this.strategies.has(activeStrategyName)) {
            console.warn(`Strategy '${activeStrategyName}' not registered, falling back to 'linear'`);
            activeStrategyName = 'linear';
        }

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