import re

with open('src/lib/nds_engine.ts', 'r', encoding='utf-8') as f:
    code = f.read()

# Replace DEFAULT_NDS_WEIGHTS
new_defaults = """export const DEFAULT_NDS_WEIGHTS: NDSWeights = {
  disabledParams: {},
  lordHouse1: 90,
  lordHouse2: -15,
  lordHouse3: -40,
  lordHouse4: 60,
  lordHouse5: 85,
  lordHouse6: -60,
  lordHouse7: 50,
  lordHouse8: -80,
  lordHouse9: 100,
  lordHouse10: 70,
  lordHouse11: -30,
  lordHouse12: -40,
  lordPlacementMatrix: [
    [100, 60, 30, 80, 90, -40, 70, -60, 100, 90, 70, -50],
    [40, 80, 20, 50, 60, -30, 40, -50, 70, 60, 80, -40],
    [-10, 10, -30, -10, -20, 40, -10, 20, -30, -10, 40, 20],
    [60, 40, 20, 60, 80, -40, 60, -60, 90, 60, 50, -50],
    [90, 70, 40, 80, 100, -20, 70, -30, 100, 90, 80, -30],
    [-50, -40, 20, -40, -50, -20, -50, 40, -60, -40, 30, 50],
    [60, 30, 20, 60, 70, -50, 60, -60, 80, 60, 60, -60],
    [-70, -60, -10, -60, -70, 50, -70, -40, -80, -60, 10, 60],
    [100, 80, 50, 90, 100, -10, 80, -20, 100, 100, 90, -20],
    [60, 60, 40, 60, 90, -30, 60, -50, 100, 60, 80, -40],
    [20, 50, 40, 30, 10, -10, 30, -20, 10, 40, -20, -10],
    [-60, -50, 0, -50, -60, 50, -60, 60, -70, -50, -10, -20]
  ],
  planetPlacementMatrix: [
    [40, 20, 80, 30, 40, 70, -30, -60, 60, 100, 90, -70],
    [80, 60, 40, 90, 80, -40, 70, -70, 90, 80, 70, -60],
    [30, -20, 90, -20, 20, 80, -40, -60, 40, 90, 90, -50],
    [90, 80, 50, 80, 90, 30, 70, 40, 80, 80, 70, -20],
    [100, 90, 40, 90, 100, -20, 80, -40, 100, 80, 70, -30],
    [80, 80, 50, 100, 90, -30, 60, 50, 90, 70, 90, 80],
    [-20, -40, 90, -30, -10, 90, 20, -20, 30, 70, 100, -60],
    [-40, -50, 80, -40, -30, 80, -50, -80, -20, 60, 90, -70],
    [-30, -40, 70, -30, -20, 70, -40, -50, 60, 50, 80, 50]
  ],
  yogaKaraka: 100,
  rahuKetuYogKaraka: 75,
  functionalBenefic: 80,
  functionalMalefic: -80,
  exaltation: 100,
  ownSign: 80,
  friendlySign: 40,
  neutralSign: 0,
  enemySign: -50,
  debilitation: -100,
  vargottama: 50,
  combustion: -80,
  sushupti: -90,
  neechaBhanga: 60,
  mutualDistance1: 50,
  mutualDistance2: 20,
  mutualDistance3: 40,
  mutualDistance4: 60,
  mutualDistance5: 80,
  mutualDistance6: -80,
  mutualDistance7: 30,
  mutualDistance8: -90,
  mutualDistance9: 80,
  mutualDistance10: 70,
  mutualDistance11: 80,
  mutualDistance12: -60,
  arudha11thAny: 60,
  arudha11thBenefic: 90,
  arudha12thAny: -50,
  arudha12thMalefic: -90,
  arudha3rdMalefic: 70,
  arudha6thMalefic: 80,
  papaKartari: -70,
  shubhaKartari: 70,
  lajita: -60,
  garvita: 90,
  kshudita: -80,
  trushita: -70,
  mudita: 70,
  kshobita: -90,
  praveshHouse1: 20,
  praveshHouse2: 30,
  praveshHouse3: 60,
  praveshHouse4: 40,
  praveshHouse5: 70,
  praveshHouse6: 50,
  praveshHouse7: 30,
  praveshHouse8: -80,
  praveshHouse9: 80,
  praveshHouse10: 70,
  praveshHouse11: 90,
  praveshHouse12: -60,
  praveshExalted: 80,
  praveshOwnSign: 60,
  praveshDebilitated: -80,
};"""

code = re.sub(r"export const DEFAULT_NDS_WEIGHTS: NDSWeights = \{.*?\n\};", new_defaults, code, flags=re.DOTALL)

# Inject Kendra natural benefic logic in getBaseLordshipScore
old_matrix_code = """
    // Matrix score
    if (!w.disabledParams?.lordPlacementMatrix) {
      const matrixScore = w.lordPlacementMatrix[h - 1][planetHouse - 1];
      if (matrixScore !== 0) {
        score += matrixScore;
        conditions.push({ key: 'lordPlacementMatrix' as keyof NDSWeights, name: `Lord of ${h} in ${planetHouse}`, value: matrixScore });
      }
    }
"""

new_matrix_code = """
    // Matrix score
    if (!w.disabledParams?.lordPlacementMatrix) {
      let matrixScore = w.lordPlacementMatrix[h - 1][planetHouse - 1];
      // Dynamic override for Kendradhipati Dosha on natural benefics 
      // User Spec: If Lord of Kendra (4,7,10) is placed in Kendra, Malefic=60, Benefic=15
      if ([4, 7, 10].includes(h) && [1, 4, 7, 10].includes(planetHouse)) {
        if (PLANET_NATURE[planet] === 'Benefic') {
          matrixScore = 15;
        }
      }
      
      if (matrixScore !== 0) {
        score += matrixScore;
        conditions.push({ key: 'lordPlacementMatrix' as keyof NDSWeights, name: `Lord of ${h} in ${planetHouse}`, value: matrixScore });
      }
    }
"""
code = code.replace(old_matrix_code.strip(), new_matrix_code.strip())

# Make sure PLANET_NATURE is imported
if 'PLANET_NATURE' not in code:
    code = code.replace("import {", "import { PLANET_NATURE,", 1)

with open('src/lib/nds_engine.ts', 'w', encoding='utf-8') as f:
    f.write(code)

print("done")
