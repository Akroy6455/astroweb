import React, { useState, useMemo, useEffect } from 'react';
import { applyAsymptoticCap } from '@/lib/nds_engine';
import { NDSWeights } from '@/lib/nds_engine';

interface TransitDataPoint {
  date: string;
  mdPlanet: string;
  adPlanet: string;
  baseNds: number;
  timingMultiplier?: number;
  netScore?: number;
  timingBreakdown?: { key: string; name: string; value: number }[];
  avgMultiplier: number;
  mdLordMultiplier: number;
  adLordMultiplier: number;
  avgNavtaraMultiplier?: number;
  mdLordNavtaraMultiplier?: number;
  adLordNavtaraMultiplier?: number;
  advancedTriggers?: any;
}

interface TransitBreakdownTableProps {
  data: TransitDataPoint[];
  weights: NDSWeights;
}

const PLANET_COLORS: Record<string, string> = {
  Sun: '#ef4444', Moon: '#3b82f6', Mars: '#dc2626', Mercury: '#10b981',
  Jupiter: '#f59e0b', Venus: '#ec4899', Saturn: '#6b7280',
  Rahu: '#8b5cf6', Ketu: '#6366f1'
};

export default function TransitBreakdownTable({ data, weights }: TransitBreakdownTableProps) {
  const itemsPerPage = 24; // 24 samples per year (twice a month)
  const [currentPage, setCurrentPage] = useState(1);
  const [enableSoftCap, setEnableSoftCap] = useState(true);

  // Initialize to current year's page
  useEffect(() => {
    if (!data || data.length === 0) return;
    const currentYear = new Date().getFullYear();
    const index = data.findIndex(d => new Date(d.date).getFullYear() === currentYear);
    if (index !== -1) {
      setCurrentPage(Math.floor(index / itemsPerPage) + 1);
    } else {
      setCurrentPage(1);
    }
  }, [data]);

  const totalPages = Math.ceil((data?.length || 0) / itemsPerPage);

  const processedData = useMemo(() => {
    if (!data) return [];
    return data.map(d => {
      let mBonus = 0;

      if (weights.enableTransitMultiplier) mBonus += (d.avgMultiplier - 1.0);
      if (weights.enableMdAdTransitMultiplier) {
        mBonus += (d.mdLordMultiplier - 1.0);
        mBonus += (d.adLordMultiplier - 1.0);
      }
      
      if (weights.enableNavtaraTransit && d.avgNavtaraMultiplier) {
        mBonus += (d.avgNavtaraMultiplier - 1.0);
      }
      if (weights.enableNavtaraMdAd && d.mdLordNavtaraMultiplier && d.adLordNavtaraMultiplier) {
        mBonus += (d.mdLordNavtaraMultiplier - 1.0);
        mBonus += (d.adLordNavtaraMultiplier - 1.0);
      }

      const calcAdvM = (planet?: string) => {
        if (!d.advancedTriggers || !planet || !d.advancedTriggers[planet]) return 1.0;
        const t = d.advancedTriggers[planet];
        let sum = 0; let count = 0;
        if (t.mAsc) { sum += (weights.advancedMaleficAsc ?? 0.6); count++; }
        if (t.mMoon) { sum += (weights.advancedMaleficMoon ?? 0.8); count++; }
        if (t.bAsc) { sum += (weights.advancedBeneficAsc ?? 1.4); count++; }
        if (t.bMoon) { sum += (weights.advancedBeneficMoon ?? 1.2); count++; }
        return count > 0 ? (sum / count) : 1.0;
      };

      if (weights.enableAdvancedTransitMultiplier && d.advancedTriggers) {
        const planets = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
        const advAvgM = planets.reduce((acc, p) => acc + calcAdvM(p), 0) / 7;
        mBonus += (advAvgM - 1.0);
        mBonus += (calcAdvM(d.mdPlanet) - 1.0);
        mBonus += (calcAdvM(d.adPlanet) - 1.0);
      }
      
      const tMultiplier = d.timingMultiplier || 1.0;
      mBonus += (tMultiplier - 1.0);

      let finalScore = 0;
      const M = Math.max(0.1, 1.0 + mBonus);
      const includeBase = weights.enableBaseNdsInTransit ?? true;
      if (includeBase) {
        if (d.baseNds >= 0) {
          finalScore = d.baseNds * M;
        } else {
          finalScore = d.baseNds / Math.max(0.01, M);
        }
      } else {
        finalScore = M * 100;
      }
      
      if (enableSoftCap) {
        finalScore = applyAsymptoticCap(finalScore);
      } else {
        finalScore = Math.max(-100, Math.min(100, finalScore));
      }
      return { ...d, finalScore, M };
    });
  }, [data, weights, enableSoftCap]);

  const currentData = useMemo(() => {
    if (!processedData) return [];
    const start = (currentPage - 1) * itemsPerPage;
    return processedData.slice(start, start + itemsPerPage);
  }, [processedData, currentPage]);

  if (!data || data.length === 0) return null;

  return (
    <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--foreground)' }}>Transit Breakdown Log</h3>
        
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={enableSoftCap} 
              onChange={e => setEnableSoftCap(e.target.checked)} 
              style={{ cursor: 'pointer' }}
            />
            Enable Soft Cap
          </label>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{ padding: '0.25rem 0.5rem', background: 'var(--background-modifier-hover)', border: 'none', borderRadius: '4px', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: 'var(--text-normal)' }}
            >
              Previous
            </button>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Page {currentPage} of {totalPages}
            </span>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{ padding: '0.25rem 0.5rem', background: 'var(--background-modifier-hover)', border: 'none', borderRadius: '4px', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', color: 'var(--text-normal)' }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
      
      <div style={{ overflowX: 'auto' }}>
        <table className="details-table" style={{ width: '100%', fontSize: '0.85rem' }}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Period (MD-AD)</th>
              <th>Base NDF (%)</th>
              <th>Total Multiplier</th>
              <th>Final Score (%)</th>
              <th>Timing Bonuses Applied</th>
            </tr>
          </thead>
          <tbody>
            {currentData.map((d, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(232, 220, 203, 0.3)' }}>
                <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                  {new Date(d.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                </td>
                <td style={{ fontWeight: 600 }}>
                  <span style={{ color: PLANET_COLORS[d.mdPlanet] }}>{d.mdPlanet}</span>
                  <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>-</span>
                  <span style={{ color: PLANET_COLORS[d.adPlanet] }}>{d.adPlanet}</span>
                </td>
                <td style={{ fontWeight: 'bold' }}>
                  {d.baseNds?.toFixed(1) || '0.0'}%
                </td>
                <td style={{ fontWeight: 'bold', color: (d.M || 1.0) >= 1.0 ? '#22c55e' : '#ef4444' }}>
                  {(d.M || 1.0).toFixed(2)}x
                </td>
                <td style={{ fontWeight: 'bold', color: (d.finalScore || 0) >= 0 ? '#22c55e' : '#ef4444' }}>
                  {(d.finalScore || 0).toFixed(1)}%
                </td>
                <td>
                  {d.timingBreakdown && d.timingBreakdown.length > 0 ? (
                    <ul style={{ margin: 0, paddingLeft: '1.2rem', listStyleType: 'disc' }}>
                      {d.timingBreakdown.map((b, idx) => {
                        const bonus = b.value - 1.0;
                        const sign = bonus >= 0 ? '+' : '';
                        return (
                          <li key={idx} style={{ color: 'var(--text-muted)' }}>
                            {b.name} <span style={{ fontWeight: 600, color: bonus >= 0 ? '#22c55e' : '#ef4444' }}>({sign}{bonus.toFixed(1)})</span>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No active triggers</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
