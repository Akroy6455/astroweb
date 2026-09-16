'use server';

import { calculateChart, calculateTaraNirnayData, generateAuspiciousTimeSeries } from '@/lib/astrology';
import { DateTime } from 'luxon';
import fs from 'fs';
import path from 'path';

let citiesCache: any[] | null = null;

export async function searchCities(query: string) {
  if (!query || query.length < 2) return [];
  
  if (!citiesCache) {
    try {
      const citiesPath = path.join(process.cwd(), 'src', 'lib', 'cities.json');
      const fileContent = fs.readFileSync(citiesPath, 'utf8');
      citiesCache = JSON.parse(fileContent);
    } catch (err) {
      console.error('Failed to load cities.json', err);
      return [];
    }
  }

  const q = query.toLowerCase();
  // Filter by matching city name, prioritizing exact startsWith
  return citiesCache!
    .filter(c => c[0].toLowerCase().startsWith(q) || c[0].toLowerCase().includes(q))
    .slice(0, 15)
    .map(c => ({
      name: c[0],
      admin1: c[1],
      countryCode: c[2],
      lat: c[3],
      lon: c[4],
      tz: c[5]
    }));
}

export async function getKundliData(formData: FormData) {
  try {
    const dateStr = formData.get('date') as string;
    const timeStr = formData.get('time') as string;
    const lat = parseFloat(formData.get('lat') as string);
    const lon = parseFloat(formData.get('lon') as string);
    
    let tzOffset = parseFloat(formData.get('tzOffset') as string);
    const ianaTz = formData.get('ianaTz') as string;
    const ayanamsha = (formData.get('ayanamsha') as string) || 'Raman';
  
    if (!dateStr || !timeStr || isNaN(lat) || isNaN(lon)) {
      return { __error: 'Invalid input data: Missing date, time, lat, or lon' };
    }
  
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hour, minute, second = 0] = timeStr.split(':').map(Number);
  
    if (ianaTz) {
      const dt = DateTime.fromObject({ year, month, day, hour, minute, second }, { zone: ianaTz });
      tzOffset = dt.offset / 60; // offset in minutes -> hours
    } else if (isNaN(tzOffset)) {
      return { __error: 'No Timezone or tzOffset provided' };
    }
  
    let utDate = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
    utDate.setMinutes(utDate.getMinutes() - tzOffset * 60);
  
    const localDate = new Date(year, month - 1, day);
    const localDayOfWeek = localDate.getDay();
  
    const res: any = calculateChart(
        utDate.getUTCFullYear(), 
        utDate.getUTCMonth() + 1, 
        utDate.getUTCDate(), 
        utDate.getUTCHours() + utDate.getUTCMinutes() / 60 + utDate.getUTCSeconds() / 3600, 
        lat, 
        lon,
        localDayOfWeek,
        ayanamsha
    );
    try {
      res.birthDate = utDate.toISOString();
    const jsonStr = JSON.stringify(res);
      return { __success: jsonStr };
    } catch (stringifyErr: any) {
      return { __error: "JSON Stringify failed: " + stringifyErr.message };
    }
  } catch (err: any) {
    console.error("CRITICAL ERROR IN getKundliData:", err);
    return { __error: err.message, stack: err.stack };
  }
}

export async function getTaraNirnayData(chartData: any, customWeights?: any) {
  return calculateTaraNirnayData(chartData, customWeights);
}


import sweph from 'sweph';
import { findNextTransit } from '@/lib/transit_finder';

export async function findNextTransitEvent(
  planetName: string,
  offsetDeg: number,
  ranges: [number, number][],
  isPoint: boolean,
  currentDateIso: string,
  direction: number = 1,
  ayanamsha: string = 'Raman'
) {
  const date = new Date(currentDateIso);
  const jd = sweph.julday(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
    date.getUTCHours() + date.getUTCMinutes() / 60,
    sweph.constants.SE_GREG_CAL
  );
  
  return await findNextTransit(planetName, offsetDeg, ranges, jd, isPoint, direction, ayanamsha);
}

export async function getAuspiciousTimeData(startDateISO: string, lat: number, lon: number, chartData: any, navtaraMoonSettings?: { enabled: boolean, weights: number[], taraEnabled?: boolean[] }, matrices?: any, durationDays?: number, navtaraPointsSettings?: { enabled: boolean, matrix: number[] }) {
  return generateAuspiciousTimeSeries(startDateISO, lat, lon, chartData, navtaraMoonSettings, matrices, durationDays, navtaraPointsSettings);
}

import { generatePanchangClockData } from '@/lib/clock_engine';

export async function getPanchangClockDataAction(
  startTimestamp: number, 
  lat: number, 
  lon: number, 
  ayanamsha: string, 
  baseMoonLon: number, 
  baseLagnaLon: number, 
  baseLagnaBav: number[],
  baseMoonBav: number[]
) {
  try {
    return await generatePanchangClockData(startTimestamp, lat, lon, ayanamsha, baseMoonLon, baseLagnaLon, baseLagnaBav, baseMoonBav);
  } catch (error) {
    console.error("Error generating panchang clock data:", error);
    throw new Error("Failed to generate panchang clock data");
  }
}


export async function fetchAyanamshaValues(dateStr: string, timeStr: string, tzOffset: number, ianaTz: string) {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hour, minute, second = 0] = timeStr.split(':').map(Number);
    let offsetHours = tzOffset;
    if (ianaTz) {
      const { DateTime } = await import('luxon');
      const dt = DateTime.fromObject({ year, month, day, hour, minute, second }, { zone: ianaTz });
      offsetHours = dt.offset / 60;
    }
    let utDate = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
    utDate.setMinutes(utDate.getMinutes() - offsetHours * 60);
    const jd = sweph.julday(utDate.getUTCFullYear(), utDate.getUTCMonth() + 1, utDate.getUTCDate(), utDate.getUTCHours() + utDate.getUTCMinutes() / 60 + utDate.getUTCSeconds() / 3600, sweph.constants.SE_GREG_CAL);
    
    const options = [
      { id: 'TrueCitra', swephId: sweph.constants.SE_SIDM_TRUE_CITRA },
      { id: 'Lahiri', swephId: sweph.constants.SE_SIDM_LAHIRI },
      { id: 'Pushya', swephId: sweph.constants.SE_SIDM_TRUE_PUSHYA },
      { id: 'Raman', swephId: sweph.constants.SE_SIDM_RAMAN },
      { id: 'KP', swephId: sweph.constants.SE_SIDM_KRISHNAMURTI },
      { id: 'SuryaSiddhanta', swephId: sweph.constants.SE_SIDM_SURYASIDDHANTA },
      { id: 'UshaShashi', swephId: sweph.constants.SE_SIDM_USHASHASHI },
      { id: 'Yukteshwar', swephId: sweph.constants.SE_SIDM_YUKTESHWAR },
      { id: 'JNBhasin', swephId: sweph.constants.SE_SIDM_JN_BHASIN },
      { id: 'Fagan', swephId: sweph.constants.SE_SIDM_FAGAN_BRADLEY },
      { id: 'Deluce', swephId: sweph.constants.SE_SIDM_DELUCE },
      { id: 'DjwhalKhul', swephId: sweph.constants.SE_SIDM_DJWHAL_KHUL },
      { id: 'Aldebaran15', swephId: sweph.constants.SE_SIDM_ALDEBARAN_15TAU },
      { id: 'GalCenter0', swephId: sweph.constants.SE_SIDM_GALCENT_0SAG },
      { id: 'Hipparchos', swephId: sweph.constants.SE_SIDM_HIPPARCHOS },
      { id: 'Sassanian', swephId: sweph.constants.SE_SIDM_SASSANIAN }
    ];
    
    const vals: Record<string, string> = {};
    for (const opt of options) {
       sweph.set_sid_mode(opt.swephId, 0, 0);
       const val = sweph.get_ayanamsa_ut(jd);
       const deg = Math.floor(val);
       const min = Math.floor((val - deg) * 60);
       const sec = Math.floor(((val - deg) * 60 - min) * 60);
       vals[opt.id] = `${deg}° ${String(min).padStart(2, '0')}' ${String(sec).padStart(2, '0')}"`;
    }
    vals['Tropical'] = `0° 00' 00"`;
    return vals;
  } catch (e) {
    console.error("Error fetching ayanamsha values:", e);
    return {};
  }
}
