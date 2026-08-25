import React from 'react';
import { Arrow } from '@/lib/vedhaLatta';

type Planet = { short: string, name: string, retrograde?: boolean };
type House = { house: number, signIndex: number, planets: Planet[] };
type KundliData = { lagna: any, houses: House[] };

export default function SouthIndianChart({ data, arrows = [] }: { data: KundliData | null, arrows?: Arrow[] }) {
  if (!data) return <div className="kundli-placeholder">Fill the form to generate Kundli</div>;

  const signPositions: Record<number, { x: number, y: number }> = {
    0: { x: 37.5, y: 12.5 }, 
    1: { x: 62.5, y: 12.5 }, 
    2: { x: 87.5, y: 12.5 }, 
    3: { x: 87.5, y: 37.5 }, 
    4: { x: 87.5, y: 62.5 }, 
    5: { x: 87.5, y: 87.5 }, 
    6: { x: 62.5, y: 87.5 }, 
    7: { x: 37.5, y: 87.5 }, 
    8: { x: 12.5, y: 87.5 }, 
    9: { x: 12.5, y: 62.5 }, 
    10: { x: 12.5, y: 37.5 }, 
    11: { x: 12.5, y: 12.5 }, 
  };

  const specialNames = ['Mandi', 'Gulika', 'Yamaghantak', 'Dhooma', 'Vyatipata', 'Parivesha', 'Indrachapa', 'Upaketu', 'Uranus', 'Neptune', 'Pluto'];

  const renderPlanets = (planets: Planet[], isAscendant: boolean, x: number, y: number) => {
    const lines = [];
    if (isAscendant) {
      lines.push(<tspan key="asc" x={`${x}%`} dy="-1.2em" fill="var(--primary)" fontWeight="bold">Asc</tspan>);
    }

    if (planets && planets.length > 0) {
      planets.forEach((p) => {
        const isSpecial = specialNames.includes(p.name);
        const pStr = p.short + (p.retrograde ? '(R)' : '');
        lines.push(
          <tspan 
            key={p.name} 
            x={`${x}%`} 
            dy={lines.length > 0 ? "1.2em" : (isAscendant ? "1.2em" : "0")} 
            fill={isSpecial ? '#3b82f6' : 'currentColor'} 
            style={isSpecial ? { fontSize: '0.75em' } : {}}
          >
            {pStr}
          </tspan>
        );
      });
    }

    if (lines.length === 0) return null;

    const totalLines = lines.length;
    const startYOffset = (totalLines - 1) * 0.6; 

    return (
      <text x={`${x}%`} y={`${y}%`} className="planet-text" textAnchor="middle" dominantBaseline="middle" transform={`translate(0, -${startYOffset * 5})`}>
        {lines}
      </text>
    );
  };

  return (
    <div className="kundli-container">
      <svg viewBox="0 0 100 100" className="kundli-svg" preserveAspectRatio="xMidYMid meet">
        <defs>
          <marker id="arrowhead-red" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <polygon points="0 0, 6 3, 0 6" fill="#ef4444" />
          </marker>
          <marker id="arrowhead-purple" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <polygon points="0 0, 6 3, 0 6" fill="#a855f7" />
          </marker>
        </defs>
        <rect x="0" y="0" width="100" height="100" fill="none" stroke="var(--chart-line)" strokeWidth="0.5" />
        <rect x="25" y="25" width="50" height="50" fill="none" stroke="var(--chart-line)" strokeWidth="0.5" />
        
        {/* Top hashes */}
        <line x1="25" y1="0" x2="25" y2="25" stroke="var(--chart-line)" strokeWidth="0.5" />
        <line x1="50" y1="0" x2="50" y2="25" stroke="var(--chart-line)" strokeWidth="0.5" />
        <line x1="75" y1="0" x2="75" y2="25" stroke="var(--chart-line)" strokeWidth="0.5" />
        
        {/* Bottom hashes */}
        <line x1="25" y1="75" x2="25" y2="100" stroke="var(--chart-line)" strokeWidth="0.5" />
        <line x1="50" y1="75" x2="50" y2="100" stroke="var(--chart-line)" strokeWidth="0.5" />
        <line x1="75" y1="75" x2="75" y2="100" stroke="var(--chart-line)" strokeWidth="0.5" />
        
        {/* Left hashes */}
        <line x1="0" y1="25" x2="25" y2="25" stroke="var(--chart-line)" strokeWidth="0.5" />
        <line x1="0" y1="50" x2="25" y2="50" stroke="var(--chart-line)" strokeWidth="0.5" />
        <line x1="0" y1="75" x2="25" y2="75" stroke="var(--chart-line)" strokeWidth="0.5" />
        
        {/* Right hashes */}
        <line x1="75" y1="25" x2="100" y2="25" stroke="var(--chart-line)" strokeWidth="0.5" />
        <line x1="75" y1="50" x2="100" y2="50" stroke="var(--chart-line)" strokeWidth="0.5" />
        <line x1="75" y1="75" x2="100" y2="75" stroke="var(--chart-line)" strokeWidth="0.5" />

        
        {/* Arrows */}
        {arrows.map((arrow, idx) => {
          const pos1 = signPositions[arrow.fromSign];
          const pos2 = signPositions[arrow.toSign];
          if (!pos1 || !pos2) return null;
          
          const dx = pos2.x - pos1.x;
          const dy = pos2.y - pos1.y;
          const len = Math.sqrt(dx*dx + dy*dy);
          if (len === 0) return null;
          
          const pad = 10;
          const shrinkX = (dx / len) * pad;
          const shrinkY = (dy / len) * pad;
          
          const x1 = pos1.x + shrinkX;
          const y1 = pos1.y + shrinkY;
          const x2 = pos2.x - shrinkX;
          const y2 = pos2.y - shrinkY;
          
          const isVedha = arrow.color.includes('ef4444');
          const markerId = isVedha ? 'url(#arrowhead-red)' : 'url(#arrowhead-purple)';
          
          return (
            <g key={`arrow-${idx}`}>
              <line x1={`${x1}%`} y1={`${y1}%`} x2={`${x2}%`} y2={`${y2}%`} stroke={arrow.color} strokeWidth="0.8" markerEnd={markerId} strokeDasharray="2,2" opacity="0.8" />
            </g>
          );
        })}

        {data.houses.map(h => {
          if (h.house === 1) {
            const pos = signPositions[h.signIndex];
            if (pos) {
              const x1 = pos.x - 12.5;
              const y1 = pos.y - 12.5;
              const x2 = pos.x + 12.5;
              const y2 = pos.y + 12.5;
              const x3 = pos.x - 12.5;
              const y3 = pos.y + 12.5;
              const x4 = pos.x + 12.5;
              const y4 = pos.y - 12.5;
              return (
                <g key="asc-cross">
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--chart-line)" strokeWidth="0.2" opacity="0.3" />
                  <line x1={x3} y1={y3} x2={x4} y2={y4} stroke="var(--chart-line)" strokeWidth="0.2" opacity="0.3" />
                </g>
              );
            }
          }
          return null;
        })}

        
        {/* Arrows */}
        {arrows.map((arrow, idx) => {
          const pos1 = signPositions[arrow.fromSign];
          const pos2 = signPositions[arrow.toSign];
          if (!pos1 || !pos2) return null;
          
          const dx = pos2.x - pos1.x;
          const dy = pos2.y - pos1.y;
          const len = Math.sqrt(dx*dx + dy*dy);
          if (len === 0) return null;
          
          const pad = 10;
          const shrinkX = (dx / len) * pad;
          const shrinkY = (dy / len) * pad;
          
          const x1 = pos1.x + shrinkX;
          const y1 = pos1.y + shrinkY;
          const x2 = pos2.x - shrinkX;
          const y2 = pos2.y - shrinkY;
          
          const isVedha = arrow.color.includes('ef4444');
          const markerId = isVedha ? 'url(#arrowhead-red)' : 'url(#arrowhead-purple)';
          
          return (
            <g key={`arrow-${idx}`}>
              <line x1={`${x1}%`} y1={`${y1}%`} x2={`${x2}%`} y2={`${y2}%`} stroke={arrow.color} strokeWidth="0.8" markerEnd={markerId} strokeDasharray="2,2" opacity="0.8" />
            </g>
          );
        })}

        {data.houses.map(h => {
          const pos = signPositions[h.signIndex];
          if (!pos) return null;
          const isAsc = (h.house === 1);
          return (
            <g key={`sign-${h.signIndex}`}>
              {renderPlanets(h.planets, isAsc, pos.x, pos.y)}
            </g>
          );
        })}
      </svg>
    </div>
  );
}