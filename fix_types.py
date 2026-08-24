import sys

file_path = "src/lib/vargaDevtas.ts"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# getDivisionalSign
content = content.replace("export function getDivisionalSign(signIndex: number, degInSign: number, division: number): number {", "export function getDivisionalSign(signIndex: number, degInSign: number, division: number | string): number {")
content = content.replace("  const part = Math.min(Math.floor(degInSign / (30 / division)), division - 1);", "  const numDiv = typeof division === 'string' ? parseInt(division) : division;\n  const part = Math.min(Math.floor(degInSign / (30 / numDiv)), numDiv - 1);")
content = content.replace("  switch (division) {", "  switch (numDiv) {")

# getDivPart
content = content.replace("export function getDivPart(degInSign: number, division: number, isOdd: boolean): number {", "export function getDivPart(degInSign: number, division: number | string, isOdd: boolean): number {")
content = content.replace("  if (division === 30) {", "  const numDiv = typeof division === 'string' ? parseInt(division) : division;\n  if (numDiv === 30) {")
content = content.replace("  return Math.min(Math.floor(degInSign / (30 / division)), division - 1);", "  return Math.min(Math.floor(degInSign / (30 / numDiv)), numDiv - 1);")

# getVargaDevta
content = content.replace("export function getVargaDevta(signIndex: number, degInSign: number, division: number): string {", "export function getVargaDevta(signIndex: number, degInSign: number, division: number | string): string {")
content = content.replace("  switch (division) {", "  const numDiv = typeof division === 'string' ? parseInt(division) : division;\n  switch (numDiv) {")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Restored number | string types!")
