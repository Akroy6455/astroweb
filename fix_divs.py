import sys

file_path = "src/lib/astrology.ts"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("const DIVISIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 16, 20, 24, 27, 30, 40, 45, 60];", "const DIVISIONS: (number | string)[] = [1, 2, '2_US', 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 16, 20, 24, 27, 30, 40, 45, 60, 150];")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Restored DIVISIONS!")
