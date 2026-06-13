'use client';

import React, { useMemo, useState, useRef, useEffect } from 'react';
import type { NDSWeights } from '@/lib/nds_engine';

interface TransitDataPoint {
  date: string;
  baseNds: number;
  avgMultiplier: number;
  mdLordMultiplier: number;
  adLordMultiplier: number;
  avgNavtaraMultiplier?: number;
  mdLordNavtaraMultiplier?: number;
  adLordNavtaraMultiplier?: number;
  mdPlanet?: string;
  adPlanet?: string;
  advancedTriggers?: Record<string, { mAsc: boolean, mMoon: boolean, bAsc: boolean, bMoon: boolean }>;
}

interface TransitChartProps {
  data: TransitDataPoint[];
  weights: NDSWeights;
}

export default function TransitChart({ data, weights }: TransitChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<(TransitDataPoint & { finalScore: number, x: number, y: number }) | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(3);

  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    
    return data.map(d => {
      const avgM = weights.enableTransitMultiplier ? d.avgMultiplier : 1.0;
      const mdAdM = weights.enableMdAdTransitMultiplier ? (d.mdLordMultiplier * d.adLordMultiplier) : 1.0;
      
      const navtaraAvgM = weights.enableNavtaraTransit && d.avgNavtaraMultiplier ? d.avgNavtaraMultiplier : 1.0;
      const navtaraMdAdM = weights.enableNavtaraMdAd && d.mdLordNavtaraMultiplier && d.adLordNavtaraMultiplier ? (d.mdLordNavtaraMultiplier * d.adLordNavtaraMultiplier) : 1.0;

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

      let advAvgM = 1.0;
      let advMdAdM = 1.0;

      if (weights.enableAdvancedTransitMultiplier && d.advancedTriggers) {
        const planets = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
        advAvgM = planets.reduce((acc, p) => acc + calcAdvM(p), 0) / 7;
        advMdAdM = calcAdvM(d.mdPlanet) * calcAdvM(d.adPlanet);
      }

      const M = avgM * mdAdM * navtaraAvgM * navtaraMdAdM * advAvgM * advMdAdM;
      let finalScore = 0;
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
      return { ...d, finalScore, advAvgM, advMdAdM, M };
    });
  
  }, [data, weights]);

  if (!processedData || processedData.length === 0) return null;

  const height = 180;
  
  // Calculate bounds
  const minScore = Math.min(...processedData.map(d => d.finalScore), -100);
  const maxScore = Math.max(...processedData.map(d => d.finalScore), 100);
  const range = Math.max(Math.abs(minScore), Math.abs(maxScore));
  const yMin = -range * 1.1;
  const yMax = range * 1.1;

  const totalPoints = processedData.length;
  const visibleData = processedData;

  // Calculate dynamic width based on data length (e.g. ~3px per point makes a 120-year span ~4320px wide)
  const chartWidth = Math.max(800, visibleData.length * zoom);
  const containerWidth = chartWidth;

  if (visibleData.length === 0) return null;

  const mapY = (val: number) => {
    const normalized = (val - yMin) / (yMax - yMin);
    return height - (normalized * height);
  };

  const mapX = (idx: number) => {
    return (idx / Math.max(1, visibleData.length - 1)) * containerWidth;
  };

  // Generate SVG path for the "mountain"
  const zeroY = mapY(0);
  let pathD = `M ${mapX(0)} ${zeroY}`;

  visibleData.forEach((d, i) => {
    pathD += ` L ${mapX(i)} ${mapY(d.finalScore)}`;
  });
  
  pathD += ` L ${mapX(visibleData.length - 1)} ${zeroY} Z`;

  // Generate line only path
  let lineD = `M ${mapX(0)} ${mapY(visibleData[0].finalScore)}`;
  visibleData.forEach((d, i) => {
    if (i > 0) lineD += ` L ${mapX(i)} ${mapY(d.finalScore)}`;
  });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    
    const fraction = x / containerWidth;
    const idx = Math.round(fraction * (visibleData.length - 1));
    if (idx >= 0 && idx < visibleData.length) {
      const pt = visibleData[idx];
      setHoveredPoint({ ...pt, x: mapX(idx), y: mapY(pt.finalScore) });
    }
  };

  // X-Axis Ticks
  const xTicks = [];
  if (visibleData.length > 0) {
    const minTime = new Date(visibleData[0].date).getTime();
    const maxTime = new Date(visibleData[visibleData.length - 1].date).getTime();
    const totalSpan = maxTime - minTime || 1;
    
    const visYears = totalSpan / (365.25 * 24 * 60 * 60 * 1000);
    const pixelsPerYear = chartWidth / visYears;
    // Tick every X years depending on how wide the chart is
    const yearStep = pixelsPerYear < 5 ? 10 : pixelsPerYear < 20 ? 5 : pixelsPerYear < 50 ? 2 : 1;
    
    const startYear = new Date(minTime).getFullYear();
    const endYear = new Date(maxTime).getFullYear();

    for (let y = Math.ceil(startYear / yearStep) * yearStep; y <= endYear; y += yearStep) {
      const t = new Date(y, 0, 1).getTime();
      if (t >= minTime && t <= maxTime) {
        const fraction = (t - minTime) / totalSpan;
        const xPos = fraction * containerWidth;
        xTicks.push({ x: xPos, label: `${y}` });
      }
    }
  }

  return (
    <div style={{ marginBottom: '1.5rem', background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', padding: '1.5rem', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--foreground)' }}>Transit weighted NDF flow</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Zoom:</span>
            <select 
              value={zoom} 
              onChange={e => setZoom(parseFloat(e.target.value))}
              style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'var(--bg)', color: 'var(--foreground)', border: '1px solid var(--border)', fontSize: '0.8rem' }}
            >
              <option value={1}>100% Compressed</option>
              <option value={2}>200% Zoom</option>
              <option value={3}>300% Default</option>
              <option value={5}>500% Spread</option>
              <option value={10}>1000% Wide Spread</option>
            </select>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {weights.enableTransitMultiplier ? '7-Planet Avg Enabled' : 'Avg Disabled'} â€¢ {weights.enableMdAdTransitMultiplier ? 'MD/AD Lords Enabled' : 'MD/AD Disabled'}
          </div>
        </div>
      </div>

      <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '1rem' }}>
        <div 
          ref={containerRef}
          style={{ width: `${chartWidth}px`, height: `${height}px`, position: 'relative', cursor: 'crosshair', overflow: 'hidden' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredPoint(null)}
        >
          <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
            <defs>
              <linearGradient id="transitGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(34, 197, 94, 0.4)" />
                <stop offset={`${(yMax / (yMax - yMin)) * 100}%`} stopColor="rgba(34, 197, 94, 0)" />
                <stop offset={`${(yMax / (yMax - yMin)) * 100}%`} stopColor="rgba(239, 68, 68, 0)" />
                <stop offset="100%" stopColor="rgba(239, 68, 68, 0.4)" />
              </linearGradient>
            </defs>

            {/* Zero Line */}
            <line x1="0" y1={zeroY} x2={containerWidth} y2={zeroY} stroke="var(--border)" strokeWidth="1" strokeDasharray="4 4" />

            {/* Area Fill */}
            <path d={pathD} fill="url(#transitGradient)" />

            {/* Line Stroke */}
            <path d={lineD} fill="none" stroke="var(--primary)" strokeWidth="2" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} />

            {/* Hover Indicator */}
            {hoveredPoint && (
              <circle cx={hoveredPoint.x} cy={hoveredPoint.y} r="5" fill="var(--primary)" stroke="var(--background)" strokeWidth="2" />
            )}
          </svg>

          {hoveredPoint && (
            <div style={{
              position: 'absolute',
              left: Math.min(hoveredPoint.x + 15, containerWidth - 200),
              top: Math.max(10, Math.min(hoveredPoint.y - 100, height - 120)),
              background: 'var(--background)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '1rem',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
              zIndex: 10,
              width: '220px',
              pointerEvents: 'none'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                <div style={{ fontSize: '0.95rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {new Date(hoveredPoint.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: hoveredPoint.finalScore >= 0 ? '#22c55e' : '#ef4444' }}>
                  {hoveredPoint.finalScore.toFixed(1)}
                </div>
              </div>

              {(weights.enableBaseNdsInTransit ?? true) && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
                  <span>Base Score:</span>
                  <span style={{ fontWeight: 600 }}>{hoveredPoint.baseNds.toFixed(1)}</span>
                </div>
              )}

              {weights.enableTransitMultiplier && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
                  <span>Avg Transit:</span>
                  <span style={{ fontWeight: 600 }}>x{hoveredPoint.avgMultiplier.toFixed(2)}</span>
                </div>
              )}

              {weights.enableMdAdTransitMultiplier && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
                  <span>BAV MD/AD:</span>
                  <span style={{ fontWeight: 600 }}>x{(hoveredPoint.mdLordMultiplier * hoveredPoint.adLordMultiplier).toFixed(2)}</span>
                </div>
              )}

              {weights.enableNavtaraTransit && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
                  <span>Navtara Avg:</span>
                  <span style={{ fontWeight: 600 }}>x{(hoveredPoint.avgNavtaraMultiplier || 1.0).toFixed(2)}</span>
                </div>
              )}

              {weights.enableNavtaraMdAd && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
                  <span>Navtara MD/AD:</span>
                  <span style={{ fontWeight: 600 }}>x{((hoveredPoint.mdLordNavtaraMultiplier || 1.0) * (hoveredPoint.adLordNavtaraMultiplier || 1.0)).toFixed(2)}</span>
                </div>
              )}

              
              {weights.enableAdvancedTransitMultiplier && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
                  <span>Lordship Avg:</span>
                  <span style={{ fontWeight: 600 }}>x{(hoveredPoint as any).advAvgM.toFixed(2)}</span>
                </div>
              )}

              {weights.enableAdvancedTransitMultiplier && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
                  <span>Lordship MD/AD:</span>
                  <span style={{ fontWeight: 600 }}>x{(hoveredPoint as any).advMdAdM.toFixed(2)}</span>
                </div>
              )}
              
              <div style={{ borderTop: '1px dashed var(--border)', margin: '0.5rem 0', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span>Total Multiplier:</span>
                <span style={{ fontWeight: 700 }}>
                  x{((hoveredPoint as any).M).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* X-Axis Dates (Moved INSIDE the overflow wrapper) */}
        <div style={{ position: 'relative', width: `${chartWidth}px`, height: '24px', marginTop: '12px' }}>
          {xTicks.map((tick, i) => (
            <div key={i} style={{ 
              position: 'absolute', 
              left: `${tick.x}px`, 
              transform: 'translateX(-50%)', 
              fontSize: '0.75rem', 
              color: 'var(--text-muted)',
              fontWeight: 500,
              whiteSpace: 'nowrap'
            }}>
              {tick.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

