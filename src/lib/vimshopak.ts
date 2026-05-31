import { Planet, Sign, SIGN_LORDS, EXALTATION, MOOLATRIKONA, DEBILITATION } from './yoga_engine/constants';
import { YogaState } from './yoga_engine/types';

export const SHODASAVARGA_WEIGHTS: Record<number, number> = {
  1: 3.5,
  2: 1.0,
  3: 1.0,
  4: 0.5,
  7: 0.5,
  9: 3.0,
  10: 0.5,
  12: 0.5,
  16: 2.0,
  20: 0.5,
  24: 0.5,
  27: 0.5,
  30: 1.0,
  40: 0.5,
  45: 0.5,
  60: 4.0
};

export function getVargaDignityPoints(
  planetName: Planet,
  vargaSignIndex: number,
  d1CompoundRelationships: Record<Planet, 'Adhimitra' | 'Mitra' | 'Sama' | 'Satru' | 'Adhisatru'>
): number {
  const signs = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
  ] as const;
  const signName = signs[vargaSignIndex] as Sign;
  const dispositor = SIGN_LORDS[signName];

  // Exaltation
  if (planetName === 'Rahu' && (signName === 'Taurus' || signName === 'Gemini')) return 20;
  if (EXALTATION[planetName]?.sign === signName) return 20;

  // Debilitation
  if (planetName === 'Rahu' && (signName === 'Sagittarius' || signName === 'Pisces')) return 0;
  if (DEBILITATION[planetName]?.sign === signName) return 0; // Or 5 depending on school, but BPHS lowest is generally very low

  // Moolatrikona
  if (MOOLATRIKONA[planetName]?.sign === signName) return 18;

  // Own Sign
  if (planetName === 'Rahu' && (signName === 'Aquarius' || signName === 'Cancer' || signName === 'Virgo')) return 20;
  if (dispositor === planetName) return 20;

  // Moolatrikona (Only strictly applies in D1 based on degrees, but conventionally in Vargas, Own Sign covers it)
  // We already handled Own Sign, which gives 20 points.

  // Use Compound Relationship from D1
  const rel = d1CompoundRelationships[dispositor];
  if (!rel) return 10; // Default to neutral if something is missing

  switch (rel) {
    case 'Adhimitra': return 18;
    case 'Mitra': return 15;
    case 'Sama': return 10;
    case 'Satru': return 7;
    case 'Adhisatru': return 5;
    default: return 10;
  }
}

export function calculateVimshopakBala(
  positions: any[],
  divisionalCharts: Record<string, { lagna: any, houses: any[] }>,
  yogaState: YogaState
) {
  const vimshopak: Record<string, { totalScore: number, breakdown: Record<string, { sign: string, points: number, weight: number, score: number }> }> = {};

  const planets = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'] as Planet[];

  for (const pName of planets) {
    // Rahu and Ketu are generally not given Vimshopak Bala in the strict classical Parashari system, but we can include them if needed. 
    // We'll calculate for the 7 standard planets.
    
    let totalScore = 0;
    const breakdown: Record<string, any> = {};
    
    const d1Relations = yogaState.planets[pName]?.compoundRelationship;
    if (!d1Relations) continue;

    for (const divStr of Object.keys(SHODASAVARGA_WEIGHTS)) {
      const divNum = parseInt(divStr);
      const weight = SHODASAVARGA_WEIGHTS[divNum];
      
      const vargaKey = `D${divNum}`;
      const varga = divisionalCharts[vargaKey];
      
      if (!varga) continue;

      // Find planet in this varga
      let vargaSignIndex = 0;
      for (const h of varga.houses) {
        if (h.planets.some((p: any) => p.name === pName)) {
          vargaSignIndex = h.signIndex;
          break;
        }
      }

      const pointsOutOf20 = getVargaDignityPoints(pName, vargaSignIndex, d1Relations);
      
      // Calculate final contribution for this varga
      const score = (pointsOutOf20 * weight) / 20;
      totalScore += score;

      const signs = [
        'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
        'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
      ];

      breakdown[vargaKey] = {
        sign: signs[vargaSignIndex],
        points: pointsOutOf20,
        weight,
        score: Number(score.toFixed(3))
      };
    }

    vimshopak[pName] = {
      totalScore: Number(totalScore.toFixed(3)),
      breakdown
    };
  }

  // Handle Rahu/Ketu separately if desired, using their exalted/deb signs and dispositor relations
  const nodes = ['Rahu', 'Ketu'] as Planet[];
  for (const node of nodes) {
      if(!yogaState.planets[node]) continue;
      const d1Relations = yogaState.planets[node]?.compoundRelationship;
      let totalScore = 0;
      const breakdown: Record<string, any> = {};
      
      for (const divStr of Object.keys(SHODASAVARGA_WEIGHTS)) {
        const divNum = parseInt(divStr);
        const weight = SHODASAVARGA_WEIGHTS[divNum];
        const vargaKey = `D${divNum}`;
        const varga = divisionalCharts[vargaKey];
        if (!varga) continue;

        let vargaSignIndex = 0;
        for (const h of varga.houses) {
          if (h.planets.some((p: any) => p.name === node)) {
            vargaSignIndex = h.signIndex;
            break;
          }
        }

        const pointsOutOf20 = getVargaDignityPoints(node, vargaSignIndex, d1Relations);
        const score = (pointsOutOf20 * weight) / 20;
        totalScore += score;

        const signs = [
          'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
          'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
        ];

        breakdown[vargaKey] = {
          sign: signs[vargaSignIndex],
          points: pointsOutOf20,
          weight,
          score: Number(score.toFixed(3))
        };
      }
      vimshopak[node] = {
        totalScore: Number(totalScore.toFixed(3)),
        breakdown
      };
  }

  return vimshopak;
}
