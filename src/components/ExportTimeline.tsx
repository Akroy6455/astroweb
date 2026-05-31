'use client';

import React from 'react';
import type { DashaTimePoint, NDSWeights } from '@/lib/nds_engine';
import { Download, FileSpreadsheet, Image as ImageIcon } from 'lucide-react';

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

interface ExportTimelineProps {
  dashaData: DashaTimePoint[];
  transitData: TransitDataPoint[];
  weights: NDSWeights;
}

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

export default function ExportTimeline({ dashaData, transitData, weights }: ExportTimelineProps) {

  const processTransitData = () => {
    return transitData.map(d => {
      const avgM = weights.enableTransitMultiplier ? d.avgMultiplier : 1.0;
      const mdAdM = weights.enableMdAdTransitMultiplier ? (d.mdLordMultiplier * d.adLordMultiplier) : 1.0;
      const navtaraAvgM = weights.enableNavtaraTransit && d.avgNavtaraMultiplier ? d.avgNavtaraMultiplier : 1.0;
      const navtaraMdAdM = weights.enableNavtaraMdAd && d.mdLordNavtaraMultiplier && d.adLordNavtaraMultiplier ? (d.mdLordNavtaraMultiplier * d.adLordNavtaraMultiplier) : 1.0;
      const includeBase = weights.enableBaseNdsInTransit ?? true;
      const finalScore = includeBase ? (d.baseNds * avgM * mdAdM * navtaraAvgM * navtaraMdAdM) : (avgM * mdAdM * navtaraAvgM * navtaraMdAdM * 100);
      return { ...d, finalScore };
    });
  };

  const exportCSV = () => {
    const processedTransit = processTransitData();
    
    // We want to merge Dasha Data and Transit Data based on dates.
    // Transit data is sampled roughly every 30 days.
    // Let's just create a CSV of Transit Data, and append the active Dasha at that date.
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,MD Lord,AD Lord,Dasha Score,Base Transit Score,Final Transit Score\n";

    processedTransit.forEach(t => {
      const tTime = new Date(t.date).getTime();
      const activeDasha = dashaData.find(d => {
        const dTime = new Date(d.date).getTime();
        const dEnd = new Date(d.endDate).getTime();
        return tTime >= dTime && tTime <= dEnd;
      });

      const mdLord = activeDasha ? activeDasha.mdLord : '';
      const adLord = activeDasha ? activeDasha.adLord : '';
      const dashaScore = activeDasha ? activeDasha.score : 0;
      
      const row = `${t.date.split('T')[0]},${mdLord},${adLord},${dashaScore.toFixed(2)},${t.baseNds.toFixed(2)},${t.finalScore.toFixed(2)}`;
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "transit_ndf_flow.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportSVG = () => {
    const processedTransit = processTransitData();
    if (!processedTransit.length || !dashaData.length) return;

    // 120 years at 5% zoom = ~20,000px wide
    const W = 20000;
    const H = 800; // 400px for Dasha, 400px for Transit
    
    const minTime = new Date(dashaData[0].date).getTime();
    const maxTime = new Date(dashaData[dashaData.length - 1].endDate).getTime();
    const totalSpan = maxTime - minTime || 1;

    const toX = (t: number) => ((t - minTime) / totalSpan) * W;

    let svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
        <rect width="${W}" height="${H}" fill="#1e293b" />
    `;

    // 1. Draw Dasha Chart (Top 400px)
    svgContent += `<g transform="translate(0, 0)">`;
    const dashaH = 300;
    const dashaY = 50;
    
    // Draw Center Line for Dasha
    svgContent += `<line x1="0" y1="${dashaY + dashaH/2}" x2="${W}" y2="${dashaY + dashaH/2}" stroke="rgba(255,255,255,0.1)" stroke-width="1" />`;
    
    dashaData.forEach(d => {
      const tStart = new Date(d.date).getTime();
      const tEnd = new Date(d.endDate).getTime();
      const x1 = toX(tStart);
      const x2 = toX(tEnd);
      const w = Math.max(1, x2 - x1);
      
      const pct = Math.max(-100, Math.min(100, d.score));
      const color = getNdsColor(pct);
      
      let y, h;
      if (pct >= 0) {
        h = (pct / 100) * (dashaH / 2);
        y = dashaY + dashaH / 2 - h;
      } else {
        h = (Math.abs(pct) / 100) * (dashaH / 2);
        y = dashaY + dashaH / 2;
      }

      svgContent += `<rect x="${x1}" y="${y}" width="${w}" height="${h}" fill="${color}" opacity="0.8" />`;
      
      // Draw labels if wide enough
      if (w > 40) {
        svgContent += `<text x="${x1 + 4}" y="${dashaY + 20}" fill="${PLANET_COLORS[d.mdLord] || '#fff'}" font-family="sans-serif" font-size="12" font-weight="bold">${d.mdLord.substring(0,2)}</text>`;
        svgContent += `<text x="${x1 + 4}" y="${dashaY + 36}" fill="${PLANET_COLORS[d.adLord] || '#fff'}" font-family="sans-serif" font-size="10">${d.adLord.substring(0,2)}</text>`;
      }
    });
    
    // Draw year grid lines
    const startYear = new Date(minTime).getFullYear();
    const endYear = new Date(maxTime).getFullYear();
    for (let y = startYear; y <= endYear; y++) {
      const tx = toX(new Date(`${y}-01-01`).getTime());
      svgContent += `<line x1="${tx}" y1="0" x2="${tx}" y2="${H}" stroke="rgba(255,255,255,0.1)" stroke-width="1" stroke-dasharray="4" />`;
      svgContent += `<text x="${tx + 5}" y="${H - 10}" fill="rgba(255,255,255,0.5)" font-family="sans-serif" font-size="12">${y}</text>`;
    }
    
    svgContent += `</g>`;

    // 2. Draw Transit Chart (Bottom 400px)
    svgContent += `<g transform="translate(0, 400)">`;
    const transH = 300;
    const transY = 50;
    
    const minScore = Math.min(...processedTransit.map(d => d.finalScore), -100);
    const maxScore = Math.max(...processedTransit.map(d => d.finalScore), 100);
    const range = Math.max(Math.abs(minScore), Math.abs(maxScore));
    const yMin = -range * 1.1;
    const yMax = range * 1.1;

    const toY = (val: number) => {
      const normalized = (val - yMin) / (yMax - yMin);
      return transY + transH - (normalized * transH);
    };

    const zeroY = toY(0);
    svgContent += `<line x1="0" y1="${zeroY}" x2="${W}" y2="${zeroY}" stroke="rgba(255,255,255,0.2)" stroke-width="2" />`;

    // Mountain path
    let pathD = `M ${toX(new Date(processedTransit[0].date).getTime())} ${zeroY}`;
    processedTransit.forEach(d => {
      pathD += ` L ${toX(new Date(d.date).getTime())} ${toY(d.finalScore)}`;
    });
    pathD += ` L ${toX(new Date(processedTransit[processedTransit.length - 1].date).getTime())} ${zeroY} Z`;
    
    svgContent += `<path d="${pathD}" fill="rgba(201, 168, 106, 0.2)" />`;

    // Line path
    let lineD = `M ${toX(new Date(processedTransit[0].date).getTime())} ${toY(processedTransit[0].finalScore)}`;
    processedTransit.forEach((d, i) => {
      if (i > 0) lineD += ` L ${toX(new Date(d.date).getTime())} ${toY(d.finalScore)}`;
    });
    
    svgContent += `<path d="${lineD}" fill="none" stroke="#C9A86A" stroke-width="2" />`;
    
    svgContent += `</g>`;
    svgContent += `</svg>`;

    const blob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "complete_ndf_timeline.svg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'center' }}>
      <button 
        onClick={exportCSV}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.5rem 1rem', borderRadius: '8px',
          background: 'var(--card-bg)', color: 'var(--foreground)',
          border: '1px solid var(--border)', cursor: 'pointer',
          fontSize: '0.85rem', fontWeight: 600,
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}
        className="submit-btn"
      >
        <FileSpreadsheet size={16} />
        Export CSV Data
      </button>
      
      <button 
        onClick={exportSVG}
        style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.5rem 1rem', borderRadius: '8px',
          background: 'var(--primary)', color: '#fff',
          border: 'none', cursor: 'pointer',
          fontSize: '0.85rem', fontWeight: 600,
          boxShadow: '0 4px 10px rgba(201, 168, 106, 0.3)'
        }}
        className="submit-btn"
      >
        <ImageIcon size={16} />
        Export High-Res SVG (Landscape)
      </button>
    </div>
  );
}
