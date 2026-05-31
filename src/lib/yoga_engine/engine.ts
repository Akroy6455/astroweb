import sweph from 'sweph';
import { ChartContext, YogaState, PlanetPosition, HouseInfo } from './types';
import { Planet, Sign, House, SIGN_LORDS } from './constants';
import { isCombust, getDignity, getCompoundRelationship, getHouseOfPlanet, isPlanetInHouse } from './dynamic';

function toTimeStr(jd: number): string {
  const date = new Date(sweph.revjul(jd, sweph.constants.SE_GREG_CAL).year, sweph.revjul(jd, sweph.constants.SE_GREG_CAL).month - 1, sweph.revjul(jd, sweph.constants.SE_GREG_CAL).day, sweph.revjul(jd, sweph.constants.SE_GREG_CAL).hour);
  // It's UT, so let's format it. Actually, sweph.revjul gives us the exact date object.
  // Better to just return JD or UT time string for the JSON.
  const info = sweph.revjul(jd, sweph.constants.SE_GREG_CAL);
  const hrs = Math.floor(info.hour);
  const mins = Math.floor((info.hour - hrs) * 60);
  const secs = Math.floor(((info.hour - hrs) * 60 - mins) * 60);
  return `${info.year}-${String(info.month).padStart(2, '0')}-${String(info.day).padStart(2, '0')} ${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')} UT`;
}

export function evaluateYogaState(
  jd: number, 
  lat: number, 
  lon: number, 
  lagna: PlanetPosition | null,
  positions: PlanetPosition[], 
  houses: HouseInfo[],
  awasthasData: any
): YogaState {
  
  // Calculate Sunrise / Sunset
  const geopos: [number, number, number] = [lon, lat, 0];
  let sr = sweph.rise_trans(jd - 1, sweph.constants.SE_SUN, '', sweph.constants.SEFLG_SWIEPH, sweph.constants.SE_CALC_RISE, geopos, 0, 0).data;
  if (sr > jd) {
    sr = sweph.rise_trans(jd - 2, sweph.constants.SE_SUN, '', sweph.constants.SEFLG_SWIEPH, sweph.constants.SE_CALC_RISE, geopos, 0, 0).data;
  }
  let ss = sweph.rise_trans(sr, sweph.constants.SE_SUN, '', sweph.constants.SEFLG_SWIEPH, sweph.constants.SE_CALC_SET, geopos, 0, 0).data;
  
  const isDayBirth = jd >= sr && jd <= ss;
  const birthGhati = (jd - sr) * 60; // 1 day = 60 ghatis

  // Tithi Calculation
  const sun = positions.find(p => p.name === 'Sun');
  const moon = positions.find(p => p.name === 'Moon');
  let tithi = 0;
  let paksha: 'Shukla' | 'Krishna' = 'Shukla';
  if (sun && moon) {
    let diff = moon.longitude - sun.longitude;
    if (diff < 0) diff += 360;
    tithi = Math.floor(diff / 12) + 1;
    paksha = tithi <= 15 ? 'Shukla' : 'Krishna';
  }

  const meta = {
    sunrise: toTimeStr(sr),
    sunset: toTimeStr(ss),
    birthGhati,
    isDayBirth,
    paksha,
    tithi
  };

  const state: YogaState = {
    meta,
    specialLagnas: {},
    upagrahas: {},
    planets: {} as any,
    houses: {} as any
  };

  // Upagrahas based on Sun
  if (sun) {
    const sLon = sun.longitude;
    const dhooma = (sLon + 133.333333) % 360;
    const vyatipata = (360 - dhooma) % 360;
    const parivesha = (vyatipata + 180) % 360;
    const indraDhanus = (360 - parivesha) % 360;
    const upaketu = (indraDhanus + 16.666667) % 360;

    const mkUpagraha = (name: string, long: number) => ({
      name,
      longitude: long,
      speed: 0,
      retrograde: false,
      rasi: { name: 'Unknown' as Sign, index: Math.floor(long/30), degreesInSign: long%30 },
      nakshatra: { name: '', pada: 1, index: 1 },
      navamsha: { name: 'Unknown' as Sign, index: 1, part: 1 }
    });

    state.upagrahas['Dhooma'] = mkUpagraha('Dhooma', dhooma);
    state.upagrahas['Vyatipata'] = mkUpagraha('Vyatipata', vyatipata);
    state.upagrahas['Parivesha'] = mkUpagraha('Parivesha', parivesha);
    state.upagrahas['Indra Dhanus'] = mkUpagraha('Indra Dhanus', indraDhanus);
    state.upagrahas['Upaketu'] = mkUpagraha('Upaketu', upaketu);
  }

  // Map Planets
  for (const pos of positions) {
    if (!['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'].includes(pos.name)) continue;
    const pName = pos.name as Planet;
    
    // Find house
    const h = getHouseOfPlanet(houses, pName) || 1;
    const aw = awasthasData ? awasthasData[pName] : null;

    // Build compound relations
    const compoundRel = {} as Record<Planet, 'Adhimitra' | 'Mitra' | 'Sama' | 'Satru' | 'Adhisatru'>;
    for (const other of positions) {
      if (other.name !== pName && ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'].includes(other.name)) {
        compoundRel[other.name as Planet] = getCompoundRelationship(pName, other.name as Planet, houses);
      }
    }

    state.planets[pName] = {
      position: pos,
      house: h as House,
      dispositor: SIGN_LORDS[pos.rasi.name as Sign],
      dignity: getDignity(pos),
      isCombust: sun ? isCombust(pos, sun) : false,
      isRetrograde: pos.retrograde,
      isHemmedBenefic: false, // TODO: Advanced hemming logic
      isHemmedMalefic: false,
      avastha: aw ? aw.sayanadi : 'Unknown',
      compoundRelationship: compoundRel
    };
  }

  // Map Houses
  for (const h of houses) {
    const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'] as const;
    const sign = signs[h.signIndex];
    
    state.houses[h.house as House] = {
      sign,
      lord: SIGN_LORDS[sign],
      occupants: h.planets.map(p => p.name as Planet),
      aspectingPlanets: [], // TODO: calculate drishti
      isHemmedBenefic: false,
      isHemmedMalefic: false
    };
  }

  return state;
}
