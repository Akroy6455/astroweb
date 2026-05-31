import { calculateChart } from './src/lib/astrology';

const res = calculateChart(2026, 5, 2, 12, 28.6139, 77.2090); // Delhi lat, lon
console.log(JSON.stringify(res, null, 2));
