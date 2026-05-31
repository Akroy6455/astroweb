import React from 'react';

type ShadbalaProps = {
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

function BarChartPanel({ title, dataKey, data, isPercentage = false }: { title: string, dataKey: string | ((p: any) => number), data: any, isPercentage?: boolean }) {
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
                {isPercentage ? Math.round(d.value) : Number.isInteger(d.value) ? d.value : d.value.toFixed(1)}
              </div>

              {/* Bar */}
              <div style={{
                position: 'absolute',
                width: '84%',
                left: '8%',
                height: `${heightPct}%`,
                background: d.value >= 0 ? '#b68e5b' : '#5E7C7B', // gold/brown for pos, dusty teal for neg
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

export default function ShadbalaTable({ data }: ShadbalaProps) {
  if (!data) return null;

  return (
    <div style={{ marginTop: '1rem' }}>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '0.5rem',
        marginBottom: '1rem'
      }}>
        <BarChartPanel title="Sthaana Bala" data={data} dataKey="sthanaBala" />
        <BarChartPanel title="Kaala Bala" data={data} dataKey="kalaBala" />
        <BarChartPanel title="DigBala" data={data} dataKey="digBala" />
        <BarChartPanel title="Cheshta Bala" data={data} dataKey="chestaBala" />
        <BarChartPanel title="DrigBala" data={data} dataKey="drikBala" />
        <BarChartPanel title="Naisargika Bala" data={data} dataKey="naisargikaBala" />
        <BarChartPanel title="Shadbala" data={data} dataKey="totalViras" />
        <BarChartPanel title="Shadbala (rupas)" data={data} dataKey="totalRupas" />
        <BarChartPanel title="Shadbala (% strength)" data={data} dataKey={(p) => (p.totalRupas / p.requiredRupas) * 100} isPercentage={true} />
      </div>

      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
        <strong>Note:</strong> Required Rupas per BPHS: Sun 6.5 | Moon 6.0 | Mars 5.0 | Mercury 7.0 | Jupiter 6.5 | Venus 5.5 | Saturn 5.0. 1 Rupa = 60 Virupas.
      </div>
    </div>
  );
}
