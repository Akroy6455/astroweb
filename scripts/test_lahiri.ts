import { calculateChart } from './src/lib/astrology';

const res = calculateChart(2026, 8, 24, 15.8677, 25.78, 87.48, 1, 'Lahiri');
console.log('Success:', res != null);
