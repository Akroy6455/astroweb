export type Arrow = {
  fromSign: number;
  toSign: number;
  color: string;
  label?: string;
};

// Vedha pairs: Good House -> Vedha House (from Moon)
// 1-indexed houses
const VEDHA_RULES: Record<string, Record<number, number>> = {
  'Sun': { 3: 9, 6: 12, 10: 4, 11: 5 },
  'Moon': { 1: 5, 3: 9, 6: 12, 7: 2, 10: 4, 11: 8 },
  'Mars': { 3: 12, 6: 9, 11: 5 },
  'Mercury': { 2: 5, 4: 3, 6: 9, 8: 1, 10: 7, 11: 12 },
  'Jupiter': { 2: 12, 5: 4, 7: 3, 9: 10, 11: 8 },
  'Venus': { 1: 8, 2: 7, 3: 1, 4: 10, 5: 9, 8: 5, 9: 11, 11: 6, 12: 3 },
  'Saturn': { 3: 12, 6: 9, 11: 5 },
  'Rahu': { 3: 12, 6: 9, 11: 5 },
  'Ketu': { 3: 12, 6: 9, 11: 5 }
};

// Returns Nakshatra index (0 to 26) from longitude (0 to 360)
function getNakshatra(longitude: number) {
  return Math.floor(longitude / (360 / 27));
}

// Returns Rasi index (0 to 11) from longitude
function getRasi(longitude: number) {
  return Math.floor(longitude / 30);
}

export function calculateVedha(planets: any[], moonRasi: number): Arrow[] {
  const arrows: Arrow[] = [];
  
  // Create a map of house from Moon -> planets in that house
  const houseOccupants: Record<number, any[]> = {};
  for (const p of planets) {
    if (['Uranus', 'Neptune', 'Pluto'].includes(p.name)) continue;
    const rasi = getRasi(p.longitude);
    const houseFromMoon = ((rasi - moonRasi + 12) % 12) + 1;
    if (!houseOccupants[houseFromMoon]) houseOccupants[houseFromMoon] = [];
    houseOccupants[houseFromMoon].push(p);
  }

  for (const p of planets) {
    const rules = VEDHA_RULES[p.name];
    if (!rules) continue;
    
    const rasi = getRasi(p.longitude);
    const houseFromMoon = ((rasi - moonRasi + 12) % 12) + 1;
    
    if (rules[houseFromMoon]) {
      const vedhaHouse = rules[houseFromMoon];
      const obstructingPlanets = houseOccupants[vedhaHouse] || [];
      
      for (const obs of obstructingPlanets) {
        // Exceptions: Father/Son
        if ((p.name === 'Sun' && obs.name === 'Saturn') || (p.name === 'Saturn' && obs.name === 'Sun')) continue;
        if ((p.name === 'Moon' && obs.name === 'Mercury') || (p.name === 'Mercury' && obs.name === 'Moon')) continue;
        
        arrows.push({
          fromSign: getRasi(obs.longitude),
          toSign: rasi,
          color: '#ef4444', // Red for Vedha
          label: 'V'
        });
      }
    }
  }
  return arrows;
}

export function calculateLatta(planets: any[]): Arrow[] {
  const arrows: Arrow[] = [];
  
  // Map of Nakshatra -> planets in it
  const nakOccupants: Record<number, any[]> = {};
  for (const p of planets) {
    if (['Uranus', 'Neptune', 'Pluto'].includes(p.name)) continue;
    const nak = getNakshatra(p.longitude);
    if (!nakOccupants[nak]) nakOccupants[nak] = [];
    nakOccupants[nak].push(p);
  }

  const kicks: Record<string, number> = {
    'Sun': 11, 'Mars': 2, 'Jupiter': 5, 'Saturn': 7, // Forward (n-1 because inclusive counting)
    'Moon': -21, 'Mercury': -6, 'Venus': -4, 'Rahu': -8, 'Ketu': -8 // Backward
  };

  for (const p of planets) {
    const kickAmount = kicks[p.name];
    if (kickAmount === undefined) continue;
    
    const pNak = getNakshatra(p.longitude);
    const kickedNak = (pNak + kickAmount + 27) % 27;
    
    const hitPlanets = nakOccupants[kickedNak] || [];
    for (const target of hitPlanets) {
      if (p.name === target.name) continue;
      arrows.push({
        fromSign: getRasi(p.longitude),
        toSign: getRasi(target.longitude),
        color: '#a855f7', // Purple for Latta
        label: 'L'
      });
    }
  }
  return arrows;
}
