const fs = require('fs');
let text = fs.readFileSync('src/components/TransitTab.tsx', 'utf8');

const search =       {subTab === 'TaraNDF' && transitData && mainData && (;
const replace =       {subTab === 'TaraNDFNatal' && mainData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {weights?.enableTaraNirnayNatalMatrix !== false ? (
            <div style={{ background: 'var(--card-bg)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <h2 style={{ textAlign: 'center', marginBottom: '1.5rem', color: 'var(--primary)' }}>Tara Nirnay NDF Natal Chart Matrix</h2>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                {['Sun', 'Moon', 'Mercury', 'Mars', 'Jupiter', 'Saturn', 'Venus'].map(planet => (
                  <button 
                    key={planet}
                    onClick={() => setSelectedNdfPlanet(planet)}
                    className={String.fromCharCode(96) + 'tab ' + String.fromCharCode(96)}
                  >
                    {planet}
                  </button>
                ))}
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '8px', overflow: 'hidden' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#eab308' }}>
                      <th style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>Natal Planet</th>
                      {Array.from({length: 12}, (_, i) => i + 1).map(h => (
                        <th key={h} style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>H{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {['Sun', 'Moon', 'Mercury', 'Mars', 'Jupiter', 'Saturn', 'Venus', 'Ascendant'].map(natalPlanet => {
                      const rowKey = 'from_' + natalPlanet;
                      const currentMatrix = weights?.taraNirnayNdfNatalMatrix || taraNirnayData;
                      const rowData = (currentMatrix as any)[selectedNdfPlanet]?.[rowKey];
                      if (!rowData) return null;

                      const tPlanetPos = mainData.positions.find((p: any) => p.name === selectedNdfPlanet);
                      let nPlanetPos = natalPlanet === 'Ascendant' ? mainData.lagna : mainData.positions.find((p: any) => p.name === natalPlanet);
                      
                      let currentTransitHouse = -1;
                      if (tPlanetPos && nPlanetPos) {
                        const tRasi = Math.floor(tPlanetPos.longitude / 30);
                        const nRasi = Math.floor(nPlanetPos.longitude / 30);
                        currentTransitHouse = ((tRasi - nRasi + 12) % 12) + 1;
                      }

                      return (
                        <tr key={natalPlanet} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '1rem', fontWeight: 'bold', color: 'var(--text)' }}>
                            {natalPlanet}
                            {nPlanetPos && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                                (Rasi {Math.floor(nPlanetPos.longitude / 30) + 1})
                              </div>
                            )}
                          </td>
                          {rowData.map((val: number, idx: number) => {
                            const houseNum = idx + 1;
                            const isCurrent = houseNum === currentTransitHouse;
                            return (
                              <td 
                                key={idx} 
                                style={{ 
                                  padding: '1rem', 
                                  color: val >= 12 ? '#22c55e' : (val < 10 ? '#ef4444' : 'var(--text)'),
                                  background: isCurrent ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                                  border: isCurrent ? '1px solid rgba(255,255,255,0.2)' : 'none',
                                  fontWeight: isCurrent ? 'bold' : 'normal'
                                }}
                              >
                                {val}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div style={{ background: 'var(--card-bg)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'center', color: 'var(--text-muted)' }}>
              Tara Nirnay NDF Natal Chart Matrix is currently disabled in the settings.
            </div>
          )}
        </div>
      )}

      {subTab === 'TaraNDF' && transitData && mainData && (;

if(text.includes(search)) {
  fs.writeFileSync('src/components/TransitTab.tsx', text.replace(search, replace));
  console.log('Fixed TransitTab');
} else {
  console.log('Search string not found');
}

