const fs = require('fs');

let content = fs.readFileSync('src/lib/astrology.ts', 'utf8');

content = content.replace(
  /if \(mdLord === 'Moon'\) \{\s*mdLordAstMultiplier = moonMdAdMultiplier;\s*\} else \{\s*(const mdSign = currentPlanetSigns\[mdLord\];)\s*(const mdPoints = ashtakavarga\.bav\[mdLord\]\[mdSign\];)\s*(mdLordAstMultiplier = 0\.6 \+ \(mdPoints \* 0\.1\);)\s*\}/,
  "$1\n         $2\n         $3"
);

content = content.replace(
  /if \(adLord === 'Moon'\) \{\s*adLordAstMultiplier = moonMdAdMultiplier;\s*\} else \{\s*(const adSign = currentPlanetSigns\[adLord\];)\s*(const adPoints = ashtakavarga\.bav\[adLord\]\[adSign\];)\s*(adLordAstMultiplier = 0\.6 \+ \(adPoints \* 0\.1\);)\s*\}/,
  "$1\n         $2\n         $3"
);

content = content.replace(
  /if \(mdLord === 'Moon'\) \{\s*mdLordNavtaraMultiplier = moonMdAdMultiplier;\s*\} else \{\s*(const mdNak = currentPlanetNakshatras\[mdLord\];)\s*(const tara = \(mdNak - moonNakIndex \+ 27\) % 9;)\s*(mdLordNavtaraMultiplier = navtaraWeights\[tara\];)\s*\}/,
  "$1\n         $2\n         $3"
);

content = content.replace(
  /if \(adLord === 'Moon'\) \{\s*adLordNavtaraMultiplier = moonMdAdMultiplier;\s*\} else \{\s*(const adNak = currentPlanetNakshatras\[adLord\];)\s*(const tara = \(adNak - moonNakIndex \+ 27\) % 9;)\s*(adLordNavtaraMultiplier = navtaraWeights\[tara\];)\s*\}/,
  "$1\n         $2\n         $3"
);

fs.writeFileSync('src/lib/astrology.ts', content);
