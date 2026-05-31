// Varga Devta (Divisional Chart Deities) Calculator
// Based on Brihat Parashara Hora Shastra (BPHS)

const D7_DEITIES = ['Kshara', 'Ksheera', 'Dadhi', 'Ghritha', 'Ikshu', 'Rasa', 'Suddha Jala'];

const D10_DEITIES = ['Indra', 'Agni', 'Yama', 'Nairriti', 'Varuna', 'Vayu', 'Kubera', 'Isana', 'Brahma', 'Ananta'];

const D12_DEITIES = ['Ganesha', 'Ashwini Kumara', 'Yama', 'Sarpa'];

const D16_ODD = ['Brahma', 'Vishnu', 'Shiva', 'Surya'];
const D16_EVEN = ['Surya', 'Shiva', 'Vishnu', 'Brahma'];

const D20_DEITIES = [
  'Kali', 'Gouri', 'Jaya', 'Lakshmi', 'Vijaya',
  'Vimala', 'Sati', 'Tara', 'Jwalamukhi', 'Shweta',
  'Lohita', 'Shama', 'Pitambari', 'Ghatika', 'Bhima',
  'Mukunda', 'Kalika', 'Chandika', 'Bhairavi', 'Mrida'
];

const D24_DEITIES = [
  'Skanda', 'Parashurama', 'Anala', 'Vishwakarma', 'Bhaga', 'Mitra',
  'Maya', 'Antaka', 'Vrishadhwaja', 'Govinda', 'Madana', 'Bheema'
];

const D27_DEITIES = [
  'Ashwini Kumara', 'Yama', 'Agni', 'Prajapati', 'Soma', 'Rudra',
  'Aditi', 'Brihaspati', 'Sarpa', 'Pitris', 'Bhaga', 'Aryama',
  'Savitur', 'Tvashta', 'Vayu', 'Indra-Agni', 'Mitra', 'Indra',
  'Nirriti', 'Jala', 'Viswadeva', 'Vishnu', 'Vasu', 'Varuna',
  'Ajaikapad', 'Ahirbudhanya', 'Pusha'
];

const D40_DEITIES = [
  'Vishnu', 'Chandra', 'Marichi', 'Tvashta', 'Dhata',
  'Shiva', 'Ravi', 'Yama', 'Yaksha', 'Gandharva',
  'Kala', 'Varuna', 'Kubera', 'Vishwajit', 'Yati',
  'Prithvi', 'Apas', 'Vayu', 'Agni', 'Akasha',
  'Surya', 'Soma', 'Brahma', 'Vishnu', 'Shiva',
  'Yama', 'Kala', 'Himamsha', 'Ganapati', 'Ashwin',
  'Yama', 'Sarpa', 'Ashwini Kumar', 'Agni', 'Vayu',
  'Pushan', 'Ritu', 'Dhata', 'Manu', 'Aditi'
];

const D45_ODD = ['Brahma', 'Shiva', 'Vishnu'];
const D45_EVEN = ['Vishnu', 'Shiva', 'Brahma'];

const D60_DEITIES = [
  'Ghora', 'Rakshasa', 'Deva', 'Kubera', 'Yaksha',
  'Kinnara', 'Bhrashta', 'Kulaghna', 'Garala', 'Agni',
  'Maya', 'Purisha', 'Apampati', 'Marut', 'Kaala',
  'Sarpa', 'Amrita', 'Indu', 'Mridu', 'Komala',
  'Heramba', 'Brahma', 'Vishnu', 'Maheshwara', 'Deva',
  'Ardra', 'Kalinasa', 'Kshitisa', 'Kamalakara', 'Gulika',
  'Mrityu', 'Kaala', 'Davagni', 'Ghora', 'Yama',
  'Kantaka', 'Sudha', 'Amrita', 'Purnachandra', 'Vishadagdha',
  'Kulanasa', 'Vamsakshaya', 'Utpata', 'Kaala', 'Saumya',
  'Komala', 'Sheetala', 'Drashtakarala', 'Indumukha', 'Praveena',
  'Kalagni', 'Dandayudha', 'Nirmala', 'Saumya', 'Krura',
  'Atisheetala', 'Amrita', 'Payodhi', 'Bhramana', 'Chandrarekha'
];

const D60_NATURE: ('B' | 'M')[] = [
  'M','M','B','B','B','B','M','M','M','M',
  'M','M','B','B','M','M','B','B','B','B',
  'B','B','B','B','B','B','B','B','B','M',
  'M','M','M','M','M','M','B','B','B','M',
  'M','M','M','M','B','B','B','M','B','B',
  'M','M','B','B','M','B','B','B','M','B'
];

const SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

const SIGNS_SHORT = ['Ar', 'Ta', 'Ge', 'Ca', 'Le', 'Vi', 'Li', 'Sc', 'Sg', 'Cp', 'Aq', 'Pi'];

// Replicates server-side getDivisionalSign for client-side use
export function getDivisionalSign(signIndex: number, degInSign: number, division: number): number {
  const isOdd = signIndex % 2 === 0;
  const isMovable = [0, 3, 6, 9].includes(signIndex);
  const isFixed = [1, 4, 7, 10].includes(signIndex);
  const isFire = [0, 4, 8].includes(signIndex);
  const isEarth = [1, 5, 9].includes(signIndex);
  const isAir = [2, 6, 10].includes(signIndex);
  const part = Math.min(Math.floor(degInSign / (30 / division)), division - 1);

  switch (division) {
    case 1: return signIndex;
    case 2: { const h = degInSign < 15 ? 0 : 1; return isOdd ? (h === 0 ? 4 : 3) : (h === 0 ? 3 : 4); }
    case 3: { const offsets = [0, 4, 8]; return (signIndex + offsets[part]) % 12; }
    case 4: { let s = signIndex; if (isFixed) s = (signIndex + 3) % 12; else if (!isMovable) s = (signIndex + 6) % 12; return (s + part) % 12; }
    case 5: return (signIndex + part) % 12;
    case 6: { const s = isOdd ? signIndex : (signIndex + 6) % 12; return (s + part) % 12; }
    case 7: { const s = isOdd ? signIndex : (signIndex + 6) % 12; return (s + part) % 12; }
    case 8: { let s = 0; if (isMovable) s = 0; else if (isFixed) s = 8; else s = 4; return (s + part) % 12; }
    case 9: { let s = 0; if (isFire) s = 0; else if (isEarth) s = 9; else if (isAir) s = 6; else s = 3; return (s + part) % 12; }
    case 10: { const s = isOdd ? signIndex : (signIndex + 8) % 12; return (s + part) % 12; }
    case 11: return (signIndex + part) % 12;
    case 12: return (signIndex + part) % 12;
    case 16: { let s = 0; if (isMovable) s = 0; else if (isFixed) s = 4; else s = 8; return (s + part) % 12; }
    case 20: { let s = 0; if (isMovable) s = 0; else if (isFixed) s = 8; else s = 4; return (s + part) % 12; }
    case 24: { const s = isOdd ? 4 : 3; return (s + part) % 12; }
    case 27: { let s = 0; if (isFire) s = 0; else if (isEarth) s = 3; else if (isAir) s = 6; else s = 9; return (s + part) % 12; }
    case 30: {
      if (isOdd) { if (degInSign < 5) return 0; if (degInSign < 10) return 10; if (degInSign < 18) return 8; if (degInSign < 25) return 2; return 6; }
      else { if (degInSign < 5) return 1; if (degInSign < 12) return 5; if (degInSign < 20) return 11; if (degInSign < 25) return 9; return 7; }
    }
    case 40: { const s = isOdd ? 0 : 6; return (s + part) % 12; }
    case 45: { let s = 0; if (isMovable) s = 0; else if (isFixed) s = 4; else s = 8; return (s + part) % 12; }
    case 60: return (signIndex + part) % 12;
    default: return signIndex;
  }
}

export function getDivPart(degInSign: number, division: number, isOdd: boolean): number {
  if (division === 30) {
    if (isOdd) {
      if (degInSign < 5) return 0; if (degInSign < 10) return 1; if (degInSign < 18) return 2; if (degInSign < 25) return 3; return 4;
    } else {
      if (degInSign < 5) return 0; if (degInSign < 12) return 1; if (degInSign < 20) return 2; if (degInSign < 25) return 3; return 4;
    }
  }
  return Math.min(Math.floor(degInSign / (30 / division)), division - 1);
}

export function getVargaDevta(signIndex: number, degInSign: number, division: number): string {
  const isOdd = signIndex % 2 === 0;
  const isMovable = [0, 3, 6, 9].includes(signIndex);
  const isFixed = [1, 4, 7, 10].includes(signIndex);

  switch (division) {
    case 1: return '—';

    case 2:
      if (isOdd) return degInSign < 15 ? 'Devas' : 'Pitris';
      return degInSign < 15 ? 'Pitris' : 'Devas';

    case 3: {
      const p = Math.min(Math.floor(degInSign / 10), 2);
      if (isMovable) return ['Narada', 'Agastya', 'Durvasa'][p];
      if (isFixed) return ['Agastya', 'Durvasa', 'Narada'][p];
      return ['Durvasa', 'Narada', 'Agastya'][p];
    }

    case 4: {
      const p = Math.min(Math.floor(degInSign / 7.5), 3);
      return ['Sanaka', 'Sanandana', 'Sanatkumara', 'Sanatana'][p];
    }

    case 5: return '—';
    case 6: return '—';

    case 7: {
      const p = Math.min(Math.floor(degInSign / (30 / 7)), 6);
      return isOdd ? D7_DEITIES[p] : D7_DEITIES[6 - p];
    }

    case 8: return '—';

    case 9: {
      const p = Math.min(Math.floor(degInSign / (30 / 9)), 8);
      let cycle: string[];
      if (isMovable) cycle = ['Deva', 'Manushya', 'Rakshasa'];
      else if (isFixed) cycle = ['Rakshasa', 'Manushya', 'Deva'];
      else cycle = ['Manushya', 'Deva', 'Rakshasa'];
      return cycle[p % 3];
    }

    case 10: {
      const p = Math.min(Math.floor(degInSign / 3), 9);
      return isOdd ? D10_DEITIES[p] : D10_DEITIES[9 - p];
    }

    case 11: return '—';

    case 12: {
      const p = Math.min(Math.floor(degInSign / 2.5), 11);
      return D12_DEITIES[p % 4];
    }

    case 16: {
      const p = Math.min(Math.floor(degInSign / (30 / 16)), 15);
      return isOdd ? D16_ODD[p % 4] : D16_EVEN[p % 4];
    }

    case 20: {
      const p = Math.min(Math.floor(degInSign / 1.5), 19);
      return isOdd ? D20_DEITIES[p] : D20_DEITIES[19 - p];
    }

    case 24: {
      const p = Math.min(Math.floor(degInSign / 1.25), 23);
      return isOdd ? D24_DEITIES[p % 12] : D24_DEITIES[11 - (p % 12)];
    }

    case 27: {
      const p = Math.min(Math.floor(degInSign / (30 / 27)), 26);
      return isOdd ? D27_DEITIES[p] : D27_DEITIES[26 - p];
    }

    case 30: {
      if (isOdd) {
        if (degInSign < 5) return 'Agni';
        if (degInSign < 10) return 'Vayu';
        if (degInSign < 18) return 'Indra';
        if (degInSign < 25) return 'Kubera';
        return 'Varuna';
      } else {
        if (degInSign < 5) return 'Varuna';
        if (degInSign < 12) return 'Kubera';
        if (degInSign < 20) return 'Indra';
        if (degInSign < 25) return 'Vayu';
        return 'Agni';
      }
    }

    case 40: {
      const p = Math.min(Math.floor(degInSign / 0.75), 39);
      return isOdd ? D40_DEITIES[p] : D40_DEITIES[39 - p];
    }

    case 45: {
      const p = Math.min(Math.floor(degInSign / (30 / 45)), 44);
      return isOdd ? D45_ODD[p % 3] : D45_EVEN[p % 3];
    }

    case 60: {
      const p = Math.min(Math.floor(degInSign / 0.5), 59);
      return isOdd ? D60_DEITIES[p] : D60_DEITIES[59 - p];
    }

    default: return '—';
  }
}

export function getD60Nature(signIndex: number, degInSign: number): string {
  const isOdd = signIndex % 2 === 0;
  const p = Math.min(Math.floor(degInSign / 0.5), 59);
  const idx = isOdd ? p : 59 - p;
  return D60_NATURE[idx] === 'B' ? 'Benefic' : 'Malefic';
}

export function getDivSignName(idx: number): string { return SIGNS[idx]; }
export function getDivSignShort(idx: number): string { return SIGNS_SHORT[idx]; }
