import { calculateChart } from './src/lib/astrology';

console.time('calculateChart');
const res = calculateChart(2026, 8, 24, 15.8677, 25.78, 87.48, 1, 'Raman');
console.timeEnd('calculateChart');
