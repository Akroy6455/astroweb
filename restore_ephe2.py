import re

with open('src/lib/astrology.ts', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("// sweph.set_ephe_path(ephePath + '/');", "sweph.set_ephe_path(ephePath + '/');")

with open('src/lib/astrology.ts', 'w', encoding='utf-8') as f:
    f.write(content)
