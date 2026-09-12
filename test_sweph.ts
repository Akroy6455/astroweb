import sweph from 'sweph';

const year = 2024;
const month = 10;
const day = 15;
const hour = 6;
const lat = 28.6139;
const lon = 77.2090;

sweph.set_ephe_path('./public/ephe');
sweph.set_sid_mode(sweph.constants.SE_SIDM_LAHIRI, 0, 0);

const flag = sweph.constants.SEFLG_SIDEREAL;
const jd = sweph.julday(year, month, day, hour, sweph.constants.SE_GREG_CAL);

const houses = sweph.houses_ex(jd, flag, lat, lon, 'P');
console.log("houses:", JSON.stringify(houses, null, 2));
