import sweph from 'sweph';
import { setAyanamshaMode } from './astrology';

const NAKSHATRAS_27 = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
  "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
  "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
  "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha",
  "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
];

const TARA_NAMES = ["Janma", "Sampat", "Vipat", "Kshema", "Pratyari", "Sadhaka", "Vadha", "Mitra", "Ati Mitra"];

export async function generatePanchangClockData(
  startTimestamp: number, // Exact epoch ms of local midnight
  lat: number, 
  lon: number, 
  ayanamsha: string, 
  baseMoonLon: number, 
  baseLagnaLon: number, 
  baseLagnaBav: number[],
  baseMoonBav: number[]
) {
  sweph.set_ephe_path('./public/ephe');
  
  let flag = sweph.constants.SEFLG_SWIEPH | sweph.constants.SEFLG_SIDEREAL;
    const sd = new Date(startTimestamp);
  const startJd = sweph.julday(sd.getUTCFullYear(), sd.getUTCMonth() + 1, sd.getUTCDate(), sd.getUTCHours() + sd.getUTCMinutes()/60.0, sweph.constants.SE_GREG_CAL);
  setAyanamshaMode(ayanamsha, startJd);

  const results = [];

  const baseLagnaNakIdx = Math.floor(baseLagnaLon / (360/27));
  const baseMoonNakIdx = Math.floor(baseMoonLon / (360/27));

  for (let i = 0; i < 36; i++) {
    // Current hour time
    const currentHourDate = new Date(startTimestamp + i * 3600 * 1000);
    
    // Convert to UTC for sweph
    const utcyear = currentHourDate.getUTCFullYear();
    const utcmonth = currentHourDate.getUTCMonth() + 1;
    const utcday = currentHourDate.getUTCDate();
    const utchour = currentHourDate.getUTCHours() + currentHourDate.getUTCMinutes() / 60;

    const jd = sweph.julday(utcyear, utcmonth, utcday, utchour, sweph.constants.SE_GREG_CAL);
    
    // Calculate Lagna
    const houses = sweph.houses_ex(jd, flag, lat, lon, 'P');
    const lagnaLon = (houses as any).points ? (houses as any).points[0] : (houses as any).data?.points[0] || 0;

    // Calculate Moon
    const moonCalc = sweph.calc_ut(jd, sweph.constants.SE_MOON, flag);
    const moonLon = moonCalc.data[0];

    // Lagna Details
    const lagnaSignIdx = Math.floor(lagnaLon / 30);
    const lagnaSignName = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"][lagnaSignIdx];
    const lagnaNakIdx = Math.floor(lagnaLon / (360/27));
    const lagnaBavPoints = baseLagnaBav[lagnaSignIdx];
    const lagnaNakName = NAKSHATRAS_27[lagnaNakIdx];
    const lagnaNavtaraIdx = (lagnaNakIdx - baseLagnaNakIdx + 27) % 9;
    const lagnaNavtaraName = TARA_NAMES[lagnaNavtaraIdx];

    // Moon Details
    const moonSignIdx = Math.floor(moonLon / 30);
    const moonBavPoints = baseMoonBav[moonSignIdx];
    const moonNakIdx = Math.floor(moonLon / (360/27));
    const moonNakName = NAKSHATRAS_27[moonNakIdx];
    const moonNavtaraIdx = (moonNakIdx - baseMoonNakIdx + 27) % 9;
    const moonNavtaraName = TARA_NAMES[moonNavtaraIdx];

    results.push({
      timeIso: currentHourDate.toISOString(),
      hour: currentHourDate.getHours(),
      lagnaSignName,
      lagnaBavPoints,
      lagnaNakName,
      lagnaNavtaraName,
      moonBavPoints,
      moonNakName,
      moonNavtaraName
    });
  }

  return results;
}
