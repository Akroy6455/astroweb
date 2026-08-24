export interface DashaPeriod {
  planet: string;
  start: string; // ISO date string
  end: string;   // ISO date string
  subPeriods?: DashaPeriod[];
  lordNatalPosition?: {
    rasi: string;
    nakshatra: string;
    house: number;
  };
  pravesh?: {
    rasi: { name: string; index: number; degreesInSign: number };
    nakshatra: { name: string; index: number; pada: number };
    house: number;
  };
}

const DASHA_LORDS = [
  { planet: 'Ketu', years: 7 },
  { planet: 'Venus', years: 20 },
  { planet: 'Sun', years: 6 },
  { planet: 'Moon', years: 10 },
  { planet: 'Mars', years: 7 },
  { planet: 'Rahu', years: 18 },
  { planet: 'Jupiter', years: 16 },
  { planet: 'Saturn', years: 19 },
  { planet: 'Mercury', years: 17 }
];

const TOTAL_YEARS = 120;
const DAYS_IN_YEAR = 365.2425; // Gregorian average year length

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function getLordNatalPosition(planetName: string, positions?: any[], houses?: any[]): { rasi: string; nakshatra: string; house: number } | undefined {
  if (!positions || !houses) return undefined;
  const p = positions.find((pos: any) => pos.name === planetName);
  if (!p) return undefined;
  const h = houses.find((house: any) => house.planets.some((hp: any) => hp.name === planetName));
  return {
    rasi: p.rasi.name,
    nakshatra: p.nakshatra.name,
    house: h ? h.house : 0
  };
}

export function calculateVimshottariDasha(moonLongitude: number, birthDate: Date, positions?: any[], houses?: any[]): DashaPeriod[] {
  const nakshatraLength = 360 / 27; // 13.333333 degrees
  const exactNakshatra = moonLongitude / nakshatraLength;
  const nakshatraIndex = Math.floor(exactNakshatra);
  const fractionPassed = exactNakshatra - nakshatraIndex;

  const startLordIndex = nakshatraIndex % 9;
  const firstLord = DASHA_LORDS[startLordIndex];
  
  // Calculate start of the theoretical full first Maha Dasha (before birth)
  const passedDays = fractionPassed * firstLord.years * DAYS_IN_YEAR;
  const fullStart = addDays(birthDate, -passedDays);

  const dashas: DashaPeriod[] = [];
  let mdStart = fullStart;

  for (let i = 0; i < 9; i++) {
    const mdLordIndex = (startLordIndex + i) % 9;
    const mdLord = DASHA_LORDS[mdLordIndex];
    const mdDuration = mdLord.years * DAYS_IN_YEAR;
    const mdEnd = addDays(mdStart, mdDuration);

    // Calculate Antar Dashas
    const adPeriods: DashaPeriod[] = [];
    let adStart = mdStart;

    for (let j = 0; j < 9; j++) {
      const adLordIndex = (mdLordIndex + j) % 9;
      const adLord = DASHA_LORDS[adLordIndex];
      const adDuration = mdDuration * (adLord.years / TOTAL_YEARS);
      const adEnd = addDays(adStart, adDuration);

      // Calculate Pratyantar Dashas
      const pdPeriods: DashaPeriod[] = [];
      let pdStart = adStart;

      for (let k = 0; k < 9; k++) {
        const pdLordIndex = (adLordIndex + k) % 9;
        const pdLord = DASHA_LORDS[pdLordIndex];
        const pdDuration = adDuration * (pdLord.years / TOTAL_YEARS);
        const pdEnd = addDays(pdStart, pdDuration);

        // Only keep if it ends after birth
        if (pdEnd > birthDate) {
          pdPeriods.push({
            planet: pdLord.planet,
            start: (pdStart < birthDate ? birthDate : pdStart).toISOString(),
            end: pdEnd.toISOString(),
            lordNatalPosition: getLordNatalPosition(pdLord.planet, positions, houses)
          });
        }
        pdStart = pdEnd;
      }

      if (adEnd > birthDate) {
        adPeriods.push({
          planet: adLord.planet,
          start: (adStart < birthDate ? birthDate : adStart).toISOString(),
          end: adEnd.toISOString(),
          subPeriods: pdPeriods,
          lordNatalPosition: getLordNatalPosition(adLord.planet, positions, houses)
        });
      }
      adStart = adEnd;
    }

    if (mdEnd > birthDate) {
      dashas.push({
        planet: mdLord.planet,
        start: (mdStart < birthDate ? birthDate : mdStart).toISOString(),
        end: mdEnd.toISOString(),
        subPeriods: adPeriods,
        lordNatalPosition: getLordNatalPosition(mdLord.planet, positions, houses)
      });
    }
    mdStart = mdEnd;
  }

  return dashas;
}
const YOGINI_LORDS = [
  { planet: 'Mangla (Moon)', years: 1 },
  { planet: 'Pingla (Sun)', years: 2 },
  { planet: 'Dhanya (Jupiter)', years: 3 },
  { planet: 'Bhramari (Mars)', years: 4 },
  { planet: 'Bhadrika (Mercury)', years: 5 },
  { planet: 'Ulka (Saturn)', years: 6 },
  { planet: 'Siddha (Venus)', years: 7 },
  { planet: 'Sankata (Rahu)', years: 8 }
];

export function calculateYoginiDasha(moonLongitude: number, birthDate: Date): DashaPeriod[] {
  const nakshatraLength = 360 / 27; // 13.333333 degrees
  const exactNakshatra = moonLongitude / nakshatraLength;
  const nakshatraIndex = Math.floor(exactNakshatra);
  const fractionPassed = exactNakshatra - nakshatraIndex;

  const nakNum = nakshatraIndex + 1;
  let remainder = (nakNum + 3) % 8;
  if (remainder === 0) remainder = 8;
  const startLordIndex = remainder - 1;

  const firstLord = YOGINI_LORDS[startLordIndex];
  
  const passedDays = fractionPassed * firstLord.years * DAYS_IN_YEAR;
  const fullStart = addDays(birthDate, -passedDays);

  const TOTAL_YOGINI_YEARS = 36;
  const allDashas: DashaPeriod[] = [];
  let currentStart = fullStart;
  
  for (let cycle = 0; cycle < 4; cycle++) {
    for (let i = 0; i < 8; i++) {
        const mdLordIndex = (startLordIndex + i) % 8;
        const mdLord = YOGINI_LORDS[mdLordIndex];
        const mdDuration = mdLord.years * DAYS_IN_YEAR;
        const mdEnd = addDays(currentStart, mdDuration);
    
        const adPeriods: DashaPeriod[] = [];
        let adStart = currentStart;
    
        for (let j = 0; j < 8; j++) {
          const adLordIndex = (mdLordIndex + j) % 8;
          const adLord = YOGINI_LORDS[adLordIndex];
          const adDuration = mdDuration * (adLord.years / TOTAL_YOGINI_YEARS);
          const adEnd = addDays(adStart, adDuration);
    
          const pdPeriods: DashaPeriod[] = [];
          let pdStart = adStart;
          for (let k = 0; k < 8; k++) {
            const pdLordIndex = (adLordIndex + k) % 8;
            const pdLord = YOGINI_LORDS[pdLordIndex];
            const pdDuration = adDuration * (pdLord.years / TOTAL_YOGINI_YEARS);
            const pdEnd = addDays(pdStart, pdDuration);
    
            if (pdEnd > birthDate) {
              pdPeriods.push({
                planet: pdLord.planet,
                start: (pdStart < birthDate ? birthDate : pdStart).toISOString(),
                end: pdEnd.toISOString()
              });
            }
            pdStart = pdEnd;
          }
    
          if (adEnd > birthDate) {
            adPeriods.push({
              planet: adLord.planet,
              start: (adStart < birthDate ? birthDate : adStart).toISOString(),
              end: adEnd.toISOString(),
              subPeriods: pdPeriods
            });
          }
          adStart = adEnd;
        }
    
        if (mdEnd > birthDate) {
          allDashas.push({
            planet: mdLord.planet,
            start: (currentStart < birthDate ? birthDate : currentStart).toISOString(),
            end: mdEnd.toISOString(),
            subPeriods: adPeriods
          });
        }
        
        currentStart = mdEnd;
    }
  }
  return allDashas;
}

const RASI_NAMES = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const RASI_LORDS = ['Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter'];
const DIRECT_SIGNS = [0, 1, 2, 6, 7, 8];

export function calculateJaminiCharDasha(lagnaSignIndex: number, positions: any[], birthDate: Date): DashaPeriod[] {
  const dashas: DashaPeriod[] = [];
  let currentStart = birthDate;
  
  const isOdd = (lagnaSignIndex + 1) % 2 !== 0;
  
  for (let i = 0; i < 12; i++) {
    const rasiIndex = isOdd ? (lagnaSignIndex + i) % 12 : (lagnaSignIndex - i + 12) % 12;
    const rasiName = RASI_NAMES[rasiIndex];
    
    let lordName = RASI_LORDS[rasiIndex];
    let lordRasiIndex = -1;
    const lordPos = positions.find((p: any) => (p.name || p.planet) === lordName);
    if (lordPos && lordPos.rasi) {
       lordRasiIndex = lordPos.rasi.index;
    }
    
    let years = 12;
    if (lordRasiIndex !== -1) {
       const isDirect = DIRECT_SIGNS.includes(rasiIndex);
       let count = 0;
       if (isDirect) {
         count = (lordRasiIndex - rasiIndex + 12) % 12;
       } else {
         count = (rasiIndex - lordRasiIndex + 12) % 12;
       }
       
       if (count === 0) years = 12;
       else years = count;
    }
    
    const mdDuration = years * DAYS_IN_YEAR;
    const mdEnd = addDays(currentStart, mdDuration);
    
    const adPeriods: DashaPeriod[] = [];
    let adStart = currentStart;
    
    for (let j = 0; j < 12; j++) {
       const adRasiIndex = isOdd ? (rasiIndex + j) % 12 : (rasiIndex - j + 12) % 12;
       const adName = RASI_NAMES[adRasiIndex];
       const adDuration = mdDuration / 12;
       const adEnd = addDays(adStart, adDuration);
       
       adPeriods.push({
         planet: adName,
         start: adStart.toISOString(),
         end: adEnd.toISOString()
       });
       
       adStart = adEnd;
    }
    
    dashas.push({
      planet: rasiName,
      start: currentStart.toISOString(),
      end: mdEnd.toISOString(),
      subPeriods: adPeriods
    });
    
    currentStart = mdEnd;
  }
  
  return dashas;
}
