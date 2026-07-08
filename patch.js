const fs = require('fs');
let content = fs.readFileSync('src/lib/nds_engine.ts', 'utf8');

// 1. Interfaces
content = content.replace('rahuKetuConjunctWeight: number;', 'rahuKetuConjunctWeight: number;\n  rahuKetuWithMoon?: number;');
content = content.replace('enableTaraNirnayMatrix?: boolean;', 'enableTaraNirnayMatrix?: boolean;\n  enableTaraNirnayNatalMatrix?: boolean;');
content = content.replace('adPercentage: number;', 'adPercentage: number;\n  blendedAdPercentage?: number;');

// 2. Defaults
content = content.replace('enableTaraNirnayMatrix: true,', 'enableTaraNirnayMatrix: true,\n    enableTaraNirnayNatalMatrix: false,');
content = content.replace('rahuKetuYogKaraka: 75,', 'rahuKetuYogKaraka: 75,\n  rahuKetuWithMoon: -50,');
content = content.replace('functionalBenefic: 80,', 'functionalBenefic: 60,');
content = content.replace('functionalMalefic: -80,', 'functionalMalefic: -60,');

// 3. Planet Placement Matrix
const oldMatrixRegex = /planetPlacementMatrix:\s*\[[\s\S]*?^\s*\],/m;
const newMatrix = `planetPlacementMatrix: [
    [90, 60, 80, 40, 70, 90, 30, 40, 80, 100, 90, 30],
    [80, 90, 70, 100, 90, 40, 80, 30, 90, 80, 90, 40],
    [70, 40, 90, 40, 60, 90, 30, 30, 70, 100, 90, 30],
    [100, 90, 70, 80, 90, 70, 70, 84, 80, 90, 90, 30],
    [100, 80, 60, 90, 80, 50, 80, 80, 100, 50, 90, 70],
    [80, 90, 70, 100, 90, 30, 80, 60, 90, 70, 90, 100],
    [30, 50, 90, 40, 60, 90, 100, 84, 70, 90, 100, 40],
    [50, 40, 90, 40, 50, 90, 40, 40, 70, 90, 100, 40],
    [40, 40, 80, 40, 60, 60, 40, 90, 90, 70, 70, 100]
  ],`;
content = content.replace(oldMatrixRegex, newMatrix);

// 4. Tara Nirnay Natal Matrix
const natalMatrix = `taraNirnayNdfNatalMatrix: {
    "Sun": {
      "from_Sun": [16, 18, 8, 16, 2, 5, 18, 17, 4, 18, 19, 3],
      "from_Moon": [1, 3, 18, 1, 2, 19, 1, 0, 2, 17, 19, 4],
      "from_Mercury": [2, 4, 17, 3, 17, 18, 2, 3, 17, 18, 19, 19],
      "from_Mars": [17, 18, 2, 18, 2, 5, 18, 18, 17, 17, 18, 4],
      "from_Jupiter": [2, 17, 2, 16, 18, 14, 2, 2, 18, 18, 20, 3],
      "from_Saturn": [17, 19, 3, 16, 15, 18, 16, 12, 18, 18, 20, 3],
      "from_Venus": [2, 18, 4, 2, 3, 16, 18, 2, 4, 4, 17, 18],
      "from_Ascendent": [19, 1, 18, 17, 2, 19, 2, 0, 2, 17, 19, 2]
    },
    "Mercury": {
      "from_Sun": [2, 2, 3, 2, 18, 18, 10, 2, 18, 2, 17, 18],
      "from_Moon": [2, 2, 1, 18, 2, 19, 2, 18, 1, 18, 19, 3],
      "from_Mercury": [18, 2, 17, 3, 18, 18, 2, 2, 18, 18, 18, 18],
      "from_Mars": [18, 18, 3, 18, 2, 2, 17, 17, 18, 18, 18, 17],
      "from_Jupiter": [2, 2, 2, 3, 2, 19, 2, 17, 2, 2, 18, 4],
      "from_Saturn": [18, 18, 2, 18, 1, 2, 17, 16, 18, 18, 18, 3],
      "from_Venus": [18, 18, 18, 15, 18, 2, 1, 18, 18, 2, 19, 18],
      "from_Ascendent": [19, 18, 2, 19, 19, 1, 19, 1, 19, 19, 19, 2]
    },
    "Mars": {
      "from_Sun": [10, 3, 18, 3, 18, 19, 2, 2, 19, 17, 18, 3],
      "from_Moon": [1, 2, 18, 2, 1, 19, 1, 0, 1, 8, 19, 2],
      "from_Mercury": [2, 5, 18, 4, 19, 18, 2, 1, 2, 2, 18, 2],
      "from_Mars": [18, 18, 3, 18, 2, 2, 18, 18, 3, 3, 18, 2],
      "from_Jupiter": [2, 3, 2, 2, 2, 18, 2, 0, 2, 18, 18, 1],
      "from_Saturn": [16, 18, 2, 17, 1, 1, 18, 2, 17, 2, 18, 3],
      "from_Venus": [3, 4, 2, 2, 3, 17, 17, 18, 4, 2, 18, 15],
      "from_Ascendent": [19, 2, 18, 1, 1, 19, 0, 1, 1, 1, 19, 1]
    },
    "Jupiter": {
      "from_Sun": [18, 17, 2, 17, 2, 1, 18, 2, 18, 18, 17, 3],
      "from_Moon": [1, 19, 2, 1, 19, 2, 19, 1, 20, 1, 19, 3],
      "from_Mercury": [17, 17, 2, 18, 2, 3, 17, 16, 3, 18, 19, 3],
      "from_Mars": [17, 18, 3, 17, 16, 3, 2, 2, 2, 18, 18, 4],
      "from_Jupiter": [19, 19, 18, 18, 3, 3, 18, 18, 2, 18, 18, 4],
      "from_Saturn": [4, 3, 18, 2, 18, 18, 2, 2, 3, 2, 19, 19],
      "from_Venus": [3, 17, 3, 3, 18, 18, 3, 2, 18, 17, 18, 3],
      "from_Ascendent": [19, 18, 3, 18, 18, 19, 19, 1, 19, 19, 19, 3]
    },
    "Saturn": {
      "from_Sun": [18, 17, 3, 16, 4, 4, 18, 16, 3, 17, 18, 3],
      "from_Moon": [1, 3, 18, 2, 2, 18, 1, 0, 2, 2, 19, 3],
      "from_Mercury": [2, 3, 3, 2, 3, 18, 4, 16, 18, 17, 17, 17],
      "from_Mars": [2, 3, 10, 4, 18, 18, 3, 2, 4, 18, 19, 16],
      "from_Jupiter": [3, 2, 3, 2, 18, 17, 2, 0, 4, 3, 18, 16],
      "from_Saturn": [2, 4, 17, 3, 17, 17, 2, 1, 2, 3, 18, 3],
      "from_Venus": [2, 2, 2, 4, 1, 18, 3, 3, 2, 2, 18, 18],
      "from_Ascendent": [18, 3, 18, 17, 19, 19, 1, 0, 1, 18, 18, 2]
    },
    "Venus": {
      "from_Sun": [4, 3, 2, 2, 2, 2, 2, 17, 3, 3, 17, 16],
      "from_Moon": [19, 18, 19, 19, 19, 2, 3, 19, 19, 2, 19, 12],
      "from_Mercury": [2, 2, 17, 3, 18, 18, 2, 3, 18, 4, 18, 4],
      "from_Mars": [1, 1, 18, 16, 17, 18, 1, 2, 18, 3, 18, 16],
      "from_Jupiter": [3, 2, 3, 4, 18, 3, 16, 18, 18, 18, 18, 3],
      "from_Saturn": [3, 3, 17, 17, 18, 4, 3, 18, 18, 18, 19, 3],
      "from_Venus": [2, 3, 2, 18, 2, 18, 17, 4, 3, 2, 18, 18],
      "from_Ascendent": [19, 18, 19, 19, 19, 2, 2, 18, 18, 2, 19, 2]
    }
  },\n  taraNirnayNdfMatrix: {`;
content = content.replace('taraNirnayNdfMatrix: {', natalMatrix);

// 5. Calculate logic
const calcLogic = `
  let extraRahuKetuScore = 0;
  if ((planet === 'Rahu' || planet === 'Ketu') && w.rahuKetuWithMoon !== undefined) {
    const moonHouse = yogaState.planets['Moon'].house;
    const planetHouse = yogaState.planets[planet].house;
    if (moonHouse === planetHouse) {
      extraRahuKetuScore = w.rahuKetuWithMoon;
      conditions.push({ key: 'rahuKetuWithMoon' as any, name: \`\${planet} Conjunct Moon\`, value: w.rahuKetuWithMoon });
      score += w.rahuKetuWithMoon;
    }
  }

  let taraNirnayNatal = { score: 0, conditions: [] as any[] };
  if (w.enableTaraNirnayNatalMatrix && w.taraNirnayNdfNatalMatrix && specialLagnas && divisionalCharts) {
    let tScore = 0;
    const matrix = w.taraNirnayNdfNatalMatrix[planet];
    if (matrix) {
      for (const [key, weightsArray] of Object.entries(matrix)) {
        let natalPointIndex = -1;
        if (key === 'from_Ascendent') {
          natalPointIndex = positions.find(p => p.name === 'Ascendant')?.rasi?.index ?? -1;
        } else {
          const refPlanet = key.replace('from_', '') as Planet;
          if (yogaState.planets[refPlanet]) {
            natalPointIndex = yogaState.planets[refPlanet].position.rasi.index;
          }
        }
        
        if (natalPointIndex !== -1) {
          const currentHouseIndex = yogaState.planets[planet].position.rasi.index;
          const dist = (currentHouseIndex - natalPointIndex + 12) % 12;
          const wVal = weightsArray[dist];
          if (wVal !== 0 && wVal !== 18) {
            const addedScore = (wVal - 18) * 10;
            tScore += addedScore;
            taraNirnayNatal.conditions.push({
              key: 'taraNirnayNatalMatrix' as any,
              name: \`Tara Nirnay NDF Natal: \${planet} \${key.replace('_', ' ')} House \${dist + 1}\`,
              value: addedScore
            });
          }
        }
      }
    }
    taraNirnayNatal.score = tScore;
  }
`;

content = content.replace('const pravesh = getPraveshOffset(planet, praveshData, weights);', 'const pravesh = getPraveshOffset(planet, praveshData, weights);\n' + calcLogic);
content = content.replace('...pravesh.conditions', '...pravesh.conditions,\n    ...taraNirnayNatal.conditions');
content = content.replace('pravesh.score;', 'pravesh.score + taraNirnayNatal.score + extraRahuKetuScore;');
content = content.replace('praveshOffset: pravesh.score', 'praveshOffset: pravesh.score,\n      taraNirnayNatal: taraNirnayNatal.score');

fs.writeFileSync('src/lib/nds_engine.ts', content);
