const fs = require('fs');
let content = fs.readFileSync('src/lib/nds_engine.ts', 'utf8');

// 1. Add new variables to NDSWeights
content = content.replace(
  /combustion: number;/,
  `combustion: number;\n  combustionBadLord?: number;\n  combustionGoodLord?: number;\n  enableCombustionTradeoff?: boolean;`
);

// 2. Add defaults to DEFAULT_NDS_WEIGHTS
content = content.replace(
  /combustion: -80,/,
  `combustion: -80,\n  combustionBadLord: -80,\n  combustionGoodLord: -40,\n  enableCombustionTradeoff: false,`
);

// 3. Replace combustion logic in getDignityScore
const oldLogicRegex = /if \(info\.isCombust\) \{[\s\S]*?\}\s*\}/;

const newLogic = `if (planet === 'Sun' && w.enableCombustionTradeoff) {
    let absorbedPoints = 0;
    const ascendantPos = _positions.find(p => p.name === 'Ascendant');
    const ascendantSignIndex = ascendantPos ? ascendantPos.rasi.index : 0;
    const sunLordOfHouse = (4 - ascendantSignIndex + 12) % 12 + 1;
    const isSunBadLord = [2, 3, 6, 7, 8, 12].includes(sunLordOfHouse);
    const combustionVal = isSunBadLord ? (w.combustionBadLord ?? w.combustion) : (w.combustionGoodLord ?? w.combustion);

    for (const otherP of Object.keys(yogaState.planets)) {
      if (otherP === 'Sun' || otherP === 'Rahu' || otherP === 'Ketu') continue;
      const otherInfo = yogaState.planets[otherP];
      if (otherInfo.isCombust) {
         absorbedPoints += -(combustionVal);
      }
    }
    
    if (absorbedPoints !== 0) {
      score += absorbedPoints;
      conditions.push({ key: 'combustion', name: \`Tradeoff: Absorbed points from combust planets\`, value: absorbedPoints });
    }
  }

  if (info.isCombust && planet !== 'Sun' && planet !== 'Rahu' && planet !== 'Ketu') {
    const ascendantPos = _positions.find(p => p.name === 'Ascendant');
    const ascendantSignIndex = ascendantPos ? ascendantPos.rasi.index : 0;
    const sunLordOfHouse = (4 - ascendantSignIndex + 12) % 12 + 1;
    const isSunBadLord = [2, 3, 6, 7, 8, 12].includes(sunLordOfHouse);
    const combustionVal = isSunBadLord ? (w.combustionBadLord ?? w.combustion) : (w.combustionGoodLord ?? w.combustion);

    score += combustionVal;
    conditions.push({ key: 'combustion', name: \`Combust (Sun is Lord of \${sunLordOfHouse})\`, value: combustionVal });
  }`;

content = content.replace(oldLogicRegex, newLogic);

fs.writeFileSync('src/lib/nds_engine.ts', content);
console.log('Patch complete.');
