import React from 'react';

type VimshopakProps = {
  data: Record<string, any>;
};

const PLANET_LABELS = [
  { full: 'Sun', short: 'Su' },
  { full: 'Moon', short: 'Mo' },
  { full: 'Mars', short: 'Ma' },
  { full: 'Mercury', short: 'Me' },
  { full: 'Jupiter', short: 'Ju' },
  { full: 'Venus', short: 'Ve' },
  { full: 'Saturn', short: 'Sa' },
];

function BarChartPanel({ title, dataKey, data }: { title: string, dataKey: string | ((p: any) => number), data: any }) {
  const chartData = PLANET_LABELS.map(p => {
    const pData = data[p.full];
    if (!pData) return { label: p.short, value: 0 };
    let val = 0;
    if (typeof dataKey === 'function') {
      val = dataKey(pData);
    } else {
      val = parseFloat(pData[dataKey]) || 0;
    }
    return { label: p.short, value: val };
  });

  const maxVal = Math.max(...chartData.map(d => d.value), 0);
  const minVal = Math.min(...chartData.map(d => d.value), 0);
  
  // Add headroom so labels don't clip
  const paddedMax = maxVal > 0 ? maxVal * 1.3 : 0;
  const paddedMin = minVal < 0 ? minVal * 1.3 : 0;
  const range = Math.max(paddedMax - paddedMin, 1);

  const zeroFromBottom = (-paddedMin / range) * 100;

  return (
    <div style={{ 
      border: '1px solid var(--border)', 
      background: 'var(--card-bg)',
      display: 'flex', 
      flexDirection: 'column', 
      height: '180px',
      padding: '0.5rem'
    }}>
      <div style={{ textAlign: 'center', color: 'var(--primary)', fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.2rem' }}>
        {title}
      </div>
      <div style={{ flex: 1, display: 'flex', position: 'relative', marginTop: '1.2rem', marginBottom: '1.2rem' }}>
        
        {/* Zero line */}
        <div style={{ position: 'absolute', bottom: `${zeroFromBottom}%`, left: 0, right: 0, height: '1px', background: 'var(--border)', zIndex: 0 }} />
        
        {chartData.map((d, i) => {
          const heightPct = (Math.abs(d.value) / range) * 100;
          return (
            <div key={i} style={{ flex: 1, position: 'relative', height: '100%' }}>
              {/* Value Label */}
              <div style={{
                position: 'absolute',
                width: '100%',
                textAlign: 'center',
                fontSize: '0.75rem',
                color: 'var(--foreground)',
                bottom: d.value >= 0 ? `${zeroFromBottom + heightPct}%` : 'auto',
                top: d.value < 0 ? `${(100 - zeroFromBottom) + heightPct}%` : 'auto',
                marginBottom: d.value >= 0 ? '3px' : '0',
                marginTop: d.value < 0 ? '3px' : '0',
                zIndex: 2,
                opacity: 0.9
              }}>
                {Number.isInteger(d.value) ? d.value : d.value.toFixed(1)}
              </div>

              {/* Bar */}
              <div style={{
                position: 'absolute',
                width: '84%',
                left: '8%',
                height: `${heightPct}%`,
                background: d.value >= 0 ? '#b68e5b' : '#5E7C7B',
                bottom: d.value >= 0 ? `${zeroFromBottom}%` : 'auto',
                top: d.value < 0 ? `${100 - zeroFromBottom}%` : 'auto',
                borderRadius: d.value >= 0 ? '2px 2px 0 0' : '0 0 2px 2px',
                zIndex: 1,
                opacity: 0.9
              }} />

              {/* X-axis Label */}
              <div style={{
                position: 'absolute',
                bottom: '-1.4rem',
                width: '100%',
                textAlign: 'center',
                fontSize: '0.8rem',
                color: 'var(--primary)',
                fontWeight: 500
              }}>
                {d.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function VimshopakTable({ data }: VimshopakProps) {
  if (!data) return null;

  return (
    <div style={{ marginTop: '2rem' }}>
      <h3 style={{ color: 'var(--primary)', marginBottom: '1rem', fontSize: '1.2rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
        Vimshopak Bala (Shodashavarga Scheme)
      </h3>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '0.5rem',
        marginBottom: '1rem'
      }}>
        <BarChartPanel title="Total Score (out of 20)" data={data} dataKey="totalScore" />
      </div>

      <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
        <table className="details-table" style={{ width: '100%', fontSize: '0.82rem' }}>
          <thead style={{ background: 'var(--text-muted)', color: 'var(--background)' }}>
            <tr>
              <th style={{ color: 'var(--background)' }}>Planet</th>
              <th style={{ color: 'var(--background)' }}>Total Score</th>
              <th style={{ color: 'var(--background)' }}>Result</th>
            </tr>
          </thead>
          <tbody>
            {PLANET_LABELS.map((p, i) => {
              const pData = data[p.full];
              if (!pData) return null;
              
              let result = "Inauspicious";
              const score = pData.totalScore;
              if (score >= 15) result = "Excellent";
              else if (score >= 10) result = "Good";
              else if (score >= 5) result = "Average";

              return (
                <tr key={p.full} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(232, 220, 203, 0.3)' }}>
                  <td><strong>{p.full}</strong></td>
                  <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{score.toFixed(2)}</td>
                  <td style={{ color: score >= 10 ? '#10b981' : (score >= 5 ? '#f59e0b' : '#ef4444'), fontWeight: 600 }}>{result}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.6', marginTop: '1rem' }}>
        <strong>Note:</strong> Vimshopak Bala assesses the dignity of a planet across 16 divisional charts. A score of 15-20 is Excellent, 10-15 is Good, 5-10 is Average, and below 5 is Inauspicious.
      </div>
    </div>
  );
}
