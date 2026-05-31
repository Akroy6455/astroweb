import React from 'react';
import KundliChart from './KundliChart';

type AshtakavargaChartProps = {
  data: any; // The full chart data including lagna, houses, and ashtakavarga
  use386?: boolean; // If true, use sav386, else sav337
};

export default function AshtakavargaChart({ data, use386 = false }: AshtakavargaChartProps) {
  if (!data || !data.ashtakavarga) return null;

  const sav = use386 ? data.ashtakavarga.sav386 : data.ashtakavarga.sav337;

  // We need to map the SAV points to the 12 houses.
  // data.houses gives us the signIndex for each house (1 to 12).
  // sav array is indexed by signIndex (0 to 11).

  const avHouses = data.houses.map((h: any) => {
    const points = sav[h.signIndex];
    return {
      house: h.house,
      signIndex: h.signIndex,
      // We masquerade the score as a 'planet' so KundliChart renders it in the center of the diamond
      planets: [{
        id: `sav-${h.house}`,
        name: `${points} pts`,
        short: `${points}`
      }]
    };
  });

  return (
    <div style={{ textAlign: 'center' }}>
      <h2 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>
        Sarvashtakavarga ({use386 ? '386' : '337'}) Chart
      </h2>
      <KundliChart data={{ lagna: data.lagna, houses: avHouses }} />
    </div>
  );
}
