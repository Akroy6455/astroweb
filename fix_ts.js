const fs = require('fs');
let content = fs.readFileSync('src/lib/nds_engine.ts', 'utf8');

content = content.replace(
  /const otherInfo = yogaState\.planets\[otherP\];/g,
  `const otherInfo = yogaState.planets[otherP as keyof typeof yogaState.planets];`
);

fs.writeFileSync('src/lib/nds_engine.ts', content);
console.log('Fixed TS error');
