import { calculateChart } from './src/lib/astrology';

const startMem = process.memoryUsage().heapUsed;
for(let i=0; i<100; i++) {
   calculateChart(2026, 8, 24, 15.8677, 25.78, 87.48, 1, 'Raman');
}
const endMem = process.memoryUsage().heapUsed;

console.log('Memory used for 100 runs:', (endMem - startMem) / 1024 / 1024, 'MB');
