/**
 * UnitConversionService
 * 
 * Purpose:
 * Handles conversion between different units of measurement within the same category
 * (e.g., Time, Volume, Temperature, Distance).
 * 
 * Usage Scenario:
 * When a user defines a variable in a specific unit (e.g., 'minutes') but a hardware block
 * expects a different unit (e.g., 'milliseconds'), this service is used to normalize the value
 * before execution.
 * 
 * Example:
 * const result = unitConversionService.convert(10, 'min', 'ms'); // Returns 600000
 */

type UnitCategory = 'time' | 'volume' | 'temperature' | 'distance' | 'conductivity' | 'pressure' | 'flow' | 'light' | 'generic' | 'unknown';

interface UnitDefinition {
    category: UnitCategory;
    toBase: (val: number) => number;   // Convert TO the base unit
    fromBase: (val: number) => number; // Convert FROM the base unit
}

export class UnitConversionService {
    private units: Map<string, UnitDefinition> = new Map();

    constructor() {
        this.registerTimeUnits();
        this.registerVolumeUnits();
        this.registerTemperatureUnits();
        this.registerDistanceUnits();
        this.registerConductivityUnits();
        this.registerPressureUnits();
        this.registerFlowUnits();
        this.registerLightUnits();
        this.registerGenericUnits();
    }

    /**
     * Converts a value from one unit to another.
     * @param value The numerical value to convert
     * @param fromUnit The unit of the input value (e.g., 'min')
     * @param toUnit The target unit (e.g., 'ms')
     * @returns The converted value
     * @throws Error if units are incompatible or unknown
     */
    public convert(value: number, fromUnit: string, toUnit: string): number {
        if (fromUnit === toUnit) return value;

        const fromDef = this.units.get(fromUnit);
        const toDef = this.units.get(toUnit);

        if (!fromDef) throw new Error(`Unknown source unit: ${fromUnit}`);
        if (!toDef) throw new Error(`Unknown target unit: ${toUnit}`);

        if (fromDef.category !== toDef.category) {
            throw new Error(`Incompatible units: Cannot convert ${fromUnit} (${fromDef.category}) to ${toUnit} (${toDef.category})`);
        }

        // 1. Convert to Base Unit
        const baseValue = fromDef.toBase(value);

        // 2. Convert from Base Unit to Target
        return toDef.fromBase(baseValue);
    }

    /**
     * Checks if a conversion is possible between two units.
     */
    public canConvert(fromUnit: string, toUnit: string): boolean {
        const fromDef = this.units.get(fromUnit);
        const toDef = this.units.get(toUnit);
        return !!(fromDef && toDef && fromDef.category === toDef.category);
    }

    // --- Registration Helpers ---

    private registerTimeUnits() {
        // Base Unit: Milliseconds (ms)
        const category: UnitCategory = 'time';

        this.units.set('ms', { category, toBase: v => v, fromBase: v => v });
        this.units.set('s', { category, toBase: v => v * 1000, fromBase: v => v / 1000 });
        this.units.set('min', { category, toBase: v => v * 60000, fromBase: v => v / 60000 });
        this.units.set('h', { category, toBase: v => v * 3600000, fromBase: v => v / 3600000 });
    }

    private registerVolumeUnits() {
        // Base Unit: Milliliters (ml)
        const category: UnitCategory = 'volume';

        this.units.set('ml', { category, toBase: v => v, fromBase: v => v });
        this.units.set('l', { category, toBase: v => v * 1000, fromBase: v => v / 1000 });
        this.units.set('gal', { category, toBase: v => v * 3785.41, fromBase: v => v / 3785.41 }); // US Gallon
    }

    private registerTemperatureUnits() {
        // Base Unit: Celsius (C)
        const category: UnitCategory = 'temperature';

        this.units.set('C', { category, toBase: v => v, fromBase: v => v });
        this.units.set('F', {
            category,
            toBase: v => (v - 32) * 5 / 9,
            fromBase: v => (v * 9 / 5) + 32
        });
    }

    private registerDistanceUnits() {
        // Base Unit: Centimeters (cm)
        const category: UnitCategory = 'distance';

        this.units.set('cm', { category, toBase: v => v, fromBase: v => v });
        this.units.set('mm', { category, toBase: v => v / 10, fromBase: v => v * 10 });
        this.units.set('m', { category, toBase: v => v * 100, fromBase: v => v / 100 });
        this.units.set('in', { category, toBase: v => v * 2.54, fromBase: v => v / 2.54 });
        this.units.set('ft', { category, toBase: v => v * 30.48, fromBase: v => v / 30.48 });
    }

    private registerConductivityUnits() {
        // Base Unit: µS/cm (microsiemens per cm)
        const category: UnitCategory = 'conductivity';

        this.units.set('uS/cm', { category, toBase: v => v, fromBase: v => v });
        this.units.set('uS_cm', { category, toBase: v => v, fromBase: v => v }); // Alias
        this.units.set('µS/cm', { category, toBase: v => v, fromBase: v => v }); // Alias
        this.units.set('mS/cm', { category, toBase: v => v * 1000, fromBase: v => v / 1000 });
        this.units.set('ppm', { category, toBase: v => v / 0.5, fromBase: v => v * 0.5 }); // Assuming 0.5 conversion factor (Hanna/NaCl)
    }

    private registerPressureUnits() {
        // Base Unit: psi
        const category: UnitCategory = 'pressure';

        this.units.set('psi', { category, toBase: v => v, fromBase: v => v });
        this.units.set('bar', { category, toBase: v => v * 14.5038, fromBase: v => v / 14.5038 });
        this.units.set('kPa', { category, toBase: v => v * 0.145038, fromBase: v => v / 0.145038 });
        this.units.set('Pa', { category, toBase: v => v * 0.000145038, fromBase: v => v / 0.000145038 });
    }

    private registerFlowUnits() {
        // Base Unit: l/min
        const category: UnitCategory = 'flow';

        this.units.set('l/min', { category, toBase: v => v, fromBase: v => v });
        this.units.set('L/min', { category, toBase: v => v, fromBase: v => v }); // Alias
        this.units.set('l/h', { category, toBase: v => v / 60, fromBase: v => v * 60 });
        this.units.set('L/h', { category, toBase: v => v / 60, fromBase: v => v * 60 }); // Alias
        this.units.set('ml/min', { category, toBase: v => v / 1000, fromBase: v => v * 1000 });
        this.units.set('gpm', { category, toBase: v => v * 3.78541, fromBase: v => v / 3.78541 });
    }

    private registerLightUnits() {
        // Base Unit: lux
        // Note: Converting Lux (Illuminance) to PPFD (PAR) depends on Light Source Spectrum.
        // We will enable strict conversion within same type, or approximate for generic white light (Sunlight ~0.0185, LED varies).
        // For safe validation, we keep them as same category but might throw warning if conversion attempted?
        // Actually, let's separate them if accurate conversion is impossible.
        // But users might want to roughly compare. Let's keep separate for now unless requested.
        const category: UnitCategory = 'light';

        this.units.set('lux', { category, toBase: v => v, fromBase: v => v });
        this.units.set('lx', { category, toBase: v => v, fromBase: v => v }); // Alias
        this.units.set('klux', { category, toBase: v => v * 1000, fromBase: v => v / 1000 });
        // PPFD
        this.units.set('umol/m2*s', { category, toBase: v => v, fromBase: v => v }); // Treat as base if from PAR sensor? No, let's add separate 'par' category later if needed.
        // For now, let's grouping Lux and PPFD is dangerous.
        // Let's stick to Lux for 'light'.
    }

    private registerGenericUnits() {
        const category: UnitCategory = 'generic';

        this.units.set('%', { category, toBase: v => v, fromBase: v => v });
        this.units.set('percent', { category, toBase: v => v, fromBase: v => v });
        this.units.set('boolean', { category, toBase: v => v, fromBase: v => v }); // 0 or 1
        this.units.set('on/off', { category, toBase: v => v, fromBase: v => v });
    }
}

export const unitConversionService = new UnitConversionService();
