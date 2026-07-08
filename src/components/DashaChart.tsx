'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import type { DashaTimePoint, AppliedCondition } from '@/lib/nds_engine';
import DashaDetailTable from './DashaDetailTable';

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
  const [clickedPoint, setClickedPoint] = useState<DashaTimePoint | null>(null);
  const [zoom, setZoom] = useState(5);

  const itemsPerPage = 24;
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!data || data.length === 0) return;
    const currentYear = new Date().getFullYear();
    const index = data.findIndex(d => new Date(d.date).getFullYear() === currentYear);
    
    if (index !== -1) {
      setCurrentPage(Math.floor(index / itemsPerPage) + 1);

      // Auto-scroll the chart to current year
      setTimeout(() => {
        if (containerRef.current && containerRef.current.parentElement) {
          const allDates = data.map(d => new Date(d.date).getTime());
          const minTime = Math.min(...allDates);
          const maxTime = Math.max(...allDates);
          const totalSpan = maxTime - minTime || 1;
          const targetTime = new Date(currentYear, 0, 1).getTime();
          
          const fraction = (targetTime - minTime) / totalSpan;
          
          const W = containerRef.current.getBoundingClientRect().width;
          const targetX = fraction * W;
          
          const parent = containerRef.current.parentElement;
          parent.scrollLeft = targetX - (parent.getBoundingClientRect().width / 2);
        }
      }, 300); // Wait for canvas to render and expand width
    }
  }, [data]);

  const totalPages = Math.ceil((data?.length || 0) / itemsPerPage);

  const currentData = useMemo(() => {
    if (!data) return [];
    const start = (currentPage - 1) * itemsPerPage;
    return data.slice(start, start + itemsPerPage);
  }, [data, currentPage]);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      // If clicking outside the container and outside the popup, close it
      const target = e.target as HTMLElement;
      if (!target.closest('.dasha-chart-container') && !target.closest('.dasha-popup')) {
        setHoveredPoint(null);
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
    const baseW = container.parentElement ? container.parentElement.getBoundingClientRect().width : 800;
    const W = Math.max(800, baseW * zoom);
    
    canvas.width = W * dpr;
    canvas.height = 420 * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = '420px';
    container.style.width = `${W}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);

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

    // Visible time range (Native scroll shows everything)
    const visStart = minTime;
    const visEnd = maxTime;
    const visSpan = visEnd - visStart || 1;

    const toX = (t: number) => padding.left + ((t - visStart) / visSpan) * chartW;
    const toY = (pct: number) => padding.top + chartH / 2 - (pct / 100) * (chartH / 2);

    // All points are visible natively
    const visible = data;

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

    // Draw MD and AD boundary markers
    let prevMd = '';
    let prevAd = '';
    let lastAdLabelX = -100;

    for (const point of visible) {
      const isNewMd = point.mdPlanet !== prevMd;
      const isNewAd = !isNewMd && point.adPlanet !== prevAd;

      if (isNewMd || isNewAd) {
        const t = new Date(point.date).getTime();
        const x = toX(t);
        
        ctx.strokeStyle = isNewMd ? 'rgba(201, 168, 106, 0.4)' : 'rgba(201, 168, 106, 0.15)';
        ctx.lineWidth = isNewMd ? 1.5 : 1;
        ctx.setLineDash(isNewMd ? [4, 4] : [2, 4]);
        ctx.beginPath();
        ctx.moveTo(x, padding.top);
        ctx.lineTo(x, H - padding.bottom);
        ctx.stroke();
        ctx.setLineDash([]);

        if (isNewMd) {
          // MD label
          ctx.fillStyle = PLANET_COLORS[point.mdPlanet] || '#C9A86A';
          ctx.font = 'bold 11px Inter, system-ui, sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(`${point.mdPlanet} MD`, x + 4, padding.top + 12);
          
          // Print AD label alongside MD
          ctx.fillStyle = PLANET_COLORS[point.adPlanet] || '#94a3b8';
          ctx.font = '10px Inter, system-ui, sans-serif';
          ctx.fillText(`${point.adPlanet} AD`, x + 4, padding.top + 26);
          
          prevMd = point.mdPlanet;
          prevAd = point.adPlanet;
          lastAdLabelX = x;
        } else if (isNewAd) {
          // AD label only if enough space
          if (x - lastAdLabelX > 45) {
            ctx.fillStyle = PLANET_COLORS[point.adPlanet] || '#94a3b8';
            ctx.font = '10px Inter, system-ui, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(`${point.adPlanet} AD`, x + 4, padding.top + 26);
            lastAdLabelX = x;
          }
          prevAd = point.adPlanet;
        }
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
  }, [data, zoom, minTime, maxTime, totalSpan, hoveredPoint]);

  useEffect(() => {
    drawChart();
    window.addEventListener('resize', drawChart);
    return () => window.removeEventListener('resize', drawChart);
  }, [drawChart]);

  // Interaction handlers
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
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
    
    const visStart = minTime;
    const visEnd = maxTime;
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
      const H = 420;
      const chartH = H - padding.top - padding.bottom;
      let mappedY = padding.top + chartH / 2; // Default zero line
      if (closest.percentage !== 0) {
        mappedY = padding.top + chartH / 2 - (closest.percentage / 100) * (chartH / 2);
      }
      
      const clickY = e.clientY - rect.top;
      // If click is too far vertically from the line, dismiss
      const isVerticalHit = Math.abs(clickY - mappedY) < 60;
      
      if (!isVerticalHit) {
        setHoveredPoint(null);
      } else {
        setHoveredPoint(closest);
      }
    } else {
      setHoveredPoint(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const padding = { top: 30, right: 20, bottom: 60, left: 55 };
    
    if (x < padding.left || x > rect.width - padding.right) return;

    const chartW = rect.width - padding.left - padding.right;
    const fraction = (x - padding.left) / chartW;
    
    const visStart = minTime;
    const visEnd = maxTime;
    const clickTime = visStart + fraction * (visEnd - visStart);

    let closest: DashaTimePoint | null = null;
    for (let i = 0; i < data.length; i++) {
      const t = new Date(data[i].date).getTime();
      const nextT = i < data.length - 1 ? new Date(data[i+1].date).getTime() : Infinity;
      if (clickTime >= t && clickTime < nextT) {
        closest = data[i];
        break;
      }
    }

    if (closest) {
      setClickedPoint(closest);
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
          
          {/* Custom Scrollbar/Minimap Replacement */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Zoom:</span>
            <select 
              value={zoom} 
              onChange={e => setZoom(parseFloat(e.target.value))}
              style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'var(--bg)', color: 'var(--foreground)', border: '1px solid var(--border)', fontSize: '0.8rem' }}
            >
              <option value={1}>Fit Screen</option>
              <option value={2}>200% Zoom</option>
              <option value={4}>400% Zoom</option>
              <option value={5}>500% Default</option>
              <option value={8}>800% Zoom</option>
              <option value={15}>1500% Zoom</option>
            </select>
          </div>
        </div>

        <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '1rem' }}>
            <div 
              ref={containerRef} 
              className="dasha-chart-container"
              style={{ position: 'relative', minWidth: '800px', height: '420px', cursor: 'crosshair', userSelect: 'none' }}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              onClick={handleClick}
            >
              <canvas ref={canvasRef} style={{ display: 'block' }} />
              
              {/* Clicked Indicator */}
              {clickedPoint && (
                (() => {
                  const padding = { top: 30, right: 20, bottom: 60, left: 55 };
                  const W = 800; // Will be actual width in rendering, but this matches container minWidth/setup
                  const chartWInner = W - padding.left - padding.right;
                  const t = new Date(clickedPoint.date).getTime();
                  const H = 420;
                  const chartH = H - padding.top - padding.bottom;
                  let mappedY = padding.top + chartH / 2;
                  if (clickedPoint.percentage !== 0) {
                    mappedY = padding.top + chartH / 2 - (clickedPoint.percentage / 100) * (chartH / 2);
                  }
                  
                  // Compute X position based on current zoom view
                  if (t >= minTime && t <= maxTime) {
                    const mappedX = padding.left + ((t - minTime) / (maxTime - minTime)) * chartWInner;
                    return (
                      <div style={{
                        position: 'absolute',
                        left: mappedX - 6,
                        top: mappedY - 6,
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        border: '2px solid var(--primary)',
                        pointerEvents: 'none'
                      }} />
                    );
                  }
                  return null;
                })()
              )}
            </div>
        </div>
      </div>

      {/* Clicked Point Breakdown */}
      {clickedPoint && (
        <div style={{ marginTop: '2rem' }}>
          <DashaDetailTable dataPoint={clickedPoint} />
        </div>
      )}

      {children && <div style={{ marginTop: '2rem' }}>{children}</div>}

      {/* Detailed Breakdown Table */}
      <div style={{ marginTop: '2rem', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
          <h4 style={{ margin: 0, color: 'var(--primary)' }}>
            Detailed Period Breakdown (Applicable Conditions)
          </h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{ padding: '0.4rem 0.8rem', borderRadius: '4px', background: 'var(--bg)', color: 'var(--foreground)', border: '1px solid var(--border)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
            >
              Prev Year
            </button>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Page {currentPage} of {totalPages}
            </span>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{ padding: '0.4rem 0.8rem', borderRadius: '4px', background: 'var(--bg)', color: 'var(--foreground)', border: '1px solid var(--border)', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
            >
              Next Year
            </button>
          </div>
        </div>
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
              {currentData.map((d: DashaTimePoint, i: number) => {
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
