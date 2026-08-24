const { load } = require('@fusionstrings/swiss-eph');

async function test() {
  const sweph = await load();
  console.log('Loaded:', Object.keys(sweph));
}
test();
