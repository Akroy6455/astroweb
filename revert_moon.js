const fs = require('fs');

let content = fs.readFileSync('src/lib/astrology.ts', 'utf8');

content = content.replace(
  /(const bindus = ashtakavarga\.bav\[p\].*?;)\s*(multiplier = 0\.6 \+ \(bindus \* 0\.1\);)/,
  "if (p === 'Moon') {\n        multiplier = 1.0;\n      } else {\n        $1\n        $2\n      }"
);

content = content.replace(
  /(const pNak = currentPlanetNakshatras\[p\];)\s*(const taraIndex = \(pNak - moonNakIndex \+ 27\) % 9;)\s*(multiplier = navtaraWeights\[taraIndex\];)/,
  "if (p === 'Moon') {\n        multiplier = 1.0;\n      } else {\n        $1\n        $2\n        $3\n      }"
);

content = content.replace(
  /(const mdSign = currentPlanetSigns\[mdLord\];)\s*(const mdPoints = ashtakavarga\.bav\[mdLord\]\[mdSign\];)\s*(mdLordAstMultiplier = 0\.6 \+ \(mdPoints \* 0\.1\);)/,
  "if (mdLord === 'Moon') {\n         mdLordAstMultiplier = moonMdAdMultiplier;\n       } else {\n         $1\n         $2\n         $3\n       }"
);

content = content.replace(
  /(const adSign = currentPlanetSigns\[adLord\];)\s*(const adPoints = ashtakavarga\.bav\[adLord\]\[adSign\];)\s*(adLordAstMultiplier = 0\.6 \+ \(adPoints \* 0\.1\);)/,
  "if (adLord === 'Moon') {\n         adLordAstMultiplier = moonMdAdMultiplier;\n       } else {\n         $1\n         $2\n         $3\n       }"
);

content = content.replace(
  /(const mdNak = currentPlanetNakshatras\[mdLord\];)\s*(const tara = \(mdNak - moonNakIndex \+ 27\) % 9;)\s*(mdLordNavtaraMultiplier = navtaraWeights\[tara\];)/,
  "if (mdLord === 'Moon') {\n         mdLordNavtaraMultiplier = moonMdAdMultiplier;\n       } else {\n         $1\n         $2\n         $3\n       }"
);

content = content.replace(
  /(const adNak = currentPlanetNakshatras\[adLord\];)\s*(const tara = \(adNak - moonNakIndex \+ 27\) % 9;)\s*(adLordNavtaraMultiplier = navtaraWeights\[tara\];)/,
  "if (adLord === 'Moon') {\n         adLordNavtaraMultiplier = moonMdAdMultiplier;\n       } else {\n         $1\n         $2\n         $3\n       }"
);

fs.writeFileSync('src/lib/astrology.ts', content);
