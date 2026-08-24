import { calculateChart } from './src/lib/astrology.js';
async function test() {
  try {
    const data = await calculateChart(2000, 1, 1, 12, 25.78, 87.48, 6, 'Raman');
    console.log('Success', !!data.shadbala);
  } catch(e) {
    console.error('Error:', e);
  }
}
test();
