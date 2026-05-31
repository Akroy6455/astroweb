'use server';

import { calculateChart } from '@/lib/astrology';
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
  const dateStr = formData.get('date') as string;
  const timeStr = formData.get('time') as string;
  const lat = parseFloat(formData.get('lat') as string);
  const lon = parseFloat(formData.get('lon') as string);
  
  let tzOffset = parseFloat(formData.get('tzOffset') as string);
  const ianaTz = formData.get('ianaTz') as string;
  const ayanamsha = (formData.get('ayanamsha') as string) || 'Raman';

  if (!dateStr || !timeStr || isNaN(lat) || isNaN(lon)) {
    throw new Error('Invalid input data');
  }

  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute, second = 0] = timeStr.split(':').map(Number);

  if (ianaTz) {
    const dt = DateTime.fromObject({ year, month, day, hour, minute, second }, { zone: ianaTz });
    tzOffset = dt.offset / 60; // offset in minutes -> hours
  } else if (isNaN(tzOffset)) {
    throw new Error('No Timezone or tzOffset provided');
  }

  // Convert local time to UT hour
  let utHour = hour + minute / 60 + second / 3600 - tzOffset;
  
  // Calculate local day of week (0=Sunday, 6=Saturday)
  const localDate = new Date(year, month - 1, day);
  const localDayOfWeek = localDate.getDay();

  // Handling UT hour underflow/overflow (simple approximation, robust date math needed in production)
  let utDate = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  utDate.setMinutes(utDate.getMinutes() - tzOffset * 60);

  const res = calculateChart(
    utDate.getUTCFullYear(), 
    utDate.getUTCMonth() + 1, 
    utDate.getUTCDate(), 
    utDate.getUTCHours() + utDate.getUTCMinutes() / 60 + utDate.getUTCSeconds() / 3600, 
    lat, 
    lon,
    localDayOfWeek,
    ayanamsha
  );

  return res;
}

export async function saveMLData(mlData: any) {
  const filePath = path.join(process.cwd(), 'ml_dataset.json');
  let data = [];
  try {
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      if (fileContent) {
        data = JSON.parse(fileContent);
      }
    }
  } catch (e) {
    console.error('Failed to read ml_dataset.json', e);
  }
  
  // Prevent duplicate insertion if already exists with same timestamp_id
  const exists = data.find((d: any) => d.timestamp_id === mlData.timestamp_id);
  if (!exists) {
    data.push(mlData);
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (err) {
      console.warn("Could not write ML data (read-only filesystem on Vercel):", err);
    }
  }
}

import { findNextTransit } from '@/lib/transit_finder';
import sweph from 'sweph';

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
