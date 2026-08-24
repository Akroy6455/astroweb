import re

file_path = "src/lib/vargaDevtas.ts"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Fix getVargaDevta
content = content.replace(
    "export function getVargaDevta(signIndex: number, degInSign: number, division: number | string): string {\n  const isOdd = signIndex % 2 === 0;\n  const isMovable = [0, 3, 6, 9].includes(signIndex);\n  const isFixed = [1, 4, 7, 10].includes(signIndex);\n\n  switch (numDiv) {",
    "export function getVargaDevta(signIndex: number, degInSign: number, division: number | string): string {\n  const isOdd = signIndex % 2 === 0;\n  const isMovable = [0, 3, 6, 9].includes(signIndex);\n  const isFixed = [1, 4, 7, 10].includes(signIndex);\n  const numDiv = typeof division === 'string' ? parseInt(division) : division;\n\n  switch (numDiv) {"
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Fixed!")
