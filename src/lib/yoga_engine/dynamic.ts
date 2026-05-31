import sweph from 'sweph';
import { 
  Planet, Sign, House, 
  SIGN_MOBILITY, SIGN_GENDER, SIGN_ELEMENT, SIGN_NATURE, SIGN_TEMPERAMENT, SIGN_BIOLOGY, SIGN_TEMPORAL, SIGN_LORDS,
  EXALTATION, DEBILITATION, MOOLATRIKONA, 
  PLANET_NATURE, PLANET_GENDER, NATURAL_RELATIONS,
  KENDRA_HOUSES, TRIKONA_HOUSES, DUSTHANA_HOUSES, UPACHAYA_HOUSES, PANAPHARA_HOUSES, APOKLIMA_HOUSES, MARAKA_HOUSES
} from './constants';
import { ChartContext, PlanetPosition, HouseInfo, YogaState } from './types';

// Normalizes an angle to 0-360
export function norm(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

export function getDispositor(pos: PlanetPosition): Planet {
  return SIGN_LORDS[pos.rasi.name as Sign];
}

export function isPlanetInHouse(houses: HouseInfo[], planetName: string, houseNumber: number): boolean {
  const house = houses.find(h => h.house === houseNumber);
  if (!house) return false;
  return house.planets.some(p => p.name === planetName);
}

export function getHouseOfPlanet(houses: HouseInfo[], planetName: string): number | null {
  for (const h of houses) {
    if (h.planets.some(p => p.name === planetName)) {
      return h.house;
    }
  }
  return null;
}

export function getHouseLord(houses: HouseInfo[], houseNumber: number): Planet | null {
  const house = houses.find(h => h.house === houseNumber);
  if (!house) return null;
  // Based on the sign index of the house
  const signs = [
    'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
  ] as const;
  return SIGN_LORDS[signs[house.signIndex]];
}

export function isCombust(planet: PlanetPosition, sun: PlanetPosition): boolean {
  if (planet.name === 'Sun' || planet.name === 'Rahu' || planet.name === 'Ketu') return false;
  const dist = Math.min(norm(planet.longitude - sun.longitude), norm(sun.longitude - planet.longitude));
  
  // Standard combustion orbs
  let orb = 0;
  switch (planet.name) {
    case 'Moon': orb = 12; break;
    case 'Mars': orb = 17; break;
    case 'Mercury': orb = planet.retrograde ? 12 : 14; break;
    case 'Jupiter': orb = 11; break;
    case 'Venus': orb = planet.retrograde ? 8 : 10; break;
    case 'Saturn': orb = 15; break;
  }
  return dist <= orb;
}

export function getCompoundRelationship(p1: Planet, p2: Planet, houses: HouseInfo[]): 'Adhimitra' | 'Mitra' | 'Sama' | 'Satru' | 'Adhisatru' {
  if (p1 === p2) return 'Sama';
  
  // Natural
  const naturalRelations = NATURAL_RELATIONS[p1];
  let natural = 0; // 1 = friend, 0 = neutral, -1 = enemy
  if (naturalRelations.Friends.includes(p2)) natural = 1;
  else if (naturalRelations.Enemies.includes(p2)) natural = -1;

  // Temporal
  // Temporal friends are in the 2nd, 3rd, 4th, 10th, 11th, and 12th from the base planet.
  let temporal = 0; // 1 = friend, -1 = enemy
  const h1 = getHouseOfPlanet(houses, p1);
  const h2 = getHouseOfPlanet(houses, p2);
  
  if (h1 && h2) {
    let diff = h2 - h1;
    if (diff < 0) diff += 12;
    // 0 is 1st house (self), 1 is 2nd house...
    const temporalHouses = [1, 2, 3, 9, 10, 11]; // which are 2, 3, 4, 10, 11, 12 from h1
    if (temporalHouses.includes(diff)) {
      temporal = 1;
    } else {
      temporal = -1;
    }
  }

  const total = natural + temporal;
  if (total === 2) return 'Adhimitra';
  if (total === 1) return 'Mitra';
  if (total === 0) return 'Sama';
  if (total === -1) return 'Satru';
  return 'Adhisatru';
}

export function getDignity(p: PlanetPosition): 'Moolatrikona' | 'Exaltation' | 'Deep Exaltation' | 'Debilitation' | 'Deep Debilitation' | 'Own Sign' | 'Enemy Sign' | 'Friendly Sign' | 'Neutral Sign' | 'Unknown' {
  const name = p.name as Planet;
  const sign = p.rasi.name as Sign;
  const deg = p.rasi.degreesInSign;

  // Exaltation
  if (name === 'Rahu' && (sign === 'Taurus' || sign === 'Gemini')) return 'Exaltation';
  const ex = EXALTATION[name];
  if (ex && ex.sign === sign) {
    if (Math.abs(deg - ex.degree) < 1.0) return 'Deep Exaltation';
    return 'Exaltation';
  }

  // Debilitation
  if (name === 'Rahu' && (sign === 'Sagittarius' || sign === 'Pisces')) return 'Debilitation';
  const deb = DEBILITATION[name];
  if (deb && deb.sign === sign) {
    if (Math.abs(deg - deb.degree) < 1.0) return 'Deep Debilitation';
    return 'Debilitation';
  }

  // Moolatrikona
  const mt = MOOLATRIKONA[name];
  if (mt && mt.sign === sign && deg >= mt.degStart && deg <= mt.degEnd) {
    return 'Moolatrikona';
  }

  // Own Sign
  if (name === 'Rahu' && (sign === 'Aquarius' || sign === 'Cancer' || sign === 'Virgo')) return 'Own Sign';
  if (SIGN_LORDS[sign] === name) {
    return 'Own Sign';
  }
  
  // Need to evaluate relation with dispositor
  // If the dispositor is a natural/temporal friend/enemy... wait, dignity uses compound relationship
  // We need the full context for this, which we might evaluate at a higher level, 
  // but for basic, natural relation:
  const dispositor = SIGN_LORDS[sign];
  if (!dispositor) return 'Unknown';
  
  const naturalRels = NATURAL_RELATIONS[name];
  if (naturalRels && naturalRels.Friends.includes(dispositor)) return 'Friendly Sign';
  if (naturalRels && naturalRels.Enemies.includes(dispositor)) return 'Enemy Sign';
  if (naturalRels && naturalRels.Neutral.includes(dispositor)) return 'Neutral Sign';
  
  return 'Unknown';
}
