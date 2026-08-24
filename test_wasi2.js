const { load } = require('@fusionstrings/swisseph-wasi');

async function test() {
  const sweph = await load();
  console.log(sweph);
}
test();
