'use client';

import React, { useState } from 'react';
import { NDSWeights, DEFAULT_NDS_WEIGHTS } from '@/lib/nds_engine';

interface Props {
  mainData: any;
  weights: NDSWeights;
}

export default function TaraNirnayNatalMatrixResults({ mainData, weights }: Props) {
  const [selectedPlanet, setSelectedPlanet] = useState('Sun');
  
  if (weights?.enableTaraNirnayNatalMatrix === false) {
    return (
      <div style={{ background: 'var(--card-bg)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2rem' }}>
        Tara Nirnay NDF Natal Chart Matrix is currently disabled in the settings.
      </div>
    );
  }

  const currentMatrix = weights?.taraNirnayNdfNatalMatrix || DEFAULT_NDS_WEIGHTS.taraNirnayNdfNatalMatrix;

  return (
    <div style={{ background: 'var(--card-bg)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '2rem' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--primary)' }}>Tara Nirnay NDF Natal Chart Matrix Results</h2>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        {['Sun', 'Moon', 'Mercury', 'Mars', 'Jupiter', 'Saturn', 'Venus', 'Rahu', 'Ketu'].map(planet => (
          <button 
            key={planet}
            onClick={() => setSelectedPlanet(planet)}
            className={`tab ${selectedPlanet === planet ? 'active' : ''}`}
            style={{ 
              padding: '0.5rem 1rem', 
              background: selectedPlanet === planet ? 'var(--primary)' : 'transparent',
              color: selectedPlanet === planet ? '#fff' : 'var(--text-muted)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
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
              <th style={{ padding: '1rem', border: '1px solid var(--border)', color: '#10b981' }}>Score</th>
            </tr>
          </thead>
          <tbody>
            {['Sun', 'Moon', 'Mercury', 'Mars', 'Jupiter', 'Saturn', 'Venus', 'Ascendant'].map(refPlanet => {
              const rowKey = `from_${refPlanet}`;
              const rowData = (currentMatrix as any)[selectedPlanet]?.[rowKey];
              if (!rowData) return null;

              const targetPos = mainData?.positions?.find((p: any) => p.name === selectedPlanet);
              let refPos = refPlanet === 'Ascendant' ? mainData.lagna : mainData?.positions?.find((p: any) => p.name === refPlanet);
              
              let currentHouse = -1;
              if (targetPos && refPos && targetPos.rasi && refPos.rasi) {
                currentHouse = ((targetPos.rasi.index - refPos.rasi.index + 12) % 12) + 1;
              }

              let appliedScore = 0;
              if (currentHouse > 0 && currentHouse <= 12) {
                appliedScore = rowData[currentHouse - 1];
              }

              return (
                <tr key={refPlanet}>
                  <td style={{ padding: '0.75rem', border: '1px solid var(--border)', fontWeight: 600, color: 'var(--text-muted)' }}>
                    From {refPlanet}
                  </td>
                  {rowData.map((val: number, idx: number) => {
                    const house = idx + 1;
                    const isCurrent = house === currentHouse;
                    return (
                      <td 
                        key={idx} 
                        style={{ 
                          padding: '0.75rem', 
                          border: '1px solid var(--border)',
                          background: isCurrent ? 'rgba(234, 179, 8, 0.15)' : 'transparent',
                          color: isCurrent ? '#eab308' : 'inherit',
                          fontWeight: isCurrent ? 600 : 400
                        }}
                      >
                        {val}
                      </td>
                    );
                  })}
                  <td style={{ padding: '0.75rem', border: '1px solid var(--border)', fontWeight: 600, color: '#10b981' }}>
                    {appliedScore > 0 ? `+${appliedScore}` : appliedScore}
                  </td>
                </tr>
              );
            })}
            <tr style={{ background: 'rgba(255, 255, 255, 0.05)', fontWeight: 600 }}>
              <td colSpan={13} style={{ padding: '1rem', border: '1px solid var(--border)', textAlign: 'right' }}>Total Score:</td>
              <td style={{ padding: '1rem', border: '1px solid var(--border)', color: '#10b981' }}>
                {['Sun', 'Moon', 'Mercury', 'Mars', 'Jupiter', 'Saturn', 'Venus', 'Ascendant'].reduce((total, refPlanet) => {
                  const rowKey = `from_${refPlanet}`;
                  const rowData = (currentMatrix as any)[selectedPlanet]?.[rowKey];
                  if (!rowData) return total;
                  const targetPos = mainData?.positions?.find((p: any) => p.name === selectedPlanet);
                  let refPos = refPlanet === 'Ascendant' ? mainData.lagna : mainData?.positions?.find((p: any) => p.name === refPlanet);
                  if (targetPos && refPos && targetPos.rasi && refPos.rasi) {
                    const currentHouse = ((targetPos.rasi.index - refPos.rasi.index + 12) % 12) + 1;
                    return total + rowData[currentHouse - 1];
                  }
                  return total;
                }, 0)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
