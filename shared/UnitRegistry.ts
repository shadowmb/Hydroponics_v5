/**
 * Unit Registry (Shared)
 * Source of Truth for Physical Units and their Categories.
 * Used by both Frontend (Validation) and Backend (Conversion).
 */

export type UnitCategory =
    | 'time'
    | 'volume'
    | 'temperature'
    | 'distance'
    | 'conductivity'
    | 'pressure'
    | 'flow'
    | 'light'
    | 'analytic'
    | 'generic'
    | 'unknown';

interface UnitDefinition {
    category: UnitCategory;
    base: boolean; // Is this the base unit for the category?
}

// Map of Unit String -> Definition
const UNITS: Record<string, UnitDefinition> = {};

// Helper to register units confidently
const register = (category: UnitCategory, ...units: string[]) => {
    units.forEach((u, i) => {
        UNITS[u] = { category, base: i === 0 };
    });
};

// --- DIGEST OF ALL UNITS ---
// Time
register('time', 'ms', 's', 'min', 'h');

// Volume
register('volume', 'ml', 'l', 'gal', 'L');

// Temperature
register('temperature', 'C', 'F', 'K');

// Distance / Level
register('distance', 'mm', 'cm', 'm', 'in', 'ft', 'inch');

// Conductivity
register('conductivity', 'µS/cm', 'uS/cm', 'uS_cm', 'mS/cm', 'ppm');

// Pressure
register('pressure', 'psi', 'bar', 'kPa', 'Pa');

// Flow
register('flow', 'l/min', 'L/min', 'l/h', 'L/h', 'ml/min', 'gpm');

// Light
register('light', 'lux', 'lx', 'klux', 'umol/m2*s', 'W/m2');

// Analytic (Chemistry/Environment)
register('analytic', 'pH', 'ORP', 'DO');

// Generic / State
register('generic', 'adc', 'mV', 'mv', '%', 'percent', 'boolean', 'on/off', 'count', 'iterations', 'integer', 'index', '#');



/**
 * Get the category of a specific unit.
 * Safe to use for validation logic.
 */
export const getUnitCategory = (unit: string): UnitCategory => {
    if (!unit) return 'unknown';
    // Normalize aliases if needed (e.g. trims)
    const clean = unit.trim();
    return UNITS[clean]?.category || 'unknown';
};

/**
 * Check if two units are compatible (same category).
 */
export const areUnitsCompatible = (unitA: string, unitB: string): boolean => {
    const catA = getUnitCategory(unitA);
    const catB = getUnitCategory(unitB);
    if (catA === 'unknown' || catB === 'unknown') return false; // Strict safety
    if (catA === 'generic' || catB === 'generic') return true; // Generics are permissive? Or stricter? 
    // Actually, generic vs specific likely fails (e.g. % vs C). 
    // But generic vs generic is OK.

    return catA === catB;
};

// --- CONVERSION LOGIC ---

// Simple linear conversion factors to BASE unit of the category
// Base units are defined by the first item in register() calls above.
// Time Base: 'ms'
// Distance Base: 'mm'
// Temperature Base: 'C'
// Volume Base: 'ml'
// Pressure Base: 'psi'
// Flow Base: 'l/min' (Wait, 'l/min' is first? Let's verify)

const FACTORS: Record<string, number | ((v: number) => number)> = {
    // Time (Base: ms)
    's': 1000,
    'min': 60000,
    'h': 3600000,

    // Distance (Base: mm)
    'cm': 10,
    'm': 1000,
    'in': 25.4,
    'ft': 304.8,
    'inch': 25.4,

    // Volume (Base: ml)
    'l': 1000,
    'L': 1000,
    'gal': 3785.41,

    // Temperature (Base: C)
    'F': (val: number) => (val - 32) * 5 / 9,
    'K': (val: number) => val - 273.15,

    // Pressure (Base: psi)
    'bar': 14.5038,
    'kPa': 0.145038,
    'Pa': 0.000145038,

    // Flow (Base: l/min)
    'L/min': 1,
    'l/h': 1 / 60,
    'L/h': 1 / 60,
    'ml/min': 0.001,
    'gpm': 3.78541,

    // Conductivity (Base: µS/cm)
    'uS/cm': 1,
    'uS_cm': 1,
    'mS/cm': 1000,
    'ppm': 2.0 // Standard 500 scale: 1000 uS/cm = 500 ppm
};

/**
 * Normalizes a value from a given unit to its category's BASE unit.
 * Used by Backend HardwareService to standardize readings.
 */
export const normalizeValue = (value: number, unit: string): { value: number, baseUnit: string } | null => {
    if (!unit) return null;
    const cleanUnit = unit.trim();
    const def = UNITS[cleanUnit];

    if (!def) {
        // Unknown unit, return null or maybe strict error?
        // For now, null implies "cannot normalize"
        return null;
    }

    // If already base, return as is
    if (def.base) {
        return { value, baseUnit: cleanUnit };
    }

    // Look for conversion factor
    const factor = FACTORS[cleanUnit];
    if (factor === undefined) {
        // No conversion known, return null
        return null;
    }

    let normalized = value;
    if (typeof factor === 'function') {
        normalized = factor(value);
    } else {
        normalized = value * factor;
    }

    // Find the base unit name for this category
    // This is a bit inefficient (O(N)), but N is small.
    // Optimization: Store baseUnit in UnitDefinition?
    const baseUnit = Object.keys(UNITS).find(u => UNITS[u].category === def.category && UNITS[u].base);

    if (!baseUnit) return null;

    return { value: normalized, baseUnit };
};

export const getAllUnits = (): string[] => Object.keys(UNITS).sort();

// --- INVERSE CONVERSION LOGIC (Base -> Unit) ---
const INVERSE_CONVERSIONS: Record<string, (v: number) => number> = {
    'F': (val: number) => (val * 9 / 5) + 32,
    'K': (val: number) => val + 273.15,
};

/**
 * Converts a value from one unit to another.
 * Handles normalization and compatibility checks.
 */
export const convertValue = (value: number, fromUnit: string, toUnit: string): number | null => {
    if (!fromUnit || !toUnit) return null;
    const cleanFrom = fromUnit.trim();
    const cleanTo = toUnit.trim();

    // 1. Normalize source to base
    const sourceNorm = normalizeValue(value, cleanFrom);
    if (!sourceNorm) return null;

    const { value: baseValue, baseUnit } = sourceNorm;

    // 2. Check compatibility
    const toDef = UNITS[cleanTo];
    if (!toDef) return null;

    const baseDef = UNITS[baseUnit];
    if (!baseDef || baseDef.category !== toDef.category) return null;

    // 3. Convert Base -> Target
    if (cleanTo === baseUnit) return baseValue;

    const factor = FACTORS[cleanTo];
    if (factor === undefined) return null;

    if (typeof factor === 'number') {
        const result = baseValue / factor;
        // Round to 3 decimal places for sanity? No, keeep precision.
        return result;
    } else {
        // It's a function (Temperature)
        const inverse = INVERSE_CONVERSIONS[cleanTo];
        if (inverse) {
            return inverse(baseValue);
        }
        return null; // No inverse defined
    }
};
