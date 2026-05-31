/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * NDS Engine — Net Dasha Score Calculator (Fully Weight-Configurable, Additive)
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import {
  Planet,
  House,
  PLANETS,
  EXALTATION,
  DEBILITATION,
  PLANET_NATURE,
  KENDRA_HOUSES,
  DUSTHANA_HOUSES,
  SIGN_LORDS,
  Sign
} from './yoga_engine/constants';
import { YogaState } from './yoga_engine/types';

function isExalted(planet: Planet, sign: Sign): boolean {
  if (planet === 'Rahu' && (sign === 'Taurus' || sign === 'Gemini')) return true;
  return EXALTATION[planet]?.sign === sign;
}

function isDebilitated(planet: Planet, sign: Sign): boolean {
  if (planet === 'Rahu' && (sign === 'Sagittarius' || sign === 'Pisces')) return true;
  return DEBILITATION[planet]?.sign === sign;
}

function isOwnSign(planet: Planet, sign: Sign): boolean {
  if (planet === 'Rahu' && (sign === 'Aquarius' || sign === 'Cancer' || sign === 'Virgo')) return true;
  return SIGN_LORDS[sign] === planet;
}

import type { DashaPeriod } from './dasha';

// ─── Exported Result Types ────────────────────────────────────────────────────

export interface NDSWeights {
  navamshaStrong: number;
  navamshaWeak: number;
  navamshaBenefic: number;
  navamshaMalefic: number;
  sayanadiAwasthaMatrix?: number[][];
  version?: number;
  // Module 1: Lordship
  lordHouse1: number;
  lordHouse2: number;
  lordHouse3: number;
  lordHouse4: number;
  lordHouse5: number;
  lordHouse6: number;
  lordHouse7: number;
  lordHouse8: number;
  lordHouse9: number;
  lordHouse10: number;
  lordHouse11: number;
  lordHouse12: number;
  lordPlacementMatrix: number[][]; // 12x12 matrix [lordOfHouse - 1][placedInHouse - 1]
  planetPlacementMatrix: number[][]; // 9x12 matrix [planetIndex][placedInHouse - 1]
  yogaKaraka: number;
  rahuKetuYogKaraka: number;
  functionalBenefic: number;
  functionalMalefic: number;

  // Module 2: Dignity (Additive points, not multipliers)
  exaltation: number;         
  ownSign: number;            
  friendlySign: number;       
  neutralSign: number;        
  enemySign: number;          
  debilitation: number;       
  vargottama: number;         
  combustion: number;
  combustionBadLord?: number;
  combustionGoodLord?: number;
  enableCombustionTradeoff?: boolean;         
  sushupti: number;           
  neechaBhanga: number;       

  // Module 3: Mutual Placement Distance
  mutualDistance1: number;
  mutualDistance2: number;
  mutualDistance3: number;
  mutualDistance4: number;
  mutualDistance5: number;
  mutualDistance6: number;
  mutualDistance7: number;
  mutualDistance8: number;
  mutualDistance9: number;
  mutualDistance10: number;
  mutualDistance11: number;
  mutualDistance12: number;

  // Module 4: Arudha
  arudha11thAny: number;
  arudha11thBenefic: number;
  arudha12thAny: number;
  arudha12thMalefic: number;
  arudha3rdMalefic: number;
  arudha6thMalefic: number;
  papaKartari: number;        
  shubhaKartari: number;

  // Module 5: Awasthas
  lajita: number;             
  garvita: number;
  kshudita: number;           
  trushita: number;           
  mudita: number;
  kshobita: number;           

  // Module 6: Dasha Pravesh
  praveshHouse1: number;
  praveshHouse2: number;
  praveshHouse3: number;
  praveshHouse4: number;
  praveshHouse5: number;
  praveshHouse6: number;
  praveshHouse7: number;
  praveshHouse8: number;
  praveshHouse9: number;
  praveshHouse10: number;
  praveshHouse11: number;
  praveshHouse12: number;
  praveshExalted: number;
  praveshOwnSign: number;
  praveshDebilitated: number;

  // Global settings
  mdWeightPercentage?: number;
  enableTransitMultiplier?: boolean;
  enableMdAdTransitMultiplier?: boolean;
  enableNavtaraTransit?: boolean;
  enableNavtaraMdAd?: boolean;
  enableBaseNdsInTransit?: boolean;

  // Toggles — one per module
  disabledParams?: Record<string, boolean>;
}

export function getW(w: NDSWeights, key: keyof NDSWeights): number {
  if (w.disabledParams?.[key as string]) return 0;
  return w[key] as number;
}

export const DEFAULT_NDS_WEIGHTS: NDSWeights = {
  navamshaStrong: 100,
  navamshaWeak: -100,
  navamshaBenefic: 50,
  navamshaMalefic: -50,
  version: 4,
  mdWeightPercentage: 50,
  enableTransitMultiplier: false,
  enableMdAdTransitMultiplier: false,
  enableNavtaraTransit: false,
  enableNavtaraMdAd: false,
  enableBaseNdsInTransit: true,
  disabledParams: {},
  lordHouse1: 90,
  lordHouse2: -15,
  lordHouse3: -40,
  lordHouse4: 60,
  lordHouse5: 85,
  lordHouse6: -60,
  lordHouse7: 50,
  lordHouse8: -80,
  lordHouse9: 100,
  lordHouse10: 70,
  lordHouse11: -30,
  lordHouse12: -40,
  lordPlacementMatrix: [
    [100, 60, 30, 80, 90, -40, 70, -60, 100, 90, 70, -50],
    [40, 80, 20, 50, 60, -30, 40, -50, 70, 60, 80, -40],
    [-10, 10, -30, -10, -20, 40, -10, 20, -30, -10, 40, 20],
    [60, 40, 20, 60, 80, -40, 60, -60, 90, 60, 50, -50],
    [90, 70, 40, 80, 100, -20, 70, -30, 100, 90, 80, -30],
    [-50, -40, 20, -40, -50, -20, -50, 40, -60, -40, 30, 50],
    [60, 30, 20, 60, 70, -50, 60, -60, 80, 60, 60, -60],
    [-70, -60, -10, -60, -70, 50, -70, -40, -80, -60, 10, 60],
    [100, 80, 50, 90, 100, -10, 80, -20, 100, 100, 90, -20],
    [60, 60, 40, 60, 90, -30, 60, -50, 100, 60, 80, -40],
    [20, 50, 40, 30, 10, -10, 30, -20, 10, 40, -20, -10],
    [-60, -50, 0, -50, -60, 50, -60, 60, -70, -50, -10, -20]
  ],
    sayanadiAwasthaMatrix: [
    [-100, 50, -50, 100, 100, 100, 80, 0, 0], // Sayana (1)
    [-100, -50, 50, 100, 100, 100, -50, 100, -100], // Upavesana (2)
    [100, -50, 80, 50, -80, 0, 100, -100, -100], // Netrapani (3) - Note: Ketu was missing, assigned -100
    [80, 100, 80, 100, 100, 80, 80, 100, 100], // Prakasana (4)
    [-50, -100, -100, 100, 100, -100, 100, 100, 100], // Gamana (5)
    [-50, 80, 100, 100, 100, 100, -100, -100, -100], // Agamana (6)
    [100, 100, 100, 100, 100, 100, 100, 100, 100], // Sabha (7)
    [0, 100, -100, 50, 100, -100, -50, -100, -100], // Agama (8)
    [-50, 100, -80, -50, 100, -80, -80, -100, -100], // Bhojana (9)
    [50, 80, 100, 100, 100, 100, 100, -100, -100], // Nritya Lipsa (10)
    [50, 100, 90, 80, 100, 100, 100, -50, -50], // Kautuka (11)
    [-50, 0, -100, -100, 0, -100, 100, 100, 100], // Nidra (12)
  ],
  planetPlacementMatrix: [
    [40, 20, 80, 30, 40, 70, -30, -60, 60, 100, 90, -70],
    [80, 60, 40, 90, 80, -40, 70, -70, 90, 80, 70, -60],
    [30, -20, 90, -20, 20, 80, -40, -60, 40, 90, 90, -50],
    [90, 80, 50, 80, 90, 30, 70, 40, 80, 80, 70, -20],
    [100, 90, 40, 90, 100, -20, 80, -40, 100, 80, 70, -30],
    [80, 80, 50, 100, 90, -30, 60, 50, 90, 70, 90, 80],
    [-20, -40, 90, -30, -10, 90, 20, -20, 30, 70, 100, -60],
    [-40, -50, 80, -40, -30, 80, -50, -80, -20, 60, 90, -70],
    [-30, -40, 70, -30, -20, 70, -40, -50, 60, 50, 80, 50]
  ],
  yogaKaraka: 100,
  rahuKetuYogKaraka: 75,
  functionalBenefic: 80,
  functionalMalefic: -80,
  exaltation: 100,
  ownSign: 80,
  friendlySign: 40,
  neutralSign: 0,
  enemySign: -50,
  debilitation: -100,
  vargottama: 50,
  combustion: -80,
  combustionBadLord: -80,
  combustionGoodLord: -40,
  enableCombustionTradeoff: false,
  sushupti: -90,
  neechaBhanga: 60,
  mutualDistance1: 50,
  mutualDistance2: 20,
  mutualDistance3: 40,
  mutualDistance4: 60,
  mutualDistance5: 80,
  mutualDistance6: -80,
  mutualDistance7: 30,
  mutualDistance8: -90,
  mutualDistance9: 80,
  mutualDistance10: 70,
  mutualDistance11: 80,
  mutualDistance12: -60,
  arudha11thAny: 60,
  arudha11thBenefic: 90,
  arudha12thAny: -50,
  arudha12thMalefic: -90,
  arudha3rdMalefic: 70,
  arudha6thMalefic: 80,
  papaKartari: -70,
  shubhaKartari: 70,
  lajita: -60,
  garvita: 90,
  kshudita: -80,
  trushita: -70,
  mudita: 70,
  kshobita: -90,
  praveshHouse1: 20,
  praveshHouse2: 30,
  praveshHouse3: 60,
  praveshHouse4: 40,
  praveshHouse5: 70,
  praveshHouse6: 50,
  praveshHouse7: 30,
  praveshHouse8: -80,
  praveshHouse9: 80,
  praveshHouse10: 70,
  praveshHouse11: 90,
  praveshHouse12: -60,
  praveshExalted: 80,
  praveshOwnSign: 60,
  praveshDebilitated: -80,
};

export interface AppliedCondition {
  key: keyof NDSWeights;
  name: string;
  value: number;
}

export interface NDSResult {
  percentage: number;
  netScore: number;
  maxPossible: number;
  conditions: AppliedCondition[];
  breakdown: {
    baseLordship: number;
    dignityScore: number;
    mutualPlacement: number;
    arudhaModifiers: number;
    navamshaModifiers: number;
    awasthaModifiers: number;
    praveshOffset: number;
  };
}

export interface DashaTimePoint {
  date: string;          // ISO-8601
  mdPlanet: string;
  adPlanet: string;
  pdPlanet: string;
  percentage: number;
  mdPercentage: number;
  adPercentage: number;
  mdResult: NDSResult;
  adResult: NDSResult;
}

// ─── Internal Helpers ─────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function H(n: number): House {
  return n as House;
}

function isNaturalMalefic(planet: Planet): boolean {
  return PLANET_NATURE[planet] === 'Malefic';
}

function isNaturalBenefic(planet: Planet): boolean {
  return PLANET_NATURE[planet] === 'Benefic';
}

function buildLordshipMap(yogaState: YogaState): Map<Planet, House[]> {
  const map = new Map<Planet, House[]>();
  for (const p of PLANETS) {
    map.set(p as Planet, []);
  }
  for (let h = 1; h <= 12; h++) {
    const lord = yogaState.houses[H(h)].lord;
    map.get(lord)!.push(H(h));
  }
  return map;
}

function hasVedicAspect(planet: Planet, sourceHouse: House, targetHouse: House): boolean {
  const dist = ((targetHouse - sourceHouse) + 12) % 12; 
  if (dist === 6) return true;
  switch (planet) {
    case 'Mars': return dist === 3 || dist === 7;
    case 'Jupiter': return dist === 4 || dist === 8;
    case 'Saturn': case 'Rahu': case 'Ketu': return dist === 2 || dist === 9;
    default: return false;
  }
}

const PARASHARA_NATURES: Record<Sign, { fb: Planet[], fm: Planet[], yk: Planet[] }> = {
  Aries: { fb: ['Sun', 'Jupiter'], fm: ['Saturn', 'Mercury', 'Venus'], yk: ['Sun', 'Moon'] },
  Taurus: { fb: ['Saturn', 'Sun'], fm: ['Jupiter', 'Venus', 'Moon'], yk: ['Saturn'] },
  Gemini: { fb: ['Venus'], fm: ['Mars', 'Jupiter', 'Sun'], yk: ['Venus', 'Mercury'] },
  Cancer: { fb: ['Mars', 'Jupiter'], fm: ['Venus', 'Mercury'], yk: ['Mars'] },
  Leo: { fb: ['Mars', 'Sun'], fm: ['Saturn', 'Venus', 'Mercury'], yk: ['Mars'] },
  Virgo: { fb: ['Venus'], fm: ['Mars', 'Jupiter', 'Moon'], yk: ['Venus', 'Mercury'] },
  Libra: { fb: ['Saturn', 'Mercury'], fm: ['Jupiter', 'Sun', 'Mars'], yk: ['Saturn'] },
  Scorpio: { fb: ['Jupiter', 'Moon'], fm: ['Mercury', 'Venus', 'Saturn'], yk: ['Sun', 'Moon'] },
  Sagittarius: { fb: ['Mars', 'Sun'], fm: ['Venus', 'Saturn', 'Mercury'], yk: ['Sun', 'Mercury'] },
  Capricorn: { fb: ['Venus', 'Mercury'], fm: ['Mars', 'Jupiter', 'Moon'], yk: ['Venus'] },
  Aquarius: { fb: ['Venus', 'Saturn'], fm: ['Jupiter', 'Moon', 'Mars'], yk: ['Venus'] },
  Pisces: { fb: ['Mars', 'Moon'], fm: ['Saturn', 'Venus', 'Sun', 'Mercury'], yk: ['Mars', 'Jupiter'] },
};

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 1 — Base Lordship Score
// ═══════════════════════════════════════════════════════════════════════════════

export function getBaseLordshipScore(planet: Planet, yogaState: YogaState, w: NDSWeights): { score: number, conditions: AppliedCondition[] } {
  if (w.disabledParams?.disableModule1) return { score: 0, conditions: [] };
  const lordshipMap = buildLordshipMap(yogaState);
  const houses = lordshipMap.get(planet) ?? [];
  const conditions: AppliedCondition[] = [];
  let score = 0;

  if (planet === 'Ketu') {
    if (houses.length === 0) return { score, conditions };
  } else if (planet === 'Rahu') {
    if (houses.length === 0) return { score, conditions };
  } else {
    if (houses.length === 0) return { score, conditions };
  }

  // Parashari Yogakaraka and Functional Natures (Strict Lagna-based Lookup)
  const lagnaSign = yogaState.houses[1 as House].sign;
  const natures = PARASHARA_NATURES[lagnaSign];
  
  if (!w.disabledParams?.functionalBenefic && natures) {
    if (natures.fb.includes(planet)) {
      score += w.functionalBenefic;
      conditions.push({ key: 'functionalBenefic', name: 'Functional Benefic', value: w.functionalBenefic });
    } else if (natures.fm.includes(planet)) {
      score += w.functionalMalefic;
      conditions.push({ key: 'functionalMalefic', name: 'Functional Malefic', value: w.functionalMalefic });
    }

    const isYogakaraka = natures.yk.includes(planet);
    if (isYogakaraka) {
      score += w.yogaKaraka;
      conditions.push({ key: 'yogaKaraka', name: `Parashari Yogakaraka (${lagnaSign} Lagna)`, value: w.yogaKaraka });
    }
  }

  const planetHouse = yogaState.planets[planet].house;
  
  // Planet in House Matrix Score
  if (!w.disabledParams?.planetPlacementMatrix) {
    const planetIndex = PLANETS.indexOf(planet);
    if (planetIndex !== -1) {
      if (!w.planetPlacementMatrix) w.planetPlacementMatrix = DEFAULT_NDS_WEIGHTS.planetPlacementMatrix;
      const pScore = w.planetPlacementMatrix[planetIndex][planetHouse - 1];
      if (pScore !== 0) {
        score += pScore;
        conditions.push({ key: 'planetPlacementMatrix' as keyof NDSWeights, name: `${planet} in House ${planetHouse}`, value: pScore });
      }
    }
  }

  for (const h of houses) {
    // Graceful fallback if lordPlacementMatrix is undefined (from old local storage)
    if (!w.lordPlacementMatrix) w.lordPlacementMatrix = DEFAULT_NDS_WEIGHTS.lordPlacementMatrix;
    
    // Matrix score
    if (!w.disabledParams?.lordPlacementMatrix) {
      let matrixScore = w.lordPlacementMatrix[h - 1][planetHouse - 1];
      // Dynamic override for Kendradhipati Dosha on natural benefics 
      // User Spec: If Lord of Kendra (4,7,10) is placed in Kendra, Malefic=60, Benefic=15
      if ([4, 7, 10].includes(h) && [1, 4, 7, 10].includes(planetHouse)) {
        if (PLANET_NATURE[planet] === 'Benefic') {
          matrixScore = 15;
        }
      }
      
      if (matrixScore !== 0) {
        score += matrixScore;
        conditions.push({ key: 'lordPlacementMatrix' as keyof NDSWeights, name: `Lord of ${h} in ${planetHouse}`, value: matrixScore });
      }
    }

    // Flat score fallback check
    if (w.lordHouse1 === undefined) {
      Object.assign(w, {
        lordHouse1: 5, lordHouse2: 2, lordHouse3: 1, lordHouse4: 4, lordHouse5: 5, lordHouse6: -5, 
        lordHouse7: -2, lordHouse8: -5, lordHouse9: 5, lordHouse10: 5, lordHouse11: -1, lordHouse12: -1
      });
    }

    // Flat score
    if (!w.disabledParams?.lordshipSliders) {
      let flatScore = 0;
      let key: keyof NDSWeights = 'lordHouse1';
      switch (h) {
        case 1: flatScore = w.lordHouse1; key = 'lordHouse1'; break;
        case 2: flatScore = w.lordHouse2; key = 'lordHouse2'; break;
        case 3: flatScore = w.lordHouse3; key = 'lordHouse3'; break;
        case 4: flatScore = w.lordHouse4; key = 'lordHouse4'; break;
        case 5: flatScore = w.lordHouse5; key = 'lordHouse5'; break;
        case 6: flatScore = w.lordHouse6; key = 'lordHouse6'; break;
        case 7: flatScore = w.lordHouse7; key = 'lordHouse7'; break;
        case 8: flatScore = w.lordHouse8; key = 'lordHouse8'; break;
        case 9: flatScore = w.lordHouse9; key = 'lordHouse9'; break;
        case 10: flatScore = w.lordHouse10; key = 'lordHouse10'; break;
        case 11: flatScore = w.lordHouse11; key = 'lordHouse11'; break;
        case 12: flatScore = w.lordHouse12; key = 'lordHouse12'; break;
      }
      
      if (flatScore !== 0) {
        score += flatScore;
        conditions.push({ key, name: `Lord of House ${h} (Base)`, value: flatScore });
      }
    }
  }

  return { score, conditions };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 2 — Dignity Score (Pure Addition/Subtraction)
// ═══════════════════════════════════════════════════════════════════════════════

export function getDignityScore(planet: Planet, yogaState: YogaState, _positions: any[], w: NDSWeights): { score: number, conditions: AppliedCondition[] } {
  if (w.disabledParams?.disableModule2) return { score: 0, conditions: [] };
  const info = yogaState.planets[planet];
  const dignity = info.dignity;
  const conditions: AppliedCondition[] = [];
  let score = 0;

  switch (dignity) {
    case 'Deep Exaltation':
    case 'Exaltation':
    case 'Moolatrikona': 
      score += w.exaltation; 
      conditions.push({ key: 'exaltation', name: 'Exalted/Moolatrikona', value: w.exaltation });
      break;
    case 'Own Sign': 
      score += w.ownSign; 
      conditions.push({ key: 'ownSign', name: 'Own Sign', value: w.ownSign });
      break;
    case 'Friendly Sign': 
      score += w.friendlySign; 
      conditions.push({ key: 'friendlySign', name: 'Friendly Sign', value: w.friendlySign });
      break;
    case 'Neutral Sign': 
      score += w.neutralSign; 
      conditions.push({ key: 'neutralSign', name: 'Neutral Sign', value: w.neutralSign });
      break;
    case 'Enemy Sign': 
      score += w.enemySign; 
      conditions.push({ key: 'enemySign', name: 'Enemy Sign', value: w.enemySign });
      break;
    case 'Debilitation':
    case 'Deep Debilitation': 
      score += w.debilitation; 
      conditions.push({ key: 'debilitation', name: 'Debilitated', value: w.debilitation });
      break;
  }

  if (dignity === 'Debilitation' || dignity === 'Deep Debilitation') {
    let nbConditions = 0;
    const dispositor = info.dispositor;
    const dispositorHouse = yogaState.planets[dispositor].house;
    const planetSignIndex = info.position.rasi.index;

    if (KENDRA_HOUSES.includes(dispositorHouse)) nbConditions++;

    for (const p of PLANETS) {
      if (isExalted(p as Planet, info.position.rasi.name as Sign)) {
        const exaltLordHouse = yogaState.planets[p as Planet].house;
        if (KENDRA_HOUSES.includes(exaltLordHouse)) nbConditions++;
        break;
      }
    }

    const dispositorSign = yogaState.planets[dispositor].position.rasi.index;
    if (planetSignIndex === dispositorSign) nbConditions++;
    if (hasVedicAspect(dispositor, dispositorHouse, info.house)) nbConditions++;
    if (KENDRA_HOUSES.includes(info.house)) nbConditions++;

    if (nbConditions >= 3) {
      const v = w.neechaBhanga;
      score += v;
      conditions.push({ key: 'neechaBhanga', name: 'Full Neecha Bhanga Raja Yoga', value: v });
    } else if (nbConditions >= 2) {
      const v = Math.round(w.neechaBhanga * 0.8);
      score += v;
      conditions.push({ key: 'neechaBhanga', name: 'Strong Neecha Bhanga', value: v });
    } else if (nbConditions >= 1) {
      const v = Math.round(w.neechaBhanga * 0.5);
      score += v;
      conditions.push({ key: 'neechaBhanga', name: 'Partial Neecha Bhanga', value: v });
    }
  }

  if (info.position.rasi.name === info.position.navamsha.name) {
    score += w.vargottama;
    conditions.push({ key: 'vargottama', name: 'Vargottama (D1=D9)', value: w.vargottama });
  }

  if (planet === 'Sun' && w.enableCombustionTradeoff) {
    let absorbedPoints = 0;
    const ascendantPos = _positions.find(p => p.name === 'Ascendant');
    const ascendantSignIndex = ascendantPos ? ascendantPos.rasi.index : 0;
    const sunLordOfHouse = (4 - ascendantSignIndex + 12) % 12 + 1;
    const isSunBadLord = [2, 3, 6, 7, 8, 12].includes(sunLordOfHouse);
    const combustionVal = isSunBadLord ? (w.combustionBadLord ?? w.combustion) : (w.combustionGoodLord ?? w.combustion);

    for (const otherP of Object.keys(yogaState.planets)) {
      if (otherP === 'Sun' || otherP === 'Rahu' || otherP === 'Ketu') continue;
      const otherInfo = yogaState.planets[otherP as keyof typeof yogaState.planets];
      if (otherInfo.isCombust) {
         absorbedPoints += -(combustionVal);
      }
    }
    
    if (absorbedPoints !== 0) {
      score += absorbedPoints;
      conditions.push({ key: 'combustion', name: `Tradeoff: Absorbed points from combust planets`, value: absorbedPoints });
    }
  }

  if (info.isCombust && planet !== 'Sun' && planet !== 'Rahu' && planet !== 'Ketu') {
    const ascendantPos = _positions.find(p => p.name === 'Ascendant');
    const ascendantSignIndex = ascendantPos ? ascendantPos.rasi.index : 0;
    const sunLordOfHouse = (4 - ascendantSignIndex + 12) % 12 + 1;
    const isSunBadLord = [2, 3, 6, 7, 8, 12].includes(sunLordOfHouse);
    const combustionVal = isSunBadLord ? (w.combustionBadLord ?? w.combustion) : (w.combustionGoodLord ?? w.combustion);

    score += combustionVal;
    conditions.push({ key: 'combustion', name: `Combust (Sun is Lord of ${sunLordOfHouse})`, value: combustionVal });
  }

  const signIdx = info.position.rasi.index;
  const deg = info.position.rasi.degreesInSign;
  if ((signIdx % 2 === 1 && deg < 6) || (signIdx % 2 === 0 && deg > 24)) {
    score += w.sushupti;
    conditions.push({ key: 'sushupti', name: 'Sushupti Avastha (Deep Sleep)', value: w.sushupti });
  }

  return { score, conditions };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 3 — Mutual Placement
// ═══════════════════════════════════════════════════════════════════════════════

export function getMutualPlacement(mdLord: Planet, adLord: Planet, yogaState: YogaState, w: NDSWeights): { score: number, conditions: AppliedCondition[] } {
  if (w.disabledParams?.disableModule3) return { score: 0, conditions: [] };
  const conditions: AppliedCondition[] = [];
  let score = 0;

  if (mdLord !== adLord) {
    const mdHouse = yogaState.planets[mdLord].house;
    const adHouse = yogaState.planets[adLord].house;

    const forward = ((adHouse - mdHouse + 12) % 12) + 1;
    const reverse = ((mdHouse - adHouse + 12) % 12) + 1;

    const scoreDistance = (d: number): { key: keyof NDSWeights, val: number } => {
      switch (d) {
        case 1: return { key: 'mutualDistance1', val: w.mutualDistance1 };
        case 2: return { key: 'mutualDistance2', val: w.mutualDistance2 };
        case 3: return { key: 'mutualDistance3', val: w.mutualDistance3 };
        case 4: return { key: 'mutualDistance4', val: w.mutualDistance4 };
        case 5: return { key: 'mutualDistance5', val: w.mutualDistance5 };
        case 6: return { key: 'mutualDistance6', val: w.mutualDistance6 };
        case 7: return { key: 'mutualDistance7', val: w.mutualDistance7 };
        case 8: return { key: 'mutualDistance8', val: w.mutualDistance8 };
        case 9: return { key: 'mutualDistance9', val: w.mutualDistance9 };
        case 10: return { key: 'mutualDistance10', val: w.mutualDistance10 };
        case 11: return { key: 'mutualDistance11', val: w.mutualDistance11 };
        case 12: return { key: 'mutualDistance12', val: w.mutualDistance12 };
        default: return { key: 'mutualDistance1', val: 0 };
      }
    };

    const fwd = scoreDistance(forward);
    const rev = scoreDistance(reverse);

    const selected = Math.abs(fwd.val) >= Math.abs(rev.val) ? { dist: forward, ...fwd } : { dist: reverse, ...rev };
    
    if (selected.val !== 0) {
      score += selected.val;
      conditions.push({ key: selected.key as keyof NDSWeights, name: `Mutual Placement (${selected.dist} houses apart)`, value: selected.val });
    }
  }

  const checkNodeYoga = (node: Planet, other: Planet) => {
    if (node !== 'Rahu' && node !== 'Ketu') return false;
    const nodeHouse = yogaState.planets[node].house;
    const otherHouse = yogaState.planets[other].house;
    
    const isInfluencing = (nodeHouse === otherHouse) || hasVedicAspect(other, otherHouse, nodeHouse);
    if (!isInfluencing) return false;

    const inKendra = [1,4,7,10].includes(nodeHouse);
    const inTrikona = [1,5,9].includes(nodeHouse);
    if (!inKendra && !inTrikona) return false;

    const lordshipMap = buildLordshipMap(yogaState);
    const otherHouses = lordshipMap.get(other) || [];
    
    const otherLordsKendra = otherHouses.some(h => [1,4,7,10].includes(h));
    const otherLordsTrikona = otherHouses.some(h => [1,5,9].includes(h));

    if (inKendra && otherLordsTrikona) return true;
    if (inTrikona && otherLordsKendra) return true;
    
    return false;
  };

  if (checkNodeYoga(mdLord, adLord) || checkNodeYoga(adLord, mdLord)) {
    score += w.rahuKetuYogKaraka;
    conditions.push({ key: 'rahuKetuYogKaraka', name: 'Node + Aspect Yog Karaka', value: w.rahuKetuYogKaraka });
  }

  return { score, conditions };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 4 — Arudha Lagna Modifiers
// ═══════════════════════════════════════════════════════════════════════════════

export function getArudhaModifiers(planet: Planet, yogaState: YogaState, alSignIndex: number, w: NDSWeights): { score: number, conditions: AppliedCondition[] } {
  if (w.disabledParams?.disableModule4) return { score: 0, conditions: [] };
  let score = 0;
  const conditions: AppliedCondition[] = [];
  const planetSignIndex = yogaState.planets[planet].position.rasi.index;

  const isBenefic = isNaturalBenefic(planet);
  const isMalefic = isNaturalMalefic(planet);

  // 11th from AL
  const sign11th = (alSignIndex + 10) % 12;
  const isPlaced11th = planetSignIndex === sign11th;
  
  // Convert 0-11 sign index to 1-12 house index for hasVedicAspect. 
  // It expects sourceHouse and targetHouse.
  const isAspecting11th = hasVedicAspect(planet, (planetSignIndex + 1) as House, (sign11th + 1) as House);

  if (isPlaced11th || isAspecting11th) {
    score += w.arudha11thAny;
    const desc = isPlaced11th ? 'Placed 11th from Arudha Lagna' : 'Aspects 11th from Arudha Lagna';
    conditions.push({ key: 'arudha11thAny', name: desc, value: w.arudha11thAny });
    if (isBenefic) {
      score += w.arudha11thBenefic;
      const bDesc = isPlaced11th ? 'Benefic in 11th from AL' : 'Benefic aspects 11th from AL';
      conditions.push({ key: 'arudha11thBenefic', name: bDesc, value: w.arudha11thBenefic });
    }
  }

  // 12th from AL
  if ((planetSignIndex - alSignIndex + 12) % 12 === 11) {
    score += w.arudha12thAny;
    conditions.push({ key: 'arudha12thAny', name: 'Placed 12th from Arudha Lagna', value: w.arudha12thAny });
    if (isMalefic) {
      score += w.arudha12thMalefic;
      conditions.push({ key: 'arudha12thMalefic', name: 'Malefic in 12th from AL', value: w.arudha12thMalefic });
    }
  }

  const signOccupants: Map<number, Planet[]> = new Map();
  for (const p of PLANETS) {
    const sIdx = yogaState.planets[p as Planet].position.rasi.index;
    if (!signOccupants.has(sIdx)) signOccupants.set(sIdx, []);
    signOccupants.get(sIdx)!.push(p as Planet);
  }

  const sign3rd = (alSignIndex + 2) % 12;
  const sign6th = (alSignIndex + 5) % 12;

  const maleficsIn3rd = (signOccupants.get(sign3rd) ?? []).filter(isNaturalMalefic);
  const maleficsIn6th = (signOccupants.get(sign6th) ?? []).filter(isNaturalMalefic);

  if (maleficsIn3rd.length > 0) {
    score += w.arudha3rdMalefic;
    conditions.push({ key: 'arudha3rdMalefic', name: 'Malefics in 3rd from AL', value: w.arudha3rdMalefic });
  }
  if (maleficsIn6th.length > 0) {
    score += w.arudha6thMalefic;
    conditions.push({ key: 'arudha6thMalefic', name: 'Malefics in 6th from AL', value: w.arudha6thMalefic });
  }

  const prevSign = (planetSignIndex - 1 + 12) % 12;
  const nextSign = (planetSignIndex + 1) % 12;

  const prevOccupants = signOccupants.get(prevSign) ?? [];
  const nextOccupants = signOccupants.get(nextSign) ?? [];

  if (prevOccupants.length > 0 && nextOccupants.length > 0 &&
      prevOccupants.every(isNaturalMalefic) && nextOccupants.every(isNaturalMalefic)) {
    score += w.papaKartari;
    conditions.push({ key: 'papaKartari', name: 'Papa Kartari Yoga (Hemmed by Malefics)', value: w.papaKartari });
  }
  else if (prevOccupants.length > 0 && nextOccupants.length > 0 &&
           prevOccupants.every(isNaturalBenefic) && nextOccupants.every(isNaturalBenefic)) {
    score += w.shubhaKartari;
    conditions.push({ key: 'shubhaKartari', name: 'Shubha Kartari Yoga (Hemmed by Benefics)', value: w.shubhaKartari });
  }

  return { score, conditions };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 5 — Awasthas
// ═══════════════════════════════════════════════════════════════════════════════

export function getAwasthaModifiers(planet: Planet, awasthasData: any, w: NDSWeights): { score: number, conditions: AppliedCondition[] } {
  if (w.disabledParams?.disableModule5) return { score: 0, conditions: [] };
  if (!awasthasData || !awasthasData[planet]) return { score: 0, conditions: [] };
  
  let score = 0;
  const conditions: AppliedCondition[] = [];
  
  const lajjitadiStr: string = awasthasData[planet].lajjitadi || 'None';
  if (lajjitadiStr !== 'None') {
    const parts = lajjitadiStr.split(',').map(s => s.trim());
    for (const part of parts) {
      const [name, multiplierStr] = part.split('^');
      const multiplier = multiplierStr ? parseInt(multiplierStr, 10) : 1;
      
      let s = 0;
      let key: keyof NDSWeights | null = null;
      
      switch (name) {
        case 'Lajita': s = w.lajita * multiplier; key = 'lajita'; break;
        case 'Garvita': s = w.garvita * multiplier; key = 'garvita'; break;
        case 'Kshudita': s = w.kshudita * multiplier; key = 'kshudita'; break;
        case 'Trushita': s = w.trushita * multiplier; key = 'trushita'; break;
        case 'Mudita': s = w.mudita * multiplier; key = 'mudita'; break;
        case 'Kshobita': s = w.kshobita * multiplier; key = 'kshobita'; break;
      }

      if (key && s !== 0) {
        score += s;
        conditions.push({ key, name: `${name} Awastha${multiplier > 1 ? ' (x' + multiplier + ')' : ''}`, value: s });
      }
    }
  }

  return { score, conditions };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODULE 6 — Pravesh Offset
// ═══════════════════════════════════════════════════════════════════════════════

export function getPraveshOffset(planet: Planet, praveshData: any, w: NDSWeights): { score: number, conditions: AppliedCondition[] } {
  if (w.disabledParams?.disableModule6) return { score: 0, conditions: [] };
  if (!praveshData) return { score: 0, conditions: [] };
  
  let score = 0;
  const conditions: AppliedCondition[] = [];

  let hScore = 0;
  let hKey: keyof NDSWeights = 'praveshHouse1';
  switch (praveshData.house) {
    case 1: hScore = w.praveshHouse1; hKey = 'praveshHouse1'; break;
    case 2: hScore = w.praveshHouse2; hKey = 'praveshHouse2'; break;
    case 3: hScore = w.praveshHouse3; hKey = 'praveshHouse3'; break;
    case 4: hScore = w.praveshHouse4; hKey = 'praveshHouse4'; break;
    case 5: hScore = w.praveshHouse5; hKey = 'praveshHouse5'; break;
    case 6: hScore = w.praveshHouse6; hKey = 'praveshHouse6'; break;
    case 7: hScore = w.praveshHouse7; hKey = 'praveshHouse7'; break;
    case 8: hScore = w.praveshHouse8; hKey = 'praveshHouse8'; break;
    case 9: hScore = w.praveshHouse9; hKey = 'praveshHouse9'; break;
    case 10: hScore = w.praveshHouse10; hKey = 'praveshHouse10'; break;
    case 11: hScore = w.praveshHouse11; hKey = 'praveshHouse11'; break;
    case 12: hScore = w.praveshHouse12; hKey = 'praveshHouse12'; break;
  }
  
  if (hScore !== 0) {
    score += hScore;
    conditions.push({ key: hKey, name: `Dasha Pravesh in House ${praveshData.house}`, value: hScore });
  }
  
  const rasiName = praveshData.rasi.name as Sign;
  if (isExalted(planet, rasiName)) {
    score += w.praveshExalted;
    conditions.push({ key: 'praveshExalted', name: 'Dasha Pravesh Exalted', value: w.praveshExalted });
  } else if (isDebilitated(planet, rasiName)) {
    score += w.praveshDebilitated;
    conditions.push({ key: 'praveshDebilitated', name: 'Dasha Pravesh Debilitated', value: w.praveshDebilitated });
  } else if (isOwnSign(planet, rasiName)) {
    score += w.praveshOwnSign;
    conditions.push({ key: 'praveshOwnSign', name: 'Dasha Pravesh Own Sign', value: w.praveshOwnSign });
  }
  
  return { score, conditions };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MASTER — calculateNDS
// ═══════════════════════════════════════════════════════════════════════════════


export function getNavamshaModifiers(planet: Planet, yogaState: YogaState, alSignIndex: number, w: NDSWeights): { score: number, conditions: AppliedCondition[] } {
  if (w.disabledParams?.disableModule7) return { score: 0, conditions: [] };
  let score = 0;
  const conditions: AppliedCondition[] = [];
  const info = yogaState.planets[planet];
  
  const navamshaSignName = info.position.navamsha.name as Sign;
  const navamshaSignIndex = info.position.navamsha.index;
  const rasiSignIndex = info.position.rasi.index;
  const navamshaLord = SIGN_LORDS[navamshaSignName];

  // 1. navamshaStrong: Exalted, Own Sign, Same as AL, or 5/9 from Rasi sign
  const isNavExalted = isExalted(planet, navamshaSignName);
  const isNavOwn = navamshaLord === planet;
  const isSameAsAL = navamshaSignIndex === alSignIndex;
  
  const distRasiToNav = (navamshaSignIndex - rasiSignIndex + 12) % 12 + 1;
  const is5or9 = distRasiToNav === 5 || distRasiToNav === 9;

  if (isNavExalted || isNavOwn || isSameAsAL || is5or9) {
    score += w.navamshaStrong;
    conditions.push({ key: 'navamshaStrong', name: 'Navamsha Exalted/Own/AL/Trikona', value: w.navamshaStrong });
  }

  // 2. navamshaWeak: Debilitated, or 6/8/12 from Rasi sign
  const isNavDebilitated = isDebilitated(planet, navamshaSignName);
  const is6812 = distRasiToNav === 6 || distRasiToNav === 8 || distRasiToNav === 12;

  if (isNavDebilitated || is6812) {
    score += w.navamshaWeak;
    conditions.push({ key: 'navamshaWeak', name: 'Navamsha Debilitated/Dusthana', value: w.navamshaWeak });
  }

  // 3. Benefic / Malefic Navamsha
  const isBeneficLord = PLANET_NATURE[navamshaLord] === 'Benefic';
  if (isBeneficLord) {
    score += w.navamshaBenefic;
    conditions.push({ key: 'navamshaBenefic', name: 'Benefic Navamsha', value: w.navamshaBenefic });
  } else {
    score += w.navamshaMalefic;
    conditions.push({ key: 'navamshaMalefic', name: 'Malefic Navamsha', value: w.navamshaMalefic });
  }

  return { score, conditions };
}

export function calculateNDS(
  planet: Planet,
  yogaState: YogaState,
  positions: any[],
  alSignIndex: number,
  awasthasData: any,
  weights: NDSWeights,
  mdLord?: Planet,
  praveshData?: any
): NDSResult {
  const base = getBaseLordshipScore(planet, yogaState, weights);
  const dignity = getDignityScore(planet, yogaState, positions, weights);
  const mutual = mdLord && mdLord ? getMutualPlacement(mdLord, planet, yogaState, weights) : { score: 0, conditions: [] };
  const arudha = getArudhaModifiers(planet, yogaState, alSignIndex, weights);
  const navamsha = getNavamshaModifiers(planet, yogaState, alSignIndex, weights);
  const awastha = getAwasthaModifiers(planet, awasthasData, weights);
  const pravesh = getPraveshOffset(planet, praveshData, weights);

  const allConditions = [
    ...base.conditions,
    ...dignity.conditions,
    ...mutual.conditions,
    ...arudha.conditions,
    ...navamsha.conditions,
    ...awastha.conditions,
    ...pravesh.conditions
  ].filter(c => c.value !== 0);

  const netScore = base.score + dignity.score + mutual.score + arudha.score + awastha.score + pravesh.score;
  const maxPossible = allConditions.reduce((sum, c) => sum + Math.abs(c.value), 0);
  
  let percentage = 0;
  if (maxPossible > 0) {
    percentage = Math.round((netScore / maxPossible) * 100);
  }

  return {
    percentage: clamp(percentage, -100, 100),
    netScore,
    maxPossible,
    conditions: allConditions,
    breakdown: {
      baseLordship: base.score,
      dignityScore: dignity.score,
      mutualPlacement: mutual.score,
      arudhaModifiers: arudha.score,
    navamshaModifiers: navamsha.score,
      awasthaModifiers: awastha.score,
      praveshOffset: pravesh.score,
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// TIME-SERIES GENERATOR
// ═══════════════════════════════════════════════════════════════════════════════

export function generateDashaTimeSeries(
  dashas: DashaPeriod[],
  yogaState: YogaState,
  positions: any[],
  alSignIndex: number,
  awasthasData: any,
  weights: NDSWeights = DEFAULT_NDS_WEIGHTS
): DashaTimePoint[] {
  const points: DashaTimePoint[] = [];

  for (const md of dashas) {
    const mdPlanet = md.planet as Planet;
    const mdResult = calculateNDS(mdPlanet, yogaState, positions, alSignIndex, awasthasData, weights, undefined, md.pravesh);
    const adPeriods = md.subPeriods ?? [];

    for (const ad of adPeriods) {
      const adPlanet = ad.planet as Planet;
      const adResult = calculateNDS(adPlanet, yogaState, positions, alSignIndex, awasthasData, weights, mdPlanet, ad.pravesh);

      const mdW = (weights.mdWeightPercentage ?? 50) / 100;
      const adW = 1 - mdW;
      const blendedPercentage = clamp(Math.round(mdResult.percentage * mdW + adResult.percentage * adW), -100, 100);
      const pdPlanet = ad.subPeriods?.[0]?.planet ?? '';

      points.push({
        date: ad.start,
        mdPlanet,
        adPlanet,
        pdPlanet,
        percentage: blendedPercentage,
        mdPercentage: mdResult.percentage,
        adPercentage: adResult.percentage,
        mdResult,
        adResult
      });
    }
  }

  return points;
}




