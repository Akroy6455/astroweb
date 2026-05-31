const fs = require('fs');
let content = fs.readFileSync('src/components/ExportTimeline.tsx', 'utf8');

// The Transit variables should remain 'Lord', because the backend TransitTimeSeries returns mdLordMultiplier
content = content.replace(/d\.mdPlanetMultiplier/g, 'd.mdLordMultiplier');
content = content.replace(/d\.adPlanetMultiplier/g, 'd.adLordMultiplier');
content = content.replace(/d\.mdPlanetNavtaraMultiplier/g, 'd.mdLordNavtaraMultiplier');
content = content.replace(/d\.adPlanetNavtaraMultiplier/g, 'd.adLordNavtaraMultiplier');

fs.writeFileSync('src/components/ExportTimeline.tsx', content);
console.log('Fixed Transit multiplier names');
