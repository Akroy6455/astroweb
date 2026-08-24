import { load, Constants } from '@fusionstrings/swisseph-wasi';

let ephInstance: any = null;
let loadPromise: Promise<void> | null = null;

export async function initSweph() {
  if (ephInstance) return;
  if (!loadPromise) {
    loadPromise = load({ ephePath: './ephe' }).then(eph => {
      ephInstance = eph;
    });
  }
  await loadPromise;
}

const sweph = {
  constants: Constants,
  set_ephe_path: (pathStr: string) => {
    if (ephInstance) {
      ephInstance.set_ephe_path(pathStr);
    }
  },
  set_sid_mode: (mode: number, t0: number, ayan_t0: number) => {
    if (!ephInstance) throw new Error("sweph not initialized");
    ephInstance.swe_set_sid_mode(mode, t0, ayan_t0);
  },
  get_ayanamsa_ut: (jd: number) => {
    if (!ephInstance) throw new Error("sweph not initialized");
    return ephInstance.swe_get_ayanamsa_ut(jd);
  },
  julday: (year: number, month: number, day: number, hour: number, gregflag: number) => {
    if (!ephInstance) throw new Error("sweph not initialized");
    return ephInstance.swe_julday(year, month, day, hour, gregflag);
  },
  calc_ut: (jd: number, planet: number, flag: number) => {
    if (!ephInstance) throw new Error("sweph not initialized");
    const { xx, error } = ephInstance.swe_calc_ut(jd, planet, flag);
    return { data: xx, error };
  },
  houses_ex: (jd: number, flag: number, lat: number, lon: number, hsys: string) => {
    if (!ephInstance) throw new Error("sweph not initialized");
    const { cusps, ascmc } = ephInstance.swe_houses_ex(jd, flag, lat, lon, hsys.charCodeAt(0));
    return { data: { houses: cusps, points: ascmc } };
  },
  rise_trans: (jd: number, planet: number, star: string, ephe_flag: number, rsmi: number, geoPos: number[], atPress: number, atTemp: number) => {
    if (!ephInstance) throw new Error("sweph not initialized");
    const { tret } = ephInstance.swe_rise_trans(jd, planet, star, ephe_flag, rsmi, geoPos, atPress, atTemp);
    return { data: Array.isArray(tret) ? tret[0] : tret };
  }
};

export default sweph;
