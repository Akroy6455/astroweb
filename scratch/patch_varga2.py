import re

with open('src/lib/vargaDevtas.ts', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    'export function getDivPart(degInSign: number, division: number, isOdd: boolean): number {',
    'export function getDivPart(degInSign: number, division: number | string, isOdd: boolean): number {'
)
content = content.replace(
    'const part = Math.min(Math.floor(degInSign / (30 / division)), division - 1);',
    '''const numDivision = typeof division === 'string' ? parseInt(division) : division;
  const part = Math.min(Math.floor(degInSign / (30 / numDivision)), numDivision - 1);'''
)
content = content.replace(
    'export function getVargaDevta(signIndex: number, degInSign: number, division: number): string {',
    'export function getVargaDevta(signIndex: number, degInSign: number, division: number | string): string {'
)

with open('src/lib/vargaDevtas.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patched vargaDevtas.ts part 2")
