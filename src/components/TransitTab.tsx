'use client';

import React, { useState, useEffect, useRef } from 'react';
import KundliChart from './KundliChart';
import SouthIndianChart from './SouthIndianChart';
import { calculateVedha, calculateLatta, Arrow } from '@/lib/vedhaLatta';
import { getLatta, getVedhaNakshatras } from '@/lib/sbc_engine';
import { formatDMS } from '@/lib/utils';
import { getKundliData, findNextTransitEvent, getAuspiciousTimeData } from '@/app/actions';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import yavanajatakaTransitSun from '@/data/yavanajataka_transit_sun.json';
import yavanajatakaTransitSaturn from '@/data/yavanajataka_transit_saturn.json';
import yavanajatakaTransitJupiter from '@/data/yavanajataka_transit_jupiter.json';
import yavanajatakaTransitVenus from '@/data/yavanajataka_transit_venus.json';
import yavanajatakaTransitMars from '@/data/yavanajataka_transit_mars.json';
import yavanajatakaTransitMercury from '@/data/yavanajataka_transit_mercury.json';
import yavanajatakaTransitMoon from '@/data/yavanajataka_transit_moon.json';
import taraNirnayData from '@/data/tara_nirnay_ndf.json';

const NAKSHATRAS_27 = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
  "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
  "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
  "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha",
  "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
];

const NAKSHATRAS_28 = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
  "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
  "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
  "Mula", "Purva Ashadha", "Uttara Ashadha", "Abhijit", "Shravana", "Dhanishta", "Shatabhisha",
  "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
];

function get28Name(longitude: number) {
  if (longitude >= 276.6666667 && longitude < 280.8888889) {
    return "Abhijit";
  }
  const index27 = Math.floor(longitude / (360/27));
  let index28 = index27;
  if (index27 >= 21) index28 = index27 + 1;
  return NAKSHATRAS_28[index28];
}

function get28Index(longitude: number) {
  if (longitude >= 276.6666667 && longitude < 280.8888889) {
    return 21;
  }
  const index27 = Math.floor(longitude / (360/27));
  return index27 >= 21 ? index27 + 1 : index27;
}

function get28NakshatraRange(index28: number): [number, number] {
  if (index28 < 20) {
    return [index28 * 13.333333333333334, (index28 + 1) * 13.333333333333334];
  } else if (index28 === 20) {
    return [266.6666666666667, 276.6666666666667];
  } else if (index28 === 21) {
    return [276.6666666666667, 280.8888888888889];
  } else if (index28 === 22) {
    return [280.8888888888889, 293.3333333333333];
  } else {
    const idx27 = index28 - 1;
    return [idx27 * 13.333333333333334, (idx27 + 1) * 13.333333333333334];
  }
}

const SBC_CELLS = Array(9).fill(null).map(() => Array(9).fill(''));
SBC_CELLS[0] = ['अ', 'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati', 'Ashwini', 'Bharani', 'आ'];
SBC_CELLS[8] = ['ई', 'Vishakha', 'Swati', 'Chitra', 'Hasta', 'Uttara Phalguni', 'Purva Phalguni', 'Magha', 'इ'];

SBC_CELLS[1][0] = 'Shravana'; SBC_CELLS[1][8] = 'Krittika';
SBC_CELLS[2][0] = 'Abhijit';  SBC_CELLS[2][8] = 'Rohini';
SBC_CELLS[3][0] = 'Uttara Ashadha'; SBC_CELLS[3][8] = 'Mrigashira';
SBC_CELLS[4][0] = 'Purva Ashadha';  SBC_CELLS[4][8] = 'Ardra';
SBC_CELLS[5][0] = 'Mula';     SBC_CELLS[5][8] = 'Punarvasu';
SBC_CELLS[6][0] = 'Jyeshtha'; SBC_CELLS[6][8] = 'Pushya';
SBC_CELLS[7][0] = 'Anuradha'; SBC_CELLS[7][8] = 'Ashlesha';

const innerSBC = [
  ['rii', 'g', 's', 'd', 'ch', 'l', 'u'],
  ['kh', 'ai', 'Aquarius', 'Pisces', 'Aries', 'lu', 'a'],
  ['j', 'Capricorn', 'ah', 'Rikta\nFri', 'o', 'Taurus', 'v'],
  ['bh', 'Sagittarius', 'Jaya\nThu', 'Poorna\nSat', 'Nanda\nSun, Tue', 'Gemini', 'k'],
  ['y', 'Scorpio', 'am', 'Bhadra\nMon, Wed', 'au', 'Cancer', 'h'],
  ['n', 'e', 'Libra', 'Virgo', 'Leo', 'luu', 'd'],
  ['ri', 't', 'r', 'p', 't~', 'm', 'uu']
];

for (let r = 0; r < 7; r++) {
  for (let c = 0; c < 7; c++) {
    SBC_CELLS[r + 1][c + 1] = innerSBC[r][c];
  }
}

export default function TransitTab({ mainData, ayanamsha = 'Raman', weights, showTransitVedha, showTransitLatta, chartStyle }: { mainData: any, ayanamsha?: string, weights?: any, showTransitVedha?: boolean, showTransitLatta?: boolean, chartStyle?: string }) {
  const [transitData, setTransitData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
    const [sbcShowNatalVedha, setSbcShowNatalVedha] = useState(false);
  const [sbcShowTransitVedha, setSbcShowTransitVedha] = useState(false);
  const [sbcShowNatalLatta, setSbcShowNatalLatta] = useState(false);
  const [sbcShowTransitLatta, setSbcShowTransitLatta] = useState(false);
    const [sbcEnabledPlanets, setSbcEnabledPlanets] = useState<Record<string, boolean>>({
      Sun: true, Moon: true, Mars: true, Mercury: true, Jupiter: true, Venus: true, Saturn: true, Rahu: true, Ketu: true
    });
  const [subTab, setSubTab] = useState<'Overview' | 'SBC' | 'Sahamas' | 'Finder' | 'YogResult' | 'TaraNDF' | 'TaraNDFNatal' | 'AuspiciousTime'>('Overview');
  const [selectedNdfPlanet, setSelectedNdfPlanet] = useState('Sun');

  // Finder State
  const [fPlanet, setFPlanet] = useState('Jupiter');
  const [fAspect, setFAspect] = useState('0');
  const [fEvent, setFEvent] = useState('Rasi');
  const [fValue, setFValue] = useState('0');
  const [fSearchDate, setFSearchDate] = useState(new Date().toISOString().split('T')[0]);
  const [fSearchTime, setFSearchTime] = useState(new Date().toTimeString().slice(0, 5));
  const [fDirection, setFDirection] = useState<number>(1);
  const [fResult, setFResult] = useState<any>(null);
  const [fLoading, setFLoading] = useState(false);

  // Auspicious Time State
  const [ausStartDate, setAusStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [ausData, setAusData] = useState<any[]>([]);
  const [ausLoading, setAusLoading] = useState(false);
    const [ausZoom, setAusZoom] = useState<'Hourly' | 'Daily' | 'Weekly'>('Hourly');

  const handleCalculateAuspicious = async () => {
    setAusLoading(true);
    try {
      const startISO = new Date(ausStartDate).toISOString();
      const result = await getAuspiciousTimeData(startISO, parseFloat(tLat), parseFloat(tLon), mainData);
      
      const formatted = result.map((r: any) => ({
        ...r,
        formattedTime: new Date(r.time).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit' })
      }));
      setAusData(formatted);
    } catch(e) {
      console.error(e);
      alert("Failed to calculate Auspicious Time");
    } finally {
      setAusLoading(false);
    }
  };


  
    const getChartData = () => {
      if (ausZoom === 'Hourly') return ausData;
      
      const aggregated: any[] = [];
      const interval = ausZoom === 'Daily' ? 24 : 168;
      
      for (let i = 0; i < ausData.length; i += interval) {
        const chunk = ausData.slice(i, i + interval);
        const avgScore = chunk.reduce((sum: number, p: any) => sum + p.score, 0) / chunk.length;
        aggregated.push({
          ...chunk[0],
          score: Number(avgScore.toFixed(2)),
          formattedTime: ausZoom === 'Daily' 
            ? new Date(chunk[0].time).toLocaleString(undefined, { month: 'short', day: 'numeric' })
            : `Week of ${new Date(chunk[0].time).toLocaleString(undefined, { month: 'short', day: 'numeric' })}`,
          breakdown: null 
        });
      }
      return aggregated;
    };

    const top11Auspicious = [...ausData].sort((a, b) => b.score - a.score).slice(0, 11);
    const chartData = getChartData();

    // Form State
  const [tDate, setTDate] = useState(new Date().toISOString().split('T')[0]);
  const [tTime, setTTime] = useState(new Date().toTimeString().slice(0, 5));
  const [tLat, setTLat] = useState('28.6139');
  const [tLon, setTLon] = useState('77.2090');
  const [tTz, setTTz] = useState((-new Date().getTimezoneOffset() / 60).toString());

  useEffect(() => {
    const now = new Date();
    const tzOffset = -now.getTimezoneOffset() / 60;
    const formData = new FormData();
    formData.append('date', tDate);
    formData.append('time', tTime);
    formData.append('lat', tLat);
    formData.append('lon', tLon);
    formData.append('tzOffset', tTz);
    
    getKundliData(formData).then(r => setTransitData(r?.__success ? JSON.parse(r.__success) : r)).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      const resData = await getKundliData(formData);
      setTransitData(resData?.__success ? JSON.parse(resData.__success) : resData);
    } catch (err: any) {
      alert(err.message);
    }
    setLoading(false);
  };

  if (!mainData) return <div>Load a main chart first.</div>;

  const transitMap: Record<string, any[]> = {};
  if (transitData) {
    transitData.positions.forEach((p: any) => {
      const nak = get28Name(p.longitude);
      if (!transitMap[nak]) transitMap[nak] = [];
      transitMap[nak].push(p);

      const rasi = p.rasi.name;
      if (!transitMap[rasi]) transitMap[rasi] = [];
      transitMap[rasi].push(p);
    });
  }

  const natalMap: Record<string, any[]> = {};
  mainData.positions.forEach((p: any) => {
    const nak = get28Name(p.longitude);
    if (!natalMap[nak]) natalMap[nak] = [];
    natalMap[nak].push(p);

    const rasi = p.rasi.name;
    if (!natalMap[rasi]) natalMap[rasi] = [];
    natalMap[rasi].push(p);
  });

  const moonLong = mainData.positions.find((p: any) => p.name === 'Moon')?.longitude || 0;
  const lagnaLong = mainData.lagna?.longitude || 0;

  const moon27 = Math.floor(moonLong / (360/27));
  const lagna27 = Math.floor(lagnaLong / (360/27));
  const moon28 = get28Index(moonLong);

  const getNavtaraList = (startIndex: number) => {
    const list = Array(9).fill(null).map(() => [] as string[]);
    for (let i = 0; i < 27; i++) {
      const offset = (i - startIndex + 27) % 27;
      list[offset % 9].push(NAKSHATRAS_27[i]);
    }
    return list;
  };

  const moonNavtara = getNavtaraList(moon27);
  const lagnaNavtara = getNavtaraList(lagna27);
  const taraNames = ["Janma", "Sampat", "Vipat", "Kshema", "Pratyari", "Sadhaka", "Vadha", "Mitra", "Ati Mitra"];

  const lagna28 = get28Index(lagnaLong);

  const getSBCTara = (base28: number, offset: number) => NAKSHATRAS_28[(base28 + offset - 1) % 28];

  // Sahamas Calculations
  const getLong = (name: string) => mainData.positions.find((p: any) => p.name === name)?.longitude || 0;
  const lSun = getLong('Sun');
  const lMoon = getLong('Moon');
  const lMars = getLong('Mars');
  const lMerc = getLong('Mercury');
  const lJup = getLong('Jupiter');
  const lVen = getLong('Venus');
  const lSat = getLong('Saturn');
  
  const isDay = ((lagnaLong - lSun + 360) % 360) < 180;

  const calcSahama = (A: number, B: number, C: number, reverseForNight: boolean = true) => {
    let pA = A, pB = B;
    if (!isDay && reverseForNight) { pA = B; pB = A; }
    let sahama = (pA - pB + C + 360) % 360;
    let arcBA = (pA - pB + 360) % 360;
    let arcBL = (lagnaLong - pB + 360) % 360;
    if (arcBL > arcBA) sahama = (sahama + 30) % 360;
    return sahama;
  };

  const RULER = ['Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter'];
  const getLord = (deg: number) => getLong(RULER[Math.floor(deg / 30)]);

  const h2 = (lagnaLong + 30) % 360;
  const h6 = (lagnaLong + 150) % 360;
  const h8 = (lagnaLong + 210) % 360;
  const h9 = (lagnaLong + 240) % 360;
  const h11 = (lagnaLong + 300) % 360;

  const lagnaLord = getLord(lagnaLong);
  const lord2 = getLord(h2);
  const lord9 = getLord(h9);
  const lord11 = getLord(h11);
  const sunLord = getLord(lSun);
  const moonLord = getLord(lMoon);

  const punya = calcSahama(lMoon, lSun, lagnaLong);
  const sastra = calcSahama(lJup, lSat, lMerc);

  let samarthaA = lMars;
  let samarthaB = lagnaLord;
  if (RULER[Math.floor(lagnaLong / 30)] === 'Mars') {
    samarthaA = lJup;
    samarthaB = lMars;
  }

  let karyaA = lSat, karyaB = lSun, karyaC = sunLord;
  if (!isDay) {
    karyaA = lSat;
    karyaB = lMoon;
    karyaC = moonLord;
  }
  const karyasiddhi = calcSahama(karyaA, karyaB, karyaC, false);

  const sahamasList = [
    { name: '1. Punya (Fortune/Good Deeds)', val: punya },
    { name: '2. Vidya (Education)', val: calcSahama(lSun, lMoon, lagnaLong) },
    { name: '3. Yasas (Fame)', val: calcSahama(lJup, punya, lagnaLong) },
    { name: '4. Mitra (Friend)', val: calcSahama(lJup, punya, lVen) },
    { name: '5. Mahatmya (Greatness)', val: calcSahama(punya, lMars, lagnaLong) },
    { name: '6. Asha (Desires)', val: calcSahama(lSat, lMars, lagnaLong) },
    { name: '7. Samartha (Enterprise/Ability)', val: calcSahama(samarthaA, samarthaB, lagnaLong) },
    { name: '8. Bhratri (Brothers)', val: calcSahama(lJup, lSat, lagnaLong, false) },
    { name: '9. Gaurava (Respect/Regard)', val: calcSahama(lJup, lMoon, lSun) },
    { name: '10. Pitri (Father)', val: calcSahama(lSat, lSun, lagnaLong) },
    { name: '11. Rajya (Kingdom)', val: calcSahama(lSat, lSun, lagnaLong) },
    { name: '12. Matri (Mother)', val: calcSahama(lMoon, lVen, lagnaLong) },
    { name: '13. Putra (Children)', val: calcSahama(lJup, lMoon, lagnaLong) },
    { name: '14. Jeeva (Life)', val: calcSahama(lSat, lJup, lagnaLong) },
    { name: '15. Karma (Action/Work)', val: calcSahama(lMars, lMerc, lagnaLong) },
    { name: '16. Roga (Disease)', val: calcSahama(lagnaLong, lMoon, lagnaLong, false) },
    { name: '17. Kali (Great Misfortune)', val: calcSahama(lJup, lMars, lagnaLong) },
    { name: '18. Sastra (Sciences)', val: sastra },
    { name: '19. Bandhu (Relatives)', val: calcSahama(lMerc, lMoon, lagnaLong) },
    { name: '20. Mrityu (Death)', val: calcSahama(h8, lMoon, lagnaLong, false) },
    { name: '21. Paradesa (Foreign)', val: calcSahama(h9, lord9, lagnaLong, false) },
    { name: '22. Artha (Money)', val: calcSahama(h2, lord2, lagnaLong, false) },
    { name: '23. Paradara (Adultery)', val: calcSahama(lVen, lSun, lagnaLong) },
    { name: '24. Vanik (Commerce)', val: calcSahama(lMoon, lMerc, lagnaLong) },
    { name: '25. Karyasiddhi (Success)', val: karyasiddhi },
    { name: '26. Vivaha (Marriage)', val: calcSahama(lVen, lSat, lagnaLong) },
    { name: '27. Santapa (Sadness)', val: calcSahama(lSat, lMoon, h6) },
    { name: '28. Sraddha (Devotion/Sincerity)', val: calcSahama(lVen, lMars, lagnaLong) },
    { name: '29. Preeti (Love/Attachment)', val: calcSahama(sastra, punya, lagnaLong) },
    { name: '30. Jadya (Chronic Disease)', val: calcSahama(lMars, lSat, lMerc) },
    { name: '31. Vyapara (Business)', val: calcSahama(lMars, lSat, lagnaLong, false) },
    { name: '32. Satru (Enemy)', val: calcSahama(lMars, lSat, lagnaLong) },
    { name: '33. Jalapatana (Ocean Crossing)', val: calcSahama(105, lSat, lagnaLong) },
    { name: '34. Bandhana (Imprisonment)', val: calcSahama(punya, lSat, lagnaLong) },
    { name: '35. Apamrityu (Bad Death)', val: calcSahama(h8, lMars, lagnaLong) },
    { name: '36. Labha (Material Gains)', val: calcSahama(h11, lord11, lagnaLong, false) }
  ];

  const formatSahama = (long: number) => {
    const signs = ["Ar", "Ta", "Ge", "Ca", "Le", "Vi", "Li", "Sc", "Sg", "Cp", "Aq", "Pi"];
    return `${signs[Math.floor(long / 30)]} ${formatDMS(long % 30)}`;
  };
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', background: 'var(--card-bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
        <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
          <label>Transit Date</label>
          <input type="date" name="date" value={tDate} onChange={(e) => setTDate(e.target.value)} required />
        </div>
        <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
          <label>Transit Time</label>
          <input type="time" name="time" value={tTime} onChange={(e) => setTTime(e.target.value)} required />
        </div>
        <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
          <label>Latitude</label>
          <input type="number" step="any" name="lat" value={tLat} onChange={(e) => setTLat(e.target.value)} required />
        </div>
        <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
          <label>Longitude</label>
          <input type="number" step="any" name="lon" value={tLon} onChange={(e) => setTLon(e.target.value)} required />
        </div>
        <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
          <label>Timezone Offset</label>
          <input type="number" step="any" name="tzOffset" value={tTz} onChange={(e) => setTTz(e.target.value)} required />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button type="submit" className="submit-btn" disabled={loading} style={{ padding: '0.75rem 1.5rem' }}>
            {loading ? '...' : 'Update'}
          </button>
        </div>
      </form>

      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', overflowX: 'auto' }}>
        <button onClick={() => setSubTab('Overview')} className={`tab ${subTab === 'Overview' ? 'active' : ''}`}>Overview</button>
        <button onClick={() => setSubTab('SBC')} className={`tab ${subTab === 'SBC' ? 'active' : ''}`}>SBC & Taras</button>
        <button onClick={() => setSubTab('Sahamas')} className={`tab ${subTab === 'Sahamas' ? 'active' : ''}`}>Sahamas</button>
        <button onClick={() => setSubTab('Finder')} className={`tab ${subTab === 'Finder' ? 'active' : ''}`}>Transit Finder</button>
        <button onClick={() => setSubTab('YogResult')} className={`tab ${subTab === 'YogResult' ? 'active' : ''}`}>Transit Yog Result</button>
        <button onClick={() => setSubTab('TaraNDF')} className={`tab ${subTab === 'TaraNDF' ? 'active' : ''}`}>Tara Nirnay NDF Transit</button>
        <button onClick={() => setSubTab('TaraNDFNatal')} className={`tab ${subTab === 'TaraNDFNatal' ? 'active' : ''}`}>Tara Nirnay NDF Natal</button>
        <button onClick={() => setSubTab('AuspiciousTime')} className={`tab ${subTab === 'AuspiciousTime' ? 'active' : ''}`}>Auspicious Time Calculator</button>
      </div>

      
      {subTab === 'AuspiciousTime' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ background: 'var(--card-bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h3 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>Auspicious Time Calculator</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.95rem' }}>
              Calculates overall auspiciousness for a 2-month period based on Ashtakavarga transit scores and Navatara adjustments.
              Positions are evaluated every 1 hour.
            </p>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label>Start Date</label>
                <input type="date" value={ausStartDate} onChange={e => setAusStartDate(e.target.value)} className="input" />
              </div>
              <button onClick={handleCalculateAuspicious} className="submit-btn" style={{ padding: '0.5rem 1rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', height: 'fit-content' }}>
                {ausLoading ? 'Calculating...' : 'Generate 2-Month Chart'}
              </button>
            </div>

            {ausData.length > 0 && (
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', alignItems: 'center' }}>
                <label style={{ fontWeight: 600, color: 'var(--text)' }}>Chart Zoom:</label>
                <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg)', padding: '0.25rem', borderRadius: '8px' }}>
                  {['Hourly', 'Daily', 'Weekly'].map((zoom) => (
                    <button 
                      key={zoom}
                      onClick={() => setAusZoom(zoom as any)}
                      style={{
                        padding: '0.25rem 1rem',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        background: ausZoom === zoom ? 'var(--primary)' : 'transparent',
                        color: ausZoom === zoom ? '#fff' : 'var(--text-muted)',
                        fontWeight: ausZoom === zoom ? 600 : 400,
                        transition: 'all 0.2s'
                      }}
                    >
                      {zoom}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {ausData.length > 0 && (
            <div style={{ background: 'var(--card-bg)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)', height: '500px' }}>
              <div style={{ overflowX: 'auto', width: '100%', height: '100%' }}>
                <div style={{ width: ausZoom === 'Hourly' ? `${Math.max(1200, ausData.length * 8)}px` : '100%', minWidth: '1000px', height: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                      <XAxis dataKey="formattedTime" stroke="var(--text-muted)" tick={{ fontSize: 12 }} interval={ausZoom === "Hourly" ? 48 : "preserveStartEnd"} />
                      <YAxis stroke="var(--text-muted)" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px' }}
                        labelStyle={{ color: 'var(--primary)', fontWeight: 'bold', marginBottom: '0.5rem' }}
                        formatter={(value: any, name: any, props: any) => [value, name === 'score' ? (ausZoom === 'Hourly' ? 'Total Auspicious Score' : 'Average Auspicious Score') : name]}
                      />
                      <Line type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
          {ausData.length > 0 && (
            <div style={{ background: 'var(--card-bg)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)', marginTop: '2rem' }}>
              <h4 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>Top 11 Most Auspicious Hours</h4>
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>Rank</th>
                      <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>Date & Time</th>
                      <th style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {top11Auspicious.map((point: any, idx: number) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '0.75rem' }}>#{idx + 1}</td>
                        <td style={{ padding: '0.75rem', fontWeight: 600 }}>{new Date(point.time).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                        <td style={{ padding: '0.75rem', color: 'var(--primary)', fontWeight: 'bold' }}>{point.score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {subTab === 'Overview' && transitData && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
          <div style={{ background: 'var(--card-bg)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)', width: '100%', maxWidth: '600px' }}>
             <h3 style={{ textAlign: 'center', marginBottom: '1rem', color: 'var(--primary)' }}>Transit D-1 Chart</h3>
             {(() => {
                let arrows: Arrow[] = [];
                if (showTransitVedha) arrows = [...arrows, ...calculateVedha(transitData.positions, Math.floor((mainData.positions.find((p: any) => p.name === 'Moon')?.longitude || mainData.lagna.longitude) / 30))];
                if (showTransitLatta) arrows = [...arrows, ...calculateLatta(transitData.positions)];
                
                return chartStyle === 'South' 
                  ? <SouthIndianChart data={{ lagna: transitData.lagna, houses: transitData.houses }} arrows={arrows} />
                  : <KundliChart data={{ lagna: transitData.lagna, houses: transitData.houses }} arrows={arrows} />;
              })()}
          </div>
          <div style={{ overflowX: 'auto', background: 'var(--card-bg)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)', width: '100%' }}>
             <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Transit Info</h3>
             <table className="details-table" style={{ width: '100%', fontSize: '0.85rem' }}>
                <thead>
                  <tr>
                    <th>Planet</th>
                    <th>Longitude</th>
                    <th>Rasi</th>
                    <th>Nakshatra</th>
                    <th>Navtara (Natal Moon)</th>
                    <th>Sahamas in Rasi</th>
                  </tr>
                </thead>
                <tbody>
                  {transitData.positions.map((p: any) => {
                    const pNak27 = Math.floor(p.longitude / (360/27));
                    const taraIdx = (pNak27 - moon27 + 27) % 9;
                    const pTara = taraNames[taraIdx];
                    
                    const pRasiIdx = Math.floor(p.longitude / 30);
                    const sahamasInRasi = sahamasList
                      .filter(s => Math.floor(s.val / 30) === pRasiIdx)
                      .map(s => s.name.split(' ')[1])
                      .join(', ');

                    return (
                      <tr key={p.name}>
                        <td style={{ fontWeight: 'bold' }}>{p.name} {p.retrograde ? '(R)' : ''}</td>
                        <td>{formatDMS(p.longitude)}</td>
                        <td>{p.rasi.name}</td>
                        <td>{p.nakshatra.name}</td>
                        <td style={{ color: 'var(--primary)' }}>{pTara}</td>
                        <td style={{ color: '#8b5cf6', fontSize: '0.8rem' }}>{sahamasInRasi || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
             </table>
          </div>
        </div>
      )}

      {subTab === 'SBC' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ background: 'var(--card-bg)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)', overflowX: 'auto' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '1rem', color: 'var(--primary)' }}>Sarvatobhadra Chakra</h2>
            <p style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              <span style={{ color: '#ef4444' }}>Red</span> = Natal Planets | <span style={{ color: '#3b82f6' }}>Blue</span> = Transit Planets
            </p>
            
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '1.5rem', background: 'var(--card-bg)', padding: '0.75rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                  <input type="checkbox" checked={sbcShowNatalVedha} onChange={e => setSbcShowNatalVedha(e.target.checked)} />
                  <span style={{ color: 'var(--text)' }}>Natal Vedha (Red)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                  <input type="checkbox" checked={sbcShowNatalLatta} onChange={e => setSbcShowNatalLatta(e.target.checked)} />
                  <span style={{ color: 'var(--text)' }}>Natal Latta (Purple)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                  <input type="checkbox" checked={sbcShowTransitVedha} onChange={e => setSbcShowTransitVedha(e.target.checked)} />
                  <span style={{ color: 'var(--text)' }}>Transit Vedha</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                  <input type="checkbox" checked={sbcShowTransitLatta} onChange={e => setSbcShowTransitLatta(e.target.checked)} />
                  <span style={{ color: 'var(--text)' }}>Transit Latta</span>
                  </label>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '1.5rem', background: 'var(--card-bg)', padding: '0.5rem 0.75rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  {['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'].map(pName => (
                    <label key={pName} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer', fontSize: '0.8rem' }}>
                      <input type="checkbox" checked={sbcEnabledPlanets[pName]} onChange={e => setSbcEnabledPlanets({...sbcEnabledPlanets, [pName]: e.target.checked})} />
                      <span style={{ color: 'var(--text)' }}>{pName}</span>
                    </label>
                  ))}
                </div>

              <div style={{ position: 'relative', width: 'fit-content', margin: '0 auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: '2px', background: 'var(--border)', border: '2px solid var(--border)', width: '736px' }}>
                  {SBC_CELLS.flat().map((cell, idx) => {
                const isNak = NAKSHATRAS_28.includes(cell);
                const isRasi = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'].includes(cell);
                const tPlanets = transitMap[cell] || [];
                const nPlanets = natalMap[cell] || [];
                
                let bg = 'rgba(15, 23, 42, 0.6)';
                if (isNak) bg = 'rgba(139, 92, 246, 0.15)';
                else if (isRasi) bg = 'rgba(56, 189, 248, 0.15)';
                else if (cell) bg = 'rgba(255, 255, 255, 0.05)';

                return (
                  <div key={idx} style={{ background: bg, width: '80px', height: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: cell ? '600' : 'normal', color: 'var(--foreground)', marginBottom: '4px', wordBreak: 'break-word', lineHeight: 1.1 }}>{cell}</div>
                    <div style={{ fontSize: '0.7rem', color: '#3b82f6', fontWeight: 'bold' }}>{tPlanets.map(p => p.short).join(', ')}</div>
                    <div style={{ fontSize: '0.7rem', color: '#ef4444' }}>{nPlanets.map(p => p.short).join(', ')}</div>
                  </div>
                )
              })}
            </div>

              {/* SBC ARROWS LOGIC */}
              {(() => {
                const sbcArrows: any[] = [];
                
                const getCellIdx = (name: string) => {
                  const flat = SBC_CELLS.flat();
                  return flat.findIndex(c => c === name);
                };

                const calcArrows = (positions: any[], isTransit: boolean) => {
                    positions.forEach(p => {
                      if (['Uranus', 'Neptune', 'Pluto'].includes(p.name)) return;
                      if (!sbcEnabledPlanets[p.name]) return;
                    
                    const pLong = p.longitude !== undefined ? p.longitude : p.long;
                      const nakIndex = get28Index(pLong);
                      const nakName = NAKSHATRAS_28[nakIndex];
                      const fromIdx = getCellIdx(nakName);
                      if (fromIdx === -1) return;
                      
                      const arrColor = isTransit ? '#3b82f6' : '#ef4444'; // Blue for Transit, Red for Natal

                    // Latta
                    if ((isTransit && sbcShowTransitLatta) || (!isTransit && sbcShowNatalLatta)) {
                      const lattaNak = getLatta(p.name, p.longitude);
                        if (lattaNak) {
                          const toIdx = getCellIdx(lattaNak);
                          if (toIdx !== -1) {
                            sbcArrows.push({ from: fromIdx, to: toIdx, color: arrColor, label: 'L', isLatta: true });
                          }
                        }
                    }

                    // Vedha
                    if ((isTransit && sbcShowTransitVedha) || (!isTransit && sbcShowNatalVedha)) {
                      const speed = isTransit ? (p.speed || 1) : 1;
                      const isRetro = isTransit ? (p.retrograde || false) : false;
                      const vedhas = getVedhaNakshatras(p.name, p.longitude, speed, isRetro);
                      
                      vedhas.forEach(line => {
                          const vNak = line[line.length - 1];
                          const toIdx = getCellIdx(vNak);
                          if (toIdx !== -1) {
                            sbcArrows.push({ from: fromIdx, to: toIdx, color: arrColor, label: 'V', isLatta: false });
                          }
                        });
                    }
                  });
                };

                if (sbcShowNatalLatta || sbcShowNatalVedha) calcArrows(mainData.positions, false);
                if (sbcShowTransitLatta || sbcShowTransitVedha) calcArrows(transitData.positions, true);

                if (sbcArrows.length === 0) return null;

                return (
                  <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                    <defs>
                      <marker id="sbc-arrowhead-red" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                        <polygon points="0 0, 6 3, 0 6" fill="#ef4444" />
                      </marker>
                      <marker id="sbc-arrowhead-purple" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                          <polygon points="0 0, 6 3, 0 6" fill="#a855f7" />
                        </marker>
                        <marker id="sbc-arrowhead-blue" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                          <polygon points="0 0, 6 3, 0 6" fill="#3b82f6" />
                        </marker>
                    </defs>
                    {sbcArrows.map((a, i) => {
                      const r1 = Math.floor(a.from / 9);
                      const c1 = a.from % 9;
                      const r2 = Math.floor(a.to / 9);
                      const c2 = a.to % 9;
                      const x1 = c1 * 82 + 40;
                      const y1 = r1 * 82 + 40;
                      const x2 = c2 * 82 + 40;
                      const y2 = r2 * 82 + 40;
                      
                      const dx = x2 - x1;
                      const dy = y2 - y1;
                      const len = Math.sqrt(dx*dx + dy*dy);
                      if (len === 0) return null;
                      
                      const shrink = 30; // Shrink to not obscure text
                      const sx = (dx/len) * shrink;
                      const sy = (dy/len) * shrink;
                      
                      const marker = a.color === '#ef4444' ? 'url(#sbc-arrowhead-red)' : (a.color === '#3b82f6' ? 'url(#sbc-arrowhead-blue)' : 'url(#sbc-arrowhead-purple)');
                        const dash = a.isLatta ? "6,6" : "none";
                        return (
                          <g key={`sbc-arr-${i}`}>
                            <line x1={x1 + sx} y1={y1 + sy} x2={x2 - sx} y2={y2 - sy} stroke={a.color} strokeWidth="2" strokeDasharray={dash} opacity="0.7" markerEnd={marker} />
                        </g>
                      );
                    })}
                  </svg>
                );
              })()}

</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            <div style={{ background: 'var(--card-bg)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Navtara (from Moon)</h3>
              <table className="details-table" style={{ fontSize: '0.8rem', width: '100%' }}>
                <thead><tr><th>Tara</th><th>Nakshatras</th></tr></thead>
                <tbody>
                  {taraNames.map((t, i) => (
                    <tr key={t}><td>{i+1}. {t}</td><td>{moonNavtara[i].join(', ')}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ background: 'var(--card-bg)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Navtara (from Lagna)</h3>
              <table className="details-table" style={{ fontSize: '0.8rem', width: '100%' }}>
                <thead><tr><th>Tara</th><th>Nakshatras</th></tr></thead>
                <tbody>
                  {taraNames.map((t, i) => (
                    <tr key={t}><td>{i+1}. {t}</td><td>{lagnaNavtara[i].join(', ')}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ background: 'var(--card-bg)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>SBC Special Taras (from Moon)</h3>
              <table className="details-table" style={{ width: '100%', fontSize: '0.85rem' }}>
                <tbody>
                  <tr><td>Karma (10th)</td><td style={{ fontWeight: 'bold' }}>{getSBCTara(moon28, 10)}</td></tr>
                  <tr><td>Sanghatika (16th)</td><td style={{ fontWeight: 'bold' }}>{getSBCTara(moon28, 16)}</td></tr>
                  <tr><td>Samudaya (18th)</td><td style={{ fontWeight: 'bold' }}>{getSBCTara(moon28, 18)}</td></tr>
                  <tr><td>Vainashika (23rd)</td><td style={{ fontWeight: 'bold' }}>{getSBCTara(moon28, 23)}</td></tr>
                  <tr><td>Manasa (25th)</td><td style={{ fontWeight: 'bold' }}>{getSBCTara(moon28, 25)}</td></tr>
                  <tr><td>Jati (26th)</td><td style={{ fontWeight: 'bold' }}>{getSBCTara(moon28, 26)}</td></tr>
                  <tr><td>Abhisheka (27th)</td><td style={{ fontWeight: 'bold' }}>{getSBCTara(moon28, 27)}</td></tr>
                  <tr><td>Desha (28th)</td><td style={{ fontWeight: 'bold' }}>{getSBCTara(moon28, 28)}</td></tr>
                </tbody>
              </table>
            </div>
            <div style={{ background: 'var(--card-bg)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>SBC Special Taras (from Lagna)</h3>
              <table className="details-table" style={{ width: '100%', fontSize: '0.85rem' }}>
                <tbody>
                  <tr><td>Karma (10th)</td><td style={{ fontWeight: 'bold' }}>{getSBCTara(lagna28, 10)}</td></tr>
                  <tr><td>Sanghatika (16th)</td><td style={{ fontWeight: 'bold' }}>{getSBCTara(lagna28, 16)}</td></tr>
                  <tr><td>Samudaya (18th)</td><td style={{ fontWeight: 'bold' }}>{getSBCTara(lagna28, 18)}</td></tr>
                  <tr><td>Vainashika (23rd)</td><td style={{ fontWeight: 'bold' }}>{getSBCTara(lagna28, 23)}</td></tr>
                  <tr><td>Manasa (25th)</td><td style={{ fontWeight: 'bold' }}>{getSBCTara(lagna28, 25)}</td></tr>
                  <tr><td>Jati (26th)</td><td style={{ fontWeight: 'bold' }}>{getSBCTara(lagna28, 26)}</td></tr>
                  <tr><td>Abhisheka (27th)</td><td style={{ fontWeight: 'bold' }}>{getSBCTara(lagna28, 27)}</td></tr>
                  <tr><td>Desha (28th)</td><td style={{ fontWeight: 'bold' }}>{getSBCTara(lagna28, 28)}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {subTab === 'Sahamas' && (
        <div style={{ background: 'var(--card-bg)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)', overflowX: 'auto' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '1rem', color: 'var(--primary)' }}>Natal Sahamas (Arabic Parts)</h2>
          <p style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Sensitive points calculated from the main natal chart using standard Tajika formulas.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            {sahamasList.map(s => (
              <div key={s.name} style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: '500', color: 'var(--text-muted)' }}>{s.name}</span>
                <span style={{ fontWeight: 'bold', color: 'var(--foreground)' }}>{formatSahama(s.val)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {subTab === 'Finder' && (
        <div style={{ background: 'var(--card-bg)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <h2 style={{ color: 'var(--primary)', marginBottom: '1.5rem' }}>Transit Prediction Finder</h2>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
            <div className="form-group" style={{ flex: 1, minWidth: '150px' }}>
              <label>Search From Date</label>
              <input type="date" value={fSearchDate} onChange={e => setFSearchDate(e.target.value)} />
            </div>
            <div className="form-group" style={{ flex: 1, minWidth: '120px' }}>
              <label>Search Time</label>
              <input type="time" value={fSearchTime} onChange={e => setFSearchTime(e.target.value)} />
            </div>
            <div className="form-group" style={{ flex: 1, minWidth: '120px' }}>
              <label>Direction</label>
              <select value={fDirection} onChange={e => setFDirection(parseInt(e.target.value))}>
                <option value={1}>Future</option>
                <option value={-1}>Past</option>
              </select>
            </div>
            <div style={{ flexBasis: '100%', height: 0 }}></div>
            <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
              <label>Target Planet</label>
              <select value={fPlanet} onChange={(e) => { setFPlanet(e.target.value); setFAspect('0'); }}>
                {['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
              <label>Aspect / View</label>
              <select value={fAspect} onChange={(e) => setFAspect(e.target.value)}>
                <option value="0">Direct (Self)</option>
                <option value="180">7th Aspect</option>
                {fPlanet === 'Saturn' && <option value="60">3rd Aspect</option>}
                {fPlanet === 'Saturn' && <option value="270">10th Aspect</option>}
                {fPlanet === 'Jupiter' && <option value="120">5th Aspect</option>}
                {fPlanet === 'Jupiter' && <option value="240">9th Aspect</option>}
                {fPlanet === 'Mars' && <option value="90">4th Aspect</option>}
                {fPlanet === 'Mars' && <option value="210">8th Aspect</option>}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
              <label>Transit Through</label>
              <select value={fEvent} onChange={(e) => { setFEvent(e.target.value); setFValue('0'); }}>
                <option value="Rasi">Rasi</option>
                <option value="Nakshatra">Nakshatra</option>
                <option value="NavtaraLagna">Navtara (from Lagna)</option>
                <option value="NavtaraMoon">Navtara (from Moon)</option>
                <option value="SpecialTaraLagna">SBC Special Tara (Lagna)</option>
                <option value="SpecialTaraMoon">SBC Special Tara (Moon)</option>
                <option value="Sahama">Sahama</option>
              </select>
            </div>
            <div className="form-group" style={{ flex: 2, minWidth: '300px' }}>
              <label>Specific Target</label>
              <select value={fValue} onChange={(e) => setFValue(e.target.value)}>
                {fEvent === 'Rasi' && ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"].map((v, i) => <option key={i} value={i}>{v}</option>)}
                {fEvent === 'Nakshatra' && NAKSHATRAS_27.map((v, i) => <option key={i} value={i}>{v}</option>)}
                {(fEvent === 'NavtaraLagna' || fEvent === 'NavtaraMoon') && Array.from({length: 27}).map((_, i) => <option key={i} value={i}>{taraNames[i % 9]} ({Math.floor(i / 9) + 1})</option>)}
                {(fEvent === 'SpecialTaraLagna' || fEvent === 'SpecialTaraMoon') && [
                  { name: 'Karma (10th)', val: 10 }, { name: 'Sanghatika (16th)', val: 16 },
                  { name: 'Samudaya (18th)', val: 18 }, { name: 'Vainashika (23rd)', val: 23 },
                  { name: 'Manasa (25th)', val: 25 }, { name: 'Jati (26th)', val: 26 },
                  { name: 'Abhisheka (27th)', val: 27 }, { name: 'Desha (28th)', val: 28 }
                ].map(o => <option key={o.val} value={o.val}>{o.name}</option>)}
                {fEvent === 'Sahama' && sahamasList.map((s, i) => <option key={i} value={i}>{s.name} ({formatSahama(s.val)})</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '0.2rem' }}>
              <button 
                className="submit-btn" 
                disabled={fLoading}
                onClick={async () => {
                  setFLoading(true);
                  setFResult(null);
                  try {
                    let ranges: [number, number][] = [];
                    let isPoint = false;
                    const val = parseInt(fValue);

                    if (fEvent === 'Rasi') {
                      ranges = [[val * 30, (val + 1) * 30]];
                    } else if (fEvent === 'Nakshatra') {
                      ranges = [[val * 13.333333333333334, (val + 1) * 13.333333333333334]];
                    } else if (fEvent === 'NavtaraLagna' || fEvent === 'NavtaraMoon') {
                      const base27 = fEvent === 'NavtaraLagna' ? lagna27 : moon27;
                      const nTarget = (base27 + val) % 27;
                      ranges = [[nTarget * 13.333333333333334, (nTarget + 1) * 13.333333333333334]];
                    } else if (fEvent === 'SpecialTaraLagna' || fEvent === 'SpecialTaraMoon') {
                      const base28 = fEvent === 'SpecialTaraLagna' ? lagna28 : moon28;
                      const target28 = (base28 + val - 1) % 28;
                      ranges = [get28NakshatraRange(target28)];
                    } else if (fEvent === 'Sahama') {
                      const sVal = sahamasList[val].val;
                      ranges = [[sVal, sVal]];
                      isPoint = true;
                    }

                    // Attempt to parse local search date/time
                    let searchIso = new Date().toISOString();
                    try {
                      searchIso = new Date(`${fSearchDate}T${fSearchTime}:00`).toISOString();
                    } catch (e) {
                      console.warn("Invalid search date, using now.");
                    }

                    const res = await findNextTransitEvent(fPlanet, parseFloat(fAspect), ranges, isPoint, searchIso, fDirection, ayanamsha);
                    setFResult(res);

                      if (res && res.dateUTC) {
                        const d = new Date(res.dateUTC);
                        const newTDate = d.toISOString().split('T')[0];
                        const newTTime = d.toTimeString().slice(0, 5);
                        const newTTz = (-d.getTimezoneOffset() / 60).toString();
                        
                        setTDate(newTDate);
                        setTTime(newTTime);
                        setTTz(newTTz);

                        const formData = new FormData();
                        formData.append('date', newTDate);
                        formData.append('time', newTTime);
                        formData.append('lat', tLat || '28.6139');
                        formData.append('lon', tLon || '77.2090');
                        formData.append('tzOffset', newTTz);
                        formData.append('ayanamsha', ayanamsha);

                        const newData = await getKundliData(formData);
                        setTransitData(newData?.__success ? JSON.parse(newData.__success) : newData);
                      }
                  } catch (e: any) {
                    alert(e.message);
                  }
                  setFLoading(false);
                }}
              >
                {fLoading ? 'Searching...' : 'Find Next Transit'}
              </button>
            </div>
          </div>

          {fResult ? (
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <h3 style={{ color: '#10b981', marginBottom: '0.5rem' }}>Transit Found!</h3>
              <p style={{ fontSize: '1.1rem' }}>
                The {fDirection === 1 ? 'next' : 'previous'} occurrence {fDirection === 1 ? 'happens' : 'happened'} on: <strong>{new Date(fResult.dateUTC).toLocaleString()}</strong>
              </p>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                At this exact moment, {fPlanet}'s true longitude is {formatDMS(fResult.longitude)}.
              </p>
              <button 
                onClick={() => setSubTab('Overview')} 
                style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 500 }}
              >
                View Transit Chart
              </button>
            </div>
          ) : fResult === null && !fLoading ? (
            <div style={{ color: 'var(--text-muted)' }}>Select your parameters and click find to calculate the next exact transit.</div>
          ) : fResult === undefined && !fLoading ? (
            <div style={{ color: '#ef4444' }}>No transit found within the next 30 years.</div>
          ) : null}
        </div>
      )}

      {subTab === 'YogResult' && transitData && mainData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div style={{ background: 'var(--card-bg)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--primary)' }}>Transit Yog Results (Yavanajataka)</h2>
            <p style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Disclaimer: The results maybe too extreme and depends on various other factors.
            </p>
            
            {/* Transit Sun Results */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#eab308' }}>Transiting Sun (Chapter 44)</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {['Sun', 'Saturn', 'Jupiter', 'Venus', 'Mars', 'Mercury', 'Moon', 'Ascendant'].map(natalPlanet => {
                  const tSunPos = transitData.positions.find((p: any) => p.name === 'Sun');
                  let nPlanetPos = natalPlanet === 'Ascendant' ? mainData.lagna : mainData.positions.find((p: any) => p.name === natalPlanet);
                  
                  if (tSunPos && nPlanetPos) {
                    const tRasi = Math.floor(tSunPos.longitude / 30);
                    const nRasi = Math.floor(nPlanetPos.longitude / 30);
                    const house = ((tRasi - nRasi + 12) % 12) + 1;
                    const result = (yavanajatakaTransitSun as any)[natalPlanet]?.[house.toString()];
                    
                    return (
                      <div key={natalPlanet} style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '1rem', borderRadius: '8px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>From Natal {natalPlanet} (House {house})</div>
                        <div style={{ color: 'var(--foreground)' }}>{result || 'No specific result given.'}</div>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>

            {/* Transit Moon Results */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#eab308' }}>Transiting Moon (Chapter 50)</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {['Moon', 'Sun', 'Saturn', 'Jupiter', 'Venus', 'Mars', 'Mercury', 'Ascendant'].map(natalPlanet => {
                  const tMoonPos = transitData.positions.find((p: any) => p.name === 'Moon');
                  let nPlanetPos = natalPlanet === 'Ascendant' ? mainData.lagna : mainData.positions.find((p: any) => p.name === natalPlanet);
                  
                  if (tMoonPos && nPlanetPos) {
                    const tRasi = Math.floor(tMoonPos.longitude / 30);
                    const nRasi = Math.floor(nPlanetPos.longitude / 30);
                    const house = ((tRasi - nRasi + 12) % 12) + 1;
                    const result = (yavanajatakaTransitMoon as any)[natalPlanet]?.[house.toString()];
                    
                    return (
                      <div key={natalPlanet} style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '1rem', borderRadius: '8px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>From Natal {natalPlanet} (House {house})</div>
                        <div style={{ color: 'var(--foreground)' }}>{result || 'No specific result given.'}</div>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>

            {/* Transit Mars Results */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#eab308' }}>Transiting Mars (Chapter 48)</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {['Mars', 'Sun', 'Saturn', 'Jupiter', 'Venus', 'Mercury', 'Moon', 'Ascendant'].map(natalPlanet => {
                  const tMarsPos = transitData.positions.find((p: any) => p.name === 'Mars');
                  let nPlanetPos = natalPlanet === 'Ascendant' ? mainData.lagna : mainData.positions.find((p: any) => p.name === natalPlanet);
                  
                  if (tMarsPos && nPlanetPos) {
                    const tRasi = Math.floor(tMarsPos.longitude / 30);
                    const nRasi = Math.floor(nPlanetPos.longitude / 30);
                    const house = ((tRasi - nRasi + 12) % 12) + 1;
                    const result = (yavanajatakaTransitMars as any)[natalPlanet]?.[house.toString()];
                    
                    return (
                      <div key={natalPlanet} style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '1rem', borderRadius: '8px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>From Natal {natalPlanet} (House {house})</div>
                        <div style={{ color: 'var(--foreground)' }}>{result || 'No specific result given.'}</div>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>

            {/* Transit Mercury Results */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#eab308' }}>Transiting Mercury (Chapter 49)</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {['Mercury', 'Sun', 'Saturn', 'Jupiter', 'Venus', 'Mars', 'Moon', 'Ascendant'].map(natalPlanet => {
                  const tMercuryPos = transitData.positions.find((p: any) => p.name === 'Mercury');
                  let nPlanetPos = natalPlanet === 'Ascendant' ? mainData.lagna : mainData.positions.find((p: any) => p.name === natalPlanet);
                  
                  if (tMercuryPos && nPlanetPos) {
                    const tRasi = Math.floor(tMercuryPos.longitude / 30);
                    const nRasi = Math.floor(nPlanetPos.longitude / 30);
                    const house = ((tRasi - nRasi + 12) % 12) + 1;
                    const result = (yavanajatakaTransitMercury as any)[natalPlanet]?.[house.toString()];
                    
                    return (
                      <div key={natalPlanet} style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '1rem', borderRadius: '8px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>From Natal {natalPlanet} (House {house})</div>
                        <div style={{ color: 'var(--foreground)' }}>{result || 'No specific result given.'}</div>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>

            {/* Transit Jupiter Results */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#eab308' }}>Transiting Jupiter (Chapter 46)</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {['Jupiter', 'Sun', 'Saturn', 'Venus', 'Mars', 'Mercury', 'Moon', 'Ascendant'].map(natalPlanet => {
                  const tJupiterPos = transitData.positions.find((p: any) => p.name === 'Jupiter');
                  let nPlanetPos = natalPlanet === 'Ascendant' ? mainData.lagna : mainData.positions.find((p: any) => p.name === natalPlanet);
                  
                  if (tJupiterPos && nPlanetPos) {
                    const tRasi = Math.floor(tJupiterPos.longitude / 30);
                    const nRasi = Math.floor(nPlanetPos.longitude / 30);
                    const house = ((tRasi - nRasi + 12) % 12) + 1;
                    const result = (yavanajatakaTransitJupiter as any)[natalPlanet]?.[house.toString()];
                    
                    return (
                      <div key={natalPlanet} style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '1rem', borderRadius: '8px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>From Natal {natalPlanet} (House {house})</div>
                        <div style={{ color: 'var(--foreground)' }}>{result || 'No specific result given.'}</div>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>

            {/* Transit Venus Results */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#eab308' }}>Transiting Venus (Chapter 47)</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {['Venus', 'Sun', 'Saturn', 'Jupiter', 'Mars', 'Mercury', 'Moon', 'Ascendant'].map(natalPlanet => {
                  const tVenusPos = transitData.positions.find((p: any) => p.name === 'Venus');
                  let nPlanetPos = natalPlanet === 'Ascendant' ? mainData.lagna : mainData.positions.find((p: any) => p.name === natalPlanet);
                  
                  if (tVenusPos && nPlanetPos) {
                    const tRasi = Math.floor(tVenusPos.longitude / 30);
                    const nRasi = Math.floor(nPlanetPos.longitude / 30);
                    const house = ((tRasi - nRasi + 12) % 12) + 1;
                    const result = (yavanajatakaTransitVenus as any)[natalPlanet]?.[house.toString()];
                    
                    return (
                      <div key={natalPlanet} style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '1rem', borderRadius: '8px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>From Natal {natalPlanet} (House {house})</div>
                        <div style={{ color: 'var(--foreground)' }}>{result || 'No specific result given.'}</div>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>

            {/* Transit Saturn Results */}
            <div>
              <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1rem', color: '#eab308' }}>Transiting Saturn (Chapter 45)</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {['Saturn', 'Sun', 'Jupiter', 'Venus', 'Mars', 'Mercury', 'Moon', 'Ascendant'].map(natalPlanet => {
                  const tSaturnPos = transitData.positions.find((p: any) => p.name === 'Saturn');
                  let nPlanetPos = natalPlanet === 'Ascendant' ? mainData.lagna : mainData.positions.find((p: any) => p.name === natalPlanet);
                  
                  if (tSaturnPos && nPlanetPos) {
                    const tRasi = Math.floor(tSaturnPos.longitude / 30);
                    const nRasi = Math.floor(nPlanetPos.longitude / 30);
                    const house = ((tRasi - nRasi + 12) % 12) + 1;
                    const result = (yavanajatakaTransitSaturn as any)[natalPlanet]?.[house.toString()];
                    
                    return (
                      <div key={natalPlanet} style={{ background: 'rgba(15, 23, 42, 0.4)', padding: '1rem', borderRadius: '8px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>From Natal {natalPlanet} (House {house})</div>
                        <div style={{ color: 'var(--foreground)' }}>{result || 'No specific result given.'}</div>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>

          </div>
        </div>
      )}

      {subTab === 'TaraNDFNatal' && mainData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {weights?.enableTaraNirnayNatalMatrix !== false ? (
            <div style={{ background: 'var(--card-bg)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--primary)' }}>Tara Nirnay NDF Natal Chart Matrix</h2>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                {['Sun', 'Mercury', 'Mars', 'Jupiter', 'Saturn', 'Venus'].map(planet => (
                  <button 
                    key={planet}
                    onClick={() => setSelectedNdfPlanet(planet)}
                    className={`tab ${selectedNdfPlanet === planet ? 'active' : ''}`}
                  >
                    {planet}
                  </button>
                ))}
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '8px', overflow: 'hidden' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#eab308' }}>
                      <th style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>Natal Planet</th>
                      {Array.from({length: 12}, (_, i) => i + 1).map(h => (
                        <th key={h} style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>H{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {['Sun', 'Moon', 'Mercury', 'Mars', 'Jupiter', 'Saturn', 'Venus', 'Ascendant'].map(natalPlanet => {
                      const rowKey = `from_${natalPlanet}`;
                      const currentMatrix = weights?.taraNirnayNdfNatalMatrix || taraNirnayData;
                      const rowData = (currentMatrix as any)[selectedNdfPlanet]?.[rowKey];
                      if (!rowData) return null;

                      const tPlanetPos = mainData.positions.find((p: any) => p.name === selectedNdfPlanet);
                      let nPlanetPos = natalPlanet === 'Ascendant' ? mainData.lagna : mainData.positions.find((p: any) => p.name === natalPlanet);
                      
                      let currentTransitHouse = -1;
                      if (tPlanetPos && nPlanetPos) {
                        const tRasi = Math.floor(tPlanetPos.longitude / 30);
                        const nRasi = Math.floor(nPlanetPos.longitude / 30);
                        currentTransitHouse = ((tRasi - nRasi + 12) % 12) + 1;
                      }

                      return (
                        <tr key={natalPlanet} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '1rem', fontWeight: 'bold', color: 'var(--text)' }}>
                            {natalPlanet}
                            {nPlanetPos && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                                (Rasi {Math.floor(nPlanetPos.longitude / 30) + 1})
                              </div>
                            )}
                          </td>
                          {rowData.map((val: number, idx: number) => {
                            const houseNum = idx + 1;
                            const isCurrent = houseNum === currentTransitHouse;
                            return (
                              <td 
                                key={idx} 
                                style={{ 
                                  padding: '1rem', 
                                  color: val >= 12 ? '#22c55e' : (val < 10 ? '#ef4444' : 'var(--text)'),
                                  background: isCurrent ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                                  border: isCurrent ? '1px solid rgba(255,255,255,0.2)' : 'none',
                                  fontWeight: isCurrent ? 'bold' : 'normal'
                                }}
                              >
                                {val}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div style={{ background: 'var(--card-bg)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'center', color: 'var(--text-muted)' }}>
              Tara Nirnay NDF Natal Chart Matrix is currently disabled in the settings.
            </div>
          )}
        </div>
      )}

      {subTab === 'TaraNDF' && transitData && mainData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {weights?.enableTaraNirnayMatrix !== false ? (
            <div style={{ background: 'var(--card-bg)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--primary)' }}>Tara Nirnay NDF Transit Chart</h2>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                {['Sun', 'Mercury', 'Mars', 'Jupiter', 'Saturn', 'Venus'].map(planet => (
                  <button 
                    key={planet}
                    onClick={() => setSelectedNdfPlanet(planet)}
                    className={`tab ${selectedNdfPlanet === planet ? 'active' : ''}`}
                  >
                    {planet}
                  </button>
                ))}
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '8px', overflow: 'hidden' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#eab308' }}>
                      <th style={{ padding: '1rem', border: '1px solid var(--border)' }}>Natal Point</th>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(house => (
                        <th key={house} style={{ padding: '1rem', border: '1px solid var(--border)' }}>H{house}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {['Sun', 'Moon', 'Mercury', 'Mars', 'Jupiter', 'Saturn', 'Venus', 'Ascendant'].map(natalPlanet => {
                      const rowKey = `from_${natalPlanet}`;
                      const currentMatrix = weights?.taraNirnayNdfMatrix || taraNirnayData;
                      const rowData = (currentMatrix as any)[selectedNdfPlanet]?.[rowKey];
                      if (!rowData) return null;

                      const tPlanetPos = transitData.positions.find((p: any) => p.name === selectedNdfPlanet);
                      let nPlanetPos = natalPlanet === 'Ascendant' ? mainData.lagna : mainData.positions.find((p: any) => p.name === natalPlanet);
                      
                      let currentTransitHouse = -1;
                      if (tPlanetPos && nPlanetPos) {
                        const tRasi = Math.floor(tPlanetPos.longitude / 30);
                        const nRasi = Math.floor(nPlanetPos.longitude / 30);
                        currentTransitHouse = ((tRasi - nRasi + 12) % 12) + 1;
                      }

                      return (
                        <tr key={natalPlanet} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '0.75rem', fontWeight: 'bold', color: 'var(--primary)', borderRight: '1px solid var(--border)' }}>From {natalPlanet}</td>
                          {rowData.map((val: number, idx: number) => {
                            const houseNumber = idx + 1;
                            const isCurrent = currentTransitHouse === houseNumber;
                            return (
                              <td 
                                key={idx} 
                                style={{ 
                                  padding: '0.75rem', 
                                  borderRight: '1px solid var(--border)',
                                  background: isCurrent ? 'rgba(56, 189, 248, 0.2)' : 'transparent',
                                  color: isCurrent ? '#38bdf8' : 'var(--foreground)',
                                  fontWeight: isCurrent ? 'bold' : 'normal'
                                }}
                              >
                                {val}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                  Note: Highlighted cells indicate the current transit house from the respective natal point.
                </div>
              </div>
            </div>
          ) : (
            <div style={{ background: 'var(--card-bg)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'center', color: 'var(--text-muted)' }}>
              Tara Nirnay NDF Transit Chart Matrix is currently disabled in the settings.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

