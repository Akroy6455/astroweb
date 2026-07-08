import React, { useState, useMemo, useRef } from 'react';
import { NDSWeights } from '@/lib/nds_engine';

interface TransitDataPoint {
  date: string;
  mdPlanet: string;
  adPlanet: string;
  baseNds: number;
  timingMultiplier?: number;
  netScore?: number;
  avgMultiplier: number;
  mdLordMultiplier: number;
  adLordMultiplier: number;
  avgNavtaraMultiplier?: number;
  mdLordNavtaraMultiplier?: number;
  adLordNavtaraMultiplier?: number;
  advancedTriggers?: any;
}

interface TransitMultiplierChartProps {
  data: TransitDataPoint[];
  weights: NDSWeights;
}

export default function TransitMultiplierChart({ data, weights }: TransitMultiplierChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<(TransitDataPoint & { M: number, x: number, y: number }) | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(5);

  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];

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

      const M = Math.max(0.1, 1.0 + mBonus);
      return { ...d, M };
    });
  
  }, [data, weights]);

  if (!processedData || processedData.length === 0) return null;

  const height = 180;
  
  // Fixed Bounds for Multiplier
  const yMin = 0;
  const yMax = 10;

  const totalPoints = processedData.length;
  const visibleData = processedData;

  const chartWidth = Math.max(800, visibleData.length * zoom);
  const containerWidth = chartWidth;

  if (visibleData.length === 0) return null;

  const mapY = (val: number) => {
    const clamped = Math.max(yMin, Math.min(yMax, val));
    const normalized = (clamped - yMin) / (yMax - yMin);
    return height - (normalized * height);
  };

  const mapX = (idx: number) => {
    return (idx / Math.max(1, visibleData.length - 1)) * containerWidth;
  };

  // Base line is 1.0 (neutral multiplier)
  const zeroY = mapY(1.0);
  let pathD = `M ${mapX(0)} ${zeroY}`;

  visibleData.forEach((d, i) => {
    pathD += ` L ${mapX(i)} ${mapY(d.M)}`;
  });
  
  pathD += ` L ${mapX(visibleData.length - 1)} ${zeroY} Z`;

  let lineD = `M ${mapX(0)} ${mapY(visibleData[0].M)}`;
  visibleData.forEach((d, i) => {
    if (i > 0) lineD += ` L ${mapX(i)} ${mapY(d.M)}`;
  });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    
    const fraction = x / containerWidth;
    const idx = Math.round(fraction * (visibleData.length - 1));
    if (idx >= 0 && idx < visibleData.length) {
      const pt = visibleData[idx];
      setHoveredPoint({ ...pt, x: mapX(idx), y: mapY(pt.M) });
    }
  };

  const xTicks = [];
  if (visibleData.length > 0) {
    const minTime = new Date(visibleData[0].date).getTime();
    const maxTime = new Date(visibleData[visibleData.length - 1].date).getTime();
    const totalSpan = maxTime - minTime || 1;
    
    const visYears = totalSpan / (365.25 * 24 * 60 * 60 * 1000);
    const pixelsPerYear = chartWidth / visYears;
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
        <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--foreground)' }}>Total Timing Multiplier (Max 10x)</h3>
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
              <option value={3}>300% Zoom</option>
              <option value={5}>500% Default</option>
              <option value={10}>1000% Wide Spread</option>
            </select>
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
              <linearGradient id="multiGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(34, 197, 94, 0.4)" />
                <stop offset={`${(yMax - 1) / yMax * 100}%`} stopColor="rgba(34, 197, 94, 0)" />
                <stop offset={`${(yMax - 1) / yMax * 100}%`} stopColor="rgba(239, 68, 68, 0)" />
                <stop offset="100%" stopColor="rgba(239, 68, 68, 0.4)" />
              </linearGradient>
            </defs>

            {/* Zero Line (1.0) */}
            <line x1="0" y1={zeroY} x2={containerWidth} y2={zeroY} stroke="var(--border)" strokeWidth="1" strokeDasharray="4 4" />

            <path d={pathD} fill="url(#multiGradient)" />
            <path d={lineD} fill="none" stroke="var(--primary)" strokeWidth="2" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} />

            {hoveredPoint && (
              <circle cx={hoveredPoint.x} cy={hoveredPoint.y} r="5" fill="var(--primary)" stroke="var(--background)" strokeWidth="2" />
            )}
          </svg>

          {hoveredPoint && (
            <div style={{
              position: 'absolute',
              left: Math.min(hoveredPoint.x + 15, containerWidth - 200),
              top: Math.max(10, Math.min(hoveredPoint.y - 60, height - 80)),
              background: 'var(--background)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '1rem',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
              zIndex: 10,
              width: '180px',
              pointerEvents: 'none'
            }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                {new Date(hoveredPoint.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: hoveredPoint.M >= 1.0 ? '#22c55e' : '#ef4444' }}>
                {hoveredPoint.M.toFixed(2)}x
              </div>
              <div style={{ fontSize: '0.8rem', marginTop: '0.5rem', color: 'var(--foreground)' }}>
                {hoveredPoint.mdPlanet} - {hoveredPoint.adPlanet}
              </div>
            </div>
          )}

          {/* X Axis ticks */}
          {xTicks.map((t, i) => (
            <div key={i} style={{
              position: 'absolute',
              left: t.x,
              bottom: '-25px',
              transform: 'translateX(-50%)',
              fontSize: '0.75rem',
              color: 'var(--text-muted)'
            }}>
              {t.label}
              <div style={{ position: 'absolute', top: '-5px', left: '50%', width: '1px', height: '4px', background: 'var(--border)' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
