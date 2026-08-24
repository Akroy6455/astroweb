import re

with open('src/lib/vargaDevtas.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix getDivisionalSign signature
content = content.replace(
    'export function getDivisionalSign(signIndex: number, degInSign: number, division: number): number {',
    'export function getDivisionalSign(signIndex: number, degInSign: number, division: number | string): number {'
)

# Fix numDivision for part calculation
content = content.replace(
    'const part = Math.min(Math.floor(degInSign / (30 / division)), division - 1);',
    '''const numDivision = typeof division === 'string' ? parseInt(division) : division;
  const part = Math.min(Math.floor(degInSign / (30 / numDivision)), numDivision - 1);'''
)

# Add case '2_US'
content = content.replace(
    '''    case 2: { // Hora
      const h = degInSign < 15 ? 0 : 1;
      return isOdd ? (h === 0 ? 4 : 3) : (h === 0 ? 3 : 4);
    }''',
    '''    case 2: { // Hora
      const h = degInSign < 15 ? 0 : 1;
      return isOdd ? (h === 0 ? 4 : 3) : (h === 0 ? 3 : 4);
    }

    case '2_US': { // Uma-Shambhu Hora
      const h = degInSign < 15 ? 0 : 1;
      if (isOdd) {
        return h === 0 ? (signIndex * 2) % 12 : (signIndex * 2 + 1) % 12;
      } else {
        return h === 0 ? (signIndex * 2 + 1) % 12 : (signIndex * 2) % 12;
      }
    }'''
)

with open('src/lib/vargaDevtas.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patched vargaDevtas.ts")
