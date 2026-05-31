const fs = require('fs');

let content = fs.readFileSync('src/lib/astrology.ts', 'utf8');

// 1. Update signature of generateMonthlyTransitTimeSeries
content = content.replace(
  /export function generateMonthlyTransitTimeSeries\(\s*dashaTimeSeries: any\[\],\s*ashtakavarga: any,\s*panchang\?: any\s*\) {/m,
  `export function generateMonthlyTransitTimeSeries(
  dashaTimeSeries: any[],
  ashtakavarga: any,
  panchang?: any,
  positions?: any[],
  lagna?: any
) {`
);

// 2. Add advanced transit multiplier logic inside the while loop.
// We'll inject it right before `points.push({`
const pointPushIndex = content.indexOf('    points.push({');
if (pointPushIndex === -1) throw new Error("Could not find points.push");

const injectedLogic = `
    const ascIndex = lagna ? lagna.rasi.index : 0;
    const moonIndex = positions ? (positions.find(p => p.name === 'Moon')?.rasi?.index ?? 0) : 0;

    const getOwnedHouses = (planetName: string, refSignIndex: number) => {
      const ownedHouses = [];
      const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
      const signLords: Record<string, string> = {
        'Aries': 'Mars', 'Taurus': 'Venus', 'Gemini': 'Mercury', 'Cancer': 'Moon', 'Leo': 'Sun', 'Virgo': 'Mercury',
        'Libra': 'Venus', 'Scorpio': 'Mars', 'Sagittarius': 'Jupiter', 'Capricorn': 'Saturn', 'Aquarius': 'Saturn', 'Pisces': 'Jupiter'
      };
      for (let i = 0; i < 12; i++) {
        if (signLords[signs[i]] === planetName) {
          const houseNum = (i - refSignIndex + 12) % 12 + 1;
          ownedHouses.push(houseNum);
        }
      }
      return ownedHouses;
    };

    const advancedTriggers: Record<string, any> = {};
    for (const p of transitPlanets) { // Only 7 planets
      const ownedFromAsc = getOwnedHouses(p, ascIndex);
      const ownedFromMoon = getOwnedHouses(p, moonIndex);
      
      const isMaleficAsc = ownedFromAsc.includes(6) || ownedFromAsc.includes(8) || ownedFromAsc.includes(12);
      const isMaleficMoon = ownedFromMoon.includes(6) || ownedFromMoon.includes(8) || ownedFromMoon.includes(12);
      const isBeneficAsc = ownedFromAsc.includes(1) || ownedFromAsc.includes(5) || ownedFromAsc.includes(9);
      const isBeneficMoon = ownedFromMoon.includes(1) || ownedFromMoon.includes(5) || ownedFromMoon.includes(9);

      const transitSignIndex = currentPlanetSigns[p];
      const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
      const transitSignName = signs[transitSignIndex];

      const isExalted = (p === 'Sun' && transitSignName === 'Aries') || 
                        (p === 'Moon' && transitSignName === 'Taurus') || 
                        (p === 'Mars' && transitSignName === 'Capricorn') || 
                        (p === 'Mercury' && transitSignName === 'Virgo') || 
                        (p === 'Jupiter' && transitSignName === 'Cancer') || 
                        (p === 'Venus' && transitSignName === 'Pisces') || 
                        (p === 'Saturn' && transitSignName === 'Libra');
                        
      const signLords: Record<string, string> = {
        'Aries': 'Mars', 'Taurus': 'Venus', 'Gemini': 'Mercury', 'Cancer': 'Moon', 'Leo': 'Sun', 'Virgo': 'Mercury',
        'Libra': 'Venus', 'Scorpio': 'Mars', 'Sagittarius': 'Jupiter', 'Capricorn': 'Saturn', 'Aquarius': 'Saturn', 'Pisces': 'Jupiter'
      };
      const isOwn = signLords[transitSignName] === p;

      const houseFromAsc = (transitSignIndex - ascIndex + 12) % 12 + 1;
      const houseFromMoon = (transitSignIndex - moonIndex + 12) % 12 + 1;

      const in159Asc = houseFromAsc === 1 || houseFromAsc === 5 || houseFromAsc === 9;
      const in159Moon = houseFromMoon === 1 || houseFromMoon === 5 || houseFromMoon === 9;

      advancedTriggers[p] = {
        mAsc: isMaleficAsc && (isExalted || in159Asc),
        mMoon: isMaleficMoon && (isExalted || in159Moon),
        bAsc: isBeneficAsc && (isExalted || isOwn || in159Asc),
        bMoon: isBeneficMoon && (isExalted || isOwn || in159Moon)
      };
    }

`;

content = content.slice(0, pointPushIndex) + injectedLogic + content.slice(pointPushIndex);

// Add advancedTriggers to the point object
content = content.replace(
  /adLordNavtaraMultiplier\n\s*\}\);/g,
  `adLordNavtaraMultiplier,
      advancedTriggers
    });`
);

fs.writeFileSync('src/lib/astrology.ts', content);
console.log('Patched astrology.ts');
