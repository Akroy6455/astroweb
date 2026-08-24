import re

with open('src/app/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the broken error setting
pattern = r"setError\(SERVER HTTP ERROR \\: \\\);"
replacement = r"setError(SERVER HTTP ERROR : );"
content = re.sub(pattern, replacement, content)

with open('src/app/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
