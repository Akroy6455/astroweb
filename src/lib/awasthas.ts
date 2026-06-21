import sweph from 'sweph';

export type PlanetName = 'Sun' | 'Moon' | 'Mars' | 'Mercury' | 'Jupiter' | 'Venus' | 'Saturn' | 'Rahu' | 'Ketu';

const P_STATUS: Record<PlanetName, number> = {
  Sun: 1, Moon: 2, Mars: 3, Mercury: 4, Jupiter: 5, Venus: 6, Saturn: 7, Rahu: 8, Ketu: 9
};

const SAYANADI_NAMES: Record<number, string> = {
  1: 'Sayana',
  2: 'Upavesna',
  3: 'Netrapani',
  4: 'Prakash',
  5: 'Gaman',
  6: 'Agmana',
  7: 'Sabha',
  8: 'Agama',
  9: 'Bhojana',
  10: 'Nrityalipsa',
  11: 'Kautuka',
  0: 'Nidra',
  12: 'Nidra' // Remainder 0 is effectively 12
};

const BENEFIICS = ['Jupiter', 'Venus', 'Moon', 'Mercury'];
const MALEFICS = ['Sun', 'Mars', 'Saturn', 'Rahu', 'Ketu'];

const SIGN_RULERS: Record<number, string> = {
  0: 'Mars', 1: 'Venus', 2: 'Mercury', 3: 'Moon', 4: 'Sun', 5: 'Mercury',
  6: 'Venus', 7: 'Mars', 8: 'Jupiter', 9: 'Saturn', 10: 'Saturn', 11: 'Jupiter'
};

const NATURAL_FRIENDS: Record<string, string[]> = {
  Sun: ['Moon', 'Mars', 'Jupiter'], Moon: ['Sun', 'Mercury'], Mars: ['Sun', 'Moon', 'Jupiter'],
  Mercury: ['Sun', 'Venus'], Jupiter: ['Sun', 'Moon', 'Mars'], Venus: ['Mercury', 'Saturn'],
  Saturn: ['Mercury', 'Venus'], Rahu: ['Jupiter', 'Venus', 'Saturn'], Ketu: ['Mars', 'Venus', 'Saturn']
};

const NATURAL_ENEMIES: Record<string, string[]> = {
  Sun: ['Venus', 'Saturn'], Moon: [], Mars: ['Mercury'], Mercury: ['Moon'],
  Jupiter: ['Mercury', 'Venus'], Venus: ['Sun', 'Moon'], Saturn: ['Sun', 'Moon', 'Mars'],
  Rahu: ['Sun', 'Moon', 'Mars'], Ketu: ['Sun', 'Moon']
};

const EXALTATION: Record<string, number> = {
  Sun: 0, Moon: 1, Mars: 9, Mercury: 5, Jupiter: 3, Venus: 11, Saturn: 6
};

const MOOLATRIKONA: Record<string, number> = {
  Sun: 4, Moon: 1, Mars: 0, Mercury: 5, Jupiter: 8, Venus: 6, Saturn: 10
};

export function isAspecting(aspector: string, aspectorSign: number, aspectedSign: number): boolean {
  if (aspectorSign === aspectedSign) return false;
  const dist = (aspectedSign - aspectorSign + 12) % 12 + 1;
  if (dist === 7) return true;
  if (aspector === 'Mars' && (dist === 4 || dist === 8)) return true;
  if ((aspector === 'Jupiter' || aspector === 'Rahu' || aspector === 'Ketu') && (dist === 5 || dist === 9)) return true;
  if (aspector === 'Saturn' && (dist === 3 || dist === 10)) return true;
  return false;
}

function norm(a: number) { return ((a % 360) + 360) % 360; }

export function calculateAwasthas(positions: any[], lagna: any, jd: number, lat: number, lon: number) {
  const result: Record<string, any> = {};

  const sun = positions.find(p => p.name === 'Sun');
  const moon = positions.find(p => p.name === 'Moon');
  
  if (!lagna || !sun || !moon) return result;

  // Exact Sunrise Calculation using Swiss Ephemeris
  const geopos: [number, number, number] = [lon, lat, 0];
  let s1 = sweph.rise_trans(jd - 1.5, sweph.constants.SE_SUN, '', sweph.constants.SEFLG_SWIEPH, sweph.constants.SE_CALC_RISE, geopos, 0, 0).data;
  let s2 = sweph.rise_trans(s1 + 0.1, sweph.constants.SE_SUN, '', sweph.constants.SEFLG_SWIEPH, sweph.constants.SE_CALC_RISE, geopos, 0, 0).data;

  
  // The immediately preceding sunrise
  const final_sunrise_jd = (s2 < jd) ? s2 : s1;

  const delta_jd = jd - final_sunrise_jd;
  const delta_minutes = delta_jd * 24 * 60;
  const g = Math.ceil(delta_minutes / 24); // Ghatikas (counts the current running Ghati)

  const a = moon.nakshatra.index + 1;
  const r = lagna.rasi.index + 1;

  for (const pos of positions) {
    if (!P_STATUS[pos.name as PlanetName]) continue;

    const name = pos.name as PlanetName;
    const s = pos.nakshatra.index + 1;
    const p = P_STATUS[name];
    const n = pos.navamsha.part;

    const calcValue = (s * p * n) + (a + g + r);
    const remainder = calcValue % 12;
    
    // Remainder 0 maps to 12 (Nidra)
    const sayanadiIdx = remainder === 0 ? 12 : remainder;
    const sayanadiName = SAYANADI_NAMES[sayanadiIdx];

    // --- Lajjitadi Awasthas ---
    const sign = pos.rasi.index;
    const houseFromLagna = (sign - lagna.rasi.index + 12) % 12 + 1;
    
    const occupants = positions.filter(other => other.rasi.index === sign).sort((a, b) => a.rasi.degreesInSign - b.rasi.degreesInSign);
    const myIndex = occupants.findIndex(o => o.name === name);
    const conjuncts: any[] = [];
    if (myIndex > 0) conjuncts.push(occupants[myIndex - 1]);
    if (myIndex < occupants.length - 1) conjuncts.push(occupants[myIndex + 1]);
    const aspectors = positions.filter(other => other.name !== name && isAspecting(other.name, other.rasi.index, sign));
    
    const countConjunct = (list: string[]) => conjuncts.filter(o => list.includes(o.name)).length;
    const countAspects = (list: string[]) => aspectors.filter(o => list.includes(o.name)).length;
    
    const ruler = SIGN_RULERS[sign];
    const enemies = NATURAL_ENEMIES[name] || [];
    const friends = NATURAL_FRIENDS[name] || [];
    
    // 1. Lajita
    // "when both conditions satisfy only then" (in 5th house AND associated/aspected by Rahu/Ketu/Sun/Saturn/Mars)
    let lajitaScore = 0;
    const lajitaCond1 = houseFromLagna === 5;
    const lajitaCond2 = countConjunct(['Sun', 'Saturn', 'Rahu', 'Ketu', 'Mars']) > 0 || countAspects(['Sun', 'Saturn', 'Rahu', 'Ketu', 'Mars']) > 0;
    if (lajitaCond1 && lajitaCond2) lajitaScore = 1;
    
    // 2. Garvita
    // "when exaltation/mooltrikon or vargottam"
    let garvitaScore = 0;
    const isExalted = EXALTATION[name] === sign || (name === 'Rahu' && (sign === 1 || sign === 2));
    const isMoola = MOOLATRIKONA[name] === sign;
    const isVargottama = pos.rasi.index === pos.navamsha.index;
    if (isExalted || isMoola || isVargottama) garvitaScore = 1;
    
    // 3. Kshudita
    // "have only any one condition if any condition hits" and "remove conjunct enemy/friend"
    let kshuditaScore = 0;
    const kshuCond1 = enemies.includes(ruler) ? 1 : 0;
    const kshuCond2 = countAspects(enemies) > 0 ? 1 : 0;
    const kshuCond3 = countConjunct(['Saturn']) > 0 ? 1 : 0;
    if (kshuCond1 + kshuCond2 + kshuCond3 >= 1) kshuditaScore = 1;
    
    // 4. Trushita
    // "all three are passed"
    let trushitaScore = 0;
    const truCond1 = [3, 7, 11].includes(sign);
    const truCond2 = countAspects(MALEFICS) > 0;
    const truCond3 = countAspects(BENEFIICS) === 0;
    if (truCond1 && truCond2 && truCond3) trushitaScore = 1;
    
    // 5. Mudita
    // "have only any one condition if any condition hits" and remove conjunct friend
    let muditaScore = 0;
    const mudCond1 = friends.includes(ruler) ? 1 : 0;
    const mudCond2 = countAspects(BENEFIICS) > 0 || countConjunct(BENEFIICS) > 0 ? 1 : 0; 
    const mudCond3 = countConjunct(['Jupiter']) > 0 ? 1 : 0;
    if (mudCond1 + mudCond2 + mudCond3 >= 1) muditaScore = 1;
    
    // 6. Kshobita
    // "when both are fulfilled" and "remove conjunct enemy/friend"
    let kshobitaScore = 0;
    const kshoCond1 = countConjunct(['Sun']) > 0;
    const kshoCond2 = aspectors.some(o => MALEFICS.includes(o.name) || enemies.includes(o.name)) || 
                      conjuncts.some(o => o.name !== 'Sun' && MALEFICS.includes(o.name));
    if (kshoCond1 && kshoCond2) kshobitaScore = 1;
    
    let lajjitadiParts = [];
    if (lajitaScore > 0) lajjitadiParts.push('Lajita');
    if (garvitaScore > 0) lajjitadiParts.push('Garvita');
    if (kshuditaScore > 0) lajjitadiParts.push('Kshudita');
    if (trushitaScore > 0) lajjitadiParts.push('Trushita');
    if (muditaScore > 0) lajjitadiParts.push('Mudita');
    if (kshobitaScore > 0) lajjitadiParts.push('Kshobita');
    
    const lajjitadiStr = lajjitadiParts.length > 0 ? lajjitadiParts.join(', ') : 'None';

    result[name] = {
      lajjitadi: lajjitadiStr,
      sayanadi: sayanadiName,
      sayanadiRemainder: sayanadiIdx,
      s, p, n, a, g, r,
      sayanadiCalculation: `(${s} * ${p} * ${n} + (${a} + ${g} + ${r})) % 12 = ${remainder}`
    };
  }

  return result;
}

export const SHADVARGA_NAMES: Record<number, string> = {
  0: 'Shunyavarga', 1: 'Shunyavarga', 2: 'Kimsuka', 3: 'Vyanjana', 
  4: 'Chamara', 5: 'Chatra', 6: 'Kundala'
};

export const SAPTAVARGA_NAMES: Record<number, string> = {
  0: 'Shunyavarga', 1: 'Shunyavarga', 2: 'Kimsuka', 3: 'Vyanjana', 
  4: 'Chamara', 5: 'Chatra', 6: 'Kundala', 7: 'Mukuta'
};

export const DASAVARGA_NAMES: Record<number, string> = {
  0: 'Shunyavarga', 1: 'Shunyavarga', 2: 'Parijatha', 3: 'Uttama', 
  4: 'Gopura', 5: 'Simhasana', 6: 'Paravata', 7: 'Devaloka', 
  8: 'Brahmaloka', 9: 'Shakravahana', 10: 'Shridham'
};

export const SHODASHVARGA_NAMES: Record<number, string> = {
  0: 'Shunyavarga', 1: 'Shunyavarga', 2: 'Bhedaka', 3: 'Kusuma', 
  4: 'Nagapurusha', 5: 'Kanduka', 6: 'Kerala', 7: 'Kalpavriksha', 
  8: 'Chandanavana', 9: 'Purnachandra', 10: 'Uchchaisrava', 
  11: 'Dhanvantari', 12: 'Suryakanta', 13: 'Vidruma', 
  14: 'Shakra-Simhasana', 15: 'Goloka', 16: 'Sri Vallabha'
};

export interface VargaClassificationResult {
  score: number;
  name: string;
  details: string[];
}

export interface VargaClassifications {
  shadvarga: VargaClassificationResult;
  saptavarga: VargaClassificationResult;
  dasavarga: VargaClassificationResult;
  shodashvarga: VargaClassificationResult;
}

export function calculateVargaClassifications(
  positions: any[],
  divisionalCharts: any,
  shadbala: any,
  arudhaLagna: any,
  awasthas: any
) {
  const result: Record<string, VargaClassifications> = {};
  
  if (!arudhaLagna || !shadbala || !awasthas) return result;

  const alSignIndex = arudhaLagna.rasi.index;
  const anglesFromAL = [0, 3, 6, 9].map(offset => (alSignIndex + offset) % 12);
  
  const targetArudhaSigns = new Set<number>();
  anglesFromAL.forEach(angleSign => {
    const lord = SIGN_RULERS[angleSign];
    for (let i = 0; i < 12; i++) {
      if (SIGN_RULERS[i] === lord) {
        targetArudhaSigns.add(i);
      }
    }
  });

  const truePlanets = ['Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
  
  const badSignLords = new Set<string>();

  for (const pos of positions) {
    if (!P_STATUS[pos.name as PlanetName]) continue;
    const pName = pos.name as PlanetName;

    let isBad = false;

    if (pos.isCombust) isBad = true;
    if (!isBad && shadbala[pName] && shadbala[pName].totalRupas < shadbala[pName].requiredRupas) isBad = true;

    if (!isBad && truePlanets.includes(pName)) {
      for (const other of positions) {
        if (other.name !== pName && truePlanets.includes(other.name)) {
          let diff = Math.abs(pos.longitude - other.longitude);
          if (diff > 180) diff = 360 - diff;
          if (diff <= 1.0) {
            const mySb = shadbala[pName]?.totalRupas || 0;
            const otherSb = shadbala[other.name]?.totalRupas || 0;
            if (mySb < otherSb) {
              isBad = true;
              break;
            }
          }
        }
      }
    }

    const myAwastha = awasthas[pName]?.sayanadi;
    if (!isBad && (myAwastha === 'Nidra' || myAwastha === 'Gaman' || myAwastha === 'Sayana')) {
      isBad = true;
    }

    if (isBad) badSignLords.add(pName);
  }

  for (const pos of positions) {
    if (!P_STATUS[pos.name as PlanetName]) continue;
    const pName = pos.name as PlanetName;

    // Accumulators for each classification
    const scores = { shadvarga: 0, saptavarga: 0, dasavarga: 0, shodashvarga: 0 };
    const details = { shadvarga: [] as string[], saptavarga: [] as string[], dasavarga: [] as string[], shodashvarga: [] as string[] };

    const divisions = [1, 2, 3, 4, 7, 9, 10, 12, 16, 20, 24, 27, 30, 40, 45, 60];

    const sysDefs = [
      { key: 'shadvarga' as const, divs: [1, 2, 3, 9, 12, 30] },
      { key: 'saptavarga' as const, divs: [1, 2, 3, 7, 9, 12, 30] },
      { key: 'dasavarga' as const, divs: [1, 2, 3, 7, 9, 10, 12, 16, 20, 24] },
      { key: 'shodashvarga' as const, divs: [1, 2, 3, 4, 7, 9, 10, 12, 16, 20, 24, 27, 30, 40, 45, 60] }
    ];

    for (const div of divisions) {
      const varga = divisionalCharts[`D${div}`];
      if (!varga || !varga.houses) continue;

      let vSignIndex = -1;
      for (const h of varga.houses) {
        if (h.planets && h.planets.some((p: any) => p.name === pName)) {
          vSignIndex = h.signIndex;
          break;
        }
      }

      if (vSignIndex === -1) continue;

      const lord = SIGN_RULERS[vSignIndex];
      let gotPoint = false;
      let reason = '';

      if (div === 2) {
        if (['Sun', 'Mars', 'Jupiter'].includes(pName) && vSignIndex === 4) {
          gotPoint = true; reason = `D2: Leo Hora`;
        } else if (['Moon', 'Venus', 'Saturn', 'Rahu', 'Ketu'].includes(pName) && vSignIndex === 3) {
          gotPoint = true; reason = `D2: Cancer Hora`;
        } else if (pName === 'Mercury') {
          gotPoint = true; reason = `D2: Mercury gets point in both`;
        }
      } else {
        if (MOOLATRIKONA[pName] === vSignIndex) {
          gotPoint = true; reason = `D${div}: Moolatrikona`;
        } else if (lord === pName) {
          gotPoint = true; reason = `D${div}: Own Sign`;
        } else if (targetArudhaSigns.has(vSignIndex)) {
          gotPoint = true; reason = `D${div}: AL Angle Lord Sign`;
        }
      }

      if (gotPoint && badSignLords.has(lord)) {
        gotPoint = false;
      }

      if (gotPoint) {
        for (const sys of sysDefs) {
          if (sys.divs.includes(div)) {
            scores[sys.key]++;
            details[sys.key].push(reason);
          }
        }
      }
    }

    result[pName] = {
      shadvarga: {
        score: scores.shadvarga,
        name: SHADVARGA_NAMES[scores.shadvarga] || 'Unknown',
        details: details.shadvarga.length > 0 ? details.shadvarga : ['No good vargas']
      },
      saptavarga: {
        score: scores.saptavarga,
        name: SAPTAVARGA_NAMES[scores.saptavarga] || 'Unknown',
        details: details.saptavarga.length > 0 ? details.saptavarga : ['No good vargas']
      },
      dasavarga: {
        score: scores.dasavarga,
        name: DASAVARGA_NAMES[scores.dasavarga] || 'Unknown',
        details: details.dasavarga.length > 0 ? details.dasavarga : ['No good vargas']
      },
      shodashvarga: {
        score: scores.shodashvarga,
        name: SHODASHVARGA_NAMES[scores.shodashvarga] || 'Unknown',
        details: details.shodashvarga.length > 0 ? details.shodashvarga : ['No good vargas']
      }
    };
  }

  return result;
}
