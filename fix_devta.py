import sys
import re

file_path = "src/lib/vargaDevtas.ts"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# We need to restore getVargaDevta case 150.
# It is the second occurrence of case 150: {
parts = content.split("case 150: {")

if len(parts) == 3:
    # parts[0] ...
    # parts[1] (first case 150 content)
    # parts[2] (second case 150 content)
    
    # Let's fix the second occurrence
    second_part_remainder = parts[2][parts[2].find("}")+1:]
    
    correct_case_150_devta = """
      const p = Math.min(Math.floor(degInSign / 0.2), 149);
      if (isMovable) return D150_NAMES[p];
      if (isFixed) return D150_NAMES[149 - p];
      return D150_NAMES[p < 75 ? p + 75 : p - 75];
    }"""
    
    new_content = parts[0] + "case 150: {" + parts[1] + "case 150: {" + correct_case_150_devta + second_part_remainder
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(new_content)
    print("Fixed getVargaDevta case 150!")
else:
    print("Unexpected number of case 150 occurrences!")
