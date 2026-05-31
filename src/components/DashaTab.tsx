'use client';

import React, { useState } from 'react';

interface DashaPeriod {
  planet: string;
  start: string;
  end: string;
  subPeriods?: DashaPeriod[];
}

interface DashaTabProps {
  dashas: DashaPeriod[];
}

function formatDate(isoString: string) {
  const d = new Date(isoString);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function DashaTab({ dashas }: DashaTabProps) {
  const [expandedMD, setExpandedMD] = useState<string | null>(null);
  const [expandedAD, setExpandedAD] = useState<string | null>(null);

  if (!dashas || dashas.length === 0) {
    return <div className="p-4 text-gray-500">No Dasha data available.</div>;
  }

  const toggleMD = (planet: string) => {
    if (expandedMD === planet) {
      setExpandedMD(null);
      setExpandedAD(null);
    } else {
      setExpandedMD(planet);
      setExpandedAD(null);
    }
  };

  const toggleAD = (planet: string) => {
    setExpandedAD(expandedAD === planet ? null : planet);
  };

  const getPlanetStyle = (planet: string) => {
    switch (planet) {
      case 'Sun': return { color: '#eab308', bg: 'rgba(234, 179, 8, 0.1)', border: 'rgba(234, 179, 8, 0.2)' }; // Yellow
      case 'Moon': return { color: '#9ca3af', bg: 'rgba(156, 163, 175, 0.1)', border: 'rgba(156, 163, 175, 0.2)' }; // Silver
      case 'Mars': return { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.2)' }; // Red
      case 'Rahu': return { color: '#52525b', bg: 'rgba(82, 82, 91, 0.1)', border: 'rgba(82, 82, 91, 0.2)' }; // Smoky
      case 'Jupiter': return { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.2)' }; // Gold
      case 'Saturn': return { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.2)' }; // Blue
      case 'Mercury': return { color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.2)' }; // Green
      case 'Ketu': return { color: '#ffffff', bg: 'rgba(255, 255, 255, 0.3)', border: 'rgba(255, 255, 255, 0.5)' }; // White
      case 'Venus': return { color: 'var(--primary)', bg: 'rgba(255, 255, 255, 0.15)', border: 'rgba(255, 255, 255, 0.3)', backdropFilter: 'blur(4px)' }; // Translucent
      default: return { color: 'var(--foreground)', bg: 'transparent', border: 'var(--border)' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '1rem' }}>
        Vimshottari Dasha (120 Years)
      </h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {dashas.map((md, i) => {
          const mdStyle = getPlanetStyle(md.planet);
          return (
          <div key={i} style={{ border: `1px solid ${mdStyle.border}`, borderRadius: '8px', overflow: 'hidden', background: 'var(--background)' }}>
            {/* Maha Dasha Header */}
            <div 
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', cursor: 'pointer', background: expandedMD === md.planet ? mdStyle.bg : 'transparent', transition: 'background 0.3s ease' }}
              onClick={() => toggleMD(md.planet)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.9rem', color: mdStyle.color }}>{expandedMD === md.planet ? '▼' : '▶'}</span>
                <span style={{ fontWeight: '600', fontSize: '1.1rem', color: mdStyle.color }}>{md.planet}</span>
                <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: mdStyle.border, color: mdStyle.color, borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Maha Dasha</span>
              </div>
              <div style={{ fontSize: '0.9rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                {formatDate(md.start)} <span style={{ margin: '0 0.5rem', opacity: 0.5 }}>to</span> {formatDate(md.end)}
              </div>
            </div>

            {/* Antar Dashas */}
            {expandedMD === md.planet && md.subPeriods && (
              <div style={{ borderTop: `1px solid ${mdStyle.border}`, background: 'rgba(255,255,255,0.02)' }}>
                {md.subPeriods.map((ad, j) => {
                  const adStyle = getPlanetStyle(ad.planet);
                  return (
                  <div key={j} style={{ borderBottom: `1px solid var(--border)` }}>
                    <div 
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem 0.75rem 2.5rem', cursor: 'pointer', background: expandedAD === ad.planet ? adStyle.bg : 'transparent', transition: 'background 0.2s ease' }}
                      onClick={() => toggleAD(ad.planet)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '0.8rem', color: adStyle.color }}>{expandedAD === ad.planet ? '▼' : '▶'}</span>
                        <span style={{ fontWeight: '500', color: 'var(--foreground)' }}>{md.planet} - <span style={{ color: adStyle.color }}>{ad.planet}</span></span>
                        <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem', background: adStyle.border, color: adStyle.color, borderRadius: '4px', textTransform: 'uppercase' }}>Antar</span>
                      </div>
                      <div style={{ fontSize: '0.85rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                        {formatDate(ad.start)} <span style={{ margin: '0 0.5rem', opacity: 0.5 }}>-</span> {formatDate(ad.end)}
                      </div>
                    </div>

                    {/* Pratyantar Dashas */}
                    {expandedAD === ad.planet && ad.subPeriods && (
                      <div style={{ padding: '0.5rem 0', background: 'rgba(0,0,0,0.02)' }}>
                        {ad.subPeriods.map((pd, k) => {
                          const pdStyle = getPlanetStyle(pd.planet);
                          return (
                          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 1rem 0.5rem 4rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{md.planet} - {ad.planet} - <span style={{ color: pdStyle.color, fontWeight: '500' }}>{pd.planet}</span></span>
                              <span style={{ fontSize: '0.6rem', padding: '0.1rem 0.3rem', background: pdStyle.border, color: pdStyle.color, borderRadius: '3px', textTransform: 'uppercase' }}>Pratyantar</span>
                            </div>
                            <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                              {formatDate(pd.start)} <span style={{ margin: '0 0.5rem', opacity: 0.5 }}>-</span> {formatDate(pd.end)}
                            </div>
                          </div>
                        )})}
                      </div>
                    )}
                  </div>
                )})}
              </div>
            )}
          </div>
        )})}
      </div>
    </div>
  );
}
