const fs = require('fs');

let content = fs.readFileSync('src/lib/astrology.ts', 'utf8');

const regex = /export function generateMonthlyTransitTimeSeries.*?return points;\n}/s;

const replacement = `export function generateMonthlyTransitTimeSeries(
  dashaTimeSeries: any[],
  ashtakavarga: any,
  panchang?: any
) {
  if (!dashaTimeSeries || dashaTimeSeries.length === 0 || !ashtakavarga?.bav) {
    return [];
  }

  const flag = sweph.constants.SEFLG_SIDEREAL | sweph.constants.SEFLG_SPEED;

  const points: any[] = [];
  
  const startDate = new Date(dashaTimeSeries[0].date);
  
  const periods = dashaTimeSeries.map((d: any, index: number) => {
     const nextDate = index < dashaTimeSeries.length - 1 
         ? new Date(dashaTimeSeries[index + 1].date)
         : new Date(startDate.getTime() + 120 * 365.25 * 24 * 60 * 60 * 1000);
     return {
         start: new Date(d.date).getTime(),
         end: nextDate.getTime(),
         mdPlanet: d.mdPlanet,
         adPlanet: d.adPlanet,
         baseNds: d.percentage
     };
  });

  const endDate = periods[periods.length - 1].end;
  let currentDateTs = startDate.getTime();

  const transitPlanets = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
  const navtaraPlanets = [...transitPlanets, 'Rahu', 'Ketu'];
  const planetIds: Record<string, number> = {
    'Sun': sweph.constants.SE_SUN,
    'Moon': sweph.constants.SE_MOON,
    'Mars': sweph.constants.SE_MARS,
    'Mercury': sweph.constants.SE_MERCURY,
    'Jupiter': sweph.constants.SE_JUPITER,
    'Venus': sweph.constants.SE_VENUS,
    'Saturn': sweph.constants.SE_SATURN,
    'Rahu': sweph.constants.SE_TRUE_NODE,
    'Ketu': sweph.constants.SE_TRUE_NODE
  };

  const navtaraWeights = [1.0, 1.3, 0.8, 1.2, 0.8, 1.3, 0.7, 1.2, 1.4];
  const moonNakIndex = panchang?.nakshatra?.index ?? 0;

  while (currentDateTs <= endDate) {
    const dDate = new Date(currentDateTs);
    const jd = sweph.julday(
      dDate.getUTCFullYear(),
      dDate.getUTCMonth() + 1,
      dDate.getUTCDate(),
      dDate.getUTCHours() + dDate.getUTCMinutes() / 60,
      sweph.constants.SE_GREG_CAL
    );

    const currentPlanetSigns: Record<string, number> = {};
    const currentPlanetNakshatras: Record<string, number> = {};

    let rahuLon = 0;

    for (const p of navtaraPlanets) {
      let lon = 0;
      if (p === 'Ketu') {
        lon = (rahuLon + 180) % 360;
      } else {
        const pId = planetIds[p];
        const res = sweph.calc_ut(jd, pId, flag);
        lon = res.data[0];
        if (p === 'Rahu') rahuLon = lon;
      }
      const signIndex = Math.floor(lon / 30) % 12;
      const nakIndex = Math.floor(lon / (360/27)) % 27;
      currentPlanetSigns[p] = signIndex;
      currentPlanetNakshatras[p] = nakIndex;
    }

    // Ashtakavarga Average (7 planets)
    let astMultipliersSum = 0;
    for (const p of transitPlanets) {
      let multiplier = 1.0;
      if (p === 'Moon') {
        multiplier = 1.0; 
      } else {
        const bindus = ashtakavarga.bav[p] ? ashtakavarga.bav[p][currentPlanetSigns[p]] : 4; 
        multiplier = 0.6 + (bindus * 0.1);
      }
      astMultipliersSum += multiplier;
    }
    const avgAshtakavargaMultiplier = astMultipliersSum / transitPlanets.length;

    // Navtara Average (9 planets)
    let navtaraMultipliersSum = 0;
    for (const p of navtaraPlanets) {
      let multiplier = 1.0;
      if (p === 'Moon') {
        multiplier = 1.0;
      } else {
        const pNak = currentPlanetNakshatras[p];
        const taraIndex = (pNak - moonNakIndex + 27) % 9;
        multiplier = navtaraWeights[taraIndex];
      }
      navtaraMultipliersSum += multiplier;
    }
    const avgNavtaraMultiplier = navtaraMultipliersSum / navtaraPlanets.length;

    const activePeriod = periods.find((p: any) => currentDateTs >= p.start && currentDateTs < p.end) || periods[periods.length - 1];
    
    const mdLord = activePeriod.mdPlanet;
    const adLord = activePeriod.adPlanet;

    const isShuklaPaksha = panchang?.tithi?.index < 15;
    const moonMdAdMultiplier = isShuklaPaksha ? 1.2 : 0.9;

    // Ashtakavarga MD/AD
    let mdLordAstMultiplier = 1.0;
    let adLordAstMultiplier = 1.0;

    if (transitPlanets.includes(mdLord)) {
       if (mdLord === 'Moon') {
         mdLordAstMultiplier = moonMdAdMultiplier;
       } else {
         const mdSign = currentPlanetSigns[mdLord];
         const mdPoints = ashtakavarga.bav[mdLord][mdSign];
         mdLordAstMultiplier = 0.6 + (mdPoints * 0.1);
       }
    }
    if (transitPlanets.includes(adLord)) {
       if (adLord === 'Moon') {
         adLordAstMultiplier = moonMdAdMultiplier;
       } else {
         const adSign = currentPlanetSigns[adLord];
         const adPoints = ashtakavarga.bav[adLord][adSign];
         adLordAstMultiplier = 0.6 + (adPoints * 0.1);
       }
    }

    // Navtara MD/AD
    let mdLordNavtaraMultiplier = 1.0;
    let adLordNavtaraMultiplier = 1.0;
    
    if (navtaraPlanets.includes(mdLord)) {
       if (mdLord === 'Moon') {
         mdLordNavtaraMultiplier = moonMdAdMultiplier;
       } else {
         const mdNak = currentPlanetNakshatras[mdLord];
         const tara = (mdNak - moonNakIndex + 27) % 9;
         mdLordNavtaraMultiplier = navtaraWeights[tara];
       }
    }
    if (navtaraPlanets.includes(adLord)) {
       if (adLord === 'Moon') {
         adLordNavtaraMultiplier = moonMdAdMultiplier;
       } else {
         const adNak = currentPlanetNakshatras[adLord];
         const tara = (adNak - moonNakIndex + 27) % 9;
         adLordNavtaraMultiplier = navtaraWeights[tara];
       }
    }

    points.push({
      date: dDate.toISOString(),
      baseNds: activePeriod.baseNds,
      avgMultiplier: avgAshtakavargaMultiplier,
      mdLordMultiplier: mdLordAstMultiplier,
      adLordMultiplier: adLordAstMultiplier,
      avgNavtaraMultiplier,
      mdLordNavtaraMultiplier,
      adLordNavtaraMultiplier
    });

    currentDateTs += 30 * 24 * 60 * 60 * 1000;
  }

  return points;
}`;

content = content.replace(regex, replacement);

fs.writeFileSync('src/lib/astrology.ts', content);
console.log('Done patch_transit.js');
