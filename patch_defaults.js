const fs = require('fs');
let content = fs.readFileSync('src/lib/nds_engine.ts', 'utf8');

content = content.replace(/enableTransitMultiplier: false,/g, 'enableTransitMultiplier: true,');
content = content.replace(/enableMdAdTransitMultiplier: false,/g, 'enableMdAdTransitMultiplier: true,');
content = content.replace(/enableNavtaraTransit: false,/g, 'enableNavtaraTransit: true,');
content = content.replace(/enableNavtaraMdAd: false,/g, 'enableNavtaraMdAd: true,');
content = content.replace(/enableBaseNdsInTransit: true,/g, 'enableBaseNdsInTransit: false,');

fs.writeFileSync('src/lib/nds_engine.ts', content);
console.log('Patched default transit weights');
