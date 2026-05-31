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
