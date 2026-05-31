import { Planet, Sign, House } from './constants';

export interface PlanetPosition {
  name: string;
  short?: string;
  longitude: number;
  speed: number;
  retrograde: boolean;
  rasi: { name: Sign; index: number; degreesInSign: number };
  nakshatra: { name: string; pada: number; index: number };
  navamsha: { name: Sign; index: number; part: number };
}

export interface HouseInfo {
  house: number; // 1 to 12
  signIndex: number;
  planets: PlanetPosition[];
}

export interface ChartContext {
  jd: number;
  lat: number;
  lon: number;
  sunRise?: number; // JD of sunrise
  sunSet?: number; // JD of sunset
  birthGhati?: number; // Time since sunrise in Ghatis
  isDayBirth: boolean;
  lagna: PlanetPosition | null; // Lagna is treated as a positional entity
  positions: PlanetPosition[]; // Contains planets
  upagrahas: PlanetPosition[]; // Dhooma, Vyatipata, Parivesha, Indra Dhanus, Upaketu, Gulika, Mandi
  houses: HouseInfo[];
  ayanamsha: string;
}

export interface YogaState {
  meta: {
    sunrise: string;
    sunset: string;
    birthGhati: number;
    isDayBirth: boolean;
    paksha: 'Shukla' | 'Krishna';
    tithi: number; // 1-30
  };
  specialLagnas: {
    BhavaLagna?: PlanetPosition;
    HoraLagna?: PlanetPosition;
    GhatiLagna?: PlanetPosition;
    PranapadaLagna?: PlanetPosition;
    VarnadaLagna?: PlanetPosition;
  };
  upagrahas: Record<string, PlanetPosition>;
  planets: Record<Planet, {
    position: PlanetPosition;
    house: House;
    dispositor: Planet;
    dignity: 'Moolatrikona' | 'Exaltation' | 'Deep Exaltation' | 'Debilitation' | 'Deep Debilitation' | 'Own Sign' | 'Enemy Sign' | 'Friendly Sign' | 'Neutral Sign' | 'Unknown';
    isCombust: boolean;
    isRetrograde: boolean;
    isHemmedBenefic: boolean;
    isHemmedMalefic: boolean;
    avastha: string; // From awasthas.ts but easily accessible here
    compoundRelationship: Record<Planet, 'Adhimitra' | 'Mitra' | 'Sama' | 'Satru' | 'Adhisatru'>;
  }>;
  houses: Record<House, {
    sign: Sign;
    lord: Planet;
    occupants: Planet[];
    aspectingPlanets: Planet[]; // Planets aspecting this house
    isHemmedBenefic: boolean;
    isHemmedMalefic: boolean;
  }>;
}
