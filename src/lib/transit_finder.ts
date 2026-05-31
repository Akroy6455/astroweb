import sweph from 'sweph';

const PLANET_IDS: Record<string, number> = {
  Sun: sweph.constants.SE_SUN,
  Moon: sweph.constants.SE_MOON,
  Mars: sweph.constants.SE_MARS,
  Mercury: sweph.constants.SE_MERCURY,
  Jupiter: sweph.constants.SE_JUPITER,
  Venus: sweph.constants.SE_VENUS,
  Saturn: sweph.constants.SE_SATURN,
  Rahu: sweph.constants.SE_MEAN_NODE,
  Ketu: sweph.constants.SE_MEAN_NODE // Handled specially (+180)
};

function norm(a: number) { return ((a % 360) + 360) % 360; }

function getPlanetLon(jd: number, planetName: string, offsetDeg: number, ayanamsha: string): { lon: number, speed: number } {
  const flag = sweph.constants.SEFLG_SIDEREAL | sweph.constants.SEFLG_SPEED;
  if (ayanamsha === 'Lahiri') {
    sweph.set_sid_mode(sweph.constants.SE_SIDM_LAHIRI, 0, 0);
  } else {
    sweph.set_sid_mode(sweph.constants.SE_SIDM_RAMAN, 0, 0);
  }

  let id = PLANET_IDS[planetName];
  if (id === undefined) throw new Error("Invalid planet name");

  const res = sweph.calc_ut(jd, id, flag);
  let lon = res.data[0];
  let speed = res.data[3];

  if (planetName === 'Ketu') {
    lon = norm(lon + 180);
  }

  // Apply the aspect offset by ADDING it to the planet's longitude.
  // Example: Saturn 3rd aspect (+60 deg). The aspect is at lon + 60.
  lon = norm(lon + offsetDeg);

  return { lon, speed };
}

function isInsideAnyRange(lon: number, ranges: [number, number][]) {
  for (const [start, end] of ranges) {
    if (start < end) {
      if (lon >= start && lon < end) return true;
    } else {
      // Crosses 0 Aries
      if (lon >= start || lon < end) return true;
    }
  }
  return false;
}

export async function findNextTransit(
  planetName: string,
  offsetDeg: number,
  ranges: [number, number][], // Array of [start, end] longitudes defining the target regions. For points, use [val, val].
  startJd: number,
  isPoint: boolean = false,
  direction: number = 1,
  ayanamsha: string = 'Raman'
) {
  // Extract all boundaries from the ranges
  const boundaries = new Set<number>();
  for (const [s, e] of ranges) {
    boundaries.add(s);
    if (!isPoint) boundaries.add(e);
  }
  const boundaryArr = Array.from(boundaries);

  let jd = startJd;
  const step = (planetName === 'Moon' ? 0.1 : 1.0) * direction; // 2.4 hours for Moon, 1 day for others
  let current = getPlanetLon(jd, planetName, offsetDeg, ayanamsha);

  const MAX_DAYS = 365 * 30; // Search up to 30 years ahead
  let daysSearched = 0;

  while (daysSearched < MAX_DAYS) {
    const nextJd = jd + step;
    const next = getPlanetLon(nextJd, planetName, offsetDeg, ayanamsha);

    const diff = norm(next.lon - current.lon);
    const isDirect = diff < 180;
    const travelDist = isDirect ? diff : (360 - diff);

    let crossedBoundary = -1;

    for (const B of boundaryArr) {
      if (isDirect) {
        if (norm(B - current.lon) < travelDist) {
          crossedBoundary = B;
          break;
        }
      } else {
        if (norm(current.lon - B) < travelDist) {
          crossedBoundary = B;
          break;
        }
      }
    }

    if (crossedBoundary !== -1) {
      // A boundary was crossed between jd and nextJd.
      // Bisection to find exact jd of crossing down to ~1 minute (0.0007 days).
      let left = jd;
      let right = nextJd;
      let mid = left;
      
      for (let i = 0; i < 15; i++) {
        mid = (left + right) / 2;
        const midLon = getPlanetLon(mid, planetName, offsetDeg, ayanamsha).lon;
        
        // Did it cross between left and mid?
        const lLon = getPlanetLon(left, planetName, offsetDeg, ayanamsha).lon;
        const mDiff = norm(midLon - lLon);
        const mDirect = mDiff < 180;
        const mDist = mDirect ? mDiff : (360 - mDiff);
        
        let crossedLeftMid = false;
        if (mDirect && norm(crossedBoundary - lLon) < mDist) crossedLeftMid = true;
        if (!mDirect && norm(lLon - crossedBoundary) < mDist) crossedLeftMid = true;
        
        if (crossedLeftMid) {
          right = mid;
        } else {
          left = mid;
        }
      }

      const exactCrossJd = mid;
      const exactCrossData = getPlanetLon(exactCrossJd, planetName, offsetDeg, ayanamsha);
      
      let isValidEntry = false;
      if (isPoint) {
        isValidEntry = true;
      } else {
        // We crossed a boundary. Did we enter the target region or leave it?
        // Check position a tiny bit in the future (relative to search direction).
        const futureCheck = getPlanetLon(exactCrossJd + 0.04 * direction, planetName, offsetDeg, ayanamsha);
        isValidEntry = isInsideAnyRange(futureCheck.lon, ranges);
      }

      if (isValidEntry) {
        // Convert exactCrossJd to Date string
        const ut = sweph.revjul(exactCrossJd, sweph.constants.SE_GREG_CAL);
        // ut contains year, month, day, hour
        
        // Convert to JS Date
        const hour = Math.floor(ut.hour);
        const min = Math.floor((ut.hour - hour) * 60);
        const sec = Math.floor((((ut.hour - hour) * 60) - min) * 60);
        
        const dateObj = new Date(Date.UTC(ut.year, ut.month - 1, ut.day, hour, min, sec));
        
        return {
          jd: exactCrossJd,
          dateUTC: dateObj.toISOString(),
          longitude: exactCrossData.lon
        };
      }
      // If we left the region (and not a point), ignore and keep searching.
    }

    jd = nextJd;
    current = next;
    daysSearched += Math.abs(step);
  }

  return null; // Not found within 30 years
}
