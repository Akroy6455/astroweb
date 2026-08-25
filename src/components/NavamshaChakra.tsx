import React from 'react';

type ChakraProps = {
  data: any;
};

export default function NavamshaChakra({ data }: ChakraProps) {
  if (!data) return <div className="kundli-placeholder">Fill the form to generate Chakra</div>;

  const cx = 500;
  const cy = 500;
  
  // Radii for the rings
  const rDot = 10;
  const rInner = 120; // 12 Rasis
  const rMid = 240;   // 27 Nakshatras
  const rOuter = 340; // 108 Navamshas
  const rEdge = 380;  // Outer rim

  // Render 12 Rasi divisions
  const rasiLines = [];
  const rasiTexts = [];
  for (let i = 0; i < 12; i++) {
    const angle = i * 30;
    // Lines
    rasiLines.push(
      <line key={`r-line-${i}`} x1={cx} y1={cy - rDot} x2={cx} y2={cy - rEdge} 
            stroke="var(--border)" strokeWidth="2" transform={`rotate(${angle}, ${cx}, ${cy})`} />
    );
    // Text placed in the middle of the 30deg slice (15deg offset)
    rasiTexts.push(
      <text key={`r-text-${i}`} x={cx} y={cy - (rInner + rDot) / 2} 
            className="chakra-text-large" dominantBaseline="middle" textAnchor="middle"
            transform={`rotate(${angle + 15}, ${cx}, ${cy})`}>
        {((12 - i) % 12) + 1} {/* Reverse order for standard Vedic counter-clockwise mapping or keep standard? 
                                Actually standard vedic charts map Aries(1) at 0 deg, counting counter-clockwise.
                                Let's map 0 degrees to East (Right) or Top. 
                                In the user's image, Aries (1) is at the top right, Taurus (2) is top left...
                                So it goes counter-clockwise.
                                SVG rotate goes clockwise. So angle = -i * 30 or we just flip the text. */}
      </text>
    );
  }

  // To match the user's image, let's just make it standard: 0 deg is Top, counting clockwise.
  // Wait, the user's image has 12 at Top Right, 1 at Top, 2 at Top Left. 
  // It's counter-clockwise. Let's adjust angles to be counter-clockwise by using negative rotations.

  const nakshatras = [
    "ASWI", "BHAR", "KRIT", "ROHI", "MRIG", "ARDR", "PUNA", "PUSH", "ASLE",
    "MAGH", "P PH", "U PH", "HAST", "CHIT", "SWAT", "VISH", "ANUR", "JYES",
    "MOOL", "P ASH", "U ASH", "SRAV", "DHAN", "SHAT", "P BH", "U BH", "REVA"
  ];

  const nakLines = [];
  const nakTexts = [];
  const degPerNak = 360 / 27;
  for (let i = 0; i < 27; i++) {
    const angle = i * degPerNak;
    nakLines.push(
      <line key={`n-line-${i}`} x1={cx} y1={cy - rInner} x2={cx} y2={cy - rEdge} 
            stroke="var(--border)" strokeWidth="1" transform={`rotate(${-angle}, ${cx}, ${cy})`} />
    );
    // Text
    nakTexts.push(
      <text key={`n-text-${i}`} x={cx} y={cy - (rMid + rInner) / 2} 
            className="chakra-text-small" dominantBaseline="middle" textAnchor="middle"
            transform={`rotate(${-(angle + degPerNak / 2)}, ${cx}, ${cy}) rotate(90, ${cx}, ${cy - (rMid + rInner) / 2})`}>
        {nakshatras[i]}
      </text>
    );
  }

  const navLines = [];
  const navTexts = [];
  const degPerNav = 360 / 108;
  for (let i = 0; i < 108; i++) {
    const angle = i * degPerNav;
    navLines.push(
      <line key={`v-line-${i}`} x1={cx} y1={cy - rMid} x2={cx} y2={cy - rEdge} 
            stroke="var(--border)" strokeWidth="0.5" transform={`rotate(${-angle}, ${cx}, ${cy})`} />
    );
    
    // Which Navamsha sign is this?
    // rasiIndex = Math.floor(i / 9)
    // part = i % 9
    const rasiIndex = Math.floor(i / 9);
    let startSignIndex = 0;
    if ([0, 4, 8].includes(rasiIndex)) startSignIndex = 0;
    if ([1, 5, 9].includes(rasiIndex)) startSignIndex = 9;
    if ([2, 6, 10].includes(rasiIndex)) startSignIndex = 6;
    if ([3, 7, 11].includes(rasiIndex)) startSignIndex = 3;
    const navSign = (startSignIndex + (i % 9)) % 12 + 1;

    navTexts.push(
      <text key={`v-text-${i}`} x={cx} y={cy - (rOuter + rMid) / 2} 
            className="chakra-text-tiny" dominantBaseline="middle" textAnchor="middle"
            transform={`rotate(${-(angle + degPerNav / 2)}, ${cx}, ${cy}) rotate(90, ${cx}, ${cy - (rOuter + rMid) / 2})`}>
        {navSign}
      </text>
    );
  }

  // Draw planets on the outside
  const planetMarkers: any[] = [];
  const allPos = [...data.positions];
  if (data.lagna) {
    allPos.push({ name: 'Ascendant', short: 'ASD', longitude: data.lagna.longitude });
  }

  const specialNames = ['Mandi', 'Gulika', 'Yamaghantak', 'Dhooma', 'Vyatipata', 'Parivesha', 'Indrachapa', 'Upaketu', 'Uranus', 'Neptune', 'Pluto'];

  allPos.forEach((p, idx) => {
    const angle = p.longitude;
    const isSpecial = specialNames.includes(p.name);
    // Arrow pointing to the edge
    planetMarkers.push(
      <g key={`p-${idx}`} transform={`rotate(${-angle}, ${cx}, ${cy})`}>
        <line x1={cx} y1={cy - rEdge - 10} x2={cx} y2={cy - rEdge - 40} stroke="var(--primary)" strokeWidth="2" />
        <polygon points={`${cx},${cy - rEdge - 5} ${cx - 5},${cy - rEdge - 15} ${cx + 5},${cy - rEdge - 15}`} fill="var(--primary)" />
        <text x={cx} y={cy - rEdge - 50} className="chakra-planet-text" dominantBaseline="middle" textAnchor="middle"
              fill={isSpecial ? '#3b82f6' : 'currentColor'} style={isSpecial ? { fontSize: '0.65em' } : {}}
              transform={`rotate(90, ${cx}, ${cy - rEdge - 50})`}>
          {p.name}
        </text>
      </g>
    );
  });

  const ascLong = data.lagna?.longitude || 0;

  return (
    <div className="chakra-container">
      <svg viewBox="0 0 1000 1000" className="chakra-svg">
        <g transform={`rotate(${ascLong}, ${cx}, ${cy})`}>
          <circle cx={cx} cy={cy} r={rEdge} fill="none" stroke="var(--border)" strokeWidth="2" />
        <circle cx={cx} cy={cy} r={rOuter} fill="none" stroke="var(--border)" strokeWidth="2" />
        <circle cx={cx} cy={cy} r={rMid} fill="none" stroke="var(--border)" strokeWidth="2" />
        <circle cx={cx} cy={cy} r={rInner} fill="none" stroke="var(--border)" strokeWidth="2" />
        <circle cx={cx} cy={cy} r={rDot} fill="var(--text-muted)" />
        
        {rasiLines}
        {nakLines}
        {navLines}

        {/* Add numbers 1-12 for Rasi ring */}
        {Array.from({length: 12}).map((_, i) => (
          <text key={`rt-${i}`} x={cx} y={cy - (rInner + rDot) / 2} 
                className="chakra-text-large" dominantBaseline="middle" textAnchor="middle"
                transform={`rotate(${-(i * 30 + 15)}, ${cx}, ${cy})`}>
            {i + 1}
          </text>
        ))}

        {nakTexts}
        {navTexts}
        {planetMarkers}
        </g>
      </svg>
    </div>
  );
}
