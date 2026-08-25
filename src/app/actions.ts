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

export async function getAuspiciousTimeData(startDateISO: string, lat: number, lon: number, chartData: any) {
  return generateAuspiciousTimeSeries(startDateISO, lat, lon, chartData);
}
