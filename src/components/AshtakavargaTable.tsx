import React from 'react';

const SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const PLANETS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Lagna'];

type AshtakavargaProps = {
  data: {
    bav: Record<string, number[]>;
    sav337: number[];
    sav386: number[];
  }
};

export default function AshtakavargaTable({ data }: AshtakavargaProps) {
  if (!data) return null;

  return (
    <div className="av-table-container" style={{ marginTop: '1rem' }}>
      <h2 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Ashtakavarga Bindus (Points)</h2>
      <div style={{ overflowX: 'auto', paddingBottom: '0.5rem' }}>
        <table className="details-table" style={{ textAlign: 'center', minWidth: '600px' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>Entity</th>
            {SIGNS.map(s => <th key={s} title={s}>{s.substring(0, 3)}</th>)}
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {PLANETS.map(planet => {
            const rowData = data.bav[planet];
            if (!rowData) return null;
            const total = rowData.reduce((sum, val) => sum + val, 0);
            return (
              <tr key={planet}>
                <td style={{ textAlign: 'left', fontWeight: planet === 'Lagna' ? 'bold' : 'normal' }}>{planet}</td>
                {rowData.map((val, idx) => (
                  <td key={idx} style={{ color: val >= 5 ? 'var(--primary)' : (val <= 3 ? '#ef4444' : 'var(--foreground)') }}>
                    {val}
                  </td>
                ))}
                <td style={{ fontWeight: 'bold' }}>{total}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
            <td style={{ textAlign: 'left', fontWeight: 'bold' }}>SAV (337)</td>
            {data.sav337.map((val, idx) => (
              <td key={idx} style={{ fontWeight: 'bold', color: val >= 28 ? 'var(--primary)' : (val < 25 ? '#ef4444' : 'inherit') }}>
                {val}
              </td>
            ))}
            <td style={{ fontWeight: 'bold' }}>337</td>
          </tr>
          <tr style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}>
            <td style={{ textAlign: 'left', fontWeight: 'bold' }}>SAV (+Lagna)</td>
            {data.sav386.map((val, idx) => (
              <td key={idx} style={{ fontWeight: 'bold', color: val >= 32 ? 'var(--primary)' : (val < 28 ? '#ef4444' : 'inherit') }}>
                {val}
              </td>
            ))}
            <td style={{ fontWeight: 'bold' }}>386</td>
          </tr>
        </tfoot>
        </table>
      </div>
      <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        <p><strong>Note:</strong> SAV (337) is the standard Sarvashtakavarga used to determine house strength. Houses with 28+ points are strong. <span style={{ color: '#ef4444' }}>Red</span> indicates weakness, <span style={{ color: 'var(--primary)' }}>Purple</span> indicates strength.</p>
      </div>
    </div>
  );
}
