import React, { useEffect, useState, useRef } from 'react';
import { toPng } from 'html-to-image';

interface ClockHourlyData {
  timeIso: string;
  hour: number;
  lagnaSignName: string;
  lagnaBavPoints: number;
  lagnaNakName: string;
  lagnaNavtaraName: string;
  moonBavPoints: number;
  moonNakName: string;
  moonNavtaraName: string;
}

interface PanchangQuartzClockProps {
  title: string;
  startHourOffset: number; // 0, 12, or 24
  data: ClockHourlyData[]; // Should be 12 items
}

export default function PanchangQuartzClock({ title, startHourOffset, data }: PanchangQuartzClockProps) {
  const [now, setNow] = useState(new Date());
  const clockRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleExportPNG = async () => {
    if (!clockRef.current) return;
    try {
      const dataUrl = await toPng(clockRef.current, { backgroundColor: '#1a1a1a' });
      const link = document.createElement('a');
      link.download = `PanchangClock_${title.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export clock as PNG', err);
    }
  };

  const size = 520;
  const cx = size / 2;
  const cy = size / 2;
  const innerR = 130;
  const outerR = 250;

  // Render a wedge path
  const describeArc = (x: number, y: number, r: number, startAngle: number, endAngle: number) => {
    const midAngle = ((startAngle + endAngle) / 2) % 360;
    const isBottomHalf = midAngle > 90 && midAngle < 270;
    
    if (isBottomHalf) {
      // Counter-clockwise so text is right-side up
      const start = polarToCartesian(x, y, r, endAngle);
      const end = polarToCartesian(x, y, r, startAngle);
      return [
        "M", start.x, start.y, 
        "A", r, r, 0, 0, 0, end.x, end.y
      ].join(" ");
    } else {
      // Clockwise so text is right-side up
      const start = polarToCartesian(x, y, r, startAngle);
      const end = polarToCartesian(x, y, r, endAngle);
      return [
        "M", start.x, start.y, 
        "A", r, r, 0, 0, 1, end.x, end.y
      ].join(" ");
    }
  };

  const describeWedge = (x: number, y: number, r1: number, r2: number, startAngle: number, endAngle: number) => {
    const p1 = polarToCartesian(x, y, r1, endAngle);
    const p2 = polarToCartesian(x, y, r1, startAngle);
    const p3 = polarToCartesian(x, y, r2, startAngle);
    const p4 = polarToCartesian(x, y, r2, endAngle);
    
    return [
      "M", p1.x, p1.y,
      "A", r1, r1, 0, 0, 0, p2.x, p2.y,
      "L", p3.x, p3.y,
      "A", r2, r2, 0, 0, 1, p4.x, p4.y,
      "Z"
    ].join(" ");
  };

  function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  }

  // Determine if this clock is currently active for the hands
  const firstHourIso = data[0]?.timeIso;
  const startTs = firstHourIso ? new Date(firstHourIso).getTime() : 0;
  const endTs = startTs + 12 * 3600 * 1000;
  const isCurrentClock = now.getTime() >= startTs && now.getTime() < endTs;

  // Hands calculation (if current clock)
  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentSeconds = now.getSeconds();
  
  // Angle for 12 hours = 360, so 1 hour = 30 deg. (clock starts at 0 = top)
  const hourAngle = (currentHours % 12) * 30 + (currentMinutes / 60) * 30;
  const minuteAngle = currentMinutes * 6 + (currentSeconds / 60) * 6;
  const secondAngle = currentSeconds * 6;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '1rem' }}>
      <div ref={clockRef} style={{ background: 'var(--background)', padding: '1rem', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h3 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>{title}</h3>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <defs>
            <radialGradient id="clockFace" cx="50%" cy="50%" r="50%">
              <stop offset="80%" stopColor="var(--card-bg)" />
              <stop offset="100%" stopColor="var(--bg)" />
            </radialGradient>
          </defs>
          
          {/* Outer Wedges */}
          {data.map((hourData, i) => {
            const startAngle = i * 30;
            const endAngle = (i + 1) * 30;
            
            // Draw wedge background
            const isCurrentHour = isCurrentClock && currentHours === new Date(hourData.timeIso).getHours();
            const wedgeFill = isCurrentHour ? 'rgba(201, 168, 106, 0.2)' : (i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.1)');
            
            return (
              <g key={i}>
                <path 
                  d={describeWedge(cx, cy, innerR, outerR, startAngle, endAngle)} 
                  fill={wedgeFill} 
                  stroke="var(--border)" 
                  strokeWidth="1"
                />
                
                {/* Text arc paths */}
                <path id={`arc-L1-${startHourOffset}-${i}`} d={describeArc(cx, cy, innerR + 100, startAngle, endAngle)} fill="none" />
                <path id={`arc-L2-${startHourOffset}-${i}`} d={describeArc(cx, cy, innerR + 65, startAngle, endAngle)} fill="none" />
                <path id={`arc-L3-${startHourOffset}-${i}`} d={describeArc(cx, cy, innerR + 30, startAngle, endAngle)} fill="none" />
                
                {/* Lagna BAV */}
                <text fontSize="12" fill="var(--primary)" fontWeight="bold" textAnchor="middle">
                  <textPath href={`#arc-L1-${startHourOffset}-${i}`} startOffset="50%">
                    L: {hourData.lagnaBavPoints} pts
                  </textPath>
                </text>
                
                {/* Lagna Nak & Navtara */}
                <text fontSize="11" fill="var(--foreground)" fontWeight="bold" textAnchor="middle">
                  <textPath href={`#arc-L2-${startHourOffset}-${i}`} startOffset="50%">
                    {hourData.lagnaNakName.substring(0,4)}-{hourData.lagnaNavtaraName.substring(0,4)}
                  </textPath>
                </text>

                {/* Moon Nak & Navtara */}
                <text fontSize="11" fill="var(--foreground)" fontWeight="bold" textAnchor="middle">
                  <textPath href={`#arc-L3-${startHourOffset}-${i}`} startOffset="50%">
                    M: {hourData.moonBavPoints}p {hourData.moonNakName.substring(0,3)}-{hourData.moonNavtaraName.substring(0,3)}
                  </textPath>
                </text>
              </g>
            );
          })}

          {/* Circular Dividers for Outer Rings */}
          <circle cx={cx} cy={cy} r={innerR + 40} fill="none" stroke="var(--border)" strokeWidth="1" />
          <circle cx={cx} cy={cy} r={innerR + 80} fill="none" stroke="var(--border)" strokeWidth="1" />
          <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="var(--border)" strokeWidth="1" />

          {/* Inner Clock Face */}
          <circle cx={cx} cy={cy} r={innerR} fill="url(#clockFace)" stroke="var(--primary)" strokeWidth="2" />
          
          {/* Clock Hour Numbers and Lagna Sign */}
          {[...Array(12)].map((_, i) => {
            const hourNum = i === 0 ? 12 : i;
            const posNum = polarToCartesian(cx, cy, innerR - 15, i * 30);
            const posSign = polarToCartesian(cx, cy, innerR - 35, i * 30);
            const hourData = data[i];
            return (
              <g key={i}>
                <text 
                  x={posNum.x} 
                  y={posNum.y} 
                  fontSize="16" 
                  fill="var(--foreground)" 
                  textAnchor="middle" 
                  dominantBaseline="middle"
                  fontWeight="bold"
                >
                  {hourNum}
                </text>
                <text 
                  x={posSign.x} 
                  y={posSign.y} 
                  fontSize="10" 
                  fill="var(--primary)" 
                  textAnchor="middle" 
                  dominantBaseline="middle"
                  fontWeight="bold"
                >
                  {hourData?.lagnaSignName.substring(0, 3).toUpperCase()}
                </text>
              </g>
            );
          })}
          
          {/* Clock Ticks */}
          {[...Array(60)].map((_, i) => {
            const isHour = i % 5 === 0;
            const p1 = polarToCartesian(cx, cy, innerR, i * 6);
            const p2 = polarToCartesian(cx, cy, innerR - (isHour ? 6 : 3), i * 6);
            return (
              <line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="var(--primary)" strokeWidth={isHour ? 2 : 1} />
            );
          })}

          {/* Moving Hands */}
          {isCurrentClock && (
            <g>
              {/* Hour Hand */}
              <line 
                x1={cx} y1={cy} 
                x2={polarToCartesian(cx, cy, innerR * 0.5, hourAngle).x} 
                y2={polarToCartesian(cx, cy, innerR * 0.5, hourAngle).y} 
                stroke="var(--foreground)" strokeWidth="4" strokeLinecap="round" 
              />
              {/* Minute Hand */}
              <line 
                x1={cx} y1={cy} 
                x2={polarToCartesian(cx, cy, innerR * 0.75, minuteAngle).x} 
                y2={polarToCartesian(cx, cy, innerR * 0.75, minuteAngle).y} 
                stroke="var(--foreground)" strokeWidth="3" strokeLinecap="round" 
              />
              {/* Second Hand */}
              <line 
                x1={cx} y1={cy} 
                x2={polarToCartesian(cx, cy, innerR * 0.85, secondAngle).x} 
                y2={polarToCartesian(cx, cy, innerR * 0.85, secondAngle).y} 
                stroke="#ef4444" strokeWidth="1" strokeLinecap="round" 
              />
              {/* Center Pivot */}
              <circle cx={cx} cy={cy} r="4" fill="#ef4444" />
            </g>
          )}
          
          {!isCurrentClock && (
            <text x={cx} y={cy} fontSize="14" fill="var(--text-muted)" textAnchor="middle" dominantBaseline="middle">
              (Not Current Time)
            </text>
          )}
        </svg>
      </div>
      <button 
        onClick={handleExportPNG}
        className="btn-secondary"
        style={{ marginTop: '1rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
      >
        Download Image
      </button>
    </div>
  );
}
