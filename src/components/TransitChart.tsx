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
}

interface TransitChartProps {
  data: TransitDataPoint[];
  weights: NDSWeights;
}

export default function TransitChart({ data, weights }: TransitChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<(TransitDataPoint & { finalScore: number, x: number, y: number }) | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(800);
  const [viewRange, setViewRange] = useState({ start: 0, end: 0.5 }); // Match 50% default zoom

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      setContainerWidth(entries[0].contentRect.width);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.map(d => {
      const avgM = weights.enableTransitMultiplier ? d.avgMultiplier : 1.0;
      const mdAdM = weights.enableMdAdTransitMultiplier ? (d.mdLordMultiplier * d.adLordMultiplier) : 1.0;
      
      const navtaraAvgM = weights.enableNavtaraTransit && d.avgNavtaraMultiplier ? d.avgNavtaraMultiplier : 1.0;
      const navtaraMdAdM = weights.enableNavtaraMdAd && d.mdLordNavtaraMultiplier && d.adLordNavtaraMultiplier ? (d.mdLordNavtaraMultiplier * d.adLordNavtaraMultiplier) : 1.0;

      const includeBase = weights.enableBaseNdsInTransit ?? true;
      const finalScore = includeBase ? (d.baseNds * avgM * mdAdM * navtaraAvgM * navtaraMdAdM) : (avgM * mdAdM * navtaraAvgM * navtaraMdAdM * 100);
      return { ...d, finalScore };
    });
  }, [data, weights]);

  if (!processedData || processedData.length === 0) return null;

  const height = 180;
  
  // Calculate bounds
  const minScore = Math.min(...processedData.map(d => d.finalScore), -100);
  const maxScore = Math.max(...processedData.map(d => d.finalScore), 100);
  const range = Math.max(Math.abs(minScore), Math.abs(maxScore));
  // Provide padding top and bottom
  const yMin = -range * 1.1;
  const yMax = range * 1.1;

  const totalPoints = processedData.length;
  const startIndex = Math.floor(viewRange.start * totalPoints);
  const endIndex = Math.floor(viewRange.end * totalPoints);
  const visibleData = processedData.slice(startIndex, endIndex);

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
    
    // Find closest point
    const fraction = x / containerWidth;
    const idx = Math.round(fraction * (visibleData.length - 1));
    if (idx >= 0 && idx < visibleData.length) {
      const pt = visibleData[idx];
      setHoveredPoint({ ...pt, x: mapX(idx), y: mapY(pt.finalScore) });
    }
  };

  return (
    <div style={{ marginBottom: '1.5rem', background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', padding: '1.5rem', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--foreground)' }}>Transit weighted NDF flow</h3>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {weights.enableTransitMultiplier ? '7-Planet Avg Enabled' : 'Avg Disabled'} • {weights.enableMdAdTransitMultiplier ? 'MD/AD Lords Enabled' : 'MD/AD Disabled'}
        </div>
      </div>

      <div 
        ref={containerRef}
        style={{ width: '100%', height: `${height}px`, position: 'relative', cursor: 'crosshair', overflow: 'hidden' }}
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
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              {new Date(hoveredPoint.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.9rem', opacity: (weights.enableBaseNdsInTransit ?? true) ? 1 : 0.4 }}>
              <span>Base Score:</span>
              <span style={{ fontWeight: 600 }}>{hoveredPoint.baseNds.toFixed(1)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.9rem', opacity: weights.enableTransitMultiplier ? 1 : 0.4 }}>
              <span>Avg Transit:</span>
              <span style={{ fontWeight: 600 }}>x{hoveredPoint.avgMultiplier.toFixed(2)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.9rem', opacity: weights.enableMdAdTransitMultiplier ? 1 : 0.4 }}>
              <span>BAV MD/AD:</span>
              <span style={{ fontWeight: 600 }}>x{(hoveredPoint.mdLordMultiplier * hoveredPoint.adLordMultiplier).toFixed(2)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.9rem', opacity: weights.enableNavtaraTransit ? 1 : 0.4 }}>
              <span>Navtara Avg:</span>
              <span style={{ fontWeight: 600 }}>x{(hoveredPoint.avgNavtaraMultiplier || 1.0).toFixed(2)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem', opacity: weights.enableNavtaraMdAd ? 1 : 0.4 }}>
              <span>Navtara MD/AD:</span>
              <span style={{ fontWeight: 600 }}>x{((hoveredPoint.mdLordNavtaraMultiplier || 1.0) * (hoveredPoint.adLordNavtaraMultiplier || 1.0)).toFixed(2)}</span>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem' }}>
              <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Final Score:</span>
              <span style={{ fontWeight: 800, color: hoveredPoint.finalScore >= 0 ? '#22c55e' : '#ef4444' }}>
                {hoveredPoint.finalScore.toFixed(1)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Scrubber / Panner (Matching DashaChart zoom logic roughly, or simply an independent scrubber) */}
      <div style={{ marginTop: '1.5rem', position: 'relative', height: '30px' }}>
        <div style={{ position: 'absolute', width: '100%', height: '8px', background: 'var(--border)', borderRadius: '4px', top: '11px' }} />
        
        <input 
          type="range" min="0" max="90" step="1"
          value={viewRange.start * 100}
          onChange={e => {
            const start = parseInt(e.target.value) / 100;
            const end = Math.min(start + 0.5, 1);
            setViewRange({ start, end });
          }}
          style={{
            position: 'absolute', width: '100%', top: '5px',
            WebkitAppearance: 'none', background: 'transparent', pointerEvents: 'none'
          }}
          className="dasha-scrubber"
        />
        <style dangerouslySetInnerHTML={{__html: `
          .dasha-scrubber::-webkit-slider-thumb { pointer-events: auto; }
          .dasha-scrubber::-moz-range-thumb { pointer-events: auto; }
        `}} />
      </div>
    </div>
  );
}
