const fs = require('fs');

let content = fs.readFileSync('src/lib/nds_engine.ts', 'utf8');

const targetRegex = /export function getMutualPlacement.*?MODULE 5 — Awasthas/s;

const replacement = `export function getMutualPlacement(mdLord: Planet, adLord: Planet, yogaState: YogaState, w: NDSWeights): { score: number, conditions: AppliedCondition[] } {
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
      conditions.push({ key: selected.key as keyof NDSWeights, name: \`Mutual Placement (\${selected.dist} houses apart)\`, value: selected.val });
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
// MODULE 5 — Awasthas`;

content = content.replace(targetRegex, replacement);

fs.writeFileSync('src/lib/nds_engine.ts', content);
console.log('Done');
