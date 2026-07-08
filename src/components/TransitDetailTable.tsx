import React from 'react';
import { NDSWeights } from '@/lib/nds_engine';

interface TransitDetailTableProps {
  dataPoint: any;
  weights: NDSWeights;
}

export default function TransitDetailTable({ dataPoint, weights }: TransitDetailTableProps) {
  if (!dataPoint) return null;

  return (
    <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border)' }}>
      <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: 'var(--foreground)' }}>
        Detailed Impact Breakdown (Excl. NDF Base)
      </h3>
      
      <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          {new Date(dataPoint.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
        <div style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 600, background: 'var(--primary-transparent)', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
          Total Multiplier: x{(dataPoint.M || 1.0).toFixed(2)}
        </div>
        {dataPoint.isAggregatedBreakout && (
          <div style={{ fontSize: '0.9rem', color: '#22c55e', fontWeight: 600, background: 'rgba(34,197,94,0.1)', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
            Breakout (3m+) Aggregate: {dataPoint.aggregatedScore?.toFixed(1)}
          </div>
        )}
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
            <th style={{ padding: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Factor</th>
            <th style={{ padding: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Rule/Condition</th>
            <th style={{ padding: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'right' }}>Multiplier Impact</th>
          </tr>
        </thead>
        <tbody>
          {/* General Transit Multipliers */}
          {weights.enableTransitMultiplier && (
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '0.75rem', color: 'var(--foreground)', fontWeight: 500 }}>Transit BAV (Avg)</td>
              <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>Average BAV transit score across all planets.</td>
              <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600, color: dataPoint.avgMultiplier >= 1.0 ? '#22c55e' : '#ef4444' }}>
                x{dataPoint.avgMultiplier?.toFixed(2)}
              </td>
            </tr>
          )}

          {weights.enableMdAdTransitMultiplier && (
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '0.75rem', color: 'var(--foreground)', fontWeight: 500 }}>Transit BAV (MD/AD)</td>
              <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>BAV transit score for current MD and AD lords.</td>
              <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600, color: dataPoint.mdAdBavM >= 1.0 ? '#22c55e' : '#ef4444' }}>
                x{dataPoint.mdAdBavM?.toFixed(2)}
              </td>
            </tr>
          )}

          {weights.enableNavtaraTransit && (
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '0.75rem', color: 'var(--foreground)', fontWeight: 500 }}>Navtara (Avg)</td>
              <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>Average Navtara (Tara) transit score across all planets.</td>
              <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600, color: dataPoint.avgNavtaraMultiplier >= 1.0 ? '#22c55e' : '#ef4444' }}>
                x{(dataPoint.avgNavtaraMultiplier || 1.0).toFixed(2)}
              </td>
            </tr>
          )}

          {weights.enableNavtaraMdAd && (
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '0.75rem', color: 'var(--foreground)', fontWeight: 500 }}>Navtara (MD/AD)</td>
              <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>Navtara transit score for current MD and AD lords.</td>
              <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600, color: dataPoint.mdAdNavtaraM >= 1.0 ? '#22c55e' : '#ef4444' }}>
                x{dataPoint.mdAdNavtaraM?.toFixed(2)}
              </td>
            </tr>
          )}

          {weights.enableAdvancedTransitMultiplier && (
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '0.75rem', color: 'var(--foreground)', fontWeight: 500 }}>Lordship (Avg)</td>
              <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>Average transit score based on Lordship rules across all planets.</td>
              <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600, color: dataPoint.advAvgM >= 1.0 ? '#22c55e' : '#ef4444' }}>
                x{(dataPoint.advAvgM || 1.0).toFixed(2)}
              </td>
            </tr>
          )}

          {weights.enableAdvancedTransitMultiplier && (
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '0.75rem', color: 'var(--foreground)', fontWeight: 500 }}>Lordship (MD/AD)</td>
              <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>Transit score based on Lordship rules for current MD and AD lords.</td>
              <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600, color: dataPoint.advMdAdM >= 1.0 ? '#22c55e' : '#ef4444' }}>
                x{(dataPoint.advMdAdM || 1.0).toFixed(2)}
              </td>
            </tr>
          )}

          {/* Timing Factors (from the Timing Engine) */}
          {dataPoint.timingBreakdown && dataPoint.timingBreakdown.map((tb: any, idx: number) => (
            <tr key={`tb-${idx}`} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '0.75rem', color: 'var(--primary)', fontWeight: 500 }}>Specific Event Trigger</td>
              <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{tb.name}</td>
              <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600, color: tb.value >= 1.0 ? '#22c55e' : '#ef4444' }}>
                x{tb.value.toFixed(2)}
              </td>
            </tr>
          ))}
          
          {(!dataPoint.timingBreakdown || dataPoint.timingBreakdown.length === 0) && (
             <tr style={{ borderBottom: '1px solid var(--border)' }}>
               <td colSpan={3} style={{ padding: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center' }}>
                 No specific timing event triggers active for this date.
               </td>
             </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
