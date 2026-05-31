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
  
  // Zoom and Pan state
  const [zoom, setZoom] = useState(0.5); // 0.5 = 50% of the timeline
  const [pan, setPan] = useState(0.5); // 0.5 = middle of the timeline

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
  const yMin = -range * 1.1;
  const yMax = range * 1.1;

  const totalPoints = processedData.length;
  
  const startFraction = pan * (1 - zoom);
  const endFraction = startFraction + zoom;

  const startIndex = Math.floor(startFraction * totalPoints);
  const endIndex = Math.min(totalPoints - 1, Math.floor(endFraction * totalPoints));
  const visibleData = processedData.slice(startIndex, endIndex + 1);

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
  const numTicks = 5;
  for (let i = 0; i < numTicks; i++) {
    const fraction = i / (numTicks - 1);
    const idx = Math.floor(fraction * (visibleData.length - 1));
    const dataPt = visibleData[idx];
    if (dataPt) {
      const dateStr = new Date(dataPt.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
      xTicks.push({ x: mapX(idx), label: dateStr });
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
              <option value={1.0}>100% (120 Years)</option>
              <option value={0.5}>50% (60 Years)</option>
              <option value={0.25}>25% (30 Years)</option>
              <option value={0.1}>10% (12 Years)</option>
              <option value={0.05}>5% (6 Years)</option>
            </select>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {weights.enableTransitMultiplier ? '7-Planet Avg Enabled' : 'Avg Disabled'} • {weights.enableMdAdTransitMultiplier ? 'MD/AD Lords Enabled' : 'MD/AD Disabled'}
          </div>
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

            <div style={{ borderTop: '1px dashed var(--border)', margin: '0.5rem 0', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span>Total Multiplier:</span>
              <span style={{ fontWeight: 700 }}>
                x{(
                  (weights.enableTransitMultiplier ? hoveredPoint.avgMultiplier : 1.0) * 
                  (weights.enableMdAdTransitMultiplier ? (hoveredPoint.mdLordMultiplier * hoveredPoint.adLordMultiplier) : 1.0) * 
                  (weights.enableNavtaraTransit ? (hoveredPoint.avgNavtaraMultiplier || 1.0) : 1.0) * 
                  (weights.enableNavtaraMdAd ? ((hoveredPoint.mdLordNavtaraMultiplier || 1.0) * (hoveredPoint.adLordNavtaraMultiplier || 1.0)) : 1.0)
                ).toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* X-Axis Dates */}
      <div style={{ position: 'relative', width: '100%', height: '24px', marginTop: '12px' }}>
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

      {/* Scrubber / Panner */}
      <div style={{ marginTop: '1rem', position: 'relative', height: '30px', opacity: zoom === 1.0 ? 0.4 : 1, pointerEvents: zoom === 1.0 ? 'none' : 'auto' }}>
        <div style={{ position: 'absolute', width: '100%', height: '8px', background: 'var(--border)', borderRadius: '4px', top: '11px' }} />
        
        <input 
          type="range" min="0" max="1000" step="1"
          value={pan * 1000}
          onChange={e => {
            const p = parseInt(e.target.value, 10) / 1000;
            setPan(p);
          }}
          style={{
            position: 'absolute', width: '100%', top: '5px',
            WebkitAppearance: 'none', background: 'transparent', cursor: 'grab'
          }}
          className="dasha-scrubber"
        />
        <style dangerouslySetInnerHTML={{__html: `
          .dasha-scrubber::-webkit-slider-thumb { 
            pointer-events: auto; 
            width: ${Math.max(20, zoom * 100)}%;
            height: 12px;
            background: var(--primary);
            border-radius: 6px;
            -webkit-appearance: none;
            cursor: grab;
          }
          .dasha-scrubber:active::-webkit-slider-thumb {
            cursor: grabbing;
          }
          .dasha-scrubber::-moz-range-thumb { 
            pointer-events: auto; 
            width: ${Math.max(20, zoom * 100)}%;
            height: 12px;
            background: var(--primary);
            border-radius: 6px;
            cursor: grab;
            border: none;
          }
        `}} />
      </div>
    </div>
  );
}
