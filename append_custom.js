const fs = require('fs');
let content = fs.readFileSync('src/lib/timing_engine.ts', 'utf-8');

if (!content.includes('import { getSpecificVedhaNakshatras')) {
    content = content.replace(
        "import { getKarmaNakshatra, getLatta, getVedhaNakshatras",
        "import { getSpecificVedhaNakshatras, getKarmaNakshatra, getLatta, getVedhaNakshatras"
    );
}

const newFunc = `

function getHouseFromLagna(lagnaRasi: number, planetRasi: number): number {
  return ((planetRasi - lagnaRasi + 12) % 12) + 1;
}

function calculateCustomTiming(
  transitData: any[],
  basePositions: PlanetPosition[],
  lagna: PlanetPosition,
  customQ: CustomQuestion
): any[] {
  const lagnaRasi = Math.floor(lagna.longitude / 30);
  
  // Pre-calculate Jaimini Karakas
  const validPlanets = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
  const candidates = basePositions.filter(p => validPlanets.includes(p.name));
  candidates.sort((a, b) => b.rasi.degreesInSign - a.rasi.degreesInSign);
  
  const karakas = {
    'AK': candidates[0]?.name,
    'AmK': candidates[1]?.name,
    'BK': candidates[2]?.name,
    'MK': candidates[3]?.name,
    'PK': candidates[4]?.name,
    'GK': candidates[5]?.name,
    'DK': candidates[6]?.name,
  };

  const getTargetPlanetName = (target: string): string | null => {
    if (validPlanets.includes(target) || target === 'Rahu' || target === 'Ketu') return target;
    if (target.startsWith('Lord of ')) {
      const houseStr = target.replace('Lord of ', '').replace('st', '').replace('nd', '').replace('rd', '').replace('th', '');
      const h = parseInt(houseStr);
      if (!isNaN(h)) return getLordOfHouse(lagnaRasi, h);
    }
    if (karakas[target as keyof typeof karakas]) return karakas[target as keyof typeof karakas];
    return null; // For Benefic/Malefic, we handle it separately
  };

  return transitData.map(point => {
    let modifiedScore = point.netScore || 0;
    const newBreakdown = [...(point.breakdown || [])];

    // --- DASHA LORD MULTIPLIERS (Additive) ---
    let dashaBonus = 0;
    for (const rule of customQ.dashaRules) {
      let isMatch = false;
      const targetPlanet = getTargetPlanetName(rule.target);
      
      const checkLevel = (planetName: string) => {
        if (!planetName) return false;
        if (rule.target === 'Benefic planets only' && PLANET_NATURE[planetName] === 'Benefic') return true;
        if (rule.target === 'Malefic planets only' && PLANET_NATURE[planetName] === 'Malefic') return true;
        if (targetPlanet && planetName === targetPlanet) return true;
        return false;
      };

      if (rule.level === 'MD' && checkLevel(point.mdPlanet)) isMatch = true;
      if (rule.level === 'AD' && checkLevel(point.adPlanet)) isMatch = true;
      if (rule.level === 'Both' && (checkLevel(point.mdPlanet) || checkLevel(point.adPlanet))) isMatch = true;

      if (isMatch) {
        dashaBonus += (rule.multiplier - 1.0);
        newBreakdown.push({ key: \`Custom: ${rule.id}\`, name: \`Dasha (${rule.level}): ${rule.target}\`, value: rule.multiplier });
      }
    }
    const dashaMultiplier = 1.0 + dashaBonus;

    // --- TRANSIT MULTIPLIERS (Additive) ---
    let transitBonus = 0;
    const transitPlanets = getTransitPlanets(point);

    for (const tp of transitPlanets) {
      for (const rule of customQ.transitRules) {
        const targetPlanet = getTargetPlanetName(rule.target);
        let isTargetMatch = false;

        if (rule.target === 'Benefic planets only' && PLANET_NATURE[tp.name] === 'Benefic') isTargetMatch = true;
        else if (rule.target === 'Malefic planets only' && PLANET_NATURE[tp.name] === 'Malefic') isTargetMatch = true;
        else if (targetPlanet && tp.name === targetPlanet) isTargetMatch = true;

        if (!isTargetMatch) continue;

        let isConditionMet = false;
        const tpRasi = Math.floor(tp.long / 30);
        
        if (customQ.positionType === 'House in ascendant chart') {
           const tpHouse = getHouseFromLagna(lagnaRasi, tpRasi);
           if (rule.condition === 'House occupation') {
              isConditionMet = true; 
           }
        } else {
           // For Nakshatras:
           const tNakIndex = getNak28Index(tp.long);
           const tNakName = NAKSHATRAS_28[tNakIndex];
           
           const lMoon = basePositions.find(p => p.name === 'Moon')?.longitude || 0;
           const janmaNakIndex = getNak28Index(lMoon);
           
           if (rule.condition === 'Occupying the nakshtra') {
              if (tNakIndex === janmaNakIndex) isConditionMet = true;
           } else if (rule.condition === 'Front vedha') {
              const vedhas = getSpecificVedhaNakshatras(tp.long, 'front');
              if (vedhas.includes(NAKSHATRAS_28[janmaNakIndex])) isConditionMet = true;
           } else if (rule.condition === 'Right Vedha to nakshatra if applicable') {
              const vedhas = getSpecificVedhaNakshatras(tp.long, 'right');
              if (vedhas.includes(NAKSHATRAS_28[janmaNakIndex])) isConditionMet = true;
           } else if (rule.condition === 'Left vedha to nakshatra if applicable') {
              const vedhas = getSpecificVedhaNakshatras(tp.long, 'left');
              if (vedhas.includes(NAKSHATRAS_28[janmaNakIndex])) isConditionMet = true;
           } else if (rule.condition === 'Latta') {
              const lattaNak = getLatta(tp.name, tp.long);
              if (lattaNak === NAKSHATRAS_28[janmaNakIndex]) isConditionMet = true;
           }
        }

        if (isConditionMet) {
          transitBonus += (rule.multiplier - 1.0);
          newBreakdown.push({ key: \`Custom: ${rule.id}\`, name: \`Transit: ${rule.target} ${rule.condition}\`, value: rule.multiplier });
        }
      }
    }
    const transitMultiplier = 1.0 + transitBonus;

    modifiedScore = modifiedScore * dashaMultiplier * transitMultiplier;
    
    return {
      ...point,
      netScore: modifiedScore,
      breakdown: newBreakdown,
      baseScore: point.netScore // Keep original score
    };
  });
}
`;

if (!content.includes('function calculateCustomTiming')) {
    content += newFunc;
    fs.writeFileSync('src/lib/timing_engine.ts', content);
}
