const fs = require('fs');
let code = fs.readFileSync('src/lib/nds_engine.ts', 'utf8');

const getAdvancedModifiers = `
export function getAdvancedModifiers(planet: Planet, positions: any[], w: NDSWeights): { score: number, conditions: AppliedCondition[] } {
  if (w.disabledParams?.advancedRules) return { score: 0, conditions: [] };
  let score = 0;
  const conditions: AppliedCondition[] = [];

  // 1. Rahu/Ketu Moon Conjunct
  const moonPos = positions.find(p => p.planet === 'Moon');
  const rahuPos = positions.find(p => p.planet === 'Rahu');
  const ketuPos = positions.find(p => p.planet === 'Ketu');
  
  if (planet === 'Moon' || planet === 'Rahu' || planet === 'Ketu') {
      if (moonPos && (rahuPos || ketuPos)) {
          if ((rahuPos && moonPos.sign === rahuPos.sign) || (ketuPos && moonPos.sign === ketuPos.sign)) {
              const penalty = w.rahuKetuMoonConjunct || 0;
              score += penalty;
              conditions.push({ key: 'rahuKetuMoonConjunct', name: 'Moon conjunct Node (Rahu/Ketu)', value: penalty });
          }
      }
  }

  return { score, conditions };
}
`;

const oldCalculateNDS = `export function calculateNDS(
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
}`;

const newCalculateNDS = getAdvancedModifiers + `
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
  const advanced = getAdvancedModifiers(planet, positions, weights);

  const allConditions = [
    ...base.conditions,
    ...dignity.conditions,
    ...mutual.conditions,
    ...arudha.conditions,
    ...navamsha.conditions,
    ...awastha.conditions,
    ...pravesh.conditions,
    ...advanced.conditions
  ].filter(c => c.value !== 0);

  const netScore = base.score + dignity.score + mutual.score + arudha.score + navamsha.score + awastha.score + pravesh.score + advanced.score;
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
      advancedRules: advanced.score,
    },
  };
}`;

code = code.replace(oldCalculateNDS, newCalculateNDS);
fs.writeFileSync('src/lib/nds_engine.ts', code);
