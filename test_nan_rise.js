const sweph = require('sweph');
sweph.set_ephe_path('./ephe');
console.log('Testing NaN rise_trans');
try {
  sweph.rise_trans(NaN, sweph.constants.SE_SUN, '', sweph.constants.SEFLG_SWIEPH, sweph.constants.SE_CALC_RISE, [80, 25, 0], 0, 0);
  console.log('Did not crash');
} catch (e) {
  console.log('Threw error:', e);
}
