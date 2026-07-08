const fs = require('fs');
let text = fs.readFileSync('src/lib/nds_engine.ts', 'utf8');

const search =   const arudha = getArudhaModifiers(planet, yogaState, alSignIndex, weights);
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

  const netScore = base.score + dignity.score + mutual.score + arudha.score + awastha.score + pravesh.score;;

const replace =   const arudha = getArudhaModifiers(planet, yogaState, alSignIndex, weights);
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

  const netScore = base.score + dignity.score + mutual.score + arudha.score + awastha.score + pravesh.score + advanced.score;;

if(text.includes(search)) {
  fs.writeFileSync('src/lib/nds_engine.ts', text.replace(search, replace));
  console.log('Fixed calculateNDS');
} else {
  console.log('Search string not found');
}

