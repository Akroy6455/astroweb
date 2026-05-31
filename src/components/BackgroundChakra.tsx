'use client';
import React from 'react';

export default function BackgroundChakra() {
  const cx = 500;
  const cy = 500;
  
  const rInner = 120;
  const rMid = 240;
  const rOuter = 340;
  const rEdge = 380;

  const lines = [];
  
  // 12 lines
  for (let i = 0; i < 12; i++) {
    lines.push(<line key={`l12-${i}`} x1={cx} y1={cy - 10} x2={cx} y2={cy - rEdge} stroke="#C9A86A" strokeWidth="2" strokeOpacity="0.2" transform={`rotate(${i * 30}, ${cx}, ${cy})`} />);
  }
  // 27 lines
  for (let i = 0; i < 27; i++) {
    lines.push(<line key={`l27-${i}`} x1={cx} y1={cy - rInner} x2={cx} y2={cy - rEdge} stroke="#C9A86A" strokeWidth="1" strokeOpacity="0.15" transform={`rotate(${i * (360/27)}, ${cx}, ${cy})`} />);
  }
  // 108 lines
  for (let i = 0; i < 108; i++) {
    lines.push(<line key={`l108-${i}`} x1={cx} y1={cy - rMid} x2={cx} y2={cy - rEdge} stroke="#C9A86A" strokeWidth="0.5" strokeOpacity="0.1" transform={`rotate(${i * (360/108)}, ${cx}, ${cy})`} />);
  }

  return (
    <>
      <style>{`
        @keyframes bg-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '100vw',
        height: '100vw',
        minWidth: '800px',
        minHeight: '800px',
        maxWidth: '1200px',
        maxHeight: '1200px',
        zIndex: -2,
        pointerEvents: 'none',
        opacity: 0.6
      }}>
        <svg viewBox="0 0 1000 1000" style={{ width: '100%', height: '100%', animation: 'bg-spin 180s linear infinite' }}>
          <circle cx={cx} cy={cy} r={rEdge} fill="none" stroke="#C9A86A" strokeWidth="2" strokeOpacity="0.2" />
          <circle cx={cx} cy={cy} r={rOuter} fill="none" stroke="#C9A86A" strokeWidth="2" strokeOpacity="0.2" />
          <circle cx={cx} cy={cy} r={rMid} fill="none" stroke="#C9A86A" strokeWidth="2" strokeOpacity="0.2" />
          <circle cx={cx} cy={cy} r={rInner} fill="none" stroke="#C9A86A" strokeWidth="2" strokeOpacity="0.2" />
          {lines}
        </svg>
      </div>
    </>
  );
}
