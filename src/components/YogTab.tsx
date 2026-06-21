import React from 'react';
import AwasthaResults from './AwasthaResults';
import yavanajatakaData from '@/data/yavanajataka_ascendant.json';
import yavanajatakaMoonNavamsha from '@/data/yavanajataka_moon_navamsha.json';

import yavanajatakaMoonNavamshaAspects from '@/data/yavanajataka_moon_navamsha_aspects.json';
import yavanajatakaDwadasamsha from '@/data/yavanajataka_dwadasamsha.json';
import yavanajatakaDrekkana from '@/data/yavanajataka_drekkana.json';
import yavanajatakaSaptamsa from '@/data/yavanajataka_saptamsa.json';
import yavanajatakaSunSigns from '@/data/yavanajataka_sun_signs.json';
import yavanajatakaMercurySigns from '@/data/yavanajataka_mercury_signs.json';
import yavanajatakaVenusSigns from '@/data/yavanajataka_venus_signs.json';
import yavanajatakaMarsSigns from '@/data/yavanajataka_mars_signs.json';
import yavanajatakaJupiterSigns from '@/data/yavanajataka_jupiter_signs.json';
import yavanajatakaSaturnSigns from '@/data/yavanajataka_saturn_signs.json';
import bphsLordsInHouses from '@/data/bphs_lords_in_houses.json';

function isAspecting(aspector: string, aspectorSign: number, aspectedSign: number): boolean {
  if (aspectorSign === aspectedSign) return false;
  const dist = (aspectedSign - aspectorSign + 12) % 12 + 1;
  if (dist === 7) return true;
  if (aspector === 'Mars' && (dist === 4 || dist === 8)) return true;
  if ((aspector === 'Jupiter' || aspector === 'Rahu' || aspector === 'Ketu') && (dist === 5 || dist === 9)) return true;
  if (aspector === 'Saturn' && (dist === 3 || dist === 10)) return true;
  return false;
}

interface Props {
  data: any;
}

export default function YogTab({ data }: Props) {
  const [selectedFilter, setSelectedFilter] = React.useState('All');
  if (!data || !data.positions) return null;

  // Find the Ascendant sign name
  const ascendantSignName = data.lagna ? data.lagna.rasi.name : null;
  const yavanajatakaResult = ascendantSignName ? yavanajatakaData[ascendantSignName as keyof typeof yavanajatakaData] : null;

  // Find Ascendant Drekkana Part
  const ascendantDegrees = data.lagna ? data.lagna.rasi.degreesInSign : 0;
  const ascendantDrekkanaPart = Math.floor(ascendantDegrees / 10) + 1;
  const yavanajatakaDrekkanaResult = ascendantSignName ? (yavanajatakaDrekkana as any)[ascendantSignName]?.[ascendantDrekkanaPart.toString()] : null;

  // Find Ascendant Saptamsa Part
  const ascendantSaptamsaPart = Math.floor(ascendantDegrees / (30 / 7)) + 1;
  const yavanajatakaAscendantSaptamsaResult = ascendantSignName ? (yavanajatakaSaptamsa as any)[ascendantSignName]?.[ascendantSaptamsaPart.toString()] : null;

  // Find Moon's sign and Navamsha part
  const moonPos = data.positions.find((p: any) => p.name === 'Moon');
  const moonSignName = moonPos ? moonPos.rasi.name : null;
  const moonDegrees = moonPos ? moonPos.rasi.degreesInSign : 0;
  const moonNavamshaPart = moonPos && moonPos.navamsha ? moonPos.navamsha.part : null;
  const moonNavamshaSignName = moonPos && moonPos.navamsha ? moonPos.navamsha.name : null;
  const yavanajatakaMoonResult = moonSignName && moonNavamshaPart 
    ? (yavanajatakaMoonNavamsha as any)[moonSignName]?.[moonNavamshaPart.toString()] 
    : null;
    
  // Find Moon Saptamsa Part
  const moonSaptamsaPart = Math.floor(moonDegrees / (30 / 7)) + 1;
  const yavanajatakaMoonSaptamsaResult = moonSignName ? (yavanajatakaSaptamsa as any)[moonSignName]?.[moonSaptamsaPart.toString()] : null;

  const signLords: Record<string, string> = {
    'Aries': 'Mars', 'Taurus': 'Venus', 'Gemini': 'Mercury', 'Cancer': 'Moon', 'Leo': 'Sun', 'Virgo': 'Mercury',
    'Libra': 'Venus', 'Scorpio': 'Mars', 'Sagittarius': 'Jupiter', 'Capricorn': 'Saturn', 'Aquarius': 'Saturn', 'Pisces': 'Jupiter'
  };
  const moonNavamshaLord = moonNavamshaSignName ? signLords[moonNavamshaSignName] : null;

  const aspectingResults: { aspector: string, text: string }[] = [];
  if (moonNavamshaLord && moonPos) {
    const possibleAspectors = ['Sun', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn']; 
    for (const aspectorName of possibleAspectors) {
      const aspectorPos = data.positions.find((p: any) => p.name === aspectorName);
      if (aspectorPos) {
        if (isAspecting(aspectorName, aspectorPos.rasi.index, moonPos.rasi.index)) {
          const aspectResult = (yavanajatakaMoonNavamshaAspects as any)[moonNavamshaLord]?.[aspectorName];
          if (aspectResult) {
            aspectingResults.push({ aspector: aspectorName, text: aspectResult });
          }
        }
      }
    }
  }

  // D12 - Dwadasamsha Results
  const SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
  const d12Results: { planet: string, sign: string, text: string }[] = [];
  if (data.divisionalCharts && data.divisionalCharts['D12']) {
    const d12Houses = data.divisionalCharts['D12'].houses;
    const planetsToCheck = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
    for (const house of d12Houses) {
      if (house.planets && house.planets.length > 0) {
        const signName = SIGNS[house.signIndex];
        for (const p of house.planets) {
          if (planetsToCheck.includes(p.name)) {
            const d12Res = (yavanajatakaDwadasamsha as any)[signName]?.[p.name];
            if (d12Res) {
              d12Results.push({ planet: p.name, sign: signName, text: d12Res });
            }
          }
        }
      }
    }
  }

  // BPHS Lords in Houses Results
  const bphsResults: { lordOf: number, placedIn: number, text: string, planetName: string }[] = [];
  if (data.lagna && data.positions) {
    const lagnaRasiIndex = data.lagna.rasi.index;
    const signsToPlanets = ['Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter'];
    
    const planetOwnedHouses = new Map<string, number[]>();
    for (let h = 1; h <= 12; h++) {
      const signIndex = (lagnaRasiIndex + h - 1) % 12;
      const lordPlanet = signsToPlanets[signIndex];
      if (!planetOwnedHouses.has(lordPlanet)) {
        planetOwnedHouses.set(lordPlanet, []);
      }
      planetOwnedHouses.get(lordPlanet)!.push(h);
    }

    const mainPlanets = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
    for (const planetName of mainPlanets) {
      const planetPos = data.positions.find((p: any) => p.name === planetName);
      if (planetPos) {
        const pSignIndex = planetPos.rasi.index;
        const placedInHouse = (pSignIndex - lagnaRasiIndex + 12) % 12 + 1;
        
        const ownedHouses = planetOwnedHouses.get(planetName) || [];
        for (const ownedHouse of ownedHouses) {
          const text = (bphsLordsInHouses as any)[ownedHouse.toString()]?.[placedInHouse.toString()];
          if (text) {
            bphsResults.push({ lordOf: ownedHouse, placedIn: placedInHouse, text, planetName });
          }
        }
      }
    }
    bphsResults.sort((a, b) => a.lordOf - b.lordOf);
  }

  // Helper for Wealth Yogas
  const getWealthYogas = (houseIndex: number, positions: any[], isInflow: boolean) => {
    const allowedPlanets = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
    const benefics = ['Jupiter', 'Venus', 'Mercury', 'Moon'];
    const yogas: string[] = [];
    
    const influencingPlanets = positions.filter((p: any) => {
      if (!allowedPlanets.includes(p.name)) return false;
      return p.rasi.index === houseIndex || isAspecting(p.name, p.rasi.index, houseIndex);
    });
    
    if (influencingPlanets.length === 0) return null;

    if (isInflow) {
      yogas.push(`Total planets influencing: ${influencingPlanets.length}. The higher the number of planets, the higher the wealth.`);
    } else {
      yogas.push(`Total planets influencing: ${influencingPlanets.length}. The higher the number of planets, the higher the expenses/outflows.`);
    }

    for (const p of influencingPlanets) {
      const isBenefic = benefics.includes(p.name);
      const type = p.rasi.index === houseIndex ? 'occupying' : 'aspecting';
      if (isInflow) {
        if (isBenefic) {
          yogas.push(`${p.name} is ${type}: Wealth from virtuous means.`);
        } else {
          yogas.push(`${p.name} is ${type}: Wealth from questionable means.`);
        }
      } else {
        if (isBenefic) {
          yogas.push(`${p.name} is ${type}: Expenses on virtuous or religious deeds.`);
        } else {
          yogas.push(`${p.name} is ${type}: Expenses on questionable or unnecessary things.`);
        }
      }
    }
    return yogas;
  };

  // Arudha Lagna BPHS Wealth Yoga
  let arudhaInflowYogas: string[] | null = null;
  let arudhaOutflowYogas: string[] | null = null;
  const alPada = data.specialLagnas?.arudhaPadas?.find((p: any) => p.house === 1);
  const alSignIndex = alPada?.rasi?.index;

  if (alSignIndex !== undefined && data.positions) {
    const eleventhFromAL = (alSignIndex + 10) % 12;
    const twelfthFromAL = (alSignIndex + 11) % 12;
    arudhaInflowYogas = getWealthYogas(eleventhFromAL, data.positions, true);
    arudhaOutflowYogas = getWealthYogas(twelfthFromAL, data.positions, false);
  }

  // Find results for every planet in D12
  const yavanajatakaDwadasamshaResults: { name: string, result: string, sign: string, dwadasamshaName: string }[] = [];
  if (data.positions && data.divisionalCharts && data.divisionalCharts['D12']) {
    for (const p of data.positions) {
      if (['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'].includes(p.name)) {
        const d12Sign = p.dwadasamsha ? p.dwadasamsha.name : null;
        if (d12Sign) {
          const res = (yavanajatakaDwadasamsha as any)[d12Sign]?.[p.name];
          if (res) {
            yavanajatakaDwadasamshaResults.push({ name: p.name, result: res, sign: p.rasi.name, dwadasamshaName: d12Sign });
          }
        }
      }
    }
  }

  // Find Yavanajataka results for Sun, Mercury, Venus, Mars, Jupiter, Saturn in signs
  const sunPos = data.positions.find((p: any) => p.name === 'Sun');
  const mercuryPos = data.positions.find((p: any) => p.name === 'Mercury');
  const venusPos = data.positions.find((p: any) => p.name === 'Venus');
  const marsPos = data.positions.find((p: any) => p.name === 'Mars');
  const jupiterPos = data.positions.find((p: any) => p.name === 'Jupiter');
  const saturnPos = data.positions.find((p: any) => p.name === 'Saturn');

  const sunSignName = sunPos ? sunPos.rasi.name : null;
  const mercurySignName = mercuryPos ? mercuryPos.rasi.name : null;
  const venusSignName = venusPos ? venusPos.rasi.name : null;
  const marsSignName = marsPos ? marsPos.rasi.name : null;
  const jupiterSignName = jupiterPos ? jupiterPos.rasi.name : null;
  const saturnSignName = saturnPos ? saturnPos.rasi.name : null;

  const yavanajatakaSunResult = sunSignName ? (yavanajatakaSunSigns as any)[sunSignName] : null;
  const yavanajatakaMercuryResult = mercurySignName ? (yavanajatakaMercurySigns as any)[mercurySignName] : null;
  const yavanajatakaVenusResult = venusSignName ? (yavanajatakaVenusSigns as any)[venusSignName] : null;
  const yavanajatakaMarsResult = marsSignName ? (yavanajatakaMarsSigns as any)[marsSignName] : null;
  const yavanajatakaJupiterResult = jupiterSignName ? (yavanajatakaJupiterSigns as any)[jupiterSignName] : null;
  const yavanajatakaSaturnResult = saturnSignName ? (yavanajatakaSaturnSigns as any)[saturnSignName] : null;

  // Karakamsa Lagna BPHS Wealth Yoga
  let karakamsaInflowYogas: string[] | null = null;
  let karakamsaOutflowYogas: string[] | null = null;

  if (data.positions && data.divisionalCharts && data.divisionalCharts['D9']) {
    const planets7 = data.positions.filter((p: any) => ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'].includes(p.name));
    if (planets7.length > 0) {
      let atmakaraka = planets7[0];
      for (const p of planets7) {
        if ((p.longitude % 30) > (atmakaraka.longitude % 30)) {
          atmakaraka = p;
        }
      }
      
      const d9Houses = data.divisionalCharts['D9'].houses;
      const akHouse = d9Houses.find((h: any) => h.planets?.some((p: any) => p.name === atmakaraka.name));
      
      if (akHouse) {
        const akSignIndex = akHouse.signIndex;
        const eleventhFromAK = (akSignIndex + 10) % 12;
        const twelfthFromAK = (akSignIndex + 11) % 12;
        karakamsaInflowYogas = getWealthYogas(eleventhFromAK, data.positions, true);
        karakamsaOutflowYogas = getWealthYogas(twelfthFromAK, data.positions, false);
      }
    }
  }

  // Gemstones Suggestion Logic
  const gemstoneSuggestions: string[] = [];
  const GEMSTONES: Record<string, string> = {
    Sun: "Ruby", Moon: "Pearl", Mars: "Red Coral", Mercury: "Emerald",
    Jupiter: "Yellow Sapphire", Venus: "Diamond", Saturn: "Blue Sapphire",
    Rahu: "Hessonite", Ketu: "Cat's Eye"
  };

  if (data.lagna && data.positions) {
    const PARASHARA_YOGAKARAKAS: Record<string, string[]> = {
      Aries: ['Sun', 'Moon'], Taurus: ['Saturn'], Gemini: ['Venus', 'Mercury'],
      Cancer: ['Mars'], Leo: ['Mars'], Virgo: ['Venus', 'Mercury'],
      Libra: ['Saturn'], Scorpio: ['Sun', 'Moon'], Sagittarius: ['Sun', 'Mercury'],
      Capricorn: ['Venus'], Aquarius: ['Venus'], Pisces: ['Mars', 'Jupiter']
    };

    const lagnaSignName = data.lagna.rasi.name;
    const ykList = PARASHARA_YOGAKARAKAS[lagnaSignName] || [];
    ykList.forEach(yk => {
      gemstoneSuggestions.push(`As per Parasara, ${yk} is Yogkaraka for ${lagnaSignName} Lagna. Suggested Gemstone: ${GEMSTONES[yk]}.`);
    });

    if (data.divisionalCharts && data.divisionalCharts['D9']) {
      const d9Houses = data.divisionalCharts['D9'].houses;
      if (d9Houses && d9Houses.length > 0) {
        const navamsaLagnaSignIndex = d9Houses[0].signIndex;
        const localSignsToPlanets = ['Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter'];
        const localSIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
        const d9LagnaLord = localSignsToPlanets[navamsaLagnaSignIndex];
        const lagnaRasiIndex = data.lagna.rasi.index;
        
        // 6th and 8th lords in D1
        const lordOf6th = localSignsToPlanets[(lagnaRasiIndex + 5) % 12];
        const lordOf8th = localSignsToPlanets[(lagnaRasiIndex + 7) % 12];

        if (d9LagnaLord !== lordOf6th && d9LagnaLord !== lordOf8th) {
          gemstoneSuggestions.push(`Lord of Navamsa Lagna (${localSIGNS[navamsaLagnaSignIndex]}) is ${d9LagnaLord}. It does not own the 6th or 8th house in D1. Suggested Gemstone: ${GEMSTONES[d9LagnaLord]}.`);
        } else {
          const d9LordPos = data.positions.find((p: any) => p.name === d9LagnaLord);
          if (d9LordPos) {
            const isOwnHouse = localSignsToPlanets[d9LordPos.rasi.index] === d9LagnaLord;
            if (isOwnHouse) {
              gemstoneSuggestions.push(`Lord of Navamsa Lagna (${localSIGNS[navamsaLagnaSignIndex]}) is ${d9LagnaLord}. Although it owns a Dusthana (6th/8th) in D1, it is placed in its own house. Suggested Gemstone: ${GEMSTONES[d9LagnaLord]}.`);
            }
          }
        }
      }
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Disclaimer */}
      <div style={{ padding: '1rem', background: 'rgba(255, 193, 7, 0.1)', borderLeft: '4px solid #ffc107', borderRadius: '4px' }}>
        <p style={{ margin: 0, color: 'var(--foreground)', fontSize: '0.95rem' }}>
          <strong>Disclaimer:</strong> The results may be too extreme and depend on various other factors.
        </p>
      </div>

      {/* Filter Dropdown */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
        <select 
          value={selectedFilter} 
          onChange={(e) => setSelectedFilter(e.target.value)}
          style={{ 
            padding: '0.75rem 1.5rem', 
            borderRadius: '8px', 
            background: 'var(--card-bg)', 
            color: 'var(--foreground)', 
            border: '1px solid var(--border)',
            fontSize: '1rem',
            outline: 'none',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}
        >
          <option value="All">All Results</option>
          <option value="Gemstones">Gemstones</option>
          <option value="Yavanajataka">Yavanajataka</option>
          <option value="BPHS Lordship">BPHS Lordship</option>
          <option value="BPHS Wealth Yogas">BPHS Wealth Yogas</option>
          <option value="Awastha Results">Awastha Results</option>
        </select>
      </div>

      {/* Gemstones Suggestion */}
      {(selectedFilter === 'All' || selectedFilter === 'Gemstones') && gemstoneSuggestions.length > 0 && (
        <div className="glass-card" style={{ padding: '1.5rem', background: 'var(--card-bg)' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            Gemstones Suggestion
          </h3>
          <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', margin: 0, color: 'var(--foreground)' }}>
            {gemstoneSuggestions.map((suggestion, i) => (
              <li key={i} style={{ fontSize: '1rem', lineHeight: 1.6, marginBottom: '0.5rem' }}>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Yavanajataka Ascendant Results */}
      {(selectedFilter === 'All' || selectedFilter === 'Yavanajataka') && ascendantSignName && yavanajatakaResult && (
        <div className="glass-card" style={{ padding: '1.5rem', background: 'var(--card-bg)' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            Yavanajataka Ascendant Results ({ascendantSignName} Lagna)
          </h3>
          <p style={{ fontSize: '1rem', lineHeight: 1.6, color: 'var(--foreground)' }}>
            {yavanajatakaResult}
          </p>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '1rem', fontStyle: 'italic' }}>
            Source: Yavanajataka Chapter 31
          </div>
        </div>
      )}

      {/* Yavanajataka Ascendant Drekkana Results */}
      {(selectedFilter === 'All' || selectedFilter === 'Yavanajataka') && ascendantSignName && yavanajatakaDrekkanaResult && (
        <div className="glass-card" style={{ padding: '1.5rem', background: 'var(--card-bg)' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            Yavanajataka Ascendant Drekkana Results ({ascendantSignName} Lagna, Drekkana {ascendantDrekkanaPart})
          </h3>
          <p style={{ fontSize: '1rem', lineHeight: 1.6, color: 'var(--foreground)' }}>
            {yavanajatakaDrekkanaResult}
          </p>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '1rem', fontStyle: 'italic' }}>
            Source: Yavanajataka Chapter 29
          </div>
        </div>
      )}

      {/* Yavanajataka Sun in Sign Results */}
      {(selectedFilter === 'All' || selectedFilter === 'Yavanajataka') && sunSignName && yavanajatakaSunResult && (
        <div className="glass-card" style={{ padding: '1.5rem', background: 'var(--card-bg)' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            Yavanajataka Sun in {sunSignName}
          </h3>
          <p style={{ fontSize: '1rem', lineHeight: 1.6, color: 'var(--foreground)' }}>
            {yavanajatakaSunResult}
          </p>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '1rem', fontStyle: 'italic' }}>
            Source: Yavanajataka Chapter 12
          </div>
        </div>
      )}

      {/* Yavanajataka Mercury in Sign Results */}
      {(selectedFilter === 'All' || selectedFilter === 'Yavanajataka') && mercurySignName && yavanajatakaMercuryResult && (
        <div className="glass-card" style={{ padding: '1.5rem', background: 'var(--card-bg)' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            Yavanajataka Mercury in {mercurySignName}
          </h3>
          <p style={{ fontSize: '1rem', lineHeight: 1.6, color: 'var(--foreground)' }}>
            {yavanajatakaMercuryResult}
          </p>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '1rem', fontStyle: 'italic' }}>
            Source: Yavanajataka Chapter 13
          </div>
        </div>
      )}

      {/* Yavanajataka Venus in Sign Results */}
      {(selectedFilter === 'All' || selectedFilter === 'Yavanajataka') && venusSignName && yavanajatakaVenusResult && (
        <div className="glass-card" style={{ padding: '1.5rem', background: 'var(--card-bg)' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            Yavanajataka Venus in {venusSignName}
          </h3>
          <p style={{ fontSize: '1rem', lineHeight: 1.6, color: 'var(--foreground)' }}>
            {yavanajatakaVenusResult}
          </p>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '1rem', fontStyle: 'italic' }}>
            Source: Yavanajataka Chapter 14
          </div>
        </div>
      )}

      {/* Yavanajataka Mars in Sign Results */}
      {(selectedFilter === 'All' || selectedFilter === 'Yavanajataka') && marsSignName && yavanajatakaMarsResult && (
        <div className="glass-card" style={{ padding: '1.5rem', background: 'var(--card-bg)' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            Yavanajataka Mars in {marsSignName}
          </h3>
          <p style={{ fontSize: '1rem', lineHeight: 1.6, color: 'var(--foreground)' }}>
            {yavanajatakaMarsResult}
          </p>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '1rem', fontStyle: 'italic' }}>
            Source: Yavanajataka Chapter 15
          </div>
        </div>
      )}

      {/* Yavanajataka Jupiter in Sign Results */}
      {(selectedFilter === 'All' || selectedFilter === 'Yavanajataka') && jupiterSignName && yavanajatakaJupiterResult && (
        <div className="glass-card" style={{ padding: '1.5rem', background: 'var(--card-bg)' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            Yavanajataka Jupiter in {jupiterSignName}
          </h3>
          <p style={{ fontSize: '1rem', lineHeight: 1.6, color: 'var(--foreground)' }}>
            {yavanajatakaJupiterResult}
          </p>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '1rem', fontStyle: 'italic' }}>
            Source: Yavanajataka Chapter 16
          </div>
        </div>
      )}

      {/* Yavanajataka Saturn in Sign Results */}
      {(selectedFilter === 'All' || selectedFilter === 'Yavanajataka') && saturnSignName && yavanajatakaSaturnResult && (
        <div className="glass-card" style={{ padding: '1.5rem', background: 'var(--card-bg)' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            Yavanajataka Saturn in {saturnSignName}
          </h3>
          <p style={{ fontSize: '1rem', lineHeight: 1.6, color: 'var(--foreground)' }}>
            {yavanajatakaSaturnResult}
          </p>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '1rem', fontStyle: 'italic' }}>
            Source: Yavanajataka Chapter 17
          </div>
        </div>
      )}

      {/* Yavanajataka Ascendant Saptamsa Results */}
      {(selectedFilter === 'All' || selectedFilter === 'Yavanajataka') && ascendantSignName && yavanajatakaAscendantSaptamsaResult && (
        <div className="glass-card" style={{ padding: '1.5rem', background: 'var(--card-bg)' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            Yavanajataka Ascendant Saptamsa Results ({ascendantSignName} Lagna, Saptamsa {ascendantSaptamsaPart})
          </h3>
          <p style={{ fontSize: '1rem', lineHeight: 1.6, color: 'var(--foreground)' }}>
            {yavanajatakaAscendantSaptamsaResult}
          </p>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '1rem', fontStyle: 'italic' }}>
            Source: Yavanajataka Chapter 30
          </div>
        </div>
      )}

      {/* Yavanajataka Moon Navamsha Results */}
      {(selectedFilter === 'All' || selectedFilter === 'Yavanajataka') && moonSignName && moonNavamshaPart && yavanajatakaMoonResult && (
        <div className="glass-card" style={{ padding: '1.5rem', background: 'var(--card-bg)' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            Yavanajataka Moon Navamsha Results (Moon in {moonSignName}, Navamsha {moonNavamshaPart})
          </h3>
          <p style={{ fontSize: '1rem', lineHeight: 1.6, color: 'var(--foreground)' }}>
            {yavanajatakaMoonResult}
          </p>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '1rem', fontStyle: 'italic' }}>
            Source: Yavanajataka Chapter 31
          </div>
        </div>
      )}

      {/* Yavanajataka Moon Saptamsa Results */}
      {(selectedFilter === 'All' || selectedFilter === 'Yavanajataka') && moonSignName && yavanajatakaMoonSaptamsaResult && (
        <div className="glass-card" style={{ padding: '1.5rem', background: 'var(--card-bg)' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            Yavanajataka Moon Saptamsa Results (Moon in {moonSignName}, Saptamsa {moonSaptamsaPart})
          </h3>
          <p style={{ fontSize: '1rem', lineHeight: 1.6, color: 'var(--foreground)' }}>
            {yavanajatakaMoonSaptamsaResult}
          </p>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '1rem', fontStyle: 'italic' }}>
            Source: Yavanajataka Chapter 30
          </div>
        </div>
      )}

      {/* Yavanajataka Moon Navamsha Aspect Results */}
      {(selectedFilter === 'All' || selectedFilter === 'Yavanajataka') && aspectingResults.length > 0 && (
        <div className="glass-card" style={{ padding: '1.5rem', background: 'var(--card-bg)' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            Yavanajataka Moon Navamsha Aspects (Moon in {moonNavamshaLord}'s Navamsha)
          </h3>
          <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', margin: 0, color: 'var(--foreground)' }}>
            {aspectingResults.map((res, i) => (
              <li key={i} style={{ fontSize: '1rem', lineHeight: 1.6, marginBottom: '0.5rem' }}>
                {res.text}
              </li>
            ))}
          </ul>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '1rem', fontStyle: 'italic' }}>
            Source: Yavanajataka Chapter 32
          </div>
        </div>
      )}

      {/* Yavanajataka Dwadasamsha (D12) Results */}
      {(selectedFilter === 'All' || selectedFilter === 'Yavanajataka') && d12Results.length > 0 && (
        <div className="glass-card" style={{ padding: '1.5rem', background: 'var(--card-bg)' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            Yavanajataka Dwadasamsha (D12) Results
          </h3>
          <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', margin: 0, color: 'var(--foreground)' }}>
            {d12Results.map((res, i) => (
              <li key={i} style={{ fontSize: '1rem', lineHeight: 1.6, marginBottom: '0.5rem' }}>
                <strong>{res.planet} in {res.sign} Dwadasamsha:</strong> {res.text}
              </li>
            ))}
          </ul>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '1rem', fontStyle: 'italic' }}>
            Source: Yavanajataka Chapter 34
          </div>
        </div>
      )}

      {/* BPHS Lords in Houses Results */}
      {(selectedFilter === 'All' || selectedFilter === 'BPHS Lordship') && bphsResults.length > 0 && (
        <div className="glass-card" style={{ padding: '1.5rem', background: 'var(--card-bg)' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            BPHS Results: Lords in Various Houses
          </h3>
          <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', margin: 0, color: 'var(--foreground)' }}>
            {bphsResults.map((res, i) => (
              <li key={i} style={{ fontSize: '1rem', lineHeight: 1.6, marginBottom: '1rem' }}>
                <strong>{res.planetName} (Lord of {res.lordOf}) in House {res.placedIn}:</strong>
                <div style={{ marginTop: '0.25rem', whiteSpace: 'pre-line' }}>{res.text}</div>
              </li>
            ))}
          </ul>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '1rem', fontStyle: 'italic' }}>
            Source: Brihat Parashara Hora Shastra
          </div>
        </div>
      )}

      {/* Arudha Lagna BPHS Wealth Yoga */}
      {(selectedFilter === 'All' || selectedFilter === 'BPHS Wealth Yogas') && (arudhaInflowYogas || arudhaOutflowYogas) && (
        <div className="glass-card" style={{ padding: '1.5rem', background: 'var(--card-bg)' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            BPHS Yoga: Wealth from Arudha Lagna
          </h3>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {arudhaInflowYogas && (
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px' }}>
                <h4 style={{ color: 'var(--success)', marginBottom: '0.5rem' }}>Inflow (11th from Arudha Lagna)</h4>
                <ul style={{ paddingLeft: '1.5rem', margin: 0, color: 'var(--foreground)' }}>
                  {arudhaInflowYogas.map((yoga, i) => (
                    <li key={i} style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>{yoga}</li>
                  ))}
                </ul>
              </div>
            )}
            {arudhaOutflowYogas && (
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px' }}>
                <h4 style={{ color: 'var(--destructive)', marginBottom: '0.5rem' }}>Outflow (12th from Arudha Lagna)</h4>
                <ul style={{ paddingLeft: '1.5rem', margin: 0, color: 'var(--foreground)' }}>
                  {arudhaOutflowYogas.map((yoga, i) => (
                    <li key={i} style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>{yoga}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '1rem', fontStyle: 'italic' }}>
            Source: Brihat Parashara Hora Shastra
          </div>
        </div>
      )}

      {/* Karakamsa Lagna BPHS Wealth Yoga */}
      {(selectedFilter === 'All' || selectedFilter === 'BPHS Wealth Yogas') && (karakamsaInflowYogas || karakamsaOutflowYogas) && (
        <div className="glass-card" style={{ padding: '1.5rem', background: 'var(--card-bg)' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            BPHS Yoga: Wealth from Karakamsa Lagna
          </h3>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {karakamsaInflowYogas && (
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px' }}>
                <h4 style={{ color: 'var(--success)', marginBottom: '0.5rem' }}>Inflow (11th from Karakamsa)</h4>
                <ul style={{ paddingLeft: '1.5rem', margin: 0, color: 'var(--foreground)' }}>
                  {karakamsaInflowYogas.map((yoga, i) => (
                    <li key={i} style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>{yoga}</li>
                  ))}
                </ul>
              </div>
            )}
            {karakamsaOutflowYogas && (
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px' }}>
                <h4 style={{ color: 'var(--destructive)', marginBottom: '0.5rem' }}>Outflow (12th from Karakamsa)</h4>
                <ul style={{ paddingLeft: '1.5rem', margin: 0, color: 'var(--foreground)' }}>
                  {karakamsaOutflowYogas.map((yoga, i) => (
                    <li key={i} style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>{yoga}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '1rem', fontStyle: 'italic' }}>
            Source: Brihat Parashara Hora Shastra
          </div>
        </div>
      )}

      {/* Awastha Results */}
      {/* Awastha Results */}
      {(selectedFilter === 'All' || selectedFilter === 'Awastha Results') && (
        <AwasthaResults data={data} />
      )}
    </div>
  );
}
