import sys

file_path = "src/lib/astrology.ts"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Fix signature and parsing
content = content.replace("function getDivisionalSign(signIndex: number, degInSign: number, division: number): number {", "function getDivisionalSign(signIndex: number, degInSign: number, division: number | string): number {")
content = content.replace("  const part = Math.min(Math.floor(degInSign / (30 / division)), division - 1);", "  const numDiv = typeof division === 'string' ? parseInt(division) : division;\n  const part = Math.min(Math.floor(degInSign / (30 / numDiv)), numDiv - 1);")

# 2. Re-inject case '2_US'
target_case_2 = """    case 2: { // Hora
      const h = degInSign < 15 ? 0 : 1;
      return isOdd ? (h === 0 ? 4 : 3) : (h === 0 ? 3 : 4);
    }"""
    
replacement_case_2 = """    case 2: { // Hora
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
    }"""
content = content.replace(target_case_2, replacement_case_2)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Restored 2_US and types!")
