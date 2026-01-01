
const UNITS = {
    'µS/cm': { category: 'conductivity', base: true },
    'ppm': { category: 'conductivity', base: false }
};

const FACTORS = {
    'ppm': 2.0
};

function normalizeValue(value, unit) {
    const def = UNITS[unit];
    if (!def) return null;
    if (def.base) return { value, baseUnit: unit };
    const factor = FACTORS[unit];
    if (factor === undefined) return null;
    return { value: value * factor, baseUnit: 'µS/cm' };
}

function convertValue(value, fromUnit, toUnit) {
    const sourceNorm = normalizeValue(value, fromUnit);
    if (!sourceNorm) return null;
    const { value: baseValue, baseUnit } = sourceNorm;
    if (toUnit === baseUnit) return baseValue;
    const factor = FACTORS[toUnit];
    if (factor === undefined) return null;
    return baseValue / factor;
}

console.log('--- Logic Test ---');
console.log('4 ppm to µS/cm:', convertValue(4, 'ppm', 'µS/cm')); // Expected: 8
console.log('8 µS/cm to ppm:', convertValue(8, 'µS/cm', 'ppm')); // Expected: 4
console.log('1 ppm to µS/cm:', convertValue(1, 'ppm', 'µS/cm')); // Expected: 2
