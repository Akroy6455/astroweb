const sweph = require('sweph');
sweph.set_ephe_path(__dirname + '/ephe/');
sweph.set_sid_mode(sweph.constants.SE_SIDM_RAMAN, 0, 0);

const jd = sweph.julday(2026, 5, 2, 12.0, sweph.constants.SE_GREG_CAL);
const flag = sweph.constants.SEFLG_SIDEREAL | sweph.constants.SEFLG_SPEED;

try {
    const res = sweph.houses_ex(jd, flag, 28.6139, 77.2090, 'P');
    console.log("Sync return:", res);
} catch(e) {
    console.log("Sync error:", e);
}
