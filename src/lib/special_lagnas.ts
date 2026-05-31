import sweph from 'sweph';

const SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

const SIGN_RULERS: Record<number, string> = {
  0: 'Mars', 1: 'Venus', 2: 'Mercury', 3: 'Moon', 4: 'Sun', 5: 'Mercury',
  6: 'Venus', 7: 'Mars', 8: 'Jupiter', 9: 'Saturn', 10: 'Saturn', 11: 'Jupiter'
};

function getRasi(longitude: number) {
  const index = Math.floor(longitude / 30);
  const degreesInSign = longitude % 30;
  return { name: SIGNS[index], index, degreesInSign };
}

function norm(a: number) { return ((a % 360) + 360) % 360; }

function calculateArudha(baseHouse: number, lagnaSignIndex: number, housesMap: any[], positions: any[]) {
  // Find the sign of the base house
  const baseSignIndex = (lagnaSignIndex + baseHouse - 1) % 12;
  const lordName = SIGN_RULERS[baseSignIndex];
  const lordPos = positions.find((p: any) => p.name === lordName);
  
  if (!lordPos) return null;
  
  const lordSignIndex = lordPos.rasi.index;
  
  // Count from base to lord (inclusive)
  const dist = (lordSignIndex - baseSignIndex + 12) % 12;
  
  // Arudha is same distance from lord
  let arudhaSignIndex = (lordSignIndex + dist) % 12;
  
  // Exceptions for Arudha
  // If Arudha falls in the base house (dist = 0), it jumps to 10th from base house
  if (dist === 0) {
    arudhaSignIndex = (baseSignIndex + 9) % 12; // 10th house is 9 signs away
  } 
  // If Arudha falls in the 7th from base house (dist = 6), it jumps to 4th from base house
  else if (dist === 6) {
    arudhaSignIndex = (baseSignIndex + 3) % 12; // 4th house is 3 signs away
  }
  
  return arudhaSignIndex;
}

export function calculateSpecialLagnas(jd: number, lat: number, lon: number, positions: any[], lagna: any, housesMap: any[]) {
  if (!lagna) return {};

  const flag = sweph.constants.SEFLG_SIDEREAL | sweph.constants.SEFLG_SPEED;
  
  // 1. Calculate Exact Sunrise
  const geopos: [number, number, number] = [lon, lat, 0];
  let s1 = sweph.rise_trans(jd - 1.5, sweph.constants.SE_SUN, '', sweph.constants.SEFLG_SWIEPH, sweph.constants.SE_CALC_RISE, geopos, 0, 0).data;
  let s2 = sweph.rise_trans(s1 + 0.1, sweph.constants.SE_SUN, '', sweph.constants.SEFLG_SWIEPH, sweph.constants.SE_CALC_RISE, geopos, 0, 0).data;
  
  const final_sunrise_jd = (s2 < jd) ? s2 : s1;
  const delta_jd = jd - final_sunrise_jd;
  const delta_minutes = delta_jd * 24 * 60;
  
  // Ishta Ghati (time from sunrise in Ghatis. 1 Ghati = 24 mins)
  const ishtaGhati = delta_minutes / 24;

  // Get Sun's longitude at exact sunrise
  const sunSunriseRes = sweph.calc_ut(final_sunrise_jd, sweph.constants.SE_SUN, flag);
  const sunSunriseLong = sunSunriseRes.data[0];

  // A. Bhava Lagna (BL): 1 Rasi (30 deg) per 5 Ghatis from Sun's sunrise longitude
  const blProgression = (ishtaGhati / 5) * 30;
  const blLong = norm(sunSunriseLong + blProgression);
  
  // B. Hora Lagna (HL): 1 Rasi (30 deg) per 2.5 Ghatis from Sun's sunrise longitude
  const hlProgression = (ishtaGhati / 2.5) * 30;
  const hlLong = norm(sunSunriseLong + hlProgression);

  // C. Ghati Lagna (GL): 1 Rasi (30 deg) per 1 Ghati from Sun's sunrise longitude
  const glProgression = ishtaGhati * 30;
  const glLong = norm(sunSunriseLong + glProgression);

  // D. Pranapada Lagna (PL): 1 Rasi per 15 Palas (0.25 Ghatis)
  // Base starting point depends on Sun's sign type
  const sun = positions.find((p: any) => p.name === 'Sun');
  let plBaseLong = sun ? sun.longitude : sunSunriseLong; // Fallback
  if (sun) {
    const sunSignIdx = sun.rasi.index;
    const isMovable = [0, 3, 6, 9].includes(sunSignIdx);
    const isFixed = [1, 4, 7, 10].includes(sunSignIdx);
    const isDual = [2, 5, 8, 11].includes(sunSignIdx);
    
    if (isFixed) {
      plBaseLong = norm(sun.longitude + 240); // 9th from Sun (8 signs ahead)
    } else if (isDual) {
      plBaseLong = norm(sun.longitude + 120); // 5th from Sun (4 signs ahead)
    }
  }
  const plProgression = (ishtaGhati / 0.25) * 30;
  const plLong = norm(plBaseLong + plProgression);
  
  // E. Indu Lagna
  let induSignIndex = 0;
  const moon = positions.find(p => p.name === 'Moon');
  if (moon) {
    const kalas: Record<string, number> = {
      Sun: 30, Moon: 16, Mars: 6, Mercury: 8, Jupiter: 10, Venus: 12, Saturn: 1
    };
    
    const lord9thFromLagna = SIGN_RULERS[(lagna.rasi.index + 8) % 12];
    const lord9thFromMoon = SIGN_RULERS[(moon.rasi.index + 8) % 12];
    
    const kalaLagna = kalas[lord9thFromLagna] || 0;
    const kalaMoon = kalas[lord9thFromMoon] || 0;
    
    const totalKalas = kalaLagna + kalaMoon;
    const remainder = totalKalas % 12;
    const addSigns = remainder === 0 ? 11 : remainder - 1; // 1 means same sign
    
    induSignIndex = (moon.rasi.index + addSigns) % 12;
  }

  // F. Arudha Lagna (AL) & Upapada Lagna (UL)
  const alSignIndex = calculateArudha(1, lagna.rasi.index, housesMap, positions);
  const ulSignIndex = calculateArudha(12, lagna.rasi.index, housesMap, positions);

  // Formatting output
  return {
    bhavaLagna: { longitude: blLong, rasi: getRasi(blLong) },
    horaLagna: { longitude: hlLong, rasi: getRasi(hlLong) },
    ghatiLagna: { longitude: glLong, rasi: getRasi(glLong) },
    pranapadaLagna: { longitude: plLong, rasi: getRasi(plLong) },
    induLagna: { rasi: { name: SIGNS[induSignIndex], index: induSignIndex } },
    arudhaLagna: alSignIndex !== null ? { rasi: { name: SIGNS[alSignIndex], index: alSignIndex } } : null,
    upapadaLagna: ulSignIndex !== null ? { rasi: { name: SIGNS[ulSignIndex], index: ulSignIndex } } : null
  };
}
