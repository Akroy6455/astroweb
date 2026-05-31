import { getMutualPlacement, DEFAULT_NDS_WEIGHTS } from './src/lib/nds_engine';

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
    'Rahu': { house: 9 }
  }
} as any;

const w = { ...DEFAULT_NDS_WEIGHTS, rahuKetuYogKaraka: 25 };

const result = getMutualPlacement('Rahu', 'Saturn', mockYogaState, w);
console.log("Result Rahu MD - Saturn AD:", JSON.stringify(result, null, 2));

const result2 = getMutualPlacement('Saturn', 'Rahu', mockYogaState, w);
console.log("Result Saturn MD - Rahu AD:", JSON.stringify(result2, null, 2));
