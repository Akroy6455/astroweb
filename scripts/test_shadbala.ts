import { calculateChart } from './src/lib/astrology';
async function test() {
  try {
    const data = await calculateChart(24, 8, 2026, 15.8677, 25.78, 87.48, 1, 'Raman');
    console.log('Success', !!data.shadbala);
  } catch(e) {
    console.error('Error:', e);
  }
}
test();
