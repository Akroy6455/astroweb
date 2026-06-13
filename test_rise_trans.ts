import sweph from 'sweph';
import path from 'path';

// Load ephemeris
const ephePath = path.join(process.cwd(), 'ephe');
sweph.set_ephe_path(ephePath + '/');

const jd = sweph.julday(2000, 1, 1, 12, sweph.constants.SE_GREG_CAL);
const rsmiRise = sweph.constants.SE_CALC_RISE | sweph.constants.SE_BIT_DISC_CENTER | sweph.constants.SE_BIT_NO_REFRACTION;
const rsmiSet = sweph.constants.SE_CALC_SET | sweph.constants.SE_BIT_DISC_CENTER | sweph.constants.SE_BIT_NO_REFRACTION;

try {
  const resRise = sweph.rise_trans(jd, sweph.constants.SE_SUN, "", sweph.constants.SEFLG_SWIEPH, rsmiRise, [80, 20, 0], 0, 0);
  console.log("Sunrise JD:", resRise);
  
  const resSet = sweph.rise_trans(jd, sweph.constants.SE_SUN, "", sweph.constants.SEFLG_SWIEPH, rsmiSet, [80, 20, 0], 0, 0);
  console.log("Sunset JD:", resSet);
} catch(e) {
  console.error("Error:", e);
}
