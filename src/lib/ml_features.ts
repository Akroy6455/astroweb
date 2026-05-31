export function extractMLFeatures(data: any, timestampId: string) {
  const { lagna, d9Lagna, positions, ashtakavarga, shadbala } = data;

  const getPlanet = (name: string) => positions.find((p: any) => p.name === name);
  const sun = getPlanet('Sun');
  const moon = getPlanet('Moon');
  const mars = getPlanet('Mars');
  const mercury = getPlanet('Mercury');
  const jupiter = getPlanet('Jupiter');
  const venus = getPlanet('Venus');
  const saturn = getPlanet('Saturn');
  const rahu = getPlanet('Rahu');
  const ketu = getPlanet('Ketu');

  // Relative house placement (1 to 12)
  const getHouse = (p: any) => {
    if (!p || !lagna) return 0;
    return (p.rasi.index - lagna.rasi.index + 12) % 12 + 1;
  };

  // Bhavat Bhavam (Lord of house X is in house Y)
  const RULER: Record<number, string> = {
    0: 'Mars', 1: 'Venus', 2: 'Mercury', 3: 'Moon', 4: 'Sun', 5: 'Mercury',
    6: 'Venus', 7: 'Mars', 8: 'Jupiter', 9: 'Saturn', 10: 'Saturn', 11: 'Jupiter'
  };

  const bhavat_bhavam: Record<string, number> = {};
  if (lagna) {
    for (let i = 1; i <= 12; i++) {
      const signIndex = (lagna.rasi.index + i - 1) % 12;
      const lordName = RULER[signIndex];
      const lordPlanet = getPlanet(lordName);
      bhavat_bhavam[`lord_${i}_in_house`] = getHouse(lordPlanet);
    }
  }

  // Ashtakavarga SAV mapping to houses 1 to 12
  const sav_scores = [];
  if (lagna && ashtakavarga && ashtakavarga.sav337) {
    for (let i = 0; i < 12; i++) {
      const signIndex = (lagna.rasi.index + i) % 12;
      sav_scores.push(ashtakavarga.sav337[signIndex]);
    }
  }

  // Motion State
  const getSpeedState = (p: any) => {
    if (!p) return 0;
    return Math.sign(p.speed); // 1, -1, 0
  };

  // Dispositor chain
  const getDispositorHouse = (p: any) => {
    if (!p || !lagna) return 0;
    const lordName = RULER[p.rasi.index];
    const lordPlanet = getPlanet(lordName);
    return getHouse(lordPlanet);
  };

  const getPada = (p: any) => p ? p.nakshatra.index * 4 + p.nakshatra.pada : 0;

  return {
    timestamp_id: timestampId,
    dynamic_anchors: {
      d1_ascendant_pada: getPada(lagna),
      d9_ascendant_rasi: d9Lagna ? d9Lagna.rasi.index + 1 : 0,
      sun_pada: getPada(sun),
      moon_pada: getPada(moon),
      mars_pada: getPada(mars),
      mercury_pada: getPada(mercury),
      jupiter_pada: getPada(jupiter),
      venus_pada: getPada(venus),
      saturn_pada: getPada(saturn),
      rahu_pada: getPada(rahu),
      ketu_pada: getPada(ketu)
    },
    relative_placements: {
      sun_house: getHouse(sun),
      moon_house: getHouse(moon),
      mars_house: getHouse(mars),
      mercury_house: getHouse(mercury),
      jupiter_house: getHouse(jupiter),
      venus_house: getHouse(venus),
      saturn_house: getHouse(saturn),
      rahu_house: getHouse(rahu),
      ketu_house: getHouse(ketu)
    },
    bhavat_bhavam,
    ashtakavarga: {
      sav_scores
    },
    motion_state: {
      sun_speed: getSpeedState(sun),
      moon_speed: getSpeedState(moon),
      mars_speed: getSpeedState(mars),
      mercury_speed: getSpeedState(mercury),
      jupiter_speed: getSpeedState(jupiter),
      venus_speed: getSpeedState(venus),
      saturn_speed: getSpeedState(saturn)
    },
    shadbala_strength: {
      sun_strength: shadbala?.Sun?.totalRupas || 0,
      moon_strength: shadbala?.Moon?.totalRupas || 0,
      mars_strength: shadbala?.Mars?.totalRupas || 0,
      mercury_strength: shadbala?.Mercury?.totalRupas || 0,
      jupiter_strength: shadbala?.Jupiter?.totalRupas || 0,
      venus_strength: shadbala?.Venus?.totalRupas || 0,
      saturn_strength: shadbala?.Saturn?.totalRupas || 0
    },
    dispositor_chain: {
      sun_dispositor_in_house: getDispositorHouse(sun),
      moon_dispositor_in_house: getDispositorHouse(moon),
      mars_dispositor_in_house: getDispositorHouse(mars),
      mercury_dispositor_in_house: getDispositorHouse(mercury),
      jupiter_dispositor_in_house: getDispositorHouse(jupiter),
      venus_dispositor_in_house: getDispositorHouse(venus),
      saturn_dispositor_in_house: getDispositorHouse(saturn),
      rahu_dispositor_in_house: getDispositorHouse(rahu),
      ketu_dispositor_in_house: getDispositorHouse(ketu)
    }
  };
}
