import React from 'react';
import type { DashaTimePoint } from '@/lib/nds_engine';

interface DashaDetailTableProps {
  dataPoint: DashaTimePoint;
}

export default function DashaDetailTable({ dataPoint }: DashaDetailTableProps) {
  if (!dataPoint) return null;

  return (
    <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border)' }}>
      <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: 'var(--foreground)' }}>
        Net Dasha Flow Breakdown
      </h3>
      
      <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          {new Date(dataPoint.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
        <div style={{ padding: '0.25rem 0.75rem', background: 'var(--bg-secondary)', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600, border: '1px solid var(--border)' }}>
          {dataPoint.mdPlanet} MD / {dataPoint.adPlanet} AD
        </div>
        <div style={{ padding: '0.25rem 0.75rem', background: dataPoint.percentage >= 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: dataPoint.percentage >= 0 ? '#22c55e' : '#ef4444', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700, border: `1px solid ${dataPoint.percentage >= 0 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}` }}>
          Overall Flow: {dataPoint.percentage}%
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Mahadasha Breakdown */}
        <div>
          <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', color: 'var(--foreground)' }}>
            Mahadasha ({dataPoint.mdPlanet}) - {dataPoint.mdPercentage}%
          </h4>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                <th style={{ padding: '0.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Rule/Condition</th>
                <th style={{ padding: '0.5rem', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'right' }}>Score</th>
              </tr>
            </thead>
            <tbody>
              {dataPoint.mdResult.conditions.map((cond, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.5rem', color: 'var(--foreground)' }}>{cond.name}</td>
                  <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 600, color: cond.value >= 0 ? '#22c55e' : '#ef4444' }}>
                    {cond.value > 0 ? '+' : ''}{cond.value}
                  </td>
                </tr>
              ))}
              <tr style={{ borderTop: '2px solid var(--border)', background: 'var(--bg-secondary)' }}>
                <td style={{ padding: '0.5rem', fontWeight: 600, color: 'var(--foreground)' }}>Total MD Score</td>
                <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 700, color: dataPoint.mdResult.netScore >= 0 ? '#22c55e' : '#ef4444' }}>
                  {dataPoint.mdResult.netScore > 0 ? '+' : ''}{dataPoint.mdResult.netScore}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Antardasha Breakdown */}
        <div>
          <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', color: 'var(--foreground)' }}>
            Antardasha ({dataPoint.adPlanet}) - {dataPoint.adPercentage}%
          </h4>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                <th style={{ padding: '0.5rem', color: 'var(--text-muted)', fontWeight: 600 }}>Rule/Condition</th>
                <th style={{ padding: '0.5rem', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'right' }}>Score</th>
              </tr>
            </thead>
            <tbody>
              {dataPoint.adResult.conditions.map((cond, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.5rem', color: 'var(--foreground)' }}>{cond.name}</td>
                  <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 600, color: cond.value >= 0 ? '#22c55e' : '#ef4444' }}>
                    {cond.value > 0 ? '+' : ''}{cond.value}
                  </td>
                </tr>
              ))}
              <tr style={{ borderTop: '2px solid var(--border)', background: 'var(--bg-secondary)' }}>
                <td style={{ padding: '0.5rem', fontWeight: 600, color: 'var(--foreground)' }}>Total AD Score</td>
                <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: 700, color: dataPoint.adResult.netScore >= 0 ? '#22c55e' : '#ef4444' }}>
                  {dataPoint.adResult.netScore > 0 ? '+' : ''}{dataPoint.adResult.netScore}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
