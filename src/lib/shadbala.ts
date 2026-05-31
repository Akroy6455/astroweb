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

export function calculateShadbala(positions: any[], lagna: any, jd: number) {
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
  const wd = Math.floor(jd + 1.5) % 7;
  const dayLord = WEEKDAY_LORDS[wd];
  
  // Approximate Sunrise = 6 AM local time.
  const hoursSinceSunrise = (localHour - 6 + 24) % 24;
  const horaNum = Math.floor(hoursSinceSunrise);
  const dayLordHoraIdx = HORA_SEQ.indexOf(dayLord);
  const horaLord = HORA_SEQ[(dayLordHoraIdx + horaNum) % 7];

  const sunLong = sun ? sun.longitude : 0;
  const ariesIngressJD = jd - (sunLong / 0.9856);
  const abdaLord = WEEKDAY_LORDS[Math.floor(ariesIngressJD + 1.5) % 7];
  const signIngressJD = jd - ((sunLong % 30) / 0.9856);
  const masaLord = WEEKDAY_LORDS[Math.floor(signIngressJD + 1.5) % 7];

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
      let ang = norm(moon.longitude - sun.longitude);
      if (ang > 180) ang = 360 - ang;
      const benef = ang / 3;
      const mal = 60 - benef;
      const isBenefic = ['Jupiter', 'Venus', 'Moon', 'Mercury'].includes(name);
      pakshaBala = isBenefic ? benef : mal;
      if (name === 'Moon') pakshaBala = Math.min(60, pakshaBala * 2);
    }

    // 3.3 Tribhaga
    let tribhagaBala = 0;
    if (name === 'Jupiter') tribhagaBala = 60;
    else {
      const h = (localHour + 24) % 24;
      if (h >= 6 && h < 10 && name === 'Mercury') tribhagaBala = 60;
      else if (h >= 10 && h < 14 && name === 'Sun') tribhagaBala = 60;
      else if (h >= 14 && h < 18 && name === 'Saturn') tribhagaBala = 60;
      else if (h >= 18 && h < 22 && name === 'Moon') tribhagaBala = 60;
      else if ((h >= 22 || h < 2) && name === 'Venus') tribhagaBala = 60;
      else if (h >= 2 && h < 6 && name === 'Mars') tribhagaBala = 60;
    }

    const varaBala = dayLord === name ? 45 : 0;
    const horaBala = horaLord === name ? 60 : 0;
    const masaBala = masaLord === name ? 30 : 0;
    const abdaBala = abdaLord === name ? 15 : 0;

    // 3.5 Ayana
    const tropLong = norm(long + 23.5);
    let bhuja = tropLong % 180;
    if (bhuja > 90) bhuja = 180 - bhuja;
    let ayanaBala = 0;
    if (bhuja <= 30) ayanaBala = (bhuja / 30) * 45;
    else if (bhuja <= 60) ayanaBala = 45 + ((bhuja - 30) / 30) * 33;
    else ayanaBala = 78 + ((bhuja - 60) / 30) * 12;
    ayanaBala = (ayanaBala / 90) * 60; // Max 60
    const isNorth = tropLong < 180;
    if (['Moon', 'Saturn'].includes(name) && isNorth) ayanaBala = 60 - ayanaBala;
    else if (['Sun', 'Mars', 'Jupiter', 'Venus'].includes(name) && !isNorth) ayanaBala = 60 - ayanaBala;
    if (name === 'Sun') ayanaBala = Math.min(60, ayanaBala * 2);

    const kalaBala = nathonathaBala + pakshaBala + tribhagaBala + varaBala + horaBala + masaBala + abdaBala + ayanaBala;

    // --- IV. CHESTA BALA ---
    let chestaBala = 0;
    let chestaPhalaVal = 0;
    if (name === 'Sun') {
      chestaBala = 0; // Sun has 0 Chesta per text
      chestaPhalaVal = ayanaBala; 
    } else if (name === 'Moon') {
      chestaBala = 0; // Moon has 0 Chesta per text
      chestaPhalaVal = pakshaBala;
    } else if (['Mars', 'Jupiter', 'Saturn'].includes(name)) {
      // Outer planets: Ck = Seeghrochcha(Sun) - True Longitude
      let ck = norm(sunLongGlobal - long);
      if (ck > 180) ck = 360 - ck;
      chestaBala = ck / 3;
      chestaPhalaVal = chestaBala;
    } else {
      // Inner planets: Speed Table mapping
      if (pos.retrograde) chestaBala = 60;
      else {
        const speed = Math.abs(pos.speed);
        const avg = AVG_SPEED[name];
        if (speed < 0.01) chestaBala = 15;
        else if (speed < avg * 0.9) chestaBala = 30;
        else if (speed > avg * 1.1) chestaBala = 45;
        else chestaBala = 7.5;
      }
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
      // Angle 'a' between aspecting and aspected
      let a = norm(long - other.longitude);
      
      let val = 0;
      if (a >= 0 && a < 30) {
        val = 0;
      } else if (a >= 30 && a < 60) {
        val = (a - 30) / 2;
        if (aspectingName === 'Saturn') val = (a - 30) * 2;
      } else if (a >= 60 && a < 90) {
        val = a - 45;
        if (aspectingName === 'Saturn') val = 45 + (90 - a) / 2;
      } else if (a >= 90 && a < 120) {
        val = 30 + (120 - a) / 2;
        if (aspectingName === 'Mars') val = 45 + (a - 90) / 2;
        else if (aspectingName === 'Jupiter') val = 45 + (a - 90) / 2;
      } else if (a >= 120 && a < 150) {
        val = 150 - a;
        if (aspectingName === 'Mars') val = 2 * (150 - a);
        else if (aspectingName === 'Jupiter') val = 2 * (150 - a);
      } else if (a >= 150 && a < 180) {
        val = 2 * (150 - a);
      } else if (a >= 180 && a < 210) {
        val = (300 - a) / 2;
        if (aspectingName === 'Mars') val = 60;
      } else if (a >= 210 && a < 240) {
        val = (300 - a) / 2;
        if (aspectingName === 'Mars') val = 270 - a;
        else if (aspectingName === 'Jupiter') val = 45 + (a - 210) / 2;
      } else if (a >= 240 && a < 270) {
        val = (300 - a) / 2;
        if (aspectingName === 'Jupiter') val = 15 + 2 * (270 - a) / 3;
        else if (aspectingName === 'Saturn') val = a - 210;
      } else if (a >= 270 && a < 300) {
        val = (300 - a) / 2;
        if (aspectingName === 'Saturn') val = 2 * (300 - a);
      }
      
      // Absolute value to handle any naturally negative outcomes (like 150-180 bracket)
      val = Math.abs(val);
      
      // Benefic aspects add, Malefic aspects subtract
      const isBeneficAspect = ['Jupiter', 'Venus', 'Moon', 'Mercury'].includes(aspectingName);
      
      let aspectMod = val;
      if (!['Jupiter', 'Mercury'].includes(aspectingName)) {
        aspectMod = val / 4;
      }
      
      // Added TO the aspected planet (name)
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
