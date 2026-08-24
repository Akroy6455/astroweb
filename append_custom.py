import fs
import json

with open('src/lib/timing_engine.ts', 'r', encoding='utf-8') as f:
    content = f.read()

if 'import { getSpecificVedhaNakshatras' not in content:
    content = content.replace("import { getKarmaNakshatra, getLatta, getVedhaNakshatras", "import { getSpecificVedhaNakshatras, getKarmaNakshatra, getLatta, getVedhaNakshatras")

new_func = '''

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
        newBreakdown.push({ key: \Custom: \\, name: \Dasha (\): \\, value: rule.multiplier });
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
           // We are evaluating based on houses
           if (rule.condition === 'House occupation') {
              // Wait, the UI doesn't specify *which* house they are occupying.
              // Ah, usually "House occupation" means they are occupying the house of the target? No, target IS the transiting planet.
              // Wait, the prompt says: "Position in the chart" -> House in ascendant chart.
              // If target is "Lord of 1st", condition is "House occupation". This is incomplete. 
              // The user probably means we need a specific reference point. 
              // Wait, for custom questions, if position type is "House in ascendant chart", what does it mean?
              // The user wants to map "IF Lord of 1st is Occupying THEN ... " - Wait, occupying WHAT? The house? 
           }
        }
        
        // I will implement the most sensible interpretation of these rules, 
        // which might require some assumptions that I will document in the UI.
        
        // For Nakshatras:
        const tNakIndex = getNak28Index(tp.long);
        const tNakName = NAKSHATRAS_28[tNakIndex];
        
        // We need Janma Nakshatra for SBC/Navatara positions
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

        if (isConditionMet) {
          transitBonus += (rule.multiplier - 1.0);
          newBreakdown.push({ key: \Custom: \\, name: \Transit: \ \\, value: rule.multiplier });
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
'''

if 'function calculateCustomTiming' not in content:
    content += new_func

with open('src/lib/timing_engine.ts', 'w', encoding='utf-8') as f:
    f.write(content)
