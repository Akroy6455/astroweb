const fs = require('fs');

function patchAstrology() {
  let content = fs.readFileSync('src/lib/astrology.ts', 'utf8');

  const debilitatedCode = `
      const isExalted = (p === 'Sun' && transitSignName === 'Aries') || 
                        (p === 'Moon' && transitSignName === 'Taurus') || 
                        (p === 'Mars' && transitSignName === 'Capricorn') || 
                        (p === 'Mercury' && transitSignName === 'Virgo') || 
                        (p === 'Jupiter' && transitSignName === 'Cancer') || 
                        (p === 'Venus' && transitSignName === 'Pisces') || 
                        (p === 'Saturn' && transitSignName === 'Libra');
                        
      const isDebilitated = (p === 'Sun' && transitSignName === 'Libra') || 
                            (p === 'Moon' && transitSignName === 'Scorpio') || 
                            (p === 'Mars' && transitSignName === 'Cancer') || 
                            (p === 'Mercury' && transitSignName === 'Pisces') || 
                            (p === 'Jupiter' && transitSignName === 'Capricorn') || 
                            (p === 'Venus' && transitSignName === 'Virgo') || 
                            (p === 'Saturn' && transitSignName === 'Aries');
  `;

  content = content.replace(
    /const isExalted = \[\s\S]*?\(p === 'Saturn' && transitSignName === 'Libra'\);/,
    debilitatedCode
  );

  const housesCode = `
      const in159Asc = houseFromAsc === 1 || houseFromAsc === 5 || houseFromAsc === 9;
      const in159Moon = houseFromMoon === 1 || houseFromMoon === 5 || houseFromMoon === 9;
      const in6812Asc = houseFromAsc === 6 || houseFromAsc === 8 || houseFromAsc === 12;
      const in6812Moon = houseFromMoon === 6 || houseFromMoon === 8 || houseFromMoon === 12;

      advancedTriggers[p] = {
        mAsc: (isMaleficAsc && (isExalted || in159Asc)) || (isBeneficAsc && (isDebilitated || in6812Asc)),
        mMoon: (isMaleficMoon && (isExalted || in159Moon)) || (isBeneficMoon && (isDebilitated || in6812Moon)),
        bAsc: (isBeneficAsc && (isExalted || isOwn || in159Asc)) || (isMaleficAsc && (isDebilitated || in6812Asc)),
        bMoon: (isBeneficMoon && (isExalted || isOwn || in159Moon)) || (isMaleficMoon && (isDebilitated || in6812Moon))
      };
  `;

  content = content.replace(
    /const in159Asc = houseFromAsc === 1 \|\| houseFromAsc === 5 \|\| houseFromAsc === 9;\s*const in159Moon = houseFromMoon === 1 \|\| houseFromMoon === 5 \|\| houseFromMoon === 9;\s*advancedTriggers\[p\] = \{\s*mAsc:.*?\s*mMoon:.*?\s*bAsc:.*?\s*bMoon:.*?\s*\};/,
    housesCode
  );

  fs.writeFileSync('src/lib/astrology.ts', content);
}

function patchUI() {
  let content = fs.readFileSync('src/components/TaraNirnaySettings.tsx', 'utf8');

  content = content.replace(
    /\{ key: 'advancedMaleficAsc', label: 'Malefic from Asc', desc: '6,8,12 lord exalted or in 1,5,9 transit houses' \}/g,
    "{ key: 'advancedMaleficAsc', label: 'Malefic from Asc', desc: '6,8,12 lord exalted/in 1,5,9 OR 1,5,9 lord debilitated/in 6,8,12' }"
  );
  content = content.replace(
    /\{ key: 'advancedMaleficMoon', label: 'Malefic from Moon', desc: '6,8,12 lord exalted or in 1,5,9 transit houses' \}/g,
    "{ key: 'advancedMaleficMoon', label: 'Malefic from Moon', desc: '6,8,12 lord exalted/in 1,5,9 OR 1,5,9 lord debilitated/in 6,8,12 from Moon' }"
  );
  content = content.replace(
    /\{ key: 'advancedBeneficAsc', label: 'Benefic from Asc', desc: '1,5,9 lord exalted, own sign, or in 1,5,9 transit houses' \}/g,
    "{ key: 'advancedBeneficAsc', label: 'Benefic from Asc', desc: '1,5,9 lord exalted/own/in 1,5,9 OR 6,8,12 lord debilitated/in 6,8,12' }"
  );
  content = content.replace(
    /\{ key: 'advancedBeneficMoon', label: 'Benefic from Moon', desc: '1,5,9 lord exalted, own sign, or in 1,5,9 transit houses' \}/g,
    "{ key: 'advancedBeneficMoon', label: 'Benefic from Moon', desc: '1,5,9 lord exalted/own/in 1,5,9 OR 6,8,12 lord debilitated/in 6,8,12 from Moon' }"
  );

  fs.writeFileSync('src/components/TaraNirnaySettings.tsx', content);
}

patchAstrology();
patchUI();
