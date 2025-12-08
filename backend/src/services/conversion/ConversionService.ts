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
            return strategy.convert(rawValue, device);
        } catch (error) {
            console.error(`Error converting value for device ${device.name}:`, error);
            return rawValue;
        }
    }
}

export const conversionService = new ConversionService();