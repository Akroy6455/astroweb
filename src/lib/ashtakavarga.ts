export type PlanetName = 'Sun' | 'Moon' | 'Mars' | 'Mercury' | 'Jupiter' | 'Venus' | 'Saturn' | 'Lagna';

// Tables representing which houses (1-12) from the entity's position get a bindu (1)
// The indices here are 1-based representing houses 1 to 12.
const AV_TABLES: Record<PlanetName, Record<PlanetName, number[]>> = {
  Sun: {
    Sun: [1, 2, 4, 7, 8, 9, 10, 11],
    Moon: [3, 6, 10, 11],
    Mars: [1, 2, 4, 7, 8, 9, 10, 11],
    Mercury: [3, 5, 6, 9, 10, 11, 12],
    Jupiter: [5, 6, 9, 11],
    Venus: [6, 7, 12],
    Saturn: [1, 2, 4, 7, 8, 9, 10, 11],
    Lagna: [3, 4, 6, 10, 11, 12]
  },
  Moon: {
    Sun: [3, 6, 7, 8, 10, 11],
    Moon: [1, 3, 6, 7, 10, 11],
    Mars: [2, 3, 5, 6, 9, 10, 11],
    Mercury: [1, 3, 4, 5, 7, 8, 10, 11],
    Jupiter: [1, 4, 7, 8, 10, 11, 12],
    Venus: [3, 4, 5, 7, 9, 10, 11],
    Saturn: [3, 5, 6, 11],
    Lagna: [3, 6, 10, 11]
  },
  Mars: {
    Sun: [3, 5, 6, 10, 11],
    Moon: [3, 6, 11],
    Mars: [1, 2, 4, 7, 8, 10, 11],
    Mercury: [3, 5, 6, 11],
    Jupiter: [6, 10, 11, 12],
    Venus: [6, 8, 11, 12],
    Saturn: [1, 4, 7, 8, 9, 10, 11],
    Lagna: [1, 3, 6, 10, 11]
  },
  Mercury: {
    Sun: [5, 6, 9, 11, 12],
    Moon: [2, 4, 6, 8, 10, 11],
    Mars: [1, 2, 4, 7, 8, 9, 10, 11],
    Mercury: [1, 3, 5, 6, 9, 10, 11, 12],
    Jupiter: [6, 8, 11, 12],
    Venus: [1, 2, 3, 4, 5, 8, 9, 11],
    Saturn: [1, 2, 4, 7, 8, 9, 10, 11],
    Lagna: [1, 2, 4, 6, 8, 10, 11]
  },
  Jupiter: {
    Sun: [1, 2, 3, 4, 7, 8, 9, 10, 11],
    Moon: [2, 5, 7, 9, 11],
    Mars: [1, 2, 4, 7, 8, 10, 11],
    Mercury: [1, 2, 4, 5, 6, 9, 10, 11],
    Jupiter: [1, 2, 3, 4, 7, 8, 10, 11],
    Venus: [2, 5, 6, 9, 10, 11],
    Saturn: [3, 5, 6, 12],
    Lagna: [1, 2, 4, 5, 6, 9, 10, 11]
  },
  Venus: {
    Sun: [8, 11, 12],
    Moon: [1, 2, 3, 4, 5, 8, 9, 11, 12],
    Mars: [3, 5, 6, 9, 11, 12],
    Mercury: [3, 5, 6, 9, 11],
    Jupiter: [5, 8, 9, 10, 11],
    Venus: [1, 2, 3, 4, 5, 8, 9, 10, 11],
    Saturn: [3, 4, 5, 8, 9, 10, 11],
    Lagna: [1, 2, 3, 4, 5, 8, 9, 11]
  },
  Saturn: {
    Sun: [1, 2, 4, 7, 8, 10, 11],
    Moon: [3, 6, 11],
    Mars: [3, 5, 6, 10, 11],
    Mercury: [6, 8, 9, 10, 11, 12],
    Jupiter: [5, 6, 11, 12],
    Venus: [6, 11, 12],
    Saturn: [3, 5, 6, 11],
    Lagna: [1, 3, 4, 6, 10, 11]
  },
  Lagna: {
    Sun: [3, 4, 6, 10, 11, 12],
    Moon: [3, 6, 10, 11, 12],
    Mars: [1, 3, 6, 10, 11],
    Mercury: [1, 2, 4, 6, 8, 10, 11],
    Jupiter: [1, 2, 4, 5, 6, 9, 10, 11],
    Venus: [1, 2, 3, 4, 5, 8, 9, 11],
    Saturn: [1, 3, 4, 6, 10, 11],
    Lagna: [3, 6, 10, 11]
  }
};

export type PosMap = Record<PlanetName, number>; // Sign indices (0-11) for each entity

export function calculateAshtakavarga(positions: PosMap) {
  // Returns:
  // bav: Record<PlanetName, number[]> (each array is 12 length, indexed by sign 0-11)
  // sav337: number[] (length 12, sum of 7 planets)
  // sav386: number[] (length 12, sum of 7 planets + Lagna)

  const planets: PlanetName[] = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Lagna'];
  const planets7: PlanetName[] = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
  
  const bav: Record<string, number[]> = {};

  for (const recipient of planets) {
    bav[recipient] = Array(12).fill(0);
    const tableForRecipient = AV_TABLES[recipient];
    
    // For each planet that gives bindus
    for (const donor of planets) {
      const donorSign = positions[donor];
      const housesWithBindu = tableForRecipient[donor];
      
      for (const house of housesWithBindu) {
        // house is 1-12. If house is 1, it's the same sign as the donor.
        const targetSign = (donorSign + house - 1) % 12;
        bav[recipient][targetSign]++;
      }
    }
  }

  const sav337 = Array(12).fill(0);
  const sav386 = Array(12).fill(0);

  for (let sign = 0; sign < 12; sign++) {
    let sum7 = 0;
    for (const p of planets7) {
      sum7 += bav[p][sign];
    }
    sav337[sign] = sum7;
    sav386[sign] = sum7 + bav['Lagna'][sign];
  }

  return { bav, sav337, sav386 };
}
