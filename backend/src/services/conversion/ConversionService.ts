import { IDevice } from '../../models/Device';
import { IConversionStrategy } from './strategies/IConversionStrategy';
import { LinearInterpolationStrategy } from './strategies/LinearInterpolationStrategy';
import { EcDfrStrategy } from './strategies/EcDfrStrategy';
import { VolumetricFlowStrategy } from './strategies/VolumetricFlowStrategy';

export class ConversionService {
    private strategies: Map<string, IConversionStrategy> = new Map();

    constructor() {
        // Register default strategies
        this.registerStrategy('linear', new LinearInterpolationStrategy());
        this.registerStrategy('ec-dfr-analog', new EcDfrStrategy());
        this.registerStrategy('volumetric_flow', new VolumetricFlowStrategy());
        this.registerStrategy('tank_volume', new LinearInterpolationStrategy());
    }

    registerStrategy(name: string, strategy: IConversionStrategy) {
        this.strategies.set(name, strategy);
    }

    convert(device: IDevice, rawValue: number, strategyOverride?: string): number {
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
            return strategy.convert(rawValue, device, strategyName);
        } catch (error) {
            console.error(`Error converting value for device ${device.name}:`, error);
            return rawValue;
        }
    }

    /**
     * Smart conversion that attempts to find a strategy producing the 'targetUnit'.
     * If found, it uses that strategy. If not, it falls back to the default strategy.
     */
    convertSmart(device: IDevice, rawValue: number, targetUnit?: string): { value: number, unit?: string, strategyUsed: string } {
        // 1. Identify Default Strategy
        // Just like in convert(), explicit override > device config > default logic
        let defaultStrategyName = device.config.conversionStrategy;
        if (!defaultStrategyName) {
            defaultStrategyName = (device.config.driverId === 'dfrobot_ec_k1') ? 'ec-dfr-analog' : 'linear';
        }

        // 2. Resolve Strategy Registry & Units
        // We need to dynamically import or access StrategyRegistry to check output units.
        // Assuming StrategyRegistry is available globally or we can import it.
        // To avoid circular refs, we might need to rely on what's registered or passed helpers. 
        // For now, let's assume we can try to "peek" at other strategies if targetUnit is provided.

        let activeStrategyName = defaultStrategyName;

        if (targetUnit) {
            // Lazy import to avoid circular dependency
            const registryPath = require('path').resolve(__dirname, '../../../../shared/strategies/StrategyRegistry');
            const { StrategyRegistry } = require(registryPath);

            // Check if Default Strategy already matches
            const defStrat = StrategyRegistry.get(defaultStrategyName);
            if (defStrat && defStrat.outputUnit === targetUnit) {
                // Perfect, use default.
                activeStrategyName = defaultStrategyName;
            } else {
                // Hunt for a better strategy
                const allstrategies = StrategyRegistry.getAll();
                const bestFit = allstrategies.find((s: any) =>
                    s.outputUnit === targetUnit &&
                    StrategyRegistry.isStrategyAvailable(s.id, device.config)
                );

                if (bestFit) {
                    activeStrategyName = bestFit.id;
                    // console.log(`[SmartConvert] Switched to '${activeStrategyName}' for unit '${targetUnit}'`);
                }
            }
        }

        // 3. Execute
        const val = this.convert(device, rawValue, activeStrategyName);

        // Resolve final unit for return (to help HardwareService know what happened)
        // We re-fetch definition to be sure
        const registryPath = require('path').resolve(__dirname, '../../../../shared/strategies/StrategyRegistry');
        const { StrategyRegistry } = require(registryPath);
        const finalStratDef = StrategyRegistry.get(activeStrategyName);

        return {
            value: val,
            unit: finalStratDef?.outputUnit || undefined,
            strategyUsed: activeStrategyName
        };
    }
}

export const conversionService = new ConversionService();