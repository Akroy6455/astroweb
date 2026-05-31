const sweph = require('sweph');
const path = require('path');
const fs = require('fs');

// Setup sweph
const ephePath = path.join(__dirname, 'ephe');
sweph.set_ephe_path(ephePath + '/');
sweph.set_sid_mode(sweph.constants.SE_SIDM_RAMAN, 0, 0);

const PLANETS = [
  { id: sweph.constants.SE_SUN, name: 'Sun' },
  { id: sweph.constants.SE_MOON, name: 'Moon' },
  { id: sweph.constants.SE_MARS, name: 'Mars' },
  { id: sweph.constants.SE_MERCURY, name: 'Mercury' },
  { id: sweph.constants.SE_JUPITER, name: 'Jupiter' },
  { id: sweph.constants.SE_VENUS, name: 'Venus' },
  { id: sweph.constants.SE_SATURN, name: 'Saturn' },
  { id: sweph.constants.SE_MEAN_NODE, name: 'Rahu' },
  { id: 'KETU', name: 'Ketu' }
];

// Rough mean daily motions (degrees per day) geocentric
const MEAN_MOTIONS = {
  'Sun': 0.9856,
  'Moon': 13.176,
  'Mars': 0.524,
  'Mercury': 0.9856,
  'Jupiter': 0.083,
  'Venus': 0.9856,
  'Saturn': 0.033,
  'Rahu': -0.053,
  'Ketu': -0.053
};

function getNakshatraPada(longitude) {
  const degreesPerNakshatra = 360 / 27; // 13.333
  const index = Math.floor(longitude / degreesPerNakshatra);
  const remainder = longitude % degreesPerNakshatra;
  const pada = Math.floor(remainder / (degreesPerNakshatra / 4)) + 1;
  return index * 4 + pada;
}

function getMotionState(planetName, speed) {
  if (speed < 0) return 2; // Retrograde
  const meanMotion = MEAN_MOTIONS[planetName] || 1.0;
  if (speed > meanMotion) return 1; // Faster than normal
  return 0; // Normal to slow
}

function calculateDailyData(date) {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  
  // 9:15 AM IST = 3:45 AM UTC
  const hour = 3 + 45 / 60; // 3.75

  const jd = sweph.julday(year, month, day, hour, sweph.constants.SE_GREG_CAL);
  const flag = sweph.constants.SEFLG_SIDEREAL | sweph.constants.SEFLG_SPEED;

  const positions = {};
  let rahuLong = 0;
  let rahuSpeed = 0;

  for (const p of PLANETS) {
    if (p.id === 'KETU') {
      const ketuLong = (rahuLong + 180) % 360;
      positions['Ketu'] = { longitude: ketuLong, speed: rahuSpeed };
      continue;
    }

    const res = sweph.calc_ut(jd, p.id, flag);
    const longitude = res.data[0];
    const speed = res.data[3];

    if (p.name === 'Rahu') {
      rahuLong = longitude;
      rahuSpeed = speed;
    }

    positions[p.name] = { longitude, speed };
  }

  // Calculate Ascendant (Mumbai: Lat: 18.9690, Lon: 72.8205)
  const houses = sweph.houses_ex(jd, flag, 18.9690, 72.8205, 'P');
  const points = houses.points || (houses.data && houses.data.points);
  const ascLongitude = points ? points[0] : 0;
  const d1_ascendant_pada = getNakshatraPada(ascLongitude);
  const d9_ascendant_rasi = ((d1_ascendant_pada - 1) % 12) + 1;

  return {
    timestamp_id: date.toISOString(),
    dynamic_anchors: {
      d1_ascendant_pada,
      d9_ascendant_rasi,
      sun_pada: getNakshatraPada(positions['Sun'].longitude),
      moon_pada: getNakshatraPada(positions['Moon'].longitude),
      mars_pada: getNakshatraPada(positions['Mars'].longitude),
      mercury_pada: getNakshatraPada(positions['Mercury'].longitude),
      jupiter_pada: getNakshatraPada(positions['Jupiter'].longitude),
      venus_pada: getNakshatraPada(positions['Venus'].longitude),
      saturn_pada: getNakshatraPada(positions['Saturn'].longitude),
      rahu_pada: getNakshatraPada(positions['Rahu'].longitude),
      ketu_pada: getNakshatraPada(positions['Ketu'].longitude)
    },
    motion_state: {
      sun_speed: getMotionState('Sun', positions['Sun'].speed),
      moon_speed: getMotionState('Moon', positions['Moon'].speed),
      mars_speed: getMotionState('Mars', positions['Mars'].speed),
      mercury_speed: getMotionState('Mercury', positions['Mercury'].speed),
      jupiter_speed: getMotionState('Jupiter', positions['Jupiter'].speed),
      venus_speed: getMotionState('Venus', positions['Venus'].speed),
      saturn_speed: getMotionState('Saturn', positions['Saturn'].speed)
    }
  };
}

async function generate10Years() {
  const dataset = [];
  const startDate = new Date('2016-05-03T03:45:00.000Z');
  const endDate = new Date('2026-05-03T03:45:00.000Z');

  let currentDate = new Date(startDate);
  console.log("Generating 10 years of data...");

  let count = 0;
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getUTCDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { 
      dataset.push(calculateDailyData(currentDate));
    }
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    count++;
  }

  const outputPath = path.join(__dirname, 'astro_trading_dataset_10yrs.json');
  fs.writeFileSync(outputPath, JSON.stringify(dataset, null, 2));
  console.log(`Dataset generation complete! Generated ${dataset.length} trading days.`);
  console.log(`Saved to ${outputPath}`);
}

generate10Years().catch(console.error);
