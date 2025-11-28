/**
 * Unit Registry
 * Defines the "Source of Truth" for physical units in the system.
 * 
 * Architecture:
 * - Base Unit: The unit used for storage in the Database (Immutable).
 * - Derived Units: Units that can be converted to/from the Base Unit.
 * - Conversion: Functions to normalize (Source -> Base) and display (Base -> Target).
 */

export type ConversionFunction = (val: number) => number;

export interface UnitDefinition {
    base: string;
    keys: string[]; // Allowed Metric Keys for this family
    derived: string[];
    // Converts FROM derived unit TO base unit (Normalization)
    toBase: Record<string, ConversionFunction>;
    // Converts FROM base unit TO derived unit (Display)
    fromBase: Record<string, ConversionFunction>;
}

export const UNIT_REGISTRY: Record<string, UnitDefinition> = {
    DISTANCE: {
        base: 'mm',
        keys: ['distance', 'depth', 'height', 'level'],
        derived: ['cm', 'm', 'inch', 'ft'],
        toBase: {
            mm: (val) => val,
            cm: (val) => val * 10,
            m: (val) => val * 1000,
            inch: (val) => val * 25.4,
            ft: (val) => val * 304.8
        },
        fromBase: {
            mm: (val) => val,
            cm: (val) => val / 10,
            m: (val) => val / 1000,
            inch: (val) => val / 25.4,
            ft: (val) => val / 304.8
        }
    },
    TEMP: {
        base: 'C',
        keys: ['temp', 'water_temp', 'soil_temp', 'air_temp'],
        derived: ['F', 'K'],
        toBase: {
            C: (val) => val,
            F: (val) => (val - 32) * 5 / 9,
            K: (val) => val - 273.15
        },
        fromBase: {
            C: (val) => val,
            F: (val) => (val * 9 / 5) + 32,
            K: (val) => val + 273.15
        }
    },
    EC: {
        base: 'uS_cm', // Microsiemens per cm
        keys: ['ec'],
        derived: ['mS_cm'],
        toBase: {
            uS_cm: (val) => val,
            mS_cm: (val) => val * 1000
        },
        fromBase: {
            uS_cm: (val) => val,
            mS_cm: (val) => val / 1000
        }
    },
    HUMIDITY: {
        base: 'pct', // Percentage 0-100
        keys: ['humidity', 'soil_moisture'],
        derived: [],
        toBase: { pct: (val) => val },
        fromBase: { pct: (val) => val }
    },
    PH: {
        base: 'ph',
        keys: ['ph'],
        derived: [],
        toBase: { ph: (val) => val },
        fromBase: { ph: (val) => val }
    },
    LIGHT: {
        base: 'umol_m2_s',
        keys: ['par'],
        derived: [],
        toBase: { umol_m2_s: (val) => val },
        fromBase: { umol_m2_s: (val) => val }
    }
};

// Helper to normalize value (Source Unit -> Base Unit)
export const normalizeValue = (value: number, unit: string): { value: number, baseUnit: string } | null => {
    for (const familyKey in UNIT_REGISTRY) {
        const family = UNIT_REGISTRY[familyKey];
        if (family.toBase[unit]) {
            return {
                value: family.toBase[unit](value),
                baseUnit: family.base
            };
        }
    }
    return null; // Unit not found in registry
};
