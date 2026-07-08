'use client';

import React, { useMemo, useState, useRef, useEffect } from 'react';
import { toPng } from 'html-to-image';
import TransitDetailTable from './TransitDetailTable';
import { Download } from 'lucide-react';
import { applyAsymptoticCap } from '@/lib/nds_engine';
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
  timingMultiplier?: number;
  timingBreakdown?: { key: string, name: string, value: number }[];
}

interface TransitChartProps {
  data: TransitDataPoint[];
  weights: NDSWeights;
  chartTitle?: string;
}

export default function TransitChart({ data, weights, chartTitle = 'Timing of Events' }: TransitChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<(TransitDataPoint & { M: number, finalScore: number, x: number, y: number }) | null>(null);
  const [clickedPoint, setClickedPoint] = useState<any | null>(null);
  const [enableSoftCap, setEnableSoftCap] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const downloadRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(5);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!downloadRef.current) return;
    setIsDownloading(true);
    try {
      // Temporarily clear hover to avoid capturing tooltip
      setHoveredPoint(null);
      // Wait for React to re-render without tooltip
      await new Promise(res => setTimeout(res, 50));
      
      const dataUrl = await toPng(downloadRef.current, {
        backgroundColor: document.documentElement.style.getPropertyValue('--surface') || '#ffffff',
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      link.download = `timing-chart-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to download chart', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const mapped = data.map(d => {
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

      let advAvgM = 1.0;
      let advMdAdM = 1.0;

      if (weights.enableAdvancedTransitMultiplier && d.advancedTriggers) {
        const planets = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
        advAvgM = planets.reduce((acc, p) => acc + calcAdvM(p), 0) / 7;
        advMdAdM = calcAdvM(d.mdPlanet) * calcAdvM(d.adPlanet);
        
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
      return { ...d, finalScore, advAvgM, advMdAdM, M };
    });
    
    let currentHigh = -Infinity;
    let highDate = 0;
    let accumulator = 0;

    for (let i = 0; i < mapped.length; i++) {
      const pt = mapped[i];
      const ptTime = new Date(pt.date).getTime();

      if (pt.finalScore > currentHigh) {
        if (currentHigh !== -Infinity) {
          const daysSinceHigh = (ptTime - highDate) / (1000 * 60 * 60 * 24);
          if (daysSinceHigh > 90) {
            accumulator += pt.finalScore;
            (pt as any).isAggregatedBreakout = true;
            (pt as any).aggregatedScore = accumulator;
          }
        }
        currentHigh = pt.finalScore;
        highDate = ptTime;
        accumulator = pt.finalScore;
      } else {
        accumulator += pt.finalScore;
      }
    }

    return mapped;
  }, [data, weights, enableSoftCap]);

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--foreground)' }}>{chartTitle}</h3>
          <button 
            onClick={handleDownload}
            disabled={isDownloading}
            title="Download Chart as PNG"
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.5rem', 
              padding: '0.3rem 0.75rem', borderRadius: '6px', 
              background: 'var(--primary)', color: 'var(--primary-foreground)', 
              border: 'none', cursor: isDownloading ? 'not-allowed' : 'pointer',
              fontSize: '0.85rem', fontWeight: 600, opacity: isDownloading ? 0.7 : 1
            }}
          >
            <Download size={16} />
            {isDownloading ? 'Downloading...' : 'Download'}
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={enableSoftCap} 
              onChange={e => setEnableSoftCap(e.target.checked)} 
              style={{ cursor: 'pointer' }}
            />
            Enable Soft Cap
          </label>
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
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {weights.enableTransitMultiplier ? '7-Planet Avg Enabled' : 'Avg Disabled'} • {weights.enableMdAdTransitMultiplier ? 'MD/AD Lords Enabled' : 'MD/AD Disabled'}
          </div>
        </div>
      </div>

      <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '1rem' }}>
        <div ref={downloadRef} style={{ width: `${chartWidth}px`, position: 'relative', background: 'var(--surface)', padding: '1rem 0' }}>
          <div 
            ref={containerRef}
            style={{ width: `${chartWidth}px`, height: `${height}px`, position: 'relative', cursor: 'crosshair', overflow: 'hidden' }}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredPoint(null)}
            onClick={(e) => {
              if (!containerRef.current) return;
              const rect = containerRef.current.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const fraction = x / containerWidth;
              const idx = Math.round(fraction * (visibleData.length - 1));
              if (idx >= 0 && idx < visibleData.length) {
                setClickedPoint(visibleData[idx]);
              }
            }}
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

            {/* Aggregated Breakout Dots */}
            {visibleData.map((d: any, i) => {
              if (d.isAggregatedBreakout) {
                return (
                  <circle 
                    key={`brk-${i}`}
                    cx={mapX(i)} 
                    cy={mapY(d.finalScore)} 
                    r="5" 
                    fill="#22c55e" 
                    stroke="var(--background)" 
                    strokeWidth="2" 
                    style={{ filter: 'drop-shadow(0 0 6px rgba(34, 197, 94, 0.8))' }}
                  />
                );
              }
              return null;
            })}

            {/* Hover Indicator */}
            {hoveredPoint && (
              <circle cx={hoveredPoint.x} cy={hoveredPoint.y} r="5" fill="var(--primary)" stroke="var(--background)" strokeWidth="2" />
            )}
            {/* Clicked Indicator */}
            {clickedPoint && (
              <circle 
                cx={clickedPoint.x ?? (visibleData.indexOf(clickedPoint) / Math.max(1, visibleData.length - 1)) * containerWidth} 
                cy={mapY(clickedPoint.finalScore)} 
                r="6" 
                fill="transparent" 
                stroke="var(--primary)" 
                strokeWidth="3" 
                strokeDasharray="2 2"
                style={{ animation: 'spin 4s linear infinite' }}
              />
            )}
          </svg>

          {/* Tooltip Overlay */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', top: 10, right: 10, fontSize: '0.8rem', color: 'var(--text-muted)', background: 'var(--background-modifier-hover)', padding: '4px 8px', borderRadius: '4px' }}>
              Click on any point to view its detailed breakdown below
            </div>
          </div>

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
              
              {hoveredPoint.timingBreakdown && hoveredPoint.timingBreakdown.length > 0 && (
                <div style={{ borderTop: '1px solid var(--border)', margin: '0.5rem 0', paddingTop: '0.5rem' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700, marginBottom: '0.25rem' }}>Timing Factors:</div>
                  {hoveredPoint.timingBreakdown.map(tb => (
                    <div key={tb.key} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.8rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{tb.name}:</span>
                      <span style={{ fontWeight: 600 }}>x{tb.value.toFixed(2)}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                    <span>Timing Multiplier:</span>
                    <span style={{ fontWeight: 700, color: 'var(--primary)' }}>x{(hoveredPoint.timingMultiplier || 1.0).toFixed(2)}</span>
                  </div>
                </div>
              )}
              
              {(hoveredPoint as any).isAggregatedBreakout && (
                <div style={{ borderTop: '1px solid var(--border)', margin: '0.5rem 0', paddingTop: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#22c55e', fontWeight: 700 }}>
                    <span>Breakout (3m+) Aggregate:</span>
                    <span>{((hoveredPoint as any).aggregatedScore)?.toFixed(1)}</span>
                  </div>
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
      
      {/* Clicked Point Breakdown */}
      {clickedPoint && (
        <TransitDetailTable dataPoint={clickedPoint} weights={weights} />
      )}
    </div>
  );
}

