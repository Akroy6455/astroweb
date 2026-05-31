const fs = require('fs');
let content = fs.readFileSync('src/lib/nds_engine.ts', 'utf8');

const regex1 = /enableTransitMultiplier\?:\s*boolean;\n\s*enableMdAdTransitMultiplier\?:\s*boolean;\n\s*enableBaseNdsInTransit\?:\s*boolean;/;
const repl1 = `enableTransitMultiplier?: boolean;
  enableMdAdTransitMultiplier?: boolean;
  enableNavtaraTransit?: boolean;
  enableNavtaraMdAd?: boolean;
  enableBaseNdsInTransit?: boolean;`;
content = content.replace(regex1, repl1);

const regex2 = /enableTransitMultiplier:\s*false,\n\s*enableMdAdTransitMultiplier:\s*false,\n\s*enableBaseNdsInTransit:\s*true,/;
const repl2 = `enableTransitMultiplier: false,
  enableMdAdTransitMultiplier: false,
  enableNavtaraTransit: false,
  enableNavtaraMdAd: false,
  enableBaseNdsInTransit: true,`;
content = content.replace(regex2, repl2);

fs.writeFileSync('src/lib/nds_engine.ts', content);
console.log('Done patch_nds_fix.js');
