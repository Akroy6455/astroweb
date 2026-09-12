import React, { useEffect, useState } from 'react';
import PanchangQuartzClock from './PanchangQuartzClock';
import { getPanchangClockDataAction } from '@/app/actions';

interface PanchangTabProps {
  data: any;
  lat: number;
  lon: number;
  ayanamsha: string;
}

import LocationAutocomplete from './LocationAutocomplete';

export default function PanchangTab({ data, lat, lon, ayanamsha }: PanchangTabProps) {
  const [clockData, setClockData] = useState<any[]>([]);
  const [loadingClocks, setLoadingClocks] = useState(false);
  const [clockDate, setClockDate] = useState<string>('');
  
  const [clockLat, setClockLat] = useState<number>(lat);
  const [clockLon, setClockLon] = useState<number>(lon);

  // Sync clock location if the main chart location changes
  useEffect(() => {
    setClockLat(lat);
    setClockLon(lon);
  }, [lat, lon]);

  // Initialize clockDate to the current date when the component mounts or data changes
  useEffect(() => {
    if (!clockDate) {
      const dt = new Date();
      const yyyy = dt.getFullYear();
      const mm = String(dt.getMonth() + 1).padStart(2, '0');
      const dd = String(dt.getDate()).padStart(2, '0');
      setClockDate(`${yyyy}-${mm}-${dd}`);
    }
  }, [clockDate, data]);

  useEffect(() => {
    async function loadClocks() {
      if (!data || !clockDate || !data.lagna || !data.positions || !data.ashtakavarga?.bav?.Lagna) return;
      setLoadingClocks(true);
      try {
        const moonLon = data.positions.find((p: any) => p.name === 'Moon')?.longitude || 0;
        
        // Pass the exact UTC timestamp for local midnight to avoid server timezone issues
        const localMidnight = new Date(`${clockDate}T00:00:00`);
        const startTimestamp = localMidnight.getTime();
        
        const result = await getPanchangClockDataAction(
          startTimestamp,
          clockLat,
          clockLon,
          ayanamsha,
          moonLon,
          data.lagna.longitude,
          data.ashtakavarga.bav.Lagna,
          data.ashtakavarga.bav.Moon || [0,0,0,0,0,0,0,0,0,0,0,0]
        );
        setClockData(result);
      } catch (err) {
        console.error("Failed to load clock data", err);
      } finally {
        setLoadingClocks(false);
      }
    }
    loadClocks();
  }, [data, clockLat, clockLon, ayanamsha, clockDate]);

  if (!data || !data.panchang) return null;

  const { vaar, tithi, nakshatra, yoga, karana } = data.panchang;

  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        
        {/* Vaar */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(201,168,106,0.1), rgba(94,124,123,0.05))',
          padding: '1.25rem',
          borderRadius: '12px',
          border: '1px solid rgba(201,168,106,0.2)'
        }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Vaar (Day of Week)
          </h4>
          <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '0.5rem' }}>
            {vaar.name}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--foreground)' }}>
            Ruler: <strong>{vaar.ruler}</strong>
          </div>
        </div>

        {/* Tithi */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(201,168,106,0.1), rgba(94,124,123,0.05))',
          padding: '1.25rem',
          borderRadius: '12px',
          border: '1px solid rgba(201,168,106,0.2)'
        }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Tithi (Lunar Day)
          </h4>
          <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '0.5rem' }}>
            {tithi.name}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--foreground)' }}>
            Completed: <strong>{tithi.percentCompleted.toFixed(2)}%</strong>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Index: {tithi.index + 1}/30
          </div>
        </div>

        {/* Nakshatra */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(201,168,106,0.1), rgba(94,124,123,0.05))',
          padding: '1.25rem',
          borderRadius: '12px',
          border: '1px solid rgba(201,168,106,0.2)'
        }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Nakshatra (Lunar Mansion)
          </h4>
          <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '0.5rem' }}>
            {nakshatra.name} <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--text-muted)' }}>(Pada {nakshatra.pada})</span>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--foreground)' }}>
            Completed: <strong>{nakshatra.percentCompleted.toFixed(2)}%</strong>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Index: {nakshatra.index + 1}/27
          </div>
        </div>

        {/* Yoga */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(201,168,106,0.1), rgba(94,124,123,0.05))',
          padding: '1.25rem',
          borderRadius: '12px',
          border: '1px solid rgba(201,168,106,0.2)'
        }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Yoga
          </h4>
          <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '0.5rem' }}>
            {yoga.name}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--foreground)' }}>
            Completed: <strong>{yoga.percentCompleted.toFixed(2)}%</strong>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Index: {yoga.index + 1}/27
          </div>
        </div>

        {/* Karana */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(201,168,106,0.1), rgba(94,124,123,0.05))',
          padding: '1.25rem',
          borderRadius: '12px',
          border: '1px solid rgba(201,168,106,0.2)'
        }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Karana (Half-Tithi)
          </h4>
          <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--primary)', marginBottom: '0.5rem' }}>
            {karana.name}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--foreground)' }}>
            Completed: <strong>{karana.percentCompleted.toFixed(2)}%</strong>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Index: {karana.index + 1}/60
          </div>
        </div>

      </div>

      {/* Moving Quartz Clocks */}
      <div style={{ marginTop: '3rem', borderTop: '1px solid var(--border)', paddingTop: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
          <h3 style={{ color: 'var(--primary)', marginBottom: '1rem', textAlign: 'center' }}>Transit Quartz Clocks (36-Hour Overview)</h3>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--card-bg)', padding: '0.75rem 1.5rem', borderRadius: '12px', border: '1px solid var(--border)', flexWrap: 'wrap', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <label style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Select Date:</label>
              <input 
                type="date" 
                value={clockDate} 
                onChange={(e) => setClockDate(e.target.value)} 
                className="form-input"
                style={{ padding: '0.5rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--foreground)' }}
              />
            </div>
            
            <div style={{ width: '1px', height: '30px', background: 'var(--border)', margin: '0 0.5rem' }}></div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '300px' }}>
               <LocationAutocomplete 
                 defaultLabel="Chart Location" 
                 onSelect={(lat, lon) => { setClockLat(lat); setClockLon(lon); }} 
               />
            </div>
          </div>
        </div>
        
        {loadingClocks && <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Calculating hourly transit data...</p>}
        
        {!loadingClocks && clockData.length === 36 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '2rem' }}>
            <PanchangQuartzClock 
              title={`${clockDate} (00:00 - 12:00)`} 
              startHourOffset={0} 
              data={clockData.slice(0, 12)} 
            />
            <PanchangQuartzClock 
              title={`${clockDate} (12:00 - 00:00)`} 
              startHourOffset={12} 
              data={clockData.slice(12, 24)} 
            />
            <PanchangQuartzClock 
              title={`Next Day (00:00 - 12:00)`} 
              startHourOffset={24} 
              data={clockData.slice(24, 36)} 
            />
          </div>
        )}
      </div>
    </div>
  );
}
