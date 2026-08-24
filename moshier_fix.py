import re

with open('src/lib/astrology.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the flag initialization to explicitly use Moshier to prevent file I/O segfaults on Vercel
pattern = r"const flags = sweph\.constants\.SEFLG_SWIEPH \| sweph\.constants\.SEFLG_SIDEREAL \| sweph\.constants\.SEFLG_SPEED;"
replacement = r"const flags = sweph.constants.SEFLG_MOSEPH | sweph.constants.SEFLG_SIDEREAL | sweph.constants.SEFLG_SPEED; // FORCED MOSHIER TO FIX VERCEL CRASH"
content = re.sub(pattern, replacement, content)

with open('src/lib/astrology.ts', 'w', encoding='utf-8') as f:
    f.write(content)
