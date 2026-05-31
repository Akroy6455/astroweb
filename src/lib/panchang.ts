export const VAARS = [
  { name: "Ravivara (Sunday)", ruler: "Sun" },
  { name: "Somavara (Monday)", ruler: "Moon" },
  { name: "Mangalavara (Tuesday)", ruler: "Mars" },
  { name: "Budhavara (Wednesday)", ruler: "Mercury" },
  { name: "Guruvara (Thursday)", ruler: "Jupiter" },
  { name: "Shukravara (Friday)", ruler: "Venus" },
  { name: "Shanivara (Saturday)", ruler: "Saturn" }
];

export const TITHIS = [
  "Shukla Pratipada", "Shukla Dwitiya", "Shukla Tritiya", "Shukla Chaturthi", "Shukla Panchami",
  "Shukla Shashthi", "Shukla Saptami", "Shukla Ashtami", "Shukla Navami", "Shukla Dashami",
  "Shukla Ekadashi", "Shukla Dwadashi", "Shukla Trayodashi", "Shukla Chaturdashi", "Purnima",
  "Krishna Pratipada", "Krishna Dwitiya", "Krishna Tritiya", "Krishna Chaturthi", "Krishna Panchami",
  "Krishna Shashthi", "Krishna Saptami", "Krishna Ashtami", "Krishna Navami", "Krishna Dashami",
  "Krishna Ekadashi", "Krishna Dwadashi", "Krishna Trayodashi", "Krishna Chaturdashi", "Amavasya"
];

export const YOGAS = [
  "Vishkumbha", "Priti", "Ayushman", "Saubhagya", "Shobhana", "Atiganda", "Sukarma", "Dhriti",
  "Shoola", "Ganda", "Vriddhi", "Dhruva", "Vyaghata", "Harshana", "Vajra", "Siddhi", "Vyatipata",
  "Variyana", "Parigha", "Shiva", "Siddha", "Sadhya", "Shubha", "Shukla", "Brahma", "Indra", "Vaidhriti"
];

export const NAKSHATRAS = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", "Punarvasu", "Pushya", "Ashlesha",
  "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
  "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
];

const MOVABLE_KARANAS = ["Bava", "Balava", "Kaulava", "Taitila", "Gara", "Vanija", "Vishti (Bhadra)"];

export function getKaranaName(index: number): string {
  if (index === 0) return "Kimstughna";
  if (index >= 1 && index <= 56) {
    return MOVABLE_KARANAS[(index - 1) % 7];
  }
  if (index === 57) return "Shakuni";
  if (index === 58) return "Chatushpada";
  if (index === 59) return "Naga";
  return "Unknown";
}

export function calculatePanchang(sunLon: number, moonLon: number, localDayOfWeek: number = 0) {
  // Normalize longitudes
  const s = (sunLon % 360 + 360) % 360;
  const m = (moonLon % 360 + 360) % 360;

  // Tithi: (Moon - Sun) / 12
  let diff = (m - s + 360) % 360;
  const tithiValue = diff / 12;
  const tithiIndex = Math.floor(tithiValue);
  const tithiFraction = tithiValue - tithiIndex;

  // Nakshatra: Moon / (360/27) = Moon / 13.33333333
  const nakValue = m / (360 / 27);
  const nakIndex = Math.floor(nakValue);
  const nakFraction = nakValue - nakIndex;

  // Yoga: (Moon + Sun) / (360/27)
  const sum = (m + s) % 360;
  const yogaValue = sum / (360 / 27);
  const yogaIndex = Math.floor(yogaValue);
  const yogaFraction = yogaValue - yogaIndex;

  // Karana: (Moon - Sun) / 6
  const karanaValue = diff / 6;
  const karanaIndex = Math.floor(karanaValue);
  const karanaFraction = karanaValue - karanaIndex;

  return {
    vaar: {
      index: localDayOfWeek,
      name: VAARS[localDayOfWeek].name,
      ruler: VAARS[localDayOfWeek].ruler
    },
    tithi: {
      index: tithiIndex,
      name: TITHIS[tithiIndex],
      percentCompleted: tithiFraction * 100
    },
    nakshatra: {
      index: nakIndex,
      name: NAKSHATRAS[nakIndex],
      pada: Math.floor(nakFraction * 4) + 1,
      percentCompleted: nakFraction * 100
    },
    yoga: {
      index: yogaIndex,
      name: YOGAS[yogaIndex],
      percentCompleted: yogaFraction * 100
    },
    karana: {
      index: karanaIndex,
      name: getKaranaName(karanaIndex),
      percentCompleted: karanaFraction * 100
    }
  };
}
