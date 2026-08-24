import re

with open('src/lib/astrology.ts', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("// sweph.set_ephe_path(ephePath);", "sweph.set_ephe_path(ephePath);")
content = content.replace("sweph.constants.SEFLG_MOSEPH", "sweph.constants.SEFLG_SWIEPH")

with open('src/lib/astrology.ts', 'w', encoding='utf-8') as f:
    f.write(content)
