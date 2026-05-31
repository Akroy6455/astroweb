const fs = require('fs');

let content = fs.readFileSync('src/lib/astrology.ts', 'utf8');

// Patch Ashtakavarga
content = content.replace(
  /if \(p === 'Moon'\) \{\s*multiplier = 1\.0;\s*\} else \{\s*(const bindus = ashtakavarga\.bav\[p\].*?;)\s*(multiplier = 0\.6 \+ \(bindus \* 0\.1\);)\s*\}/,
  "$1\n        $2"
);

// Patch Navtara
content = content.replace(
  /if \(p === 'Moon'\) \{\s*multiplier = 1\.0;\s*\} else \{\s*(const pNak = currentPlanetNakshatras\[p\];)\s*(const taraIndex = \(pNak - moonNakIndex \+ 27\) % 9;)\s*(multiplier = navtaraWeights\[taraIndex\];)\s*\}/,
  "$1\n        $2\n        $3"
);

fs.writeFileSync('src/lib/astrology.ts', content);
