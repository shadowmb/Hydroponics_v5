import { areUnitsCompatible } from '../UnitRegistry';

export type StrategyType = 'SENSOR' | 'ACTUATOR';

export interface StrategyDefinition {
    id: string;
    label: string;
    type: StrategyType;
    description: string;

    /**
     * The unit that the hardware provides (or expects).
     * e.g. 'cm' for Distance Sensor, 'boolean' for Relay.
     */
    inputUnit: string;

    /**
     * The unit that the strategy outputs (or accepts from user).
     * e.g. 'l' for Tank Volume, 'ml' for Dosing Pump.
     */
    outputUnit: string;

    /**
     * Configuration for the Calibration Wizard.
     * If present, this strategy requires calibration.
     */
    calibration?: {
        /**
         * The key in device.config.calibrations to check for existence.
         */
        calibrationKey: string;

        /**
         * The UI component to render in the Wizard (e.g., 'MultiPointTable').
         */
        component: string;

        minPoints?: number;
        xLabel?: string;
        yLabel?: string;
    };
}

/**
 * The Central Registry of all supported strategies.
 */
const STRATEGIES: Record<string, StrategyDefinition> = {
    // --- SENSORS ---
    'linear': {
        id: 'linear',
        label: 'Default (Linear/Raw)',
        type: 'SENSOR',
        description: 'Standard linear reading (y = mx + c). Returns value in base unit.',
        inputUnit: 'any',
        outputUnit: 'any',
        calibration: {
            calibrationKey: 'linear',
            component: 'MultiPointTable',
            minPoints: 2,
            xLabel: 'Raw Input',
            yLabel: 'Calibrated Value'
        }
    },
    'offset_only': {
        id: 'offset_only',
        label: 'Offset Only',
        type: 'SENSOR',
        description: 'Simple offset adjustment (val + offset).',
        inputUnit: 'any',
        outputUnit: 'any',
    },
    'tank_volume': {
        id: 'tank_volume',
        label: 'Tank Volume (Liters)',
        type: 'SENSOR',
        description: 'Converts distance measurement to volume using a multi-point lookup table.',
        inputUnit: 'mm',
        outputUnit: 'l',
        calibration: {
            calibrationKey: 'tank_volume',
            component: 'MultiPointTable',
            minPoints: 2,
            xLabel: 'Distance (mm)',
            yLabel: 'Volume (L)'
        }
    },
    'two_point_linear': {
        id: 'two_point_linear',
        label: 'Two-Point Linear Calibration',
        type: 'SENSOR',
        description: 'Calibrate using two known reference points (e.g. pH 4.0/7.0).',
        inputUnit: 'any',
        outputUnit: 'any',
        calibration: {
            calibrationKey: 'two_point_linear', // Matches device config schema
            component: 'MultiPointTable',       // Reusing existing table component
            minPoints: 2,
            xLabel: 'Raw Value',
            yLabel: 'Calibrated Value'
        }
    },
    'ph_dfr': {
        id: 'ph_dfr',
        label: 'DFRobot pH (Pro/V2) [Legacy]',
        type: 'SENSOR',
        description: 'Traditional temperature-compensated pH conversion (Legacy).',
        inputUnit: 'any',
        outputUnit: 'pH',
        calibration: {
            calibrationKey: 'ph_dfr',
            component: 'MultiPointTable',
            minPoints: 1,
            xLabel: 'Raw Value',
            yLabel: 'pH Value'
        }
    },
    'ph_smart': {
        id: 'ph_smart',
        label: 'Smart pH Tracker',
        type: 'SENSOR',
        description: 'Advanced 3-point segmented linear conversion with Nernst temp compensation and health diagnostics.',
        inputUnit: 'any',
        outputUnit: 'pH',
        calibration: {
            calibrationKey: 'ph_smart',
            component: 'PhSmartWizard',

            minPoints: 1, // 1=Offset, 2=Slope, 3=Segmented
            xLabel: 'Raw Input',
            yLabel: 'pH Value (Buffer)'
        }
    },
    'ec_smart': {
        id: 'ec_smart',
        label: 'Smart EC Tracker',
        type: 'SENSOR',
        description: 'Advanced 3-point segmented linear conversion with automatic temperature compensation and K-Factor diagnostics.',
        inputUnit: 'any',
        outputUnit: 'mS/cm',
        calibration: {
            calibrationKey: 'ec_smart',
            component: 'EcSmartWizard',

            minPoints: 1,
            xLabel: 'Raw Input',
            yLabel: 'EC Value (uS/cm)'
        }
    },

    // --- ACTUATORS ---
    'actuator_manual': {
        id: 'actuator_manual',
        label: 'Manual Control (On/Off)',
        type: 'ACTUATOR',
        description: 'Simple ON/OFF switching.',
        inputUnit: 'boolean',
        outputUnit: 'boolean'
    },
    'volumetric_flow': {
        id: 'volumetric_flow',
        label: 'Precise Dosing (Volume)',
        type: 'ACTUATOR',
        description: 'Dose a specific volume by running for a calculated duration.',
        inputUnit: 'ms',
        outputUnit: 'ml',
        calibration: {
            calibrationKey: 'volumetric_flow',
            component: 'TwoPointLinear',
            xLabel: 'Duration (ms)',
            yLabel: 'Volume (ml)'
        }
    },
    'range_linear': {
        id: 'range_linear',
        label: 'PWM Range Mapping',
        type: 'ACTUATOR',
        description: 'Maps 0-100% input to a specific PWM range (e.g. 100-255).',
        inputUnit: 'percent',
        outputUnit: 'pwm_value',
        calibration: {
            calibrationKey: 'range_linear',
            component: 'SetLimit', // New component or reuse
            xLabel: 'Input (%)',
            yLabel: 'PWM Output'
        }
    }
};

export class StrategyRegistry {
    /**
     * Get a strategy definition by ID.
     */
    static get(id: string): StrategyDefinition | undefined {
        return STRATEGIES[id];
    }

    /**
     * Get all registered strategies.
     */
    static getAll(): StrategyDefinition[] {
        return Object.values(STRATEGIES);
    }

    /**
     * Get strategies filtered by type.
     */
    static getForType(type: StrategyType): StrategyDefinition[] {
        return Object.values(STRATEGIES).filter(s => s.type === type);
    }

    /**
     * Check if a strategy is available for a specific device configuration.
     * Returns true if the strategy does NOT require calibration, OR if the required calibration exists.
     */
    static isStrategyAvailable(strategyId: string, deviceConfig: any): boolean {
        const strategy = STRATEGIES[strategyId];
        if (!strategy) return false;

        // If no calibration required, it's always available
        if (!strategy.calibration) return true;

        // Check if calibration exists in device config
        const calKey = strategy.calibration.calibrationKey;
        return !!(deviceConfig?.calibrations && deviceConfig.calibrations[calKey]);
    }
}

/**
 * Resolves the final output unit of a strategy, handling 'any' by looking up device default.
 */
export const resolveStrategyOutputUnit = (
    strategyId: string | undefined,
    deviceContext?: { device: any, template: any }
): string | undefined => {
    if (!strategyId) return undefined;
    const strategy = StrategyRegistry.get(strategyId);
    if (!strategy) return undefined;

    let outputUnit = strategy.outputUnit;

    if (outputUnit === 'any' && deviceContext) {
        const { template } = deviceContext;
        const driverCommand = template?.commands ? (Array.isArray(template.commands) ? template.commands.find((c: any) => c.label === 'Read' || c.name === 'READ') : template.commands['READ']) : null;
        const nativeUnit = driverCommand?.sourceUnit || template?.uiConfig?.defaultUnit;

        if (nativeUnit) {
            outputUnit = nativeUnit;
        }
    }
    return outputUnit === 'any' ? undefined : outputUnit;
};

/**
 * Validates if a Block's configuration is valid regarding its Strategy and Variable.
 * 
 * @param strategyId The selected strategy (e.g. 'tank_volume')
 * @param variableUnit The unit of the variable assigned to the block (e.g. 'l')
 * @param deviceContext Optional. If provided, allows resolving "any" strategy input to the device's native unit.
 *                      Should contain the device object and optionally the template.
 * @returns { isValid: boolean, error?: string }
 */
export const validateBlockStrategy = (
    strategyId: string | undefined,
    variableUnit: string | undefined,
    deviceContext?: { device: any, template: any }
): { isValid: boolean, error?: string } => {

    // 1. Basic Checks
    if (!strategyId) return { isValid: true };
    if (!variableUnit) return { isValid: true };

    const outputUnit = resolveStrategyOutputUnit(strategyId, deviceContext);

    // If unit is still unknown or any, assume valid
    if (!outputUnit) return { isValid: true };

    // 2. Compare Units
    if (!areUnitsCompatible(outputUnit, variableUnit)) {
        return {
            isValid: false,
            error: `Incompatible Units: Strategy outputs '${outputUnit}', but Variable is '${variableUnit}'.`
        };
    }

    return { isValid: true };
};

/**
 * Validates if the selected device has the necessary calibration for the chosen strategy.
 */
export const validateStrategyCalibration = (
    strategyId: string | undefined,
    deviceConfig: any
): { isValid: boolean, error?: string } => {
    if (!strategyId) return { isValid: true };
    const strategy = StrategyRegistry.get(strategyId);
    if (!strategy) return { isValid: true }; // Unknown strategy, assume valid or let other checks fail

    if (strategy.calibration) {
        const calKey = strategy.calibration.calibrationKey;
        const hasCal = deviceConfig?.calibrations && deviceConfig.calibrations[calKey];

        if (!hasCal) {
            return {
                isValid: false,
                error: `Missing Calibration: '${strategy.label}' requires '${calKey}' calibration.`
            };
        }
    }
    return { isValid: true };
};
