const fs = require('fs');
let content = fs.readFileSync('src/lib/nds_engine.ts', 'utf8');

const regex1 = /enableTransit:\s*boolean;\n\s*enableTransitMdAd:\s*boolean;\n\s*includeBaseNdsInTransit:\s*boolean;/;
const repl1 = `enableTransit: boolean;
  enableTransitMdAd: boolean;
  enableNavtaraTransit: boolean;
  enableNavtaraMdAd: boolean;
  includeBaseNdsInTransit: boolean;`;
content = content.replace(regex1, repl1);

const regex2 = /enableTransit:\s*true,\n\s*enableTransitMdAd:\s*true,\n\s*includeBaseNdsInTransit:\s*true,/;
const repl2 = `enableTransit: true,
  enableTransitMdAd: true,
  enableNavtaraTransit: true,
  enableNavtaraMdAd: true,
  includeBaseNdsInTransit: true,`;
content = content.replace(regex2, repl2);

fs.writeFileSync('src/lib/nds_engine.ts', content);
console.log('Done patch_nds.js');
