import React from 'react';
import { PLANETS, Planet, SIGN_LORDS, SIGNS, HOUSES, EXALTATION } from '../lib/yoga_engine/constants';

interface ShadbalaAspectMatrixProps {
  data: any;
}

export default function ShadbalaAspectMatrix({ data }: ShadbalaAspectMatrixProps) {
  if (!data || !data.positions || !data.lagna) {
    return <div style={{textAlign: 'center', padding: '2rem'}}>No data available for Shadbala Aspect Matrix</div>;
  }

  // Helper to normalize angles
  const norm = (a: number) => ((a % 360) + 360) % 360;

  // BPHS formula exact virupas calculation (based on continuous PVR logic)
  const getAspectVirupas = (aspector: string, a: number): number => {
    let val = 0;
    if (a >= 30 && a < 60) {
      val = (a - 30) / 2;
    } else if (a >= 60 && a < 90) {
      val = (a - 60) + 15;
    } else if (a >= 90 && a < 120) {
      val = (120 - a) / 2 + 30;
    } else if (a >= 120 && a < 150) {
      val = 150 - a;
    } else if (a >= 150 && a < 180) {
      val = (a - 150) * 2;
    } else if (a >= 180 && a < 300) {
      val = (300 - a) / 2;
    }

    // Vishesha Drishti Exceptions
    if (aspector === 'Mars') {
      if (a >= 60 && a < 90) val = 15 + (a - 60) * 1.5;
      else if (a >= 90 && a < 120) val = 60 - (a - 90);
      else if (a >= 180 && a < 210) val = 60;
      else if (a >= 210 && a < 240) val = 60 - (a - 210);
    } else if (aspector === 'Jupiter' || aspector === 'Rahu' || aspector === 'Ketu') {
      if (a >= 90 && a < 120) val = 45 + (a - 90) / 2;
      else if (a >= 120 && a < 150) val = 60 - 2 * (a - 120);
      else if (a >= 210 && a < 240) val = 45 + (a - 210) / 2;
      else if (a >= 240 && a < 270) val = 60 - 1.5 * (a - 240);
    } else if (aspector === 'Saturn') {
      if (a >= 30 && a < 60) val = 2 * (a - 30);
      else if (a >= 60 && a < 90) val = 60 - (a - 60) / 2;
      else if (a >= 240 && a < 270) val = 30 + (a - 240);
      else if (a >= 270 && a < 300) val = 2 * (300 - a);
    }

    val = Math.min(60, Math.max(0, val));
    return val;
  };

  const getShadbalaMultipliedAspect = (aspector: string, aspectorLong: number, aspectedLong: number) => {
    const a = norm(aspectedLong - aspectorLong);
    const virupas = getAspectVirupas(aspector, a);
    
    let shadbalaViras = 0;
    if (data.shadbala?.[aspector]) {
      shadbalaViras = data.shadbala[aspector].totalViras;
    } else {
      const dispositor = data.yogaState?.planets?.[aspector]?.dispositor;
      if (dispositor && data.shadbala?.[dispositor]) {
        shadbalaViras = data.shadbala[dispositor].totalViras;
      }
    }

    return Math.round((virupas / 60) * shadbalaViras);
  };

  const isExaltedSign = (aspector: Planet, sign: string) => {
    if (aspector === 'Rahu' && (sign === 'Taurus' || sign === 'Gemini')) return true;
    if (aspector === 'Ketu' && (sign === 'Scorpio' || sign === 'Sagittarius')) return true;
    return EXALTATION[aspector]?.sign === sign;
  };

  const getRelationshipStyle = (aspectorName: Planet, targetLord: Planet, targetSign?: string) => {
    if (targetSign && isExaltedSign(aspectorName, targetSign)) return { color: '#ffffff', fontWeight: 'bold' as const };
    if (aspectorName === targetLord) return { color: '#0000ff', fontWeight: 'bold' as const };
    
    const rel = data.yogaState?.planets[aspectorName]?.compoundRelationship?.[targetLord];
    if (!rel) return {};

    switch (rel) {
      case 'Adhimitra': return { color: '#d4a300', fontWeight: 'bold' as const };
      case 'Mitra': return { color: '#d4a300' };
      case 'Sama': return { color: 'var(--foreground)' }; // Adapts to light/dark mode
      case 'Satru': return { color: '#ff0000' };
      case 'Adhisatru': return { color: '#ff0000', fontStyle: 'italic' as const, fontWeight: 'bold' as const };
      default: return {};
    }
  };

  const getPlanetSymbol = (p: Planet) => {
    switch(p) {
      case 'Sun': return 'Su';
      case 'Moon': return 'Mo';
      case 'Mars': return 'Ma';
      case 'Mercury': return 'Me';
      case 'Jupiter': return 'Ju';
      case 'Venus': return 'Ve';
      case 'Saturn': return 'Sa';
      case 'Rahu': return 'Ra';
      case 'Ketu': return 'Ke';
      default: return String(p).substring(0, 2);
    }
  };

  const getAvasthaIcon = (pName: Planet) => {
    const dignity = data.yogaState?.planets[pName]?.dignity;
    if (dignity === 'Exalted') return <span title="Uchcha (exalted)" style={{ color: 'green', fontSize: '0.8em', marginLeft: '2px' }}>↑</span>;
    if (dignity === 'Debilitated') return <span title="Neecha (debilitated)" style={{ color: 'red', fontSize: '0.8em', marginLeft: '2px' }}>↓</span>;
    if (dignity === 'Moolatrikona') return <span title="Moolatrikona" style={{ color: 'green', fontSize: '0.8em', marginLeft: '2px' }}>▲</span>;
    if (dignity === 'Own Sign') return <span title="Swagriha (own house)" style={{ color: 'blue', fontSize: '0.8em', marginLeft: '2px' }}>⌂</span>;
    return null;
  };

  const rows = PLANETS;
  const houseCols = HOUSES.map(h => `${h}${h===1?'st':h===2?'nd':h===3?'rd':'th'}`);
  const cols = [...PLANETS, ...houseCols];

  // Helper to find longitudes
  const getLong = (name: string) => data.positions.find((p: any) => p.name === name)?.longitude || 0;
  
  const houseMidpoints = HOUSES.map(h => {
    const longitude = norm(data.lagna.longitude + (h - 1) * 30);
    const signIndex = Math.floor(longitude / 30);
    return {
      label: `${h}${h===1?'st':h===2?'nd':h===3?'rd':'th'}`,
      longitude,
      lord: SIGN_LORDS[SIGNS[signIndex]]
    };
  });

  const getRelationshipType = (aspectorName: Planet, targetLord: Planet, targetSign?: string) => {
    if (targetSign && isExaltedSign(aspectorName, targetSign)) return 'Exalted';
    if (aspectorName === targetLord) return 'Swagriha';
    const rel = data.yogaState?.planets[aspectorName]?.compoundRelationship?.[targetLord];
    return rel || 'Sama';
  };

  const colTotals: Record<string, { Exalted: number, Swagriha: number, Adhimitra: number, Mitra: number, Sama: number, Satru: number, Adhisatru: number, Total: number }> = {};
  cols.forEach(c => {
    colTotals[c] = { Exalted: 0, Swagriha: 0, Adhimitra: 0, Mitra: 0, Sama: 0, Satru: 0, Adhisatru: 0, Total: 0 };
  });
  const rowTotalsMap: Record<string, any> = {};

  rows.forEach(rowPlanet => {
    const rowLong = getLong(rowPlanet);
    const aspectTotals = { Exalted: 0, Swagriha: 0, Adhimitra: 0, Mitra: 0, Sama: 0, Satru: 0, Adhisatru: 0, Total: 0 };

    PLANETS.forEach(colPlanet => {
      if (rowPlanet !== colPlanet) {
        const colLong = getLong(colPlanet);
        const colSign = SIGNS[Math.floor(colLong / 30)];
        const aspectValue = getShadbalaMultipliedAspect(rowPlanet, rowLong, colLong);
        const relType = getRelationshipType(rowPlanet, colPlanet, colSign);
        if (aspectValue > 0) {
          aspectTotals[relType as keyof typeof aspectTotals] += aspectValue;
          aspectTotals.Total += aspectValue;
          colTotals[colPlanet][relType as keyof typeof aspectTotals] += aspectValue;
          colTotals[colPlanet].Total += aspectValue;
        }
      }
    });

    houseMidpoints.forEach(hm => {
      const hmSign = SIGNS[Math.floor(hm.longitude / 30)];
      const aspectValue = getShadbalaMultipliedAspect(rowPlanet, rowLong, hm.longitude);
      const relType = getRelationshipType(rowPlanet, hm.lord, hmSign);
      if (aspectValue > 0) {
        aspectTotals[relType as keyof typeof aspectTotals] += aspectValue;
        aspectTotals.Total += aspectValue;
        colTotals[hm.label][relType as keyof typeof aspectTotals] += aspectValue;
        colTotals[hm.label].Total += aspectValue;
      }
    });

    rowTotalsMap[rowPlanet] = aspectTotals;
  });

  const extraHeaders = [
    { key: 'Exalted', label: 'Exalted' },
    { key: 'Swagriha', label: 'Own' },
    { key: 'Adhimitra', label: 'AdhiMit' },
    { key: 'Mitra', label: 'Mitra' },
    { key: 'Sama', label: 'Sama' },
    { key: 'Satru', label: 'Satru' },
    { key: 'Adhisatru', label: 'AdhiSat' },
    { key: 'Total', label: 'Total' }
  ];

  return (
    <div style={{ width: '100%' }}>
      <div style={{ overflowX: 'auto', marginBottom: '1rem', paddingBottom: '0.5rem' }}>
        <table style={{ borderCollapse: 'collapse', width: 'max-content', fontSize: '0.9rem', textAlign: 'center', margin: '0 auto', background: 'var(--card-bg)' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid var(--border)', padding: '0.3rem 0.5rem' }}></th>
              {cols.map((col, idx) => (
                <th key={idx} style={{ border: '1px solid var(--border)', padding: '0.3rem 0.5rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>
                  {col === '1st' ? '1st' : col === '2nd' ? '2nd' : col === '3rd' ? '3rd' : 
                   (PLANETS as readonly string[]).includes(col) ? getPlanetSymbol(col as Planet) : col}
                </th>
              ))}
              {extraHeaders.map(h => (
                <th key={h.key} style={{ border: '1px solid var(--border)', padding: '0.3rem 0.5rem', fontWeight: 'bold', fontSize: '0.75rem', backgroundColor: 'var(--bg-alt, rgba(0,0,0,0.02))' }}>
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(rowPlanet => {
              const rowLong = getLong(rowPlanet);
              const aspectTotals = rowTotalsMap[rowPlanet];

              return (
                <tr key={rowPlanet}>
                  <td style={{ border: '1px solid var(--border)', padding: '0.3rem 0.5rem', textAlign: 'left', whiteSpace: 'nowrap' }}>
                    {getPlanetSymbol(rowPlanet)}{getAvasthaIcon(rowPlanet)}
                  </td>
                  {PLANETS.map(colPlanet => {
                    if (rowPlanet === colPlanet) {
                      return <td key={colPlanet} style={{ border: '1px solid var(--border)', padding: '0.3rem 0.5rem' }}></td>;
                    }
                    const colLong = getLong(colPlanet);
                    const colSign = SIGNS[Math.floor(colLong / 30)];
                    const aspectValue = getShadbalaMultipliedAspect(rowPlanet, rowLong, colLong);
                    const style = getRelationshipStyle(rowPlanet, colPlanet, colSign);
                    
                    return (
                      <td key={colPlanet} style={{ border: '1px solid var(--border)', padding: '0.3rem 0.5rem', ...style }}>
                        {aspectValue > 0 ? aspectValue : 0}
                      </td>
                    );
                  })}
                  {houseMidpoints.map(hm => {
                    const hmSign = SIGNS[Math.floor(hm.longitude / 30)];
                    const aspectValue = getShadbalaMultipliedAspect(rowPlanet, rowLong, hm.longitude);
                    const style = getRelationshipStyle(rowPlanet, hm.lord, hmSign);
                    
                    return (
                      <td key={hm.label} style={{ border: '1px solid var(--border)', padding: '0.3rem 0.5rem', ...style }}>
                        {aspectValue > 0 ? aspectValue : 0}
                      </td>
                    );
                  })}
                  {/* Row Totals on the right */}
                  <td style={{ border: '1px solid var(--border)', padding: '0.3rem 0.5rem', color: '#ffffff', fontWeight: 'bold', fontSize: '0.8rem' }}>{aspectTotals.Exalted > 0 ? aspectTotals.Exalted : '-'}</td>
                  <td style={{ border: '1px solid var(--border)', padding: '0.3rem 0.5rem', color: '#0000ff', fontSize: '0.8rem' }}>{aspectTotals.Swagriha > 0 ? aspectTotals.Swagriha : '-'}</td>
                  <td style={{ border: '1px solid var(--border)', padding: '0.3rem 0.5rem', color: '#d4a300', fontWeight: 'bold', fontSize: '0.8rem' }}>{aspectTotals.Adhimitra > 0 ? aspectTotals.Adhimitra : '-'}</td>
                  <td style={{ border: '1px solid var(--border)', padding: '0.3rem 0.5rem', color: '#d4a300', fontSize: '0.8rem' }}>{aspectTotals.Mitra > 0 ? aspectTotals.Mitra : '-'}</td>
                  <td style={{ border: '1px solid var(--border)', padding: '0.3rem 0.5rem', color: 'var(--foreground)', fontSize: '0.8rem' }}>{aspectTotals.Sama > 0 ? aspectTotals.Sama : '-'}</td>
                  <td style={{ border: '1px solid var(--border)', padding: '0.3rem 0.5rem', color: '#ff0000', fontSize: '0.8rem' }}>{aspectTotals.Satru > 0 ? aspectTotals.Satru : '-'}</td>
                  <td style={{ border: '1px solid var(--border)', padding: '0.3rem 0.5rem', color: '#ff0000', fontStyle: 'italic', fontWeight: 'bold', fontSize: '0.8rem' }}>{aspectTotals.Adhisatru > 0 ? aspectTotals.Adhisatru : '-'}</td>
                  <td style={{ border: '1px solid var(--border)', padding: '0.3rem 0.5rem', fontWeight: 'bold', fontSize: '0.85rem', backgroundColor: 'var(--bg-alt, rgba(0,0,0,0.02))' }}>{aspectTotals.Total > 0 ? aspectTotals.Total : '-'}</td>
                </tr>
              );
            })}
            {/* Column Totals Rows */}
            {extraHeaders.map(h => (
              <tr key={h.key} style={{ backgroundColor: h.key === 'Total' ? 'var(--bg-alt, rgba(0,0,0,0.02))' : 'transparent' }}>
                <td style={{ border: '1px solid var(--border)', padding: '0.3rem 0.5rem', textAlign: 'left', fontWeight: h.key === 'Total' || h.key === 'Adhimitra' || h.key === 'Adhisatru' || h.key === 'Exalted' ? 'bold' : 'normal', fontSize: '0.8rem', color: h.key === 'Exalted' ? '#ffffff' : h.key === 'Swagriha' ? '#0000ff' : h.key === 'Adhimitra' || h.key === 'Mitra' ? '#d4a300' : h.key === 'Satru' || h.key === 'Adhisatru' ? '#ff0000' : 'inherit', fontStyle: h.key === 'Adhisatru' ? 'italic' : 'normal' }}>
                  {h.label}
                </td>
                {cols.map(col => {
                  const val = colTotals[col][h.key as keyof typeof colTotals[string]];
                  return (
                    <td key={col} style={{ border: '1px solid var(--border)', padding: '0.3rem 0.5rem', fontSize: '0.8rem', fontWeight: h.key === 'Total' ? 'bold' : 'normal' }}>
                      {val > 0 ? val : '-'}
                    </td>
                  );
                })}
                <td colSpan={8} style={{ border: '1px solid var(--border)', padding: '0.3rem 0.5rem', textAlign: 'center', color: 'var(--text-muted)' }}></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', fontSize: '0.85rem', color: 'var(--text-muted)', justifyContent: 'center', background: 'var(--card-bg)', padding: '1rem', borderRadius: '8px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><span style={{ color: 'var(--text-muted)' }}>↓ Aspecting planet</span></div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            <div><span style={{ color: 'green' }}>↑</span> Uchcha (exalted)</div>
            <div><span style={{ color: 'red' }}>↓</span> Neecha (debilitated)</div>
            <div><span style={{ color: 'green' }}>△</span> Moolatrikona</div>
            <div><span style={{ color: 'blue' }}>⌂</span> Swagriha (own house)</div>
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          <div><strong>Chart used:</strong> D-1</div>
          <div><strong>Full aspect value:</strong> Aspector's Total Shadbala (in Virupas)</div>
          <div><strong>Houses from:</strong> As</div>
        </div>

        <div>
          <div style={{ marginBottom: '0.5rem', fontWeight: 'bold', fontStyle: 'italic' }}>Aspect Legend (color code):</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.2rem 2rem' }}>
            <div>Exalted <span style={{ float:'right', color:'#ffffff' }}>White</span></div>
            <div>Swagriha (own house) <span style={{ float:'right', color:'#0000ff' }}>Blue</span></div>
            <div>Adhimitra (best friend) <span style={{ float:'right', color:'#d4a300', fontWeight:'bold' }}>Yellow Bold</span></div>
            <div>Mitra (friend) <span style={{ float:'right', color:'#d4a300' }}>Yellow</span></div>
            <div>Sama (neutral) <span style={{ float:'right', color:'var(--foreground)' }}>Black</span></div>
            <div>Satru (enemy) <span style={{ float:'right', color:'#ff0000' }}>Red</span></div>
            <div>Adhisatru (worst enemy) <span style={{ float:'right', color:'#ff0000', fontStyle:'italic', fontWeight:'bold' }}>Bold Italic Red</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
