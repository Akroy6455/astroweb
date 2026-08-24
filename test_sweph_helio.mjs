import * as sweph from 'sweph';

const jd = 2460000;
const flags = sweph.constants.SEFLG_SWIEPH | sweph.constants.SEFLG_HELCTR | sweph.constants.SEFLG_SIDEREAL;

sweph.set_ephe_path('./public/ephe');

try {
  const res = sweph.calc_ut(jd, sweph.constants.SE_MERCURY, flags);
  console.log("Success:", res);
} catch (e) {
  console.log("Error:", e);
}
