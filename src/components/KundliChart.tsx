import React from 'react';

type Planet = { short: string, name: string, retrograde?: boolean };
type House = { house: number, signIndex: number, planets: Planet[] };
type KundliData = { lagna: any, houses: House[] };

export default function KundliChart({ data }: { data: KundliData | null }) {
  if (!data) return <div className="kundli-placeholder">Fill the form to generate Kundli</div>;

  // The 12 house positions in a North Indian chart (X, Y for text rendering)
  // Scale 0 to 100
  const housePositions = {
    1: { x: 50, y: 25 },
    2: { x: 25, y: 10 },
    3: { x: 10, y: 25 },
    4: { x: 25, y: 50 },
    5: { x: 10, y: 75 },
    6: { x: 25, y: 90 },
    7: { x: 50, y: 75 },
    8: { x: 75, y: 90 },
    9: { x: 90, y: 75 },
    10: { x: 75, y: 50 },
    11: { x: 90, y: 25 },
    12: { x: 75, y: 10 },
  };

  const specialNames = ['Mandi', 'Gulika', 'Dhooma', 'Vyatipata', 'Parivesha', 'Indrachapa', 'Upaketu', 'Uranus', 'Neptune', 'Pluto'];

  const renderPlanets = (planets: Planet[], x: number, y: number) => {
    if (!planets || planets.length === 0) return null;
    return (
      <text x={`${x}%`} y={`${y}%`} className="planet-text" textAnchor="middle" dominantBaseline="middle">
        {planets.map((p, index) => {
          const isSpecial = specialNames.includes(p.name);
          const textStr = p.short + (p.retrograde ? '(R)' : '') + (index < planets.length - 1 ? ', ' : '');
          return (
            <tspan key={p.name} fill={isSpecial ? '#3b82f6' : 'currentColor'} style={isSpecial ? { fontSize: '0.65em' } : {}}>
              {textStr}
            </tspan>
          );
        })}
      </text>
    );
  };

  const renderSignNum = (signIndex: number, x: number, y: number) => {
    return (
      <text x={`${x}%`} y={`${y}%`} className="sign-text" textAnchor="middle" dominantBaseline="middle">
        {signIndex + 1}
      </text>
    );
  };

  // small offset for sign numbers so they don't overlap with planets
  const signOffsets = {
    1: { dx: 0, dy: -10 },
    2: { dx: -5, dy: -5 },
    3: { dx: -5, dy: 5 },
    4: { dx: 0, dy: -10 },
    5: { dx: -5, dy: -5 },
    6: { dx: -5, dy: 5 },
    7: { dx: 0, dy: 10 },
    8: { dx: 5, dy: 5 },
    9: { dx: 5, dy: -5 },
    10: { dx: 0, dy: 10 },
    11: { dx: 5, dy: 5 },
    12: { dx: 5, dy: -5 },
  };

  return (
    <div className="chart-container">
      <svg viewBox="0 0 100 100" className="kundli-svg">
        <rect x="2" y="2" width="96" height="96" className="chart-border" />
        
        {/* Diagonals */}
        <line x1="2" y1="2" x2="98" y2="98" className="chart-line" />
        <line x1="2" y1="98" x2="98" y2="2" className="chart-line" />
        
        {/* Inner Diamond */}
        <line x1="50" y1="2" x2="98" y2="50" className="chart-line" />
        <line x1="98" y1="50" x2="50" y2="98" className="chart-line" />
        <line x1="50" y1="98" x2="2" y2="50" className="chart-line" />
        <line x1="2" y1="50" x2="50" y2="2" className="chart-line" />

        {/* Render Houses Data */}
        {data.houses.map((houseObj) => {
          const pos = housePositions[houseObj.house as keyof typeof housePositions];
          const offset = signOffsets[houseObj.house as keyof typeof signOffsets];
          return (
            <g key={houseObj.house}>
              {renderSignNum(houseObj.signIndex, pos.x + offset.dx, pos.y + offset.dy)}
              {renderPlanets(houseObj.planets, pos.x, pos.y)}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
