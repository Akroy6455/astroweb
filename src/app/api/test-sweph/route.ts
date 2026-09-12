import { NextResponse } from 'next/server';
import { generatePanchangClockData } from '@/lib/clock_engine';

export async function GET() {
  try {
    const lat = 28.6139;
    const lon = 77.2090;
    const ayanamsha = 'Lahiri';
    
    // Test for right now
    const startTimestamp = Date.now();

    const data = await generatePanchangClockData(
      startTimestamp,
      lat,
      lon,
      ayanamsha,
      0, // baseMoonLon
      0, // baseLagnaLon
      [0,0,0,0,0,0,0,0,0,0,0,0],
      [0,0,0,0,0,0,0,0,0,0,0,0]
    );

    return NextResponse.json({ status: 'OK', data });
  } catch (err: any) {
    return NextResponse.json({ status: 'ERROR', error: err.message }, { status: 500 });
  }
}
