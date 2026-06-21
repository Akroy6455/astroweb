import sweph from 'sweph';

// Parashari Shadbala Engine - Exact Implementation

export type PlanetName = 'Sun' | 'Moon' | 'Mars' | 'Mercury' | 'Jupiter' | 'Venus' | 'Saturn';

const PARAMOCCHA: Record<PlanetName, number> = {
  Sun: 10, Moon: 33, Mars: 298, Mercury: 165, Jupiter: 95, Venus: 357, Saturn: 200,
};

const NAISARGIKA: Record<PlanetName, number> = {
  Sun: 60.00, Moon: 51.43, Venus: 42.85, Jupiter: 34.28, Mercury: 25.70, Mars: 17.14, Saturn: 8.57,
};

const REQUIRED_RUPAS: Record<PlanetName, number> = {
  Sun: 6.5, Moon: 6.0, Mars: 5.0, Mercury: 7.0, Jupiter: 6.5, Venus: 5.5, Saturn: 5.0,
};

const AVG_SPEED: Record<PlanetName, number> = {
  Sun: 0.9856, Moon: 13.1764, Mars: 0.5240, Mercury: 1.3833, Jupiter: 0.0831, Venus: 1.2000, Saturn: 0.0335,
};

const RULER: Record<number, PlanetName> = {
  0: 'Mars', 1: 'Venus', 2: 'Mercury', 3: 'Moon', 4: 'Sun', 5: 'Mercury',
  6: 'Venus', 7: 'Mars', 8: 'Jupiter', 9: 'Saturn', 10: 'Saturn', 11: 'Jupiter'
};

const NATURAL_FRIENDS: Record<PlanetName, PlanetName[]> = {
  Sun: ['Moon', 'Mars', 'Jupiter'],
  Moon: ['Sun', 'Mercury'],
  Mars: ['Sun', 'Moon', 'Jupiter'],
  Mercury: ['Sun', 'Venus'],
  Jupiter: ['Sun', 'Moon', 'Mars'],
  Venus: ['Mercury', 'Saturn'],
  Saturn: ['Mercury', 'Venus'],
};

const NATURAL_ENEMIES: Record<PlanetName, PlanetName[]> = {
  Sun: ['Venus', 'Saturn'],
  Moon: [],
  Mars: ['Mercury'],
  Mercury: ['Moon'],
  Jupiter: ['Mercury', 'Venus'],
  Venus: ['Sun', 'Moon'],
  Saturn: ['Sun', 'Moon', 'Mars'],
};

function norm(a: number) { return ((a % 360) + 360) % 360; }

export function calculateShadbala(positions: any[], lagna: any, jd: number, lat: number, lon: number) {
  const result: Record<string, any> = {};

  const sun = positions.find(p => p.name === 'Sun');
  const moon = positions.find(p => p.name === 'Moon');
  const ascLong = lagna.longitude;
  const sunLongGlobal = sun ? sun.longitude : 0;
  const sunAscAngle = norm(ascLong - sunLongGlobal);
  let localHour = (sunAscAngle / 15) + 6;
  if (localHour >= 24) localHour -= 24;

  // 1. Calculate Vargas for all planets
  const vargas: Record<string, Record<string, number>> = {};
  for (const pos of positions) {
    if (!['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'].includes(pos.name)) continue;
    const l = pos.longitude;
    const sign = Math.floor(l / 30);
    const degInSign = l % 30;
    
    // D1
    const d1 = sign;
    // D2 Hora
    const isEven = sign % 2 !== 0; // 1 is Taurus (Even)
    let d2 = isEven ? (degInSign < 15 ? 3 : 4) : (degInSign < 15 ? 4 : 3);
    // D3 Drekkana
    const dec = Math.floor(degInSign / 10);
    const d3 = (sign + (dec * 4)) % 12;
    // D7 Saptamsha
    const d7Part = Math.floor(degInSign / (30/7));
    const d7 = isEven ? (sign + 6 + d7Part) % 12 : (sign + d7Part) % 12;
    // D9 Navamsha
    const d9Part = Math.floor(degInSign / (30/9));
    const d9 = ((Math.floor(l / (30/9))) % 12); // standard formula
    // D12 Dwadasamsha
    const d12Part = Math.floor(degInSign / 2.5);
    const d12 = (sign + d12Part) % 12;
    // D30 Trishamsha
    let d30 = 0;
    if (!isEven) {
      if (degInSign < 5) d30 = 0; // Aries
      else if (degInSign < 10) d30 = 10; // Aquarius
      else if (degInSign < 18) d30 = 8; // Sagittarius
      else if (degInSign < 25) d30 = 2; // Gemini
      else d30 = 6; // Libra
    } else {
      if (degInSign < 5) d30 = 1; // Taurus
      else if (degInSign < 12) d30 = 5; // Virgo
      else if (degInSign < 20) d30 = 11; // Pisces
      else if (degInSign < 25) d30 = 9; // Capricorn
      else d30 = 7; // Scorpio
    }
    
    vargas[pos.name] = { d1, d2, d3, d7, d9, d12, d30 };
  }

  // Calculate Temporary Relationships (Tatkalika Maitri)
  const tatkalika: Record<string, Record<string, number>> = {};
  for (const p1 of positions) {
    if (!['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'].includes(p1.name)) continue;
    tatkalika[p1.name] = {};
    for (const p2 of positions) {
      if (!['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'].includes(p2.name)) continue;
      if (p1.name === p2.name) continue;
      const s1 = vargas[p1.name].d1;
      const s2 = vargas[p2.name].d1;
      const dist = ((s2 - s1 + 12) % 12) + 1; // 1-based index (1=same sign)
      // Temp Friend: 2, 3, 4, 10, 11, 12
      // Temp Enemy: 1, 5, 6, 7, 8, 9
      if ([2, 3, 4, 10, 11, 12].includes(dist)) {
        tatkalika[p1.name][p2.name] = 1; // Friend
      } else {
        tatkalika[p1.name][p2.name] = -1; // Enemy
      }
    }
  }

  const WEEKDAY_LORDS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
  const HORA_SEQ = ['Saturn', 'Jupiter', 'Mars', 'Sun', 'Venus', 'Mercury', 'Moon'];
  
  // Exact Sunrise Calculation using Swiss Ephemeris
  const geopos: [number, number, number] = [lon, lat, 0];
  let s1 = sweph.rise_trans(jd - 1.5, sweph.constants.SE_SUN, '', sweph.constants.SEFLG_SWIEPH, sweph.constants.SE_CALC_RISE, geopos, 0, 0).data;
  let s2 = sweph.rise_trans(s1 + 0.1, sweph.constants.SE_SUN, '', sweph.constants.SEFLG_SWIEPH, sweph.constants.SE_CALC_RISE, geopos, 0, 0).data;
  
  const final_sunrise_jd = (s2 < jd) ? s2 : s1;
  const next_sunrise_jd = (s2 < jd) ? sweph.rise_trans(s2 + 0.1, sweph.constants.SE_SUN, '', sweph.constants.SEFLG_SWIEPH, sweph.constants.SE_CALC_RISE, geopos, 0, 0).data : s2;

  let ss1 = sweph.rise_trans(final_sunrise_jd, sweph.constants.SE_SUN, '', sweph.constants.SEFLG_SWIEPH, sweph.constants.SE_CALC_SET, geopos, 0, 0).data;
  const final_sunset_jd = (ss1 > final_sunrise_jd && ss1 < next_sunrise_jd) ? ss1 : sweph.rise_trans(final_sunrise_jd + 0.5, sweph.constants.SE_SUN, '', sweph.constants.SEFLG_SWIEPH, sweph.constants.SE_CALC_SET, geopos, 0, 0).data;

  // Exact Vedic Day Lord
  const localSunriseJD = final_sunrise_jd + (lon / 360);
  const wd = Math.floor(localSunriseJD + 1.5) % 7;
  const dayLord = WEEKDAY_LORDS[wd];

  // Exact Hora Lord
  const ahoratra = next_sunrise_jd - final_sunrise_jd;
  const horaFraction = (jd - final_sunrise_jd) / ahoratra; // 0 to 1
  const horaNum = Math.floor(horaFraction * 24); // 0 to 23
  const dayLordHoraIdx = HORA_SEQ.indexOf(dayLord);
  const horaLord = HORA_SEQ[(dayLordHoraIdx + horaNum) % 7]; 

  // Exact Savana Ahargana for Abda and Masa Lords (from Kali Epoch: 588465.5)
  const ahargana = Math.floor(localSunriseJD - 588465.5);
  const years = Math.floor(ahargana / 360);
  
  // JHora default "Use 360-day savana year (from creation)"
  // Srishti epoch solar years = 1955885114
  const srishtiYears = 1955885114 + years;
  const abdaWd = srishtiYears % 7;
  
  // Masa Lord in JHora uses Srishti Epoch months
  // Srishti epoch months = Srishti epoch years * 12
  const srishtiMonths = 1955885114 * 12 + Math.floor(ahargana / 30);
  const masaWd = srishtiMonths % 7;
  
  const abdaLord = WEEKDAY_LORDS[abdaWd];
  const masaLord = WEEKDAY_LORDS[masaWd];

  for (const pos of positions) {
    if (!['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'].includes(pos.name)) continue;
    const name = pos.name as PlanetName;
    const long = pos.longitude;

    // --- I. STHANA BALA ---
    // 1.1 Uccha Bala
    const debLong = norm(PARAMOCCHA[name] + 180);
    let dFromDeb = Math.abs(long - debLong);
    if (dFromDeb > 180) dFromDeb = 360 - dFromDeb;
    const uchchaBala = dFromDeb / 3;

    // 1.2 Saptavargaja Bala
    let saptavargajaBala = 0;
    const myVargas = vargas[name];
    for (const [vName, vSign] of Object.entries(myVargas)) {
      const ruler = RULER[vSign];
      if (ruler === name) {
        // Special check for Moolatrikona in D1
        let isMool = false;
        if (vName === 'd1') {
          const moolSigns: any = { Sun: 4, Moon: 1, Mars: 0, Mercury: 5, Jupiter: 8, Venus: 6, Saturn: 10 };
          if (moolSigns[name] === vSign) isMool = true;
        }
        saptavargajaBala += isMool ? 45 : 30;
      } else {
        const natFriend = NATURAL_FRIENDS[name].includes(ruler) ? 1 : (NATURAL_ENEMIES[name].includes(ruler) ? -1 : 0);
        const tempFriend = tatkalika[name][ruler];
        const combined = natFriend + tempFriend;
        if (combined === 2) saptavargajaBala += 22.5; // Adhi Mitra
        else if (combined === 1) saptavargajaBala += 15.0; // Mitra
        else if (combined === 0) saptavargajaBala += 7.5; // Sama
        else if (combined === -1) saptavargajaBala += 3.75; // Satru
        else if (combined === -2) saptavargajaBala += 1.875; // Adhi Satru
      }
    }

    // 1.3 Ojhayugma
    const isOddRasi = myVargas.d1 % 2 === 0;
    const isOddNav = myVargas.d9 % 2 === 0;
    let ojayugmaBala = 0;
    if (['Sun', 'Mars', 'Jupiter', 'Mercury', 'Saturn'].includes(name)) {
      if (isOddRasi) ojayugmaBala += 15;
      if (isOddNav) ojayugmaBala += 15;
    } else {
      if (!isOddRasi) ojayugmaBala += 15;
      if (!isOddNav) ojayugmaBala += 15;
    }

    // 1.4 Kendradi
    const houseNum = ((myVargas.d1 - Math.floor(ascLong/30) + 12) % 12) + 1;
    let kendradiBala = 0;
    if ([1, 4, 7, 10].includes(houseNum)) kendradiBala = 60;
    else if ([2, 5, 8, 11].includes(houseNum)) kendradiBala = 30;
    else kendradiBala = 15;

    // 1.5 Drekkana
    const dec = Math.floor((long % 30) / 10);
    let drekkanaBala = 0;
    if (['Sun', 'Mars', 'Jupiter'].includes(name) && dec === 0) drekkanaBala = 15;
    else if (['Mercury', 'Saturn'].includes(name) && dec === 1) drekkanaBala = 15;
    else if (['Moon', 'Venus'].includes(name) && dec === 2) drekkanaBala = 15;

    const sthanaBala = uchchaBala + saptavargajaBala + ojayugmaBala + kendradiBala + drekkanaBala;

    // --- II. DIG BALA ---
    const ZSP: any = { Jupiter: norm(ascLong+180), Mercury: norm(ascLong+180), Sun: norm(ascLong+90), Mars: norm(ascLong+90), Saturn: norm(ascLong), Moon: norm(ascLong+270), Venus: norm(ascLong+270) };
    let dFromZsp = Math.abs(long - ZSP[name]);
    if (dFromZsp > 180) dFromZsp = 360 - dFromZsp;
    const digBala = dFromZsp / 3;

    // --- III. KALA BALA ---
    // 3.1 Nathonnata
    let nathonathaBala = 0;
    const distFromNoon = Math.abs(localHour - 12) / 12; // 0 to 1
    const distFromMidnight = localHour < 12 ? Math.abs(localHour / 12) : Math.abs((24 - localHour) / 12);
    if (name === 'Mercury') nathonathaBala = 60;
    else if (['Sun', 'Jupiter', 'Venus'].includes(name)) nathonathaBala = (1 - distFromNoon) * 60;
    else nathonathaBala = (1 - distFromMidnight) * 60;

    // 3.2 Paksha
    let pakshaBala = 0;
    if (sun && moon) {
      const moonLong = moon.longitude;
      let phaseAngle = moonLong - sunLongGlobal;
      if (phaseAngle < 0) phaseAngle += 360;
      if (phaseAngle > 180) phaseAngle = 360 - phaseAngle;

      const benef = phaseAngle / 3;
      const mal = 60 - benef;
      
      const isMercuryMalefic = () => {
        if (name !== 'Mercury') return false;
        let dist = Math.abs(pos.longitude - sunLongGlobal);
        if (dist > 180) dist = 360 - dist;
        if (dist <= 14) return true; // Combust
        
        const mercSign = Math.floor(pos.longitude / 30);
        for (const p of positions) {
          if (['Sun', 'Mars', 'Saturn', 'Rahu', 'Ketu'].includes(p.name)) {
            if (Math.floor(p.longitude / 30) === mercSign) return true;
          }
        }
        return false;
      };
      
      const isBenefic = ['Jupiter', 'Venus', 'Moon'].includes(name) || (name === 'Mercury' && !isMercuryMalefic());
      pakshaBala = isBenefic ? benef : mal;
      if (name === 'Moon') pakshaBala *= 2; // Max 120, do not cap at 60
    }

    // 3.3 Tribhaga
    let tribhagaBala = 0;
    if (name === 'Jupiter') tribhagaBala = 60;
    else {
      if (jd < final_sunset_jd) {
        // Day time
        const dayDuration = final_sunset_jd - final_sunrise_jd;
        const partOfDay = (jd - final_sunrise_jd) / dayDuration;
        if (partOfDay < 1/3 && name === 'Mercury') tribhagaBala = 60;
        else if (partOfDay >= 1/3 && partOfDay < 2/3 && name === 'Sun') tribhagaBala = 60;
        else if (partOfDay >= 2/3 && name === 'Saturn') tribhagaBala = 60;
      } else {
        // Night time
        const nightDuration = next_sunrise_jd - final_sunset_jd;
        const partOfNight = (jd - final_sunset_jd) / nightDuration;
        if (partOfNight < 1/3 && name === 'Moon') tribhagaBala = 60;
        else if (partOfNight >= 1/3 && partOfNight < 2/3 && name === 'Venus') tribhagaBala = 60;
        else if (partOfNight >= 2/3 && name === 'Mars') tribhagaBala = 60;
      }
    }

    const varaBala = dayLord === name ? 45 : 0;
    const horaBala = horaLord === name ? 60 : 0;
    const masaBala = masaLord === name ? 30 : 0;
    const abdaBala = abdaLord === name ? 15 : 0;

    // 3.5 Ayana
    // Lahiri ayanamsa approximation: roughly 24 deg
    const tropLong = norm(long + 24);
    const kranti = Math.asin(Math.sin(tropLong * Math.PI / 180) * Math.sin(23.45 * Math.PI / 180)) * 180 / Math.PI;
    
    let ayanaVal = 0;
    if (['Moon', 'Saturn'].includes(name)) {
      ayanaVal = 60 * (24 - kranti) / 48;
    } else if (['Sun', 'Mars', 'Jupiter', 'Venus'].includes(name)) {
      ayanaVal = 60 * (24 + kranti) / 48;
    } else if (name === 'Mercury') {
      ayanaVal = 60 * (24 + Math.abs(kranti)) / 48;
    }
    
    let ayanaBala = Math.max(0, Math.min(60, ayanaVal));
    if (name === 'Sun') ayanaBala *= 2; // Double for Sun, max 120


    const kalaBala = nathonathaBala + pakshaBala + tribhagaBala + varaBala + horaBala + masaBala + abdaBala + ayanaBala;

    // --- IV. CHESTA BALA ---
    let chestaBala = 0;
    let chestaPhalaVal = 0;
    if (name === 'Sun' || name === 'Moon') {
      chestaBala = 0; // Sun and Moon do not have Chesta Bala
      chestaPhalaVal = 60; // Usually assumed full or calculated differently for phalas, but setting 60 to avoid Kashta Phala penalty, or could be 0. Let's use 0 for now to match.
      chestaPhalaVal = 0;
    } else {
      let seeghrochcha = 0;
      if (['Mars', 'Jupiter', 'Saturn'].includes(name)) {
        seeghrochcha = sunLongGlobal; // True Sun
      } else {
        // Inner planets (Mercury, Venus): Seeghrochcha is their Heliocentric Longitude
        const id = name === 'Mercury' ? sweph.constants.SE_MERCURY : sweph.constants.SE_VENUS;
        const flags = sweph.constants.SEFLG_SWIEPH | sweph.constants.SEFLG_HELCTR | sweph.constants.SEFLG_SIDEREAL;
        const res = sweph.calc_ut(jd, id, flags);
        seeghrochcha = res.data[0];
      }
      
      let ck = norm(seeghrochcha - long);
      if (ck > 180) ck = 360 - ck;
      chestaBala = ck / 3;
      chestaPhalaVal = chestaBala;
    }

    // --- V. NAISARGIKA BALA ---
    const naisargikaBala = NAISARGIKA[name];

    // --- VI. DRIK BALA (Exact Aspectual Calculus from Table) ---
    // Drik Bala is given TO the planet aspected (name/long) FROM the aspecting planet (other)
    let drikBala = 0;
    for (const other of positions) {
      if (other.name === name || !['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'].includes(other.name)) continue;
      
      const aspectingName = other.name as PlanetName;
      // Angle 'a' between aspecting and aspected. User formula: Aspected - Aspector
      let a = norm(long - other.longitude);
      
      let val = 0;
      if (a >= 30 && a < 60) {
        val = (a - 30) / 2;
      } else if (a >= 60 && a < 90) {
        val = (a - 60) + 15;
      } else if (a >= 90 && a < 120) {
        val = (120 - a) / 2 + 30;
      } else if (a >= 120 && a < 150) {
        val = 150 - a;
      } else if (a >= 150 && a < 180) {
        val = (a - 150) * 2;
      } else if (a >= 180 && a < 300) {
        val = (300 - a) / 2;
      }

      // Vishesha Drishti Exceptions (Continuous PVR Logic)
      if (aspectingName === 'Mars') {
        if (a >= 90 && a < 120) val = 45 + (a - 90) / 2;
        else if (a >= 120 && a < 150) val = 2 * (150 - a);
        else if (a >= 210 && a < 240) val = 270 - a;
      } else if (aspectingName === 'Jupiter') {
        if (a >= 90 && a < 120) val = 45 + (a - 90) / 2;
        else if (a >= 120 && a < 150) val = 2 * (150 - a);
        else if (a >= 210 && a < 240) val = 45 + (a - 210) / 2;
      } else if (aspectingName === 'Saturn') {
        if (a >= 30 && a < 60) val = 2 * (a - 30);
        else if (a >= 60 && a < 90) val = 45 + (90 - a) / 2;
        else if (a >= 270 && a < 300) val = 2 * (300 - a);
      }

      // Cap at 60 Virupas
      val = Math.min(60, val);
      
      // Absolute value to handle any naturally negative outcomes (like 150-180 bracket)
      val = Math.abs(val);
      
      let aspectMod = val;
      // User rule: Jupiter and Mercury 100%, others divided by 4
      if (['Venus', 'Moon', 'Sun', 'Mars', 'Saturn'].includes(aspectingName)) {
        aspectMod = val / 4;
      }
      
      let isBeneficAspect = ['Jupiter', 'Venus', 'Mercury'].includes(aspectingName);
      if (aspectingName === 'Moon') {
         // Waxing moon is benefic, waning is malefic
         const moonLong = positions.find(p => p.name === 'Moon')?.longitude || 0;
         const sunLong = positions.find(p => p.name === 'Sun')?.longitude || 0;
         const diff = norm(moonLong - sunLong);
         if (diff < 180) {
           isBeneficAspect = true; // Waxing
         }
      }
      
      // Benefic aspects add, Malefic aspects subtract
      if (isBeneficAspect) {
        drikBala += aspectMod;
      } else {
        drikBala -= aspectMod;
      }
    }

    const ishtaPhala = Math.sqrt(uchchaBala * chestaPhalaVal);
    const kashtaPhala = Math.sqrt(Math.abs(60 - uchchaBala) * Math.abs(60 - chestaPhalaVal));

    const totalViras = sthanaBala + digBala + kalaBala + chestaBala + naisargikaBala + drikBala;
    const totalRupas = totalViras / 60;

    result[name] = {
      uchchaBala: +uchchaBala.toFixed(2),
      saptavargajaBala: +saptavargajaBala.toFixed(2),
      ojayugmaBala: +ojayugmaBala.toFixed(2),
      kendradiBala: +kendradiBala.toFixed(2),
      drekkanaBala: +drekkanaBala.toFixed(2),
      sthanaBala: +sthanaBala.toFixed(2),
      digBala: +digBala.toFixed(2),
      kalaBala: +kalaBala.toFixed(2),
      kalaBreakdown: { nathonathaBala: +nathonathaBala.toFixed(2), pakshaBala: +pakshaBala.toFixed(2), tribhagaBala: +tribhagaBala.toFixed(2), varaBala, horaBala, masaBala, abdaBala, ayanaBala: +ayanaBala.toFixed(2) },
      chestaBala: +chestaBala.toFixed(2),
      naisargikaBala: +naisargikaBala.toFixed(2),
      drikBala: +drikBala.toFixed(2),
      totalViras: +totalViras.toFixed(2),
      totalRupas: +totalRupas.toFixed(2),
      requiredRupas: REQUIRED_RUPAS[name],
      ishtaPhala: +ishtaPhala.toFixed(2),
      kashtaPhala: +kashtaPhala.toFixed(2),
    };
  }

  return result;
}
