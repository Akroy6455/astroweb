'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { DashaTimePoint, AppliedCondition } from '@/lib/nds_engine';

const PLANET_COLORS: Record<string, string> = {
  Sun: '#f59e0b', Moon: '#e2e8f0', Mars: '#ef4444',
  Mercury: '#22c55e', Jupiter: '#f59e0b', Venus: '#ec4899',
  Saturn: '#6366f1', Rahu: '#64748b', Ketu: '#a78bfa',
};

function getNdsColor(pct: number): string {
  if (pct >= 0) {
    const s = Math.min(pct, 100);
    return `hsl(150, ${s}%, 50%)`;
  } else {
    const s = Math.min(Math.abs(pct), 100);
    return `hsl(0, ${s}%, 55%)`;
  }
}

export default function DashaChart({ data, children }: { data: DashaTimePoint[], children?: React.ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredPoint, setHoveredPoint] = useState<DashaTimePoint | null>(null);
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewRange, setViewRange] = useState({ start: 0, end: 0.5 }); // 50% default zoom

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      // If clicking outside the container and outside the popup, close it
      const target = e.target as HTMLElement;
      if (!target.closest('.dasha-chart-container') && !target.closest('.dasha-popup')) {
        setHoveredPoint(null);
        setIsExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleGlobalClick);
    return () => document.removeEventListener('mousedown', handleGlobalClick);
  }, []);

  if (!data || data.length === 0) {
    return <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '3rem' }}>No Dasha data available for scoring.</div>;
  }

  const allDates = data.map(d => new Date(d.date).getTime());
  const minTime = Math.min(...allDates);
  const maxTime = Math.max(...allDates);
  const totalSpan = maxTime - minTime || 1;

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const drawChart = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = 420 * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = '420px';

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    const W = rect.width;
    const H = 420;
    const padding = { top: 30, right: 20, bottom: 60, left: 55 };
    const chartW = W - padding.left - padding.right;
    const chartH = H - padding.top - padding.bottom;

    // Clear
    ctx.clearRect(0, 0, W, H);

    // Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
    bgGrad.addColorStop(0, 'rgba(15, 23, 42, 0.9)');
    bgGrad.addColorStop(1, 'rgba(15, 23, 42, 0.6)');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Visible time range
    const visStart = minTime + totalSpan * viewRange.start;
    const visEnd = minTime + totalSpan * viewRange.end;
    const visSpan = visEnd - visStart || 1;

    const toX = (t: number) => padding.left + ((t - visStart) / visSpan) * chartW;
    const toY = (pct: number) => padding.top + chartH / 2 - (pct / 100) * (chartH / 2);

    // Filter visible data points
    const visible = data.filter(d => {
      const t = new Date(d.date).getTime();
      return t >= visStart && t <= visEnd;
    });

    // Y-axis grid lines and labels
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
    ctx.lineWidth = 1;
    ctx.font = '11px Inter, system-ui, sans-serif';
    ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
    ctx.textAlign = 'right';

    for (let pct = -100; pct <= 100; pct += 25) {
      const y = toY(pct);
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(W - padding.right, y);
      ctx.stroke();
      ctx.fillText(`${pct}%`, padding.left - 8, y + 4);
    }

    // Zero line (prominent)
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(padding.left, toY(0));
    ctx.lineTo(W - padding.right, toY(0));
    ctx.stroke();
    ctx.setLineDash([]);

    // X-axis time labels
    ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
    ctx.textAlign = 'center';
    ctx.font = '10px Inter, system-ui, sans-serif';

    const visYears = visSpan / (365.25 * 24 * 60 * 60 * 1000);
    const yearStep = visYears > 50 ? 10 : visYears > 20 ? 5 : visYears > 10 ? 2 : 1;
    const startYear = new Date(visStart).getFullYear();
    const endYear = new Date(visEnd).getFullYear();

    for (let y = Math.ceil(startYear / yearStep) * yearStep; y <= endYear; y += yearStep) {
      const t = new Date(y, 0, 1).getTime();
      if (t >= visStart && t <= visEnd) {
        const x = toX(t);
        ctx.fillText(`${y}`, x, H - padding.bottom + 20);
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, padding.top);
        ctx.lineTo(x, H - padding.bottom);
        ctx.stroke();
      }
    }

    // Draw MD boundary markers
    let prevMd = '';
    for (const point of visible) {
      if (point.mdPlanet !== prevMd) {
        const t = new Date(point.date).getTime();
        const x = toX(t);
        ctx.strokeStyle = 'rgba(201, 168, 106, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(x, padding.top);
        ctx.lineTo(x, H - padding.bottom);
        ctx.stroke();
        ctx.setLineDash([]);

        // MD label
        ctx.fillStyle = PLANET_COLORS[point.mdPlanet] || '#C9A86A';
        ctx.font = 'bold 11px Inter, system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`${point.mdPlanet} MD`, x + 4, padding.top + 12);

        prevMd = point.mdPlanet;
      }
    }

    // Draw Area Chart
    if (visible.length > 0) {
      ctx.beginPath();
      
      // Start at the first visible point's zero line to close the shape later
      const firstT = new Date(visible[0].date).getTime();
      let firstX = toX(firstT);
      if (firstX < padding.left) firstX = padding.left;
      ctx.moveTo(firstX, toY(0));

      // Draw the step line (Area path)
      for (let i = 0; i < visible.length; i++) {
        const p = visible[i];
        const tStart = new Date(p.date).getTime();
        const tEnd = i < visible.length - 1 ? new Date(visible[i + 1].date).getTime() : Math.min(maxTime, visEnd);
        
        let xStart = toX(tStart);
        let xEnd = toX(tEnd);
        
        if (xStart < padding.left) xStart = padding.left;
        if (xEnd > W - padding.right) xEnd = W - padding.right;
        if (xStart >= W - padding.right) continue;

        const yValue = toY(p.percentage);
        
        // Move to start of this step
        if (i === 0) {
          ctx.lineTo(xStart, yValue);
        } else {
          // Vertical step from previous value
          ctx.lineTo(xStart, yValue);
        }
        // Horizontal line for the duration of the AD
        ctx.lineTo(xEnd, yValue);
      }

      // Close the area shape down to the zero line
      let lastX = W - padding.right;
      ctx.lineTo(lastX, toY(0));
      ctx.closePath();

      // Classy Area Gradient
      const areaGrad = ctx.createLinearGradient(0, padding.top, 0, H - padding.bottom);
      areaGrad.addColorStop(0, 'rgba(16, 185, 129, 0.3)'); // Green at top
      areaGrad.addColorStop(0.5, 'rgba(15, 23, 42, 0)');   // Transparent at zero
      areaGrad.addColorStop(1, 'rgba(239, 68, 68, 0.3)');  // Red at bottom
      
      ctx.fillStyle = areaGrad;
      ctx.fill();

      // Draw the actual Step Line on top of the area
      ctx.beginPath();
      for (let i = 0; i < visible.length; i++) {
        const p = visible[i];
        const tStart = new Date(p.date).getTime();
        const tEnd = i < visible.length - 1 ? new Date(visible[i + 1].date).getTime() : Math.min(maxTime, visEnd);
        
        let xStart = toX(tStart);
        let xEnd = toX(tEnd);
        
        if (xStart < padding.left) xStart = padding.left;
        if (xEnd > W - padding.right) xEnd = W - padding.right;
        if (xStart >= W - padding.right) continue;

        const yValue = toY(p.percentage);
        
        if (i === 0) {
          ctx.moveTo(xStart, yValue);
        } else {
          ctx.lineTo(xStart, yValue);
        }
        ctx.lineTo(xEnd, yValue);
      }
      ctx.strokeStyle = '#c9a86a';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 8;
      ctx.shadowColor = 'rgba(201, 168, 106, 0.6)';
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw AD Net Score text and Points
      for (let i = 0; i < visible.length; i++) {
        const p = visible[i];
        const tStart = new Date(p.date).getTime();
        const tEnd = i < visible.length - 1 ? new Date(visible[i + 1].date).getTime() : Math.min(maxTime, visEnd);
        
        let xStart = toX(tStart);
        let xEnd = toX(tEnd);
        if (xStart < padding.left) xStart = padding.left;
        if (xEnd > W - padding.right) xEnd = W - padding.right;
        
        const barWidth = xEnd - xStart;
        if (barWidth > 30) {
           const pts = p.adResult.netScore;
           const scoreStr = (pts >= 0 ? '+' : '') + pts;
           const yValue = toY(p.percentage);
           const isPositive = p.percentage >= 0;
           
           ctx.fillStyle = isPositive ? '#34d399' : '#fca5a5';
           ctx.font = 'bold 10px Inter, system-ui, sans-serif';
           ctx.textAlign = 'center';
           
           const textY = isPositive ? yValue - 10 : yValue + 16;
           if (textY > padding.top && textY < H - padding.bottom + 10) {
             ctx.fillText(scoreStr, xStart + barWidth / 2, textY);
           }
        }

        // Draw hover highlight
        if (hoveredPoint && hoveredPoint.date === p.date) {
           const yValue = toY(p.percentage);
           ctx.beginPath();
           ctx.arc(xStart + barWidth / 2, yValue, 5, 0, 2 * Math.PI);
           ctx.fillStyle = '#fff';
           ctx.shadowBlur = 10;
           ctx.shadowColor = '#fff';
           ctx.fill();
           ctx.shadowBlur = 0;
        }
      }
    }
  }, [data, viewRange, minTime, totalSpan, hoveredPoint]);

  useEffect(() => {
    drawChart();
    window.addEventListener('resize', drawChart);
    return () => window.removeEventListener('resize', drawChart);
  }, [drawChart]);

  // Interaction handlers
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const padding = { top: 30, right: 20, bottom: 60, left: 55 };
    
    if (x < padding.left || x > rect.width - padding.right) {
      setHoveredPoint(null);
      return;
    }

    const chartW = rect.width - padding.left - padding.right;
    const fraction = (x - padding.left) / chartW;
    
    const visStart = minTime + totalSpan * viewRange.start;
    const visEnd = minTime + totalSpan * viewRange.end;
    const hoverTime = visStart + fraction * (visEnd - visStart);

    // Find the current AD period based on step logic
    let closest: DashaTimePoint | null = null;
    let pointXStart = 0;
    let pointXEnd = 0;
    
    for (let i = 0; i < data.length; i++) {
      const t = new Date(data[i].date).getTime();
      const nextT = i < data.length - 1 ? new Date(data[i+1].date).getTime() : Infinity;
      if (hoverTime >= t && hoverTime < nextT) {
        closest = data[i];
        const chartWInner = rect.width - padding.left - padding.right;
        pointXStart = padding.left + ((t - visStart) / (visEnd - visStart)) * chartWInner;
        pointXEnd = padding.left + ((nextT - visStart) / (visEnd - visStart)) * chartWInner;
        break;
      }
    }

    if (closest) {
      // Toggle off if clicking the same point or empty space far from the line
      const H = 420;
      const chartH = H - padding.top - padding.bottom;
      let mappedY = padding.top + chartH / 2; // Default zero line
      if (closest.percentage !== 0) {
        mappedY = padding.top + chartH / 2 - (closest.percentage / 100) * (chartH / 2);
      }
      
      const clickY = e.clientY - rect.top;
      // If click is too far vertically from the line, dismiss
      const isVerticalHit = Math.abs(clickY - mappedY) < 60;
      
      if ((hoveredPoint && hoveredPoint.date === closest.date) || !isVerticalHit) {
        setHoveredPoint(null);
        setIsExpanded(false);
      } else {
        setHoveredPoint(closest);
        setIsExpanded(false);
        // Position popup centered on the point segment
        const mappedX = (Math.max(padding.left, pointXStart) + Math.min(rect.width - padding.right, pointXEnd)) / 2;
        setPopupPos({ x: mappedX, y: mappedY });
      }
    } else {
      setHoveredPoint(null);
      setIsExpanded(false);
    }
  };

  const getTier = (pct: number) => {
    if (pct >= 75) return { label: 'Spectacular', color: '#10b981' };
    if (pct >= 40) return { label: 'Favorable', color: '#34d399' };
    if (pct >= 10) return { label: 'Average', color: '#6ee7b7' };
    if (pct >= -9) return { label: 'Neutral', color: '#94a3b8' };
    if (pct >= -39) return { label: 'Challenging', color: '#fca5a5' };
    if (pct >= -74) return { label: 'Difficult', color: '#ef4444' };
    return { label: 'Crisis', color: '#b91c1c' };
  };

  const formatConditions = (conditions: AppliedCondition[]) => {
    if (!conditions || conditions.length === 0) return <span style={{ color: 'var(--text-muted)' }}>None</span>;
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
        {conditions.map((c, i) => (
          <span key={i} style={{ 
            fontSize: '0.75rem', 
            padding: '2px 6px', 
            background: c.value > 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            color: c.value > 0 ? '#10b981' : '#ef4444',
            border: `1px solid ${c.value > 0 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
            borderRadius: '4px',
            whiteSpace: 'nowrap'
          }}>
            {c.name} ({c.value > 0 ? '+' : ''}{c.value})
          </span>
        ))}
      </div>
    );
  };

  return (
    <div style={{ marginTop: '2rem' }}>
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem 1.5rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, color: 'var(--foreground)' }}>Net Dasha Flow (Percentage)</h3>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Interactive timeline of Antardasha (AD) periods mapping percentage favorability based on applied conditions. <strong>Click anywhere on the chart</strong> to inspect a period.
            </p>
          </div>
          
          {/* Custom Scrollbar/Minimap */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(0,0,0,0.2)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Zoom:</span>
            <input 
              type="range" min="10" max="100" defaultValue="50" 
              onChange={e => {
                const range = parseInt(e.target.value) / 100;
                // Center the zoom
                const center = viewRange.start + (viewRange.end - viewRange.start) / 2;
                let start = center - range / 2;
                let end = center + range / 2;
                if (start < 0) { start = 0; end = range; }
                if (end > 1) { end = 1; start = 1 - range; }
                setViewRange({ start, end });
              }}
              style={{ width: '100px', accentColor: 'var(--primary)' }}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '1rem' }}>Pan:</span>
            <input 
              type="range" min="0" max="1000" defaultValue="0"
              onChange={e => {
                const currentSpan = viewRange.end - viewRange.start;
                const offset = (parseInt(e.target.value) / 1000) * (1 - currentSpan);
                setViewRange({ start: offset, end: offset + currentSpan });
              }}
              style={{ width: '100px', accentColor: 'var(--primary)' }}
            />
          </div>
        </div>

        <div 
          ref={containerRef} 
          className="dasha-chart-container"
          style={{ position: 'relative', width: '100%', height: '420px', cursor: 'crosshair', userSelect: 'none' }}
          onClick={handleClick}
        >
          <canvas ref={canvasRef} style={{ display: 'block' }} />
        </div>
      </div>

      {hoveredPoint && (
        <div className="dasha-popup" style={{
          position: 'absolute',
          top: popupPos.y > 200 ? popupPos.y - 180 : popupPos.y + 20,
          left: popupPos.x > 340 ? popupPos.x - 320 : popupPos.x + 20,
          background: 'rgba(15, 23, 42, 0.98)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(201, 168, 106, 0.5)',
          padding: '1.25rem',
          borderRadius: '12px',
          zIndex: 1000,
          color: '#f8fafc',
          boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.7)',
          width: '320px',
        }}>
          <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: '0.5rem' }}>
            {new Date(hoveredPoint.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.75rem' }}>
            <strong style={{ fontSize: '1.2rem', color: '#C9A86A' }}>
              {hoveredPoint.mdPlanet}-{hoveredPoint.adPlanet}
            </strong>
            <span style={{ fontWeight: 'bold', fontSize: '1.3rem', color: getNdsColor(hoveredPoint.percentage) }}>
              {hoveredPoint.percentage}%
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>MD Score ({hoveredPoint.mdPlanet})</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>({hoveredPoint.mdResult.netScore > 0 ? '+' : ''}{hoveredPoint.mdResult.netScore} pts)</span>
                <span style={{ color: getNdsColor(hoveredPoint.mdPercentage), fontWeight: 600 }}>{hoveredPoint.mdPercentage}%</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8' }}>AD Score ({hoveredPoint.adPlanet})</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>({hoveredPoint.adResult.netScore > 0 ? '+' : ''}{hoveredPoint.adResult.netScore} pts)</span>
                <span style={{ color: getNdsColor(hoveredPoint.adPercentage), fontWeight: 600 }}>{hoveredPoint.adPercentage}%</span>
              </div>
            </div>
          </div>
          <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
            <span style={{ fontSize: '0.8rem', color: '#cbd5e1', display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>AD Applicable Rules</span>
            {formatConditions(isExpanded ? hoveredPoint.adResult.conditions : hoveredPoint.adResult.conditions.slice(0, 4))}
            
            {hoveredPoint.adResult.conditions.length > 4 && (
              <button 
                onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                style={{ 
                  background: 'transparent', border: 'none', color: '#38bdf8', fontSize: '0.8rem', 
                  marginTop: '0.5rem', cursor: 'pointer', padding: 0, textDecoration: 'underline' 
                }}
              >
                {isExpanded ? 'Show less' : `+${hoveredPoint.adResult.conditions.length - 4} more...`}
              </button>
            )}
          </div>
        </div>
      )}

      {children && <div style={{ marginTop: '2rem' }}>{children}</div>}

      {/* Detailed Breakdown Table */}
      <div style={{ marginTop: '2rem', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <h4 style={{ margin: 0, padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', color: 'var(--primary)' }}>
          Detailed Period Breakdown (Applicable Conditions)
        </h4>
        <div style={{ overflowX: 'auto' }}>
          <table className="details-table" style={{ width: '100%', fontSize: '0.85rem' }}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Period (MD-AD)</th>
                <th>Percentage</th>
                <th>Tier</th>
                <th>MD Rules Applied</th>
                <th>AD Rules Applied</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d, i) => {
                const tier = getTier(d.percentage);
                return (
                  <tr key={i} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(232, 220, 203, 0.3)' }}>
                    <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                      {new Date(d.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      <span style={{ color: PLANET_COLORS[d.mdPlanet] }}>{d.mdPlanet}</span>
                      <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>-</span>
                      <span style={{ color: PLANET_COLORS[d.adPlanet] }}>{d.adPlanet}</span>
                    </td>
                    <td style={{ fontWeight: 'bold', color: tier.color }}>
                      {d.percentage}%
                    </td>
                    <td>
                      <span style={{ 
                        padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600,
                        background: `${tier.color}20`, color: tier.color 
                      }}>
                        {tier.label}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Score: {d.mdResult.netScore} / {d.mdResult.maxPossible} ({d.mdPercentage}%)
                        </div>
                        {formatConditions(d.mdResult.conditions)}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Score: {d.adResult.netScore} / {d.adResult.maxPossible} ({d.adPercentage}%)
                        </div>
                        {formatConditions(d.adResult.conditions)}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
