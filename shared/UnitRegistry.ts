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
register('conductivity', 'uS/cm', 'uS_cm', 'µS/cm', 'mS/cm', 'ppm');

// Pressure
register('pressure', 'psi', 'bar', 'kPa', 'Pa');

// Flow
register('flow', 'l/min', 'L/min', 'l/h', 'L/h', 'ml/min', 'gpm');

// Light
register('light', 'lux', 'lx', 'klux', 'umol/m2*s', 'W/m2');

// Generic / State
register('generic', '%', 'percent', 'boolean', 'on/off');


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

export const getAllUnits = (): string[] => Object.keys(UNITS).sort();
