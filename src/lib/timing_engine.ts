import { PlanetPosition } from './yoga_engine/types';
import { getKarmaNakshatra, getLatta, getVedhaNakshatras, NAKSHATRAS_28, getNak28Index, getSampatNakshatra, getAadhanaNakshatra, getAbhishekaNakshatra, getNaidhanaNakshatra, getVainasikaNakshatra } from './sbc_engine';

export interface TimingOptions {
  job: {
    enabled: boolean;
    lord6_10_multiplier: number;
    lord2_7_11_multiplier: number;
    karmaNakshatra_multiplier: number;
    latta_multiplier: number;
    vedha_benefic_multiplier: number;
    vedha_malefic_multiplier: number;
    exalted_own_multiplier: number;
    sahama_multiplier: number;
    amk_karma_multiplier: number;
  };
  wealth?: {
    enabled: boolean;
    lord2_11_multiplier: number;
    lord9_4_5_multiplier: number;
    nakshatra_2_19_multiplier: number;
    latta_aadhana_multiplier: number;
    vedha_aadhana_benefic_multiplier: number;
    vedha_aadhana_malefic_multiplier: number;
    exalted_own_2_11_multiplier: number;
    sahama_artha_labha_multiplier: number;
  };
  goodTime?: {
    enabled: boolean;
    transit_karma_multiplier: number;
    transit_aadhana_multiplier: number;
    transit_abhisheka_multiplier: number;
    latta_karma_multiplier: number;
    latta_aadhana_multiplier: number;
    latta_abhisheka_multiplier: number;
    transit_naidhana_multiplier: number;
    transit_vainasika_multiplier: number;
    latta_naidhana_multiplier: number;
    latta_vainasika_multiplier: number;
    vedha_benefic_multiplier: number;
    vedha_malefic_multiplier: number;
  };
}

export const DEFAULT_TIMING_OPTIONS: TimingOptions = {
  job: {
    enabled: true,
    lord6_10_multiplier: 1.5,
    lord2_7_11_multiplier: 1.2,
    karmaNakshatra_multiplier: 1.5,
    latta_multiplier: 0.5,
    vedha_benefic_multiplier: 1.2,
    vedha_malefic_multiplier: 0.8,
    exalted_own_multiplier: 1.2,
    sahama_multiplier: 1.2,
    amk_karma_multiplier: 1.5,
  },
  wealth: {
    enabled: true,
    lord2_11_multiplier: 1.5,
    lord9_4_5_multiplier: 1.2,
    nakshatra_2_19_multiplier: 1.5,
    latta_aadhana_multiplier: 0.5,
    vedha_aadhana_benefic_multiplier: 1.2,
    vedha_aadhana_malefic_multiplier: 0.8,
    exalted_own_2_11_multiplier: 1.2,
    sahama_artha_labha_multiplier: 1.2,
  },
  goodTime: {
    enabled: true,
    transit_karma_multiplier: 1.2,
    transit_aadhana_multiplier: 1.2,
    transit_abhisheka_multiplier: 1.5,
    latta_karma_multiplier: 0.8,
    latta_aadhana_multiplier: 0.8,
    latta_abhisheka_multiplier: 0.6,
    transit_naidhana_multiplier: 0.8,
    transit_vainasika_multiplier: 0.6,
    latta_naidhana_multiplier: 1.2,
    latta_vainasika_multiplier: 1.5,
    vedha_benefic_multiplier: 1.2,
    vedha_malefic_multiplier: 0.8,
  }
};

const BENEFICS = ['Jupiter', 'Venus', 'Mercury', 'Moon'];
function isBenefic(planet: string): boolean {
  return BENEFICS.includes(planet);
}

function getAmatyakaraka(positions: PlanetPosition[]): string | null {
  const validPlanets = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
  const candidates = positions.filter(p => validPlanets.includes(p.name));
  candidates.sort((a, b) => b.rasi.degreesInSign - a.rasi.degreesInSign);
  return candidates.length >= 2 ? candidates[1].name : null;
}

function calcSahama(A: number, B: number, C: number, isDay: boolean, lagnaLong: number, reverseForNight: boolean = true) {
  let pA = A, pB = B;
  if (!isDay && reverseForNight) { pA = B; pB = A; }
  let sahama = (pA - pB + C + 360) % 360;
  const arcBA = (pA - pB + 360) % 360;
  const arcBL = (lagnaLong - pB + 360) % 360;
  if (arcBL > arcBA) sahama = (sahama + 30) % 360;
  return sahama;
}

const RULERS = ['Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter'];

const OWN_SIGNS: Record<string, number[]> = {
  'Sun': [4], 'Moon': [3], 'Mars': [0, 7], 'Mercury': [2, 5],
  'Jupiter': [8, 11], 'Venus': [1, 6], 'Saturn': [9, 10]
};
const EXALT_SIGNS: Record<string, number> = {
  'Sun': 0, 'Moon': 1, 'Mars': 9, 'Mercury': 5,
  'Jupiter': 3, 'Venus': 11, 'Saturn': 6
};

function getTransitPlanets(point: any) {
  return [
    { name: 'Sun', long: point.tSun, speed: point.tSunSpeed || 1 },
    { name: 'Moon', long: point.tMoon, speed: point.tMoonSpeed || 13 },
    { name: 'Mars', long: point.tMars, speed: point.tMarsSpeed || 0.5 },
    { name: 'Mercury', long: point.tMercury, speed: point.tMercurySpeed || 1 },
    { name: 'Jupiter', long: point.tJupiter, speed: point.tJupiterSpeed || 0.08 },
    { name: 'Venus', long: point.tVenus, speed: point.tVenusSpeed || 1 },
    { name: 'Saturn', long: point.tSaturn, speed: point.tSaturnSpeed || 0.03 },
    { name: 'Rahu', long: point.tRahu, speed: point.tRahuSpeed || -0.05 },
    { name: 'Ketu', long: point.tKetu, speed: point.tKetuSpeed || -0.05 }
  ].filter(p => p.long !== undefined);
}

function getLordOfHouse(lagnaRasi: number, h: number): string {
  const houseRasi = (lagnaRasi + h - 1) % 12;
  return RULERS[houseRasi];
}

// ── Job Timing ──────────────────────────────────────────────────────────────────
function calculateJobTiming(
  transitData: any[],
  basePositions: PlanetPosition[],
  lagna: PlanetPosition,
  isDay: boolean,
  options: TimingOptions
): any[] {
  const lagnaRasi = Math.floor(lagna.longitude / 30);
  
  const lord2 = getLordOfHouse(lagnaRasi, 2);
  const lord6 = getLordOfHouse(lagnaRasi, 6);
  const lord7 = getLordOfHouse(lagnaRasi, 7);
  const lord10 = getLordOfHouse(lagnaRasi, 10);
  const lord11 = getLordOfHouse(lagnaRasi, 11);

  const lMars = basePositions.find(p => p.name === 'Mars')?.longitude || 0;
  const lMerc = basePositions.find(p => p.name === 'Mercury')?.longitude || 0;
  const lMoon = basePositions.find(p => p.name === 'Moon')?.longitude || 0;
  
  const karmaSahamaLong = calcSahama(lMars, lMerc, lagna.longitude, isDay, lagna.longitude, true);
  const karmaSahamaRasi = Math.floor(karmaSahamaLong / 30);
  const karmaNakName = getKarmaNakshatra(lMoon);
  const amkName = getAmatyakaraka(basePositions);

  return transitData.map(point => {
    let modifiedScore = point.netScore || 0;
    const newBreakdown = [...(point.breakdown || [])];

    // --- DASHA LORD MULTIPLIERS (Additive) ---
    const activeLords = [point.mdPlanet, point.adPlanet, point.pdPlanet];
    let dashaBonus = 0;
    
    if (activeLords.includes(lord6) || activeLords.includes(lord10)) {
      dashaBonus += (options.job.lord6_10_multiplier - 1.0);
      newBreakdown.push({ key: 'Job: Dasha Lord (6/10)', name: `Job: ${lord6}/${lord10} Dasha`, value: options.job.lord6_10_multiplier });
    }
    if (activeLords.includes(lord2) || activeLords.includes(lord7) || activeLords.includes(lord11)) {
      dashaBonus += (options.job.lord2_7_11_multiplier - 1.0);
      newBreakdown.push({ key: 'Job: Dasha Lord (2/7/11)', name: `Job: ${lord2}/${lord7}/${lord11} Dasha`, value: options.job.lord2_7_11_multiplier });
    }
    const dashaMultiplier = 1.0 + dashaBonus;
    
    // --- TRANSIT MULTIPLIERS (Additive) ---
    let transitBonus = 0;
    const transitPlanets = getTransitPlanets(point);

    for (const tp of transitPlanets) {
      const tNakName = NAKSHATRAS_28[getNak28Index(tp.long)];
      if (tNakName === karmaNakName) {
        transitBonus += (options.job.karmaNakshatra_multiplier - 1.0);
        newBreakdown.push({ key: 'Job: SBC Karma Nakshatra', name: `Job: ${tp.name} in Karma Nak.`, value: options.job.karmaNakshatra_multiplier });
        
        if (tp.name === amkName) {
          transitBonus += (options.job.amk_karma_multiplier - 1.0);
          newBreakdown.push({ key: 'Job: AmK Karma Nakshatra', name: `Job: AmK (${tp.name}) in Karma Nak.`, value: options.job.amk_karma_multiplier });
        }
      }

      const lattaTarget = getLatta(tp.name, tp.long);
      if (lattaTarget === karmaNakName) {
        transitBonus += (options.job.latta_multiplier - 1.0);
        newBreakdown.push({ key: 'Job: SBC Latta', name: `Job: ${tp.name} Latta to Karma Nak.`, value: options.job.latta_multiplier });
      }

      const isRetro = tp.speed < 0;
      const vedhas = getVedhaNakshatras(tp.name, tp.long, tp.speed, isRetro);
      if (vedhas.includes(karmaNakName)) {
        const mult = isBenefic(tp.name) ? options.job.vedha_benefic_multiplier : options.job.vedha_malefic_multiplier;
        transitBonus += (mult - 1.0);
        newBreakdown.push({ key: 'Job: SBC Vedha', name: `Job: ${tp.name} Vedha to Karma Nak.`, value: mult });
      }

      if (tp.name === lord6 || tp.name === lord10) {
        const tRasi = Math.floor(tp.long / 30);
        if (OWN_SIGNS[tp.name]?.includes(tRasi) || EXALT_SIGNS[tp.name] === tRasi) {
          transitBonus += (options.job.exalted_own_multiplier - 1.0);
          newBreakdown.push({ key: 'Job: Lord 6/10 Dignity', name: `Job: ${tp.name} Exalted/Own`, value: options.job.exalted_own_multiplier });
        }
      }

      if (['Jupiter', 'Saturn', 'Rahu', 'Ketu'].includes(tp.name)) {
        const tRasi = Math.floor(tp.long / 30);
        if (tRasi === karmaSahamaRasi) {
          transitBonus += (options.job.sahama_multiplier - 1.0);
          newBreakdown.push({ key: 'Job: Sahama Transit', name: `Job: ${tp.name} in Karma Sahama`, value: options.job.sahama_multiplier });
        }
      }
    }

    const transitMultiplier = Math.max(0.1, 1.0 + transitBonus);
    const totalTimingMultiplier = Math.max(0.1, dashaMultiplier * transitMultiplier);
    
    modifiedScore = modifiedScore * totalTimingMultiplier;
    let modifiedPercentage = (point.percentage || 0) * totalTimingMultiplier;
    if (modifiedPercentage > 100) modifiedPercentage = 100;

    return {
      ...point,
      netScore: modifiedScore,
      percentage: modifiedPercentage,
      breakdown: newBreakdown,
      timingMultiplier: totalTimingMultiplier,
      timingBreakdown: newBreakdown.filter((b: any) => b.key.startsWith('Job:'))
    };
  });
}

// ── Wealth Timing ───────────────────────────────────────────────────────────────
function calculateWealthTiming(
  transitData: any[],
  basePositions: PlanetPosition[],
  lagna: PlanetPosition,
  isDay: boolean,
  options: TimingOptions
): any[] {
  const wo = options.wealth || DEFAULT_TIMING_OPTIONS.wealth!;
  const lagnaRasi = Math.floor(lagna.longitude / 30);
  
  // Relevant lords
  const lord2 = getLordOfHouse(lagnaRasi, 2);
  const lord4 = getLordOfHouse(lagnaRasi, 4);
  const lord5 = getLordOfHouse(lagnaRasi, 5);
  const lord9 = getLordOfHouse(lagnaRasi, 9);
  const lord11 = getLordOfHouse(lagnaRasi, 11);

  // Natal positions
  const lMoon = basePositions.find(p => p.name === 'Moon')?.longitude || 0;
  const lLord2Long = basePositions.find(p => p.name === lord2)?.longitude || 0;
  const lLord11Long = basePositions.find(p => p.name === lord11)?.longitude || 0;

  // Sampat Nakshatra (2nd from Moon) and Aadhana Nakshatra (19th from Moon)
  const sampatNakName = getSampatNakshatra(lMoon);
  const aadhanaNakName = getAadhanaNakshatra(lMoon);

  // Artha Sahama: 2nd House Cusp - 2nd Lord + Ascendant (reversed for night)
  const house2Cusp = ((lagnaRasi + 1) * 30) % 360; // Start of 2nd house sign
  const arthaSahamaLong = calcSahama(house2Cusp, lLord2Long, lagna.longitude, isDay, lagna.longitude, true);
  const arthaSahamaRasi = Math.floor(arthaSahamaLong / 30);

  // Labha Sahama: 11th House Cusp - 11th Lord + Ascendant (reversed for night)
  const house11Cusp = ((lagnaRasi + 10) * 30) % 360; // Start of 11th house sign
  const labhaSahamaLong = calcSahama(house11Cusp, lLord11Long, lagna.longitude, isDay, lagna.longitude, true);
  const labhaSahamaRasi = Math.floor(labhaSahamaLong / 30);

  return transitData.map(point => {
    let modifiedScore = point.netScore || 0;
    const newBreakdown = [...(point.breakdown || [])];

    // --- DASHA LORD MULTIPLIERS (Additive) ---
    const activeLords = [point.mdPlanet, point.adPlanet, point.pdPlanet];
    let dashaBonus = 0;
    
    // Rule 1: 1.5x for 2nd and 11th lord Dasha/AD/PD
    if (activeLords.includes(lord2) || activeLords.includes(lord11)) {
      dashaBonus += (wo.lord2_11_multiplier - 1.0);
      newBreakdown.push({ key: 'Wealth: Dasha Lord (2/11)', name: `Wealth: ${lord2}/${lord11} Dasha`, value: wo.lord2_11_multiplier });
    }
    // Rule 2: 1.2x for 9th, 4th, 5th lord Dasha/AD/PD
    if (activeLords.includes(lord9) || activeLords.includes(lord4) || activeLords.includes(lord5)) {
      dashaBonus += (wo.lord9_4_5_multiplier - 1.0);
      newBreakdown.push({ key: 'Wealth: Dasha Lord (9/4/5)', name: `Wealth: ${lord9}/${lord4}/${lord5} Dasha`, value: wo.lord9_4_5_multiplier });
    }
    const dashaMultiplier = 1.0 + dashaBonus;
    
    // --- TRANSIT MULTIPLIERS (Additive) ---
    let transitBonus = 0;
    const transitPlanets = getTransitPlanets(point);

    for (const tp of transitPlanets) {
      const tNakName = NAKSHATRAS_28[getNak28Index(tp.long)];
      
      // Rule 3: 1.5x for any planet transiting in Sampat (2nd) or Aadhana (19th) Nakshatra
      if (tNakName === sampatNakName || tNakName === aadhanaNakName) {
        transitBonus += (wo.nakshatra_2_19_multiplier - 1.0);
        const which = tNakName === sampatNakName ? 'Sampat' : 'Aadhana';
        newBreakdown.push({ key: `Wealth: ${which} Nak`, name: `Wealth: ${tp.name} in ${which} Nak.`, value: wo.nakshatra_2_19_multiplier });
      }

      // Rule 4: 0.5x (penalty) for planet giving Latta to Aadhana Nakshatra
      const lattaTarget = getLatta(tp.name, tp.long);
      if (lattaTarget === aadhanaNakName) {
        transitBonus += (wo.latta_aadhana_multiplier - 1.0);
        newBreakdown.push({ key: 'Wealth: Latta Aadhana', name: `Wealth: ${tp.name} Latta to Aadhana`, value: wo.latta_aadhana_multiplier });
      }

      // Rule 5: 1.2x for every planet giving Vedha to Aadhana Nakshatra
      const isRetro = tp.speed < 0;
      const vedhas = getVedhaNakshatras(tp.name, tp.long, tp.speed, isRetro);
      if (vedhas.includes(aadhanaNakName)) {
        const mult = isBenefic(tp.name) ? wo.vedha_aadhana_benefic_multiplier : wo.vedha_aadhana_malefic_multiplier;
        transitBonus += (mult - 1.0);
        newBreakdown.push({ key: 'Wealth: Vedha Aadhana', name: `Wealth: ${tp.name} Vedha to Aadhana`, value: mult });
      }

      // Rule 6: 1.2x when 2nd or 11th lord is exalted or in own sign
      if (tp.name === lord2 || tp.name === lord11) {
        const tRasi = Math.floor(tp.long / 30);
        if (OWN_SIGNS[tp.name]?.includes(tRasi) || EXALT_SIGNS[tp.name] === tRasi) {
          transitBonus += (wo.exalted_own_2_11_multiplier - 1.0);
          newBreakdown.push({ key: 'Wealth: Lord 2/11 Dignity', name: `Wealth: ${tp.name} Exalted/Own`, value: wo.exalted_own_2_11_multiplier });
        }
      }

      // Rule 7: 1.2x when Jupiter, Saturn, Rahu, or Ketu transit Artha or Labha Sahama rasi
      if (['Jupiter', 'Saturn', 'Rahu', 'Ketu'].includes(tp.name)) {
        const tRasi = Math.floor(tp.long / 30);
        if (tRasi === arthaSahamaRasi) {
          transitBonus += (wo.sahama_artha_labha_multiplier - 1.0);
          newBreakdown.push({ key: 'Wealth: Artha Sahama', name: `Wealth: ${tp.name} in Artha Sahama`, value: wo.sahama_artha_labha_multiplier });
        }
        if (tRasi === labhaSahamaRasi) {
          transitBonus += (wo.sahama_artha_labha_multiplier - 1.0);
          newBreakdown.push({ key: 'Wealth: Labha Sahama', name: `Wealth: ${tp.name} in Labha Sahama`, value: wo.sahama_artha_labha_multiplier });
        }
      }
    }

    const transitMultiplier = Math.max(0.1, 1.0 + transitBonus);
    const totalTimingMultiplier = Math.max(0.1, dashaMultiplier * transitMultiplier);
    
    modifiedScore = modifiedScore * totalTimingMultiplier;
    let modifiedPercentage = (point.percentage || 0) * totalTimingMultiplier;
    if (modifiedPercentage > 100) modifiedPercentage = 100;

    return {
      ...point,
      netScore: modifiedScore,
      percentage: modifiedPercentage,
      breakdown: newBreakdown,
      timingMultiplier: totalTimingMultiplier,
      timingBreakdown: newBreakdown.filter((b: any) => b.key.startsWith('Wealth:'))
    };
  });
}

// ── Main Entry Point ────────────────────────────────────────────────────────────
export function calculateTimingOfEvents(
  transitData: any[],
  basePositions: PlanetPosition[],
  lagna: PlanetPosition,
  isDay: boolean,
  options: TimingOptions,
  question: 'job' | 'wealth' | 'marriage' | 'abroad' | 'health' | 'goodTime' | null
): any[] {
  if (!question) return transitData;

  if (question === 'job' && options.job.enabled) {
    return calculateJobTiming(transitData, basePositions, lagna, isDay, options);
  }

  if (question === 'wealth' && options.wealth?.enabled) {
    return calculateWealthTiming(transitData, basePositions, lagna, isDay, options);
  }

  if (question === 'goodTime' && options.goodTime?.enabled) {
    return calculateGoodTiming(transitData, basePositions, lagna, isDay, options);
  }

  // Other questions not yet implemented - return unmodified
  return transitData;
}

// 🌟 Good Time 🌟
function calculateGoodTiming(
  transitData: any[],
  basePositions: PlanetPosition[],
  lagna: PlanetPosition,
  isDay: boolean,
  options: TimingOptions
): any[] {
  const go = options.goodTime || DEFAULT_TIMING_OPTIONS.goodTime!;
  
  // Natal positions
  const lMoon = basePositions.find(p => p.name === 'Moon')?.longitude || 0;

  // SBC Nakshatras
  const karmaNakName = getKarmaNakshatra(lMoon);
  const aadhanaNakName = getAadhanaNakshatra(lMoon);
  const abhishekaNakName = getAbhishekaNakshatra(lMoon);
  const naidhanaNakName = getNaidhanaNakshatra(lMoon);
  const vainasikaNakName = getVainasikaNakshatra(lMoon);

  return transitData.map(point => {
    let modifiedScore = point.netScore || 0;
    const newBreakdown = [...(point.breakdown || [])];

    let nakshatraBonus = 0;
    let lattaBonus = 0;
    let vedhaBonus = 0;
  
    // We check all transit planets
    const transitingPlanets = point.positions || [];
    
    transitingPlanets.forEach((tp: PlanetPosition) => {
      const tNakIndex = getNak28Index(tp.longitude);
      const tNakName = NAKSHATRAS_28[tNakIndex];
      const lattaNak = getLatta(tp.name, tp.longitude);

      // --- Transit Multipliers ---
      if (tNakName === karmaNakName) {
        nakshatraBonus += (go.transit_karma_multiplier - 1.0);
        newBreakdown.push({ key: `GoodTime: Transit Karma`, name: `${tp.name} Transit Karma Nakshatra`, value: go.transit_karma_multiplier });
      }
      if (tNakName === aadhanaNakName) {
        nakshatraBonus += (go.transit_aadhana_multiplier - 1.0);
        newBreakdown.push({ key: `GoodTime: Transit Aadhana`, name: `${tp.name} Transit Aadhana Nakshatra`, value: go.transit_aadhana_multiplier });
      }
      if (tNakName === abhishekaNakName) {
        nakshatraBonus += (go.transit_abhisheka_multiplier - 1.0);
        newBreakdown.push({ key: `GoodTime: Transit Abhisheka`, name: `${tp.name} Transit Abhisheka Nakshatra`, value: go.transit_abhisheka_multiplier });
      }
      if (tNakName === naidhanaNakName) {
        nakshatraBonus += (go.transit_naidhana_multiplier - 1.0);
        newBreakdown.push({ key: `GoodTime: Transit Naidhana`, name: `${tp.name} Transit Naidhana Nakshatra`, value: go.transit_naidhana_multiplier });
      }
      if (tNakName === vainasikaNakName) {
        nakshatraBonus += (go.transit_vainasika_multiplier - 1.0);
        newBreakdown.push({ key: `GoodTime: Transit Vainasika`, name: `${tp.name} Transit Vainasika Nakshatra`, value: go.transit_vainasika_multiplier });
      }

      // --- Latta Multipliers ---
      if (lattaNak) {
        if (lattaNak === karmaNakName) {
          lattaBonus += (go.latta_karma_multiplier - 1.0);
          newBreakdown.push({ key: `GoodTime: Latta Karma`, name: `${tp.name} Latta to Karma`, value: go.latta_karma_multiplier });
        }
        if (lattaNak === aadhanaNakName) {
          lattaBonus += (go.latta_aadhana_multiplier - 1.0);
          newBreakdown.push({ key: `GoodTime: Latta Aadhana`, name: `${tp.name} Latta to Aadhana`, value: go.latta_aadhana_multiplier });
        }
        if (lattaNak === abhishekaNakName) {
          lattaBonus += (go.latta_abhisheka_multiplier - 1.0);
          newBreakdown.push({ key: `GoodTime: Latta Abhisheka`, name: `${tp.name} Latta to Abhisheka`, value: go.latta_abhisheka_multiplier });
        }
        if (lattaNak === naidhanaNakName) {
          lattaBonus += (go.latta_naidhana_multiplier - 1.0);
          newBreakdown.push({ key: `GoodTime: Latta Naidhana`, name: `${tp.name} Latta to Naidhana`, value: go.latta_naidhana_multiplier });
        }
        if (lattaNak === vainasikaNakName) {
          lattaBonus += (go.latta_vainasika_multiplier - 1.0);
          newBreakdown.push({ key: `GoodTime: Latta Vainasika`, name: `${tp.name} Latta to Vainasika`, value: go.latta_vainasika_multiplier });
        }
      }

      // --- Vedha Multipliers ---
      const isRetro = tp.speed < 0;
      const vedhas = getVedhaNakshatras(tp.name, tp.longitude, tp.speed, isRetro);
      const goodTimeNaks = [karmaNakName, aadhanaNakName, abhishekaNakName, naidhanaNakName, vainasikaNakName];
      if (vedhas.some(v => goodTimeNaks.includes(v))) {
        const mult = isBenefic(tp.name) ? go.vedha_benefic_multiplier : go.vedha_malefic_multiplier;
        vedhaBonus += (mult - 1.0);
        newBreakdown.push({ key: `GoodTime: Vedha`, name: `${tp.name} Vedha to Key Nak.`, value: mult });
      }
    });

    const totalBonus = nakshatraBonus + lattaBonus + vedhaBonus;
    
    if (totalBonus !== 0) {
      modifiedScore = modifiedScore * (1 + totalBonus);
    }

    return {
      ...point,
      netScore: modifiedScore,
      breakdown: newBreakdown,
    };
  });
}

// 💼 Job Timing 💼
export interface CustomTransitRule { id: string; target: string; relation: string; referenceType: string; referenceValue: number | string; multiplier: number; }

export interface CustomDashaRule { id: string; target: string; level: string; multiplier: number; }

export interface CustomQuestion { id: string; name: string; positionType?: string; transitRules: CustomTransitRule[]; dashaRules: CustomDashaRule[]; }

export const SAHAMA_NAMES = ['Punya', 'Vidya', 'Yashas', 'Mitra', 'Mahatmya', 'Asha', 'Samartha', 'Bhratri', 'Gaurava', 'Pitri', 'Rajya', 'Matri', 'Putra', 'Jivita', 'Karma', 'Roga', 'Kala', 'Shastra', 'Bandhu', 'Mrityu', 'Jadya', 'Karya', 'Vyadhi', 'Vinaasha', 'Paradara', 'Paradesha', 'Artha', 'Paradravya', 'Preeti', 'Yuddha', 'Apamrityu', 'Jalapatana', 'Bandhana', 'Apavada', 'Utthana', 'Gaurava', 'Karyasiddhi', 'Vivaha', 'Sutika', 'Santapa', 'Shraddha', 'Priti', 'Jadya', 'Vyapar', 'Shatru', 'Jalapayana', 'Bandhana'];
