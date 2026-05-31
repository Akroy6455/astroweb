function buildLordshipMap(yogaState) {
  const map = new Map();
  const PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
  PLANETS.forEach(p => map.set(p, []));
  for (let h = 1; h <= 12; h++) {
    const lord = yogaState.houses[h].lord;
    map.get(lord).push(h);
  }
  return map;
}

function hasVedicAspect(planet, sourceHouse, targetHouse) {
  const dist = ((targetHouse - sourceHouse) + 12) % 12; 
  if (dist === 6) return true; // 7th house aspect for all (6 steps away)
  switch (planet) {
    case 'Mars': return dist === 3 || dist === 7; // 4th and 8th aspect
    case 'Jupiter': return dist === 4 || dist === 8; // 5th and 9th aspect
    case 'Saturn': case 'Rahu': case 'Ketu': return dist === 2 || dist === 9; // 3rd and 10th aspect
    default: return false;
  }
}

function checkNodeYoga(node, other, yogaState) {
  if (node !== 'Rahu' && node !== 'Ketu') return false;
  
  const nodeHouse = yogaState.planets[node].house;
  if (!nodeHouse) return false;

  const otherHouse = yogaState.planets[other].house;
  if (!otherHouse) return false;

  const isInfluencing = (nodeHouse === otherHouse) || hasVedicAspect(other, otherHouse, nodeHouse);
  if (!isInfluencing) return false;

  const inKendra = [1,4,7,10].includes(nodeHouse);
  const inTrikona = [1,5,9].includes(nodeHouse);
  if (!inKendra && !inTrikona) return false;

  const lordshipMap = buildLordshipMap(yogaState);
  const otherHouses = lordshipMap.get(other) || [];
  
  const otherLordsKendra = otherHouses.some(h => [1,4,7,10].includes(h));
  const otherLordsTrikona = otherHouses.some(h => [1,5,9].includes(h));

  console.log({ node, other, nodeHouse, otherHouse, inKendra, inTrikona, otherLordsKendra, otherLordsTrikona, isInfluencing, otherHouses });

  if (inKendra && otherLordsTrikona) return true;
  if (inTrikona && otherLordsKendra) return true;
  return false;
}

const mockYogaState = {
  houses: {
    1: { sign: 'Scorpio', lord: 'Mars', occupants: [], aspectingPlanets: [] },
    2: { sign: 'Sagittarius', lord: 'Jupiter', occupants: [], aspectingPlanets: [] },
    3: { sign: 'Capricorn', lord: 'Saturn', occupants: [], aspectingPlanets: [] },
    4: { sign: 'Aquarius', lord: 'Saturn', occupants: [], aspectingPlanets: [] },
    5: { sign: 'Pisces', lord: 'Jupiter', occupants: [], aspectingPlanets: [] },
    6: { sign: 'Aries', lord: 'Mars', occupants: [], aspectingPlanets: [] },
    7: { sign: 'Taurus', lord: 'Venus', occupants: ['Saturn'], aspectingPlanets: [] },
    8: { sign: 'Gemini', lord: 'Mercury', occupants: [], aspectingPlanets: [] },
    9: { sign: 'Cancer', lord: 'Moon', occupants: ['Rahu'], aspectingPlanets: [] },
    10: { sign: 'Leo', lord: 'Sun', occupants: [], aspectingPlanets: [] },
    11: { sign: 'Virgo', lord: 'Mercury', occupants: [], aspectingPlanets: [] },
    12: { sign: 'Libra', lord: 'Venus', occupants: [], aspectingPlanets: [] },
  },
  planets: {
    'Saturn': { house: 7 },
    'Rahu': { house: 9 },
    'Ketu': { house: 3 },
    'Sun': { house: 10 },
    'Moon': { house: 9 },
    'Mars': { house: 1 },
    'Mercury': { house: 8 },
    'Jupiter': { house: 5 },
    'Venus': { house: 7 },
  }
};

console.log("Rahu - Saturn result:", checkNodeYoga('Rahu', 'Saturn', mockYogaState));
