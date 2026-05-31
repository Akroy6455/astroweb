const fs = require('fs');
let code = fs.readFileSync('src/lib/nds_engine.ts', 'utf8');
const props = [
  'lordHouse1','lordHouse2','lordHouse3','lordHouse4','lordHouse5','lordHouse6','lordHouse7','lordHouse8','lordHouse9','lordHouse10','lordHouse11','lordHouse12',
  'lordPlacementMatrix','planetPlacementMatrix','yogaKaraka','rahuKetuYogKaraka','functionalBenefic','functionalMalefic',
  'exaltation','ownSign','friendlySign','neutralSign','enemySign','debilitation','vargottama','combustion','sushupti','neechaBhanga',
  'mutualDistance1','mutualDistance2','mutualDistance3','mutualDistance4','mutualDistance5','mutualDistance6','mutualDistance7','mutualDistance8','mutualDistance9','mutualDistance10','mutualDistance11','mutualDistance12',
  'arudha11thAny','arudha11thBenefic','arudha12thAny','arudha12thMalefic','arudha3rdMalefic','arudha6thMalefic','papaKartari','shubhaKartari',
  'lajita','garvita','kshudita','trushita','mudita','kshobita',
  'praveshHouse1','praveshHouse2','praveshHouse3','praveshHouse4','praveshHouse5','praveshHouse6','praveshHouse7','praveshHouse8','praveshHouse9','praveshHouse10','praveshHouse11','praveshHouse12',
  'praveshExalted','praveshOwnSign','praveshDebilitated'
];
for (const p of props) {
  const r1 = new RegExp('weights\\\\.' + p + '\\\\b', 'g');
  code = code.replace(r1, 'getW(weights, \'' + p + '\')');
  const r2 = new RegExp('w\\\\.' + p + '\\\\b', 'g');
  code = code.replace(r2, 'getW(w, \'' + p + '\')');
}
code = code.replace(/weights\.enableDignity !== false \? getDignityScore\(planet, yogaState, positions, weights\) : \{ score: 0, conditions: \[\] \};/g, 'getDignityScore(planet, yogaState, positions, weights);');
code = code.replace(/weights\.enableMutualPlacement !== false \? getMutualPlacement\(mdLord, planet, yogaState, weights\) : \{ score: 0, conditions: \[\] \};/g, 'mdLord ? getMutualPlacement(mdLord, planet, yogaState, weights) : { score: 0, conditions: [] };');
code = code.replace(/weights\.enableArudha !== false \? getArudhaModifiers\(planet, yogaState, alSignIndex, weights\) : \{ score: 0, conditions: \[\] \};/g, 'getArudhaModifiers(planet, yogaState, alSignIndex, weights);');
code = code.replace(/weights\.enableAwastha !== false \? getAwasthaModifiers\(planet, awasthasData, weights\) : \{ score: 0, conditions: \[\] \};/g, 'getAwasthaModifiers(planet, awasthasData, weights);');
code = code.replace(/weights\.enablePravesh !== false \? getPraveshOffset\(planet, praveshData, weights\) : \{ score: 0, conditions: \[\] \};/g, 'getPraveshOffset(planet, praveshData, weights);');
fs.writeFileSync('src/lib/nds_engine.ts', code);
