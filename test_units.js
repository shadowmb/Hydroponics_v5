
const { convertValue, normalizeValue } = require('./shared/UnitRegistry');

console.log('--- Unit Conversion Test ---');
const val = 4;
const from = 'ppm';
const to = 'µS/cm';

const norm = normalizeValue(val, from);
console.log(`Normalization of ${val} ${from}:`, norm);

const converted = convertValue(val, from, to);
console.log(`Conversion of ${val} ${from} to ${to}:`, converted);

const uS = 1413;
const toPpm = convertValue(uS, 'µS/cm', 'ppm');
console.log(`Conversion of ${uS} µS/cm to ppm:`, toPpm);
