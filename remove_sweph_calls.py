import re

with open('src/lib/shadbala.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace revjul and julday
pattern1 = r"const dateObj = sweph\.revjul\(jd, sweph\.constants\.SE_GREG_CAL\);\s*const ay = dateObj\.year;\s*const base1951JD = sweph\.julday\(ay, 1, 1, 0, sweph\.constants\.SE_GREG_CAL\);"
replacement1 = r"""
  const utMillis = (jd - 2440587.5) * 86400000;
  const utDate = new Date(utMillis);
  const ay = utDate.getUTCFullYear();
  const base1951Millis = Date.UTC(ay, 0, 1);
  const base1951JD = (base1951Millis / 86400000) + 2440587.5;
"""
content = re.sub(pattern1, replacement1.strip(), content)

# Replace get_ayanamsa_ut with an approximation or standard call (Raman ayanamsa ~22.44 in 1950 + precession)
pattern2 = r"const ayanamsaVal = sweph\.get_ayanamsa_ut\(jd\);"
replacement2 = r"""
  // Raman ayanamsa approximation to avoid Vercel C++ segfault on get_ayanamsa_ut
  const ayanamsaVal = 22.4428 + ((jd - 2433282.5) / 365.25) * (50.25 / 3600);
"""
content = re.sub(pattern2, replacement2.strip(), content)

with open('src/lib/shadbala.ts', 'w', encoding='utf-8') as f:
    f.write(content)
