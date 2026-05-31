const sweph = require('sweph');

console.log(sweph);
console.log("Constants:", sweph.constants);

try {
    sweph.set_ephe_path(__dirname);
    sweph.set_sid_mode(sweph.constants.SE_SIDM_RAMAN, 0, 0);

    const flag = sweph.constants.SEFLG_SIDEREAL | sweph.constants.SEFLG_SPEED;
    const jd = sweph.julday(2026, 5, 2, 12.0, sweph.constants.SE_GREG_CAL);
    console.log("JD:", jd);
    
    // Some versions of sweph use promises or sync
    const res = sweph.calc_ut(jd, sweph.constants.SE_SUN, flag);
    console.log("Result:", res);
} catch (e) {
    console.error("Error:", e);
}
