import sweph from 'sweph';
import path from 'path';
import fs from 'fs';
import { calculateAshtakavarga } from './ashtakavarga';
import { calculateShadbala } from './shadbala';
import { extractMLFeatures } from './ml_features';
import { calculateAwasthas, calculateVargaClassifications } from './awasthas';
import { calculateVimshottariDasha } from './dasha';
import { calculatePanchang } from './panchang';
import { evaluateYogaState } from './yoga_engine/engine';
import { calculateVimshopakBala } from './vimshopak';
import { calculateSpecialLagnas } from './special_lagnas';
import { generateDashaTimeSeries, DEFAULT_NDS_WEIGHTS } from './nds_engine';

// Robust ephemeris path resolution for both local dev and Vercel serverless
function findEphePath(): string {
  const candidates = [
    path.join(process.cwd(), 'ephe'),
    path.join(__dirname, '..', '..', 'ephe'),
    path.join(__dirname, '..', '..', '..', 'ephe'),
    path.join(__dirname, '..', '..', '..', '..', 'ephe'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  // Fallback to process.cwd() even if not found (sweph will use internal data)
  console.warn('Could not find ephe directory, tried:', candidates);
  return path.join(process.cwd(), 'ephe');
}

const ephePath = findEphePath();
sweph.set_ephe_path(ephePath + '/');

const PLANETS = [
  { id: sweph.constants.SE_SUN, name: 'Sun', short: 'Su' },
  { id: sweph.constants.SE_MOON, name: 'Moon', short: 'Mo' },
  { id: sweph.constants.SE_MARS, name: 'Mars', short: 'Ma' },
  { id: sweph.constants.SE_MERCURY, name: 'Mercury', short: 'Me' },
  { id: sweph.constants.SE_JUPITER, name: 'Jupiter', short: 'Ju' },
  { id: sweph.constants.SE_VENUS, name: 'Venus', short: 'Ve' },
  { id: sweph.constants.SE_SATURN, name: 'Saturn', short: 'Sa' },
  { id: sweph.constants.SE_URANUS, name: 'Uranus', short: 'Ur' },
  { id: sweph.constants.SE_NEPTUNE, name: 'Neptune', short: 'Ne' },
  { id: sweph.constants.SE_PLUTO, name: 'Pluto', short: 'Pl' },
  { id: sweph.constants.SE_MEAN_NODE, name: 'Rahu', short: 'Ra' },
  { id: 'KETU', name: 'Ketu', short: 'Ke' }, // Ketu is always 180 deg from Rahu
  { id: 'MANDI', name: 'Mandi', short: 'Md' },
  { id: 'GULIKA', name: 'Gulika', short: 'Gl' },
  { id: 'DHOOMA', name: 'Dhooma', short: 'Dh' },
  { id: 'VYATIPATA', name: 'Vyatipata', short: 'Vy' },
  { id: 'PARIVESHA', name: 'Parivesha', short: 'Pa' },
  { id: 'INDRACHAPA', name: 'Indrachapa', short: 'In' },
  { id: 'UPAKETU', name: 'Upaketu', short: 'Uk' }
];

const NAKSHATRAS = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
  "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
  "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
  "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha",
  "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
];

const SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

function getNakshatra(longitude: number) {
  // Total 360 degrees divided by 27 nakshatras = 13.333333 degrees per nakshatra
  const degreesPerNakshatra = 360 / 27;
  const index = Math.floor(longitude / degreesPerNakshatra);
  const remainder = longitude % degreesPerNakshatra;
  const pada = Math.floor(remainder / (degreesPerNakshatra / 4)) + 1;
  return { name: NAKSHATRAS[index], pada, index };
}

function getRasi(longitude: number) {
  const index = Math.floor(longitude / 30);
  const degreesInSign = longitude % 30;
  return { name: SIGNS[index], index, degreesInSign };
}

function getNavamsha(rasiIndex: number, degreesInSign: number) {
  // 1 Navamsha = 3 degrees 20 minutes = 3.3333... degrees = 30 / 9
  const navamshaPart = Math.floor(degreesInSign / (30 / 9)); 
  
  let startSignIndex = 0;
  if ([0, 4, 8].includes(rasiIndex)) startSignIndex = 0;     // Fire starts from Aries
  if ([1, 5, 9].includes(rasiIndex)) startSignIndex = 9;     // Earth starts from Capricorn
  if ([2, 6, 10].includes(rasiIndex)) startSignIndex = 6;    // Air starts from Libra
  if ([3, 7, 11].includes(rasiIndex)) startSignIndex = 3;    // Water starts from Cancer
  
  const navamshaIndex = (startSignIndex + navamshaPart) % 12;
  return { name: SIGNS[navamshaIndex], index: navamshaIndex, part: navamshaPart + 1 };
}

function getDivisionalSign(signIndex: number, degInSign: number, division: number): number {
  const isOdd = signIndex % 2 === 0; // 0-indexed: Aries(0)=odd(1st), Taurus(1)=even(2nd)
  const isMovable = [0, 3, 6, 9].includes(signIndex);
  const isFixed = [1, 4, 7, 10].includes(signIndex);
  const isFire = [0, 4, 8].includes(signIndex);
  const isEarth = [1, 5, 9].includes(signIndex);
  const isAir = [2, 6, 10].includes(signIndex);

  const part = Math.min(Math.floor(degInSign / (30 / division)), division - 1);

  switch (division) {
    case 1: return signIndex;

    case 2: { // Hora
      const h = degInSign < 15 ? 0 : 1;
      return isOdd ? (h === 0 ? 4 : 3) : (h === 0 ? 3 : 4);
    }

    case 3: { // Drekkana
      const offsets = [0, 4, 8];
      return (signIndex + offsets[part]) % 12;
    }

    case 4: { // Chaturthamsha
      let start = signIndex;
      if (isFixed) start = (signIndex + 3) % 12;
      else if (!isMovable) start = (signIndex + 6) % 12;
      return (start + part) % 12;
    }

    case 5: { // Panchamsha
      return (signIndex + part) % 12;
    }

    case 6: { // Shashthamsha
      const start = isOdd ? signIndex : (signIndex + 6) % 12;
      return (start + part) % 12;
    }

    case 7: { // Saptamsha
      const start = isOdd ? signIndex : (signIndex + 6) % 12;
      return (start + part) % 12;
    }

    case 8: { // Ashtamsha
      let start = 0;
      if (isMovable) start = 0;
      else if (isFixed) start = 8;
      else start = 4;
      return (start + part) % 12;
    }

    case 9: { // Navamsha
      let start = 0;
      if (isFire) start = 0;
      else if (isEarth) start = 9;
      else if (isAir) start = 6;
      else start = 3;
      return (start + part) % 12;
    }

    case 10: { // Dashamsha
      const start = isOdd ? signIndex : (signIndex + 8) % 12;
      return (start + part) % 12;
    }

    case 11: { // Rudramsha
      return (signIndex + part) % 12;
    }

    case 12: { // Dwadashamsha
      return (signIndex + part) % 12;
    }

    case 16: { // Shodashamsha
      let start = 0;
      if (isMovable) start = 0;
      else if (isFixed) start = 4;
      else start = 8;
      return (start + part) % 12;
    }

    case 20: { // Vimshamsha
      let start = 0;
      if (isMovable) start = 0;
      else if (isFixed) start = 8;
      else start = 4;
      return (start + part) % 12;
    }

    case 24: { // Chaturvimshamsha
      const start = isOdd ? 4 : 3;
      return (start + part) % 12;
    }

    case 27: { // Bhamsha / Nakshatramsha
      let start = 0;
      if (isFire) start = 0;
      else if (isEarth) start = 3;
      else if (isAir) start = 6;
      else start = 9;
      return (start + part) % 12;
    }

    case 30: { // Trimshamsha - unequal divisions
      if (isOdd) {
        if (degInSign < 5) return 0;
        if (degInSign < 10) return 10;
        if (degInSign < 18) return 8;
        if (degInSign < 25) return 2;
        return 6;
      } else {
        if (degInSign < 5) return 1;
        if (degInSign < 12) return 5;
        if (degInSign < 20) return 11;
        if (degInSign < 25) return 9;
        return 7;
      }
    }

    case 40: { // Khavedamsha
      const start = isOdd ? 0 : 6;
      return (start + part) % 12;
    }

    case 45: { // Akshavedamsha
      let start = 0;
      if (isMovable) start = 0;
      else if (isFixed) start = 4;
      else start = 8;
      return (start + part) % 12;
    }

    case 60: { // Shashtiamsha
      return (signIndex + part) % 12;
    }

    default: return signIndex;
  }
}

export function calculateChart(year: number, month: number, day: number, hour: number, lat: number, lon: number, localDayOfWeek: number = 0, ayanamsha: string = 'Raman') {
  if (ayanamsha === 'Lahiri') {
    sweph.set_sid_mode(sweph.constants.SE_SIDM_LAHIRI, 0, 0);
  } else {
    sweph.set_sid_mode(sweph.constants.SE_SIDM_RAMAN, 0, 0);
  }

  // hour should be UT hour
  const jd = sweph.julday(year, month, day, hour, sweph.constants.SE_GREG_CAL);
  
  const flag = sweph.constants.SEFLG_SIDEREAL | sweph.constants.SEFLG_SPEED;

  // Pre-calculate Mandi and Gulika JDs
  const rsmiRise = sweph.constants.SE_CALC_RISE | sweph.constants.SE_BIT_DISC_CENTER | sweph.constants.SE_BIT_NO_REFRACTION;
  const rsmiSet = sweph.constants.SE_CALC_SET | sweph.constants.SE_BIT_DISC_CENTER | sweph.constants.SE_BIT_NO_REFRACTION;
  
  const midnightJd = Math.floor(jd - 0.5) + 0.5;
  const resRise = sweph.rise_trans(midnightJd, sweph.constants.SE_SUN, "", sweph.constants.SEFLG_SWIEPH, rsmiRise, [lon, lat, 0], 0, 0);
  const sunriseJd = resRise.data;
  const resSet = sweph.rise_trans(sunriseJd, sweph.constants.SE_SUN, "", sweph.constants.SEFLG_SWIEPH, rsmiSet, [lon, lat, 0], 0, 0);
  const sunsetJd = resSet.data;
  
  let isDayTime = false;
  let segmentDuration = 0;
  let startJd = 0;

  if (jd >= sunriseJd && jd < sunsetJd) {
     isDayTime = true;
     segmentDuration = (sunsetJd - sunriseJd) / 8;
     startJd = sunriseJd;
  } else {
     isDayTime = false;
     let nightStartJd, nightEndJd;
     if (jd < sunriseJd) {
         const prevMidJd = midnightJd - 1;
         const resPrevSet = sweph.rise_trans(prevMidJd, sweph.constants.SE_SUN, "", sweph.constants.SEFLG_SWIEPH, rsmiSet, [lon, lat, 0], 0, 0);
         nightStartJd = resPrevSet.data;
         nightEndJd = sunriseJd;
     } else {
         nightStartJd = sunsetJd;
         const nextMidJd = midnightJd + 1;
         const resNextRise = sweph.rise_trans(nextMidJd, sweph.constants.SE_SUN, "", sweph.constants.SEFLG_SWIEPH, rsmiRise, [lon, lat, 0], 0, 0);
         nightEndJd = resNextRise.data;
     }
     segmentDuration = (nightEndJd - nightStartJd) / 8;
     startJd = nightStartJd;
  }

  const gulikaDayIndex = [6, 5, 4, 3, 2, 1, 0];
  const gulikaNightIndex = [2, 1, 0, 6, 5, 4, 3];
  const mandiDayIndex = [5, 4, 3, 2, 1, 0, 6];
  const mandiNightIndex = [1, 0, 6, 5, 4, 3, 2];

  const gIndex = isDayTime ? gulikaDayIndex[localDayOfWeek] : gulikaNightIndex[localDayOfWeek];
  const mIndex = isDayTime ? mandiDayIndex[localDayOfWeek] : mandiNightIndex[localDayOfWeek];

  const gulikaJd = startJd + (gIndex * segmentDuration);
  const mandiJd = startJd + (mIndex * segmentDuration);

  const housesGulika = sweph.houses_ex(gulikaJd, flag, lat, lon, 'P');
  const gulikaLong = (housesGulika as any).points ? (housesGulika as any).points[0] : (housesGulika as any).data?.points[0] || 0;

  const housesMandi = sweph.houses_ex(mandiJd, flag, lat, lon, 'P');
  const mandiLong = (housesMandi as any).points ? (housesMandi as any).points[0] : (housesMandi as any).data?.points[0] || 0;

  const positions: any[] = [];

  for (const p of PLANETS) {
    if (['KETU', 'MANDI', 'GULIKA', 'DHOOMA', 'VYATIPATA', 'PARIVESHA', 'INDRACHAPA', 'UPAKETU'].includes(p.id as string)) {
      let calcLong = 0;
      let speed = 0;
      let retrograde = false;

      if (p.id === 'KETU') {
        const rahu = positions.find(pos => pos.name === 'Rahu');
        if (rahu) {
          calcLong = (rahu.longitude + 180) % 360;
          speed = rahu.speed;
          retrograde = rahu.retrograde;
        }
      } else if (p.id === 'MANDI') {
        calcLong = mandiLong;
      } else if (p.id === 'GULIKA') {
        calcLong = gulikaLong;
      } else {
        const sun = positions.find(pos => pos.name === 'Sun');
        if (sun) {
          const dhooma = (sun.longitude + 133.333333) % 360;
          const vyatipata = (360 - dhooma) % 360;
          const parivesha = (vyatipata + 180) % 360;
          const indrachapa = (360 - parivesha) % 360;
          
          if (p.id === 'DHOOMA') calcLong = dhooma;
          if (p.id === 'VYATIPATA') calcLong = vyatipata;
          if (p.id === 'PARIVESHA') calcLong = parivesha;
          if (p.id === 'INDRACHAPA') calcLong = indrachapa;
          if (p.id === 'UPAKETU') calcLong = (indrachapa + 16.666666) % 360;
          
          speed = sun.speed;
          retrograde = sun.retrograde;
        }
      }

      const rasi = getRasi(calcLong);
      const nakshatra = getNakshatra(calcLong);
      const navamsha = getNavamsha(rasi.index, rasi.degreesInSign);
      positions.push({
        ...p,
        longitude: calcLong,
        speed,
        retrograde,
        rasi,
        nakshatra,
        navamsha
      });
      continue;
    }

    const res = sweph.calc_ut(jd, p.id as number, flag);
    const longitude = res.data[0];
    const speed = res.data[3];
    const retrograde = speed < 0;

    const rasi = getRasi(longitude);
    const nakshatra = getNakshatra(longitude);
    const navamsha = getNavamsha(rasi.index, rasi.degreesInSign);

    positions.push({
      ...p,
      longitude,
      speed,
      retrograde,
      rasi,
      nakshatra,
      navamsha
    });
  }

  // Calculate Ascendant (Lagna)
  const houses = sweph.houses_ex(jd, flag, lat, lon, 'P');
  const points = (houses as any).points || (houses as any).data?.points;
  const ascLongitude = points ? points[0] : 0;
  
  let lagna = null;
  let d9Lagna = null;
  if (ascLongitude) {
     const ascRasi = getRasi(ascLongitude);
     const ascNakshatra = getNakshatra(ascLongitude);
     const ascNavamsha = getNavamsha(ascRasi.index, ascRasi.degreesInSign);
     
     lagna = { name: 'Lagna', short: 'As', longitude: ascLongitude, speed: 0, retrograde: false, rasi: ascRasi, nakshatra: ascNakshatra, navamsha: ascNavamsha };
     d9Lagna = { name: 'D9 Lagna', short: 'As', longitude: 0, speed: 0, retrograde: false, rasi: ascNavamsha, nakshatra: ascNakshatra, navamsha: ascNavamsha };
  }

  // Map planets to houses based on Lagna (whole sign house system for D1)
  const housesMap = Array.from({length: 12}, (_, i) => ({
    house: i + 1,
    signIndex: lagna ? (lagna.rasi.index + i) % 12 : i,
    planets: [] as any[]
  }));

  // Map planets to houses based on D9 Lagna (whole sign house system for D9)
  const d9HousesMap = Array.from({length: 12}, (_, i) => ({
    house: i + 1,
    signIndex: d9Lagna ? (d9Lagna.rasi.index + i) % 12 : i,
    planets: [] as any[]
  }));

  const avPosMap: any = { Lagna: lagna ? lagna.rasi.index : 0 };

  for (const pos of positions) {
    // D1 mapping
    const houseIndex = housesMap.findIndex(h => h.signIndex === pos.rasi.index);
    if (houseIndex !== -1) {
      housesMap[houseIndex].planets.push(pos);
    }
    // D9 mapping
    const d9HouseIndex = d9HousesMap.findIndex(h => h.signIndex === pos.navamsha.index);
    if (d9HouseIndex !== -1) {
      d9HousesMap[d9HouseIndex].planets.push(pos);
    }
    // AV mapping
    if (['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'].includes(pos.name)) {
      avPosMap[pos.name] = pos.rasi.index;
    }
  }

  // Compute all divisional charts
  const DIVISIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 16, 20, 24, 27, 30, 40, 45, 60];
  const divisionalCharts: Record<string, { lagna: any, houses: any[] }> = {};

  for (const div of DIVISIONS) {
    let divLagna = null;
    if (lagna) {
      const divLagnaSignIdx = getDivisionalSign(lagna.rasi.index, lagna.rasi.degreesInSign, div);
      divLagna = { name: `D${div} Lagna`, short: 'As', rasi: { name: SIGNS[divLagnaSignIdx], index: divLagnaSignIdx } };
    }

    const divHouses = Array.from({length: 12}, (_, i) => ({
      house: i + 1,
      signIndex: divLagna ? (divLagna.rasi.index + i) % 12 : i,
      planets: [] as any[]
    }));

    for (const pos of positions) {
      const divSign = getDivisionalSign(pos.rasi.index, pos.rasi.degreesInSign, div);
      const hIdx = divHouses.findIndex(h => h.signIndex === divSign);
      if (hIdx !== -1) {
        divHouses[hIdx].planets.push(pos);
      }
    }

    divisionalCharts[`D${div}`] = { lagna: divLagna, houses: divHouses };
  }

  const ashtakavarga = calculateAshtakavarga(avPosMap);

  const shadbala = calculateShadbala(positions, lagna, jd);
  const awasthas = calculateAwasthas(positions, lagna, jd, lat, lon);
  
  // Calculate Dasha
  const moon = positions.find((p: any) => p.name === 'Moon');
  let dasha: any[] = [];
  if (moon) {
    const hourInt = Math.floor(hour);
    const minInt = Math.floor((hour - hourInt) * 60);
    const secInt = Math.floor((hour - hourInt - minInt / 60) * 3600);
    const birthDate = new Date(Date.UTC(year, month - 1, day, hourInt, minInt, secInt));
    dasha = calculateVimshottariDasha(moon.longitude, birthDate, positions, housesMap);

    // Calculate Dasha Pravesh (transit at start of MD and AD)
    if (lagna) {
      const natalLagnaRasiIndex = lagna.rasi.index;
      const getPlanetId = (name: string) => PLANETS.find(p => p.name === name)?.id;

      for (const md of dasha) {
        const pId = getPlanetId(md.planet);
        if (pId !== undefined) {
          const dDate = new Date(md.start);
          const mdJd = sweph.julday(dDate.getUTCFullYear(), dDate.getUTCMonth() + 1, dDate.getUTCDate(), dDate.getUTCHours() + dDate.getUTCMinutes() / 60, sweph.constants.SE_GREG_CAL);
          let lon = 0;
          if (pId === 'KETU') {
             const rahuRes = sweph.calc_ut(mdJd, sweph.constants.SE_MEAN_NODE, flag);
             lon = (rahuRes.data[0] + 180) % 360;
          } else {
             const res = sweph.calc_ut(mdJd, pId as number, flag);
             lon = res.data[0];
          }
          const rasi = getRasi(lon);
          const nakshatra = getNakshatra(lon);
          const house = (rasi.index - natalLagnaRasiIndex + 12) % 12 + 1;
          md.pravesh = { rasi, nakshatra, house };
        }

        if (md.subPeriods) {
          for (const ad of md.subPeriods) {
            const adId = getPlanetId(ad.planet);
            if (adId !== undefined) {
              const adDate = new Date(ad.start);
              const adJd = sweph.julday(adDate.getUTCFullYear(), adDate.getUTCMonth() + 1, adDate.getUTCDate(), adDate.getUTCHours() + adDate.getUTCMinutes() / 60, sweph.constants.SE_GREG_CAL);
              let lon = 0;
              if (adId === 'KETU') {
                 const rahuRes = sweph.calc_ut(adJd, sweph.constants.SE_MEAN_NODE, flag);
                 lon = (rahuRes.data[0] + 180) % 360;
              } else {
                 const res = sweph.calc_ut(adJd, adId as number, flag);
                 lon = res.data[0];
              }
              const rasi = getRasi(lon);
              const nakshatra = getNakshatra(lon);
              const house = (rasi.index - natalLagnaRasiIndex + 12) % 12 + 1;
              ad.pravesh = { rasi, nakshatra, house };
            }
          }
        }
      }
    }
  }

  const sun = positions.find((p: any) => p.name === 'Sun');
  let panchang = null;
  if (sun && moon) {
    panchang = calculatePanchang(sun.longitude, moon.longitude, localDayOfWeek);
  }

  const timestampId = new Date().toISOString();
  const mlData = extractMLFeatures({ lagna, d9Lagna, positions, ashtakavarga, shadbala }, timestampId);

  const yogaState = evaluateYogaState(jd, lat, lon, lagna as any, positions as any, housesMap as any, awasthas);
  const vimshopakBala = calculateVimshopakBala(positions, divisionalCharts, yogaState);
  
  const specialLagnas = calculateSpecialLagnas(jd, lat, lon, positions, lagna, housesMap);
  
  // Calculate Varga Classifications
  const vargaClasses = calculateVargaClassifications(positions, divisionalCharts, shadbala, specialLagnas?.arudhaLagna, awasthas);
  // Merge varga classifications into awasthas
  for (const pName of Object.keys(awasthas)) {
    if (vargaClasses[pName]) {
      awasthas[pName].shadvarga = vargaClasses[pName].shadvarga;
      awasthas[pName].saptavarga = vargaClasses[pName].saptavarga;
      awasthas[pName].dasavarga = vargaClasses[pName].dasavarga;
      awasthas[pName].shodashvarga = vargaClasses[pName].shodashvarga;
    }
  }

  // NDS time series — one data point per Antardasha boundary
  const alSignIndex = specialLagnas?.arudhaLagna?.rasi?.index ?? 0;
  let dashaTimeSeries: any[] = [];
  try {
    dashaTimeSeries = generateDashaTimeSeries(dasha, yogaState, positions, alSignIndex, awasthas, DEFAULT_NDS_WEIGHTS);
  } catch (e) {
    console.warn('NDS time series generation failed:', e);
  }

  let transitTimeSeries: any[] = [];
  try {
    if (dashaTimeSeries.length > 0 && ashtakavarga?.bav) {
      transitTimeSeries = generateMonthlyTransitTimeSeries(dashaTimeSeries, ashtakavarga, panchang);
    }
  } catch (e) {
    console.warn('Transit time series generation failed:', e);
  }

  return {
    jd,
    lagna,
    d9Lagna,
    positions,
    houses: housesMap,
    d9Houses: d9HousesMap,
    ashtakavarga,
    shadbala,
    vimshopakBala,
    awasthas,
    dasha,
    panchang,
    mlData,
    yogaState,
    divisionalCharts,
    specialLagnas,
    dashaTimeSeries,
    transitTimeSeries
  };
}

export function generateMonthlyTransitTimeSeries(
  dashaTimeSeries: any[],
  ashtakavarga: any,
  panchang?: any,
  positions?: any[],
  lagna?: any
) {
  if (!dashaTimeSeries || dashaTimeSeries.length === 0 || !ashtakavarga?.bav) {
    return [];
  }

  const flag = sweph.constants.SEFLG_SIDEREAL | sweph.constants.SEFLG_SPEED;

  const points: any[] = [];
  
  const startDate = new Date(dashaTimeSeries[0].date);
  
  const periods = dashaTimeSeries.map((d: any, index: number) => {
     const nextDate = index < dashaTimeSeries.length - 1 
         ? new Date(dashaTimeSeries[index + 1].date)
         : new Date(startDate.getTime() + 120 * 365.25 * 24 * 60 * 60 * 1000);
     return {
         start: new Date(d.date).getTime(),
         end: nextDate.getTime(),
         mdPlanet: d.mdPlanet,
         adPlanet: d.adPlanet,
         baseNds: d.percentage
     };
  });

  const endDate = periods[periods.length - 1].end;
  let currentDateTs = startDate.getTime();

  const transitPlanets = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
  const navtaraPlanets = [...transitPlanets, 'Rahu', 'Ketu'];
  const planetIds: Record<string, number> = {
    'Sun': sweph.constants.SE_SUN,
    'Moon': sweph.constants.SE_MOON,
    'Mars': sweph.constants.SE_MARS,
    'Mercury': sweph.constants.SE_MERCURY,
    'Jupiter': sweph.constants.SE_JUPITER,
    'Venus': sweph.constants.SE_VENUS,
    'Saturn': sweph.constants.SE_SATURN,
    'Rahu': sweph.constants.SE_TRUE_NODE,
    'Ketu': sweph.constants.SE_TRUE_NODE
  };

  const navtaraWeights = [1.0, 1.3, 0.8, 1.2, 0.8, 1.3, 0.7, 1.2, 1.4];
  const moonNakIndex = panchang?.nakshatra?.index ?? 0;

  while (currentDateTs <= endDate) {
    const dDate = new Date(currentDateTs);
    const jd = sweph.julday(
      dDate.getUTCFullYear(),
      dDate.getUTCMonth() + 1,
      dDate.getUTCDate(),
      dDate.getUTCHours() + dDate.getUTCMinutes() / 60,
      sweph.constants.SE_GREG_CAL
    );

    const currentPlanetSigns: Record<string, number> = {};
    const currentPlanetNakshatras: Record<string, number> = {};

    let rahuLon = 0;

    for (const p of navtaraPlanets) {
      let lon = 0;
      if (p === 'Ketu') {
        lon = (rahuLon + 180) % 360;
      } else {
        const pId = planetIds[p];
        const res = sweph.calc_ut(jd, pId, flag);
        lon = res.data[0];
        if (p === 'Rahu') rahuLon = lon;
      }
      const signIndex = Math.floor(lon / 30) % 12;
      const nakIndex = Math.floor(lon / (360/27)) % 27;
      currentPlanetSigns[p] = signIndex;
      currentPlanetNakshatras[p] = nakIndex;
    }

    // Ashtakavarga Average (7 planets)
    let astMultipliersSum = 0;
    for (const p of transitPlanets) {
      let multiplier = 1.0;
      if (p === 'Moon') {
        multiplier = 1.0;
      } else {
        const bindus = ashtakavarga.bav[p] ? ashtakavarga.bav[p][currentPlanetSigns[p]] : 4;
        multiplier = 0.6 + (bindus * 0.1);
      }
      astMultipliersSum += multiplier;
    }
    const avgAshtakavargaMultiplier = astMultipliersSum / transitPlanets.length;

    // Navtara Average (9 planets)
    let navtaraMultipliersSum = 0;
    for (const p of navtaraPlanets) {
      let multiplier = 1.0;
      if (p === 'Moon') {
        multiplier = 1.0;
      } else {
        const pNak = currentPlanetNakshatras[p];
        const taraIndex = (pNak - moonNakIndex + 27) % 9;
        multiplier = navtaraWeights[taraIndex];
      }
      navtaraMultipliersSum += multiplier;
    }
    const avgNavtaraMultiplier = navtaraMultipliersSum / navtaraPlanets.length;

    const activePeriod = periods.find((p: any) => currentDateTs >= p.start && currentDateTs < p.end) || periods[periods.length - 1];
    
    const mdLord = activePeriod.mdPlanet;
    const adLord = activePeriod.adPlanet;

    const isShuklaPaksha = panchang?.tithi?.index < 15;
    const moonMdAdMultiplier = isShuklaPaksha ? 1.2 : 0.9;

    // Ashtakavarga MD/AD
    let mdLordAstMultiplier = 1.0;
    let adLordAstMultiplier = 1.0;

    if (transitPlanets.includes(mdLord)) {
       if (mdLord === 'Moon') {
         mdLordAstMultiplier = moonMdAdMultiplier;
       } else {
         const mdSign = currentPlanetSigns[mdLord];
         const mdPoints = ashtakavarga.bav[mdLord][mdSign];
         mdLordAstMultiplier = 0.6 + (mdPoints * 0.1);
       }
    }
    if (transitPlanets.includes(adLord)) {
       if (adLord === 'Moon') {
         adLordAstMultiplier = moonMdAdMultiplier;
       } else {
         const adSign = currentPlanetSigns[adLord];
         const adPoints = ashtakavarga.bav[adLord][adSign];
         adLordAstMultiplier = 0.6 + (adPoints * 0.1);
       }
    }

    // Navtara MD/AD
    let mdLordNavtaraMultiplier = 1.0;
    let adLordNavtaraMultiplier = 1.0;
    
    if (navtaraPlanets.includes(mdLord)) {
       if (mdLord === 'Moon') {
         mdLordNavtaraMultiplier = moonMdAdMultiplier;
       } else {
         const mdNak = currentPlanetNakshatras[mdLord];
         const tara = (mdNak - moonNakIndex + 27) % 9;
         mdLordNavtaraMultiplier = navtaraWeights[tara];
       }
    }
    if (navtaraPlanets.includes(adLord)) {
       if (adLord === 'Moon') {
         adLordNavtaraMultiplier = moonMdAdMultiplier;
       } else {
         const adNak = currentPlanetNakshatras[adLord];
         const tara = (adNak - moonNakIndex + 27) % 9;
         adLordNavtaraMultiplier = navtaraWeights[tara];
       }
    }


    const ascIndex = lagna ? lagna.rasi.index : 0;
    const moonIndex = positions ? (positions.find(p => p.name === 'Moon')?.rasi?.index ?? 0) : 0;

    const getOwnedHouses = (planetName: string, refSignIndex: number) => {
      const ownedHouses = [];
      const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
      const signLords: Record<string, string> = {
        'Aries': 'Mars', 'Taurus': 'Venus', 'Gemini': 'Mercury', 'Cancer': 'Moon', 'Leo': 'Sun', 'Virgo': 'Mercury',
        'Libra': 'Venus', 'Scorpio': 'Mars', 'Sagittarius': 'Jupiter', 'Capricorn': 'Saturn', 'Aquarius': 'Saturn', 'Pisces': 'Jupiter'
      };
      for (let i = 0; i < 12; i++) {
        if (signLords[signs[i]] === planetName) {
          const houseNum = (i - refSignIndex + 12) % 12 + 1;
          ownedHouses.push(houseNum);
        }
      }
      return ownedHouses;
    };

    const advancedTriggers: Record<string, any> = {};
    for (const p of transitPlanets) { // Only 7 planets
      const ownedFromAsc = getOwnedHouses(p, ascIndex);
      const ownedFromMoon = getOwnedHouses(p, moonIndex);
      
      const isMaleficAsc = ownedFromAsc.includes(6) || ownedFromAsc.includes(8) || ownedFromAsc.includes(12);
      const isMaleficMoon = ownedFromMoon.includes(6) || ownedFromMoon.includes(8) || ownedFromMoon.includes(12);
      const isBeneficAsc = ownedFromAsc.includes(1) || ownedFromAsc.includes(5) || ownedFromAsc.includes(9);
      const isBeneficMoon = ownedFromMoon.includes(1) || ownedFromMoon.includes(5) || ownedFromMoon.includes(9);

      const transitSignIndex = currentPlanetSigns[p];
      const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
      const transitSignName = signs[transitSignIndex];

      const isExalted = (p === 'Sun' && transitSignName === 'Aries') || 
                        (p === 'Moon' && transitSignName === 'Taurus') || 
                        (p === 'Mars' && transitSignName === 'Capricorn') || 
                        (p === 'Mercury' && transitSignName === 'Virgo') || 
                        (p === 'Jupiter' && transitSignName === 'Cancer') || 
                        (p === 'Venus' && transitSignName === 'Pisces') || 
                        (p === 'Saturn' && transitSignName === 'Libra');

      const isDebilitated = (p === 'Sun' && transitSignName === 'Libra') || 
                            (p === 'Moon' && transitSignName === 'Scorpio') || 
                            (p === 'Mars' && transitSignName === 'Cancer') || 
                            (p === 'Mercury' && transitSignName === 'Pisces') || 
                            (p === 'Jupiter' && transitSignName === 'Capricorn') || 
                            (p === 'Venus' && transitSignName === 'Virgo') || 
                            (p === 'Saturn' && transitSignName === 'Aries');

const signLords: Record<string, string> = {
        'Aries': 'Mars', 'Taurus': 'Venus', 'Gemini': 'Mercury', 'Cancer': 'Moon', 'Leo': 'Sun', 'Virgo': 'Mercury',
        'Libra': 'Venus', 'Scorpio': 'Mars', 'Sagittarius': 'Jupiter', 'Capricorn': 'Saturn', 'Aquarius': 'Saturn', 'Pisces': 'Jupiter'
      };
      const isOwn = signLords[transitSignName] === p;

      const houseFromAsc = (transitSignIndex - ascIndex + 12) % 12 + 1;
      const houseFromMoon = (transitSignIndex - moonIndex + 12) % 12 + 1;

      
      const in159Asc = houseFromAsc === 1 || houseFromAsc === 5 || houseFromAsc === 9;
      const in159Moon = houseFromMoon === 1 || houseFromMoon === 5 || houseFromMoon === 9;
      const in6812Asc = houseFromAsc === 6 || houseFromAsc === 8 || houseFromAsc === 12;
      const in6812Moon = houseFromMoon === 6 || houseFromMoon === 8 || houseFromMoon === 12;

      advancedTriggers[p] = {
        mAsc: (isMaleficAsc && (isExalted || in159Asc)) || (isBeneficAsc && (isDebilitated || in6812Asc)),
        mMoon: (isMaleficMoon && (isExalted || in159Moon)) || (isBeneficMoon && (isDebilitated || in6812Moon)),
        bAsc: (isBeneficAsc && (isExalted || isOwn || in159Asc)) || (isMaleficAsc && (isDebilitated || in6812Asc)),
        bMoon: (isBeneficMoon && (isExalted || isOwn || in159Moon)) || (isMaleficMoon && (isDebilitated || in6812Moon))
      };
  
    }

    points.push({
      date: dDate.toISOString(),
      baseNds: activePeriod.baseNds,
      avgMultiplier: avgAshtakavargaMultiplier,
      mdLordMultiplier: mdLordAstMultiplier,
      adLordMultiplier: adLordAstMultiplier,
      avgNavtaraMultiplier,
      mdLordNavtaraMultiplier,
      adLordNavtaraMultiplier,
      mdPlanet: mdLord,
      adPlanet: adLord,
      advancedTriggers
    });

    currentDateTs += 30 * 24 * 60 * 60 * 1000;
  }

  return points;
}
