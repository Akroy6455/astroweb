import { PlanetPosition } from './yoga_engine/types';

export const NAKSHATRAS_28 = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
  "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
  "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
  "Mula", "Purva Ashadha", "Uttara Ashadha", "Abhijit", "Shravana", "Dhanishta", 
  "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"
];

// Grid mapping for 28 Nakshatras in SBC
const SBC_GRID: (string | null)[][] = Array(9).fill(null).map(() => Array(9).fill(null));

// North Wall (Row 0)
SBC_GRID[0][1] = 'Dhanishta'; SBC_GRID[0][2] = 'Shatabhisha'; SBC_GRID[0][3] = 'Purva Bhadrapada';
SBC_GRID[0][4] = 'Uttara Bhadrapada'; SBC_GRID[0][5] = 'Revati'; SBC_GRID[0][6] = 'Ashwini'; SBC_GRID[0][7] = 'Bharani';

// East Wall (Col 8)
SBC_GRID[1][8] = 'Krittika'; SBC_GRID[2][8] = 'Rohini'; SBC_GRID[3][8] = 'Mrigashira';
SBC_GRID[4][8] = 'Ardra'; SBC_GRID[5][8] = 'Punarvasu'; SBC_GRID[6][8] = 'Pushya'; SBC_GRID[7][8] = 'Ashlesha';

// South Wall (Row 8) - Reversed order visually
SBC_GRID[8][7] = 'Magha'; SBC_GRID[8][6] = 'Purva Phalguni'; SBC_GRID[8][5] = 'Uttara Phalguni';
SBC_GRID[8][4] = 'Hasta'; SBC_GRID[8][3] = 'Chitra'; SBC_GRID[8][2] = 'Swati'; SBC_GRID[8][1] = 'Vishakha';

// West Wall (Col 0) - Reversed order visually
SBC_GRID[7][0] = 'Anuradha'; SBC_GRID[6][0] = 'Jyeshtha'; SBC_GRID[5][0] = 'Mula';
SBC_GRID[4][0] = 'Purva Ashadha'; SBC_GRID[3][0] = 'Uttara Ashadha'; SBC_GRID[2][0] = 'Abhijit'; SBC_GRID[1][0] = 'Shravana';

const NAK_TO_POS: Record<string, [number, number]> = {};
for (let r = 0; r < 9; r++) {
  for (let c = 0; c < 9; c++) {
    const val = SBC_GRID[r][c];
    if (val) NAK_TO_POS[val] = [r, c];
  }
}

export function getNak28Index(longitude: number): number {
  // Rough mapping to 28 nakshatras. Abhijit spans from 276.66 deg to 280.9 deg
  if (longitude >= 276.6667 && longitude < 280.9) return 21; // Abhijit
  
  // Standard 27 Nakshatras indexing mapping
  let n27 = Math.floor(longitude / (360/27));
  
  // If it's passed Abhijit, shift the index for 28 nakshatras array mapping
  if (longitude >= 280.9) {
    // 27-nakshatra index of Shravana is 21. In 28 it is 22.
    // So for long > 280.9, we add +1 to map it to NAKSHATRAS_28 indices.
    // Let's just directly map 27 index to 28 index
    // 0..19 are same (Ashwini to U.Ashadha)
    // Abhijit is 21
    if (n27 >= 20) n27 += 1;
  }
  
  return n27 % 28;
}

export function getKarmaNakshatra(moonLong: number): string {
  const moonIndex = getNak28Index(moonLong);
  const karmaIndex = (moonIndex + 9) % 28; // 10th nakshatra is index + 9
  return NAKSHATRAS_28[karmaIndex];
}

export function getSampatNakshatra(moonLong: number): string {
  const moonIndex = getNak28Index(moonLong);
  const sampatIndex = (moonIndex + 1) % 28; // 2nd nakshatra from Moon
  return NAKSHATRAS_28[sampatIndex];
}

export function getAadhanaNakshatra(moonLong: number): string {
  const moonIndex = getNak28Index(moonLong);
  const aadhanaIndex = (moonIndex + 18) % 28; // 19th nakshatra from Moon
  return NAKSHATRAS_28[aadhanaIndex];
}



export function getAbhishekaNakshatra(moonLong: number): string {
  const moonIndex = getNak28Index(moonLong);
  const abhishekaIndex = (moonIndex + 26) % 28; // 27th nakshatra from Moon
  return NAKSHATRAS_28[abhishekaIndex];
}

export function getNaidhanaNakshatra(moonLong: number): string {
  const moonIndex = getNak28Index(moonLong);
  const naidhanaIndex = (moonIndex + 6) % 28; // 7th nakshatra from Moon
  return NAKSHATRAS_28[naidhanaIndex];
}

export function getVainasikaNakshatra(moonLong: number): string {
  const moonIndex = getNak28Index(moonLong);
  const vainasikaIndex = (moonIndex + 21) % 28; // 22nd nakshatra from Moon
  return NAKSHATRAS_28[vainasikaIndex];
}

// LATTA
export function getLatta(planetName: string, planetLong: number): string | null {
  const nakIndex = getNak28Index(planetLong);
  let lattaIndex = -1;
  
  switch (planetName) {
    case 'Sun': lattaIndex = (nakIndex + 12 - 1) % 28; break; // 12th Fwd
    case 'Moon': lattaIndex = (nakIndex - 22 + 1 + 28) % 28; break; // 22nd Bwd
    case 'Mars': lattaIndex = (nakIndex + 3 - 1) % 28; break; // 3rd Fwd
    case 'Mercury': lattaIndex = (nakIndex - 7 + 1 + 28) % 28; break; // 7th Bwd
    case 'Jupiter': lattaIndex = (nakIndex + 6 - 1) % 28; break; // 6th Fwd
    case 'Venus': lattaIndex = (nakIndex - 5 + 1 + 28) % 28; break; // 5th Bwd
    case 'Saturn': lattaIndex = (nakIndex + 8 - 1) % 28; break; // 8th Fwd
    case 'Rahu': lattaIndex = (nakIndex - 9 + 1 + 28) % 28; break; // 9th Bwd
    case 'Ketu': lattaIndex = (nakIndex - 9 + 1 + 28) % 28; break; // Same as Rahu
  }
  
  if (lattaIndex >= 0) return NAKSHATRAS_28[lattaIndex];
  return null;
}

// VEDHA
export function getVedhaNakshatras(planetName: string, planetLong: number, speed: number, isRetrograde: boolean): string[] {
  const nakName = NAKSHATRAS_28[getNak28Index(planetLong)];
  const pos = NAK_TO_POS[nakName];
  if (!pos) return [];
  
  const [r, c] = pos;
  const vedhas: string[] = [];
  
  const addLine = (dr: number, dc: number) => {
    let currR = r + dr;
    let currC = c + dc;
    while (currR >= 0 && currR <= 8 && currC >= 0 && currC <= 8) {
      const val = SBC_GRID[currR][currC];
      if (val) vedhas.push(val);
      currR += dr;
      currC += dc;
    }
  };
  
  // Front Vedha
  const addFront = () => {
    if (r === 0) addLine(1, 0);
    else if (r === 8) addLine(-1, 0);
    else if (c === 0) addLine(0, 1);
    else if (c === 8) addLine(0, -1);
  };

  // Right/Left Vedha (Diagonals)
  const addRight = () => {
    if (r === 0) addLine(1, -1);
    else if (r === 8) addLine(-1, 1);
    else if (c === 0) addLine(-1, 1);
    else if (c === 8) addLine(1, -1);
  };
  
  const addLeft = () => {
    if (r === 0) addLine(1, 1);
    else if (r === 8) addLine(-1, -1);
    else if (c === 0) addLine(1, 1);
    else if (c === 8) addLine(-1, -1);
  };
  
  if (['Sun', 'Moon', 'Rahu', 'Ketu'].includes(planetName)) {
    addFront();
    addRight();
    addLeft();
  } else {
    // Tara Grahas
    const isFast = Math.abs(speed) > (
      planetName === 'Mars' ? 0.6 :
      planetName === 'Mercury' ? 1.5 :
      planetName === 'Jupiter' ? 0.2 :
      planetName === 'Venus' ? 1.2 :
      planetName === 'Saturn' ? 0.1 : 99
    );
    
    if (isRetrograde) {
      addLeft();
    } else if (isFast) {
      addRight();
    } else {
      addFront();
    }
  }
  
  return vedhas;
}
