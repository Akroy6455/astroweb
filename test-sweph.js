const { load, Constants } = require('@fusionstrings/swisseph-wasi');

async function main() {
  const sweph = await load();
  // Set Ayanamsa to Raman
  sweph.swe_set_sid_mode(Constants.SE_SIDM_RAMAN, 0, 0);

  // calculate JD for today
  const jd = sweph.swe_julday(2026, 5, 2, 12.0, Constants.SE_GREG_CAL);
  console.log("JD:", jd);

  // Calc sun
  const flag = Constants.SEFLG_SIDEREAL | Constants.SEFLG_SPEED;
  const res = sweph.swe_calc_ut(jd, Constants.SE_SUN, flag);
  console.log("Sun:", res);
}

main().catch(console.error);
