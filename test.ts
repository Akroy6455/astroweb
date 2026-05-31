import { calculateChart } from './src/lib/astrology';

try {
  const result = calculateChart(1990, 1, 1, 12, 28.6, 77.2, 1, 'Raman');
  console.log('Success:', JSON.stringify(result).substring(0, 100));
} catch (e) {
  console.error('Error in calculateChart:', e);
}
