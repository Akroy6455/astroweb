const fs = require('fs');

let content = fs.readFileSync('src/components/TaraNirnaySettings.tsx', 'utf8');

// Insert new toggles and sliders
const toggleToAdd = `
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
              <div>
                <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--foreground)' }}>Enable Functional Lordship Transit Multiplier</span>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Multiply Dasha score by functional lordship weights (averaging 7 planets and MD/AD).</p>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={localWeights.enableAdvancedTransitMultiplier ?? true} 
                  onChange={(e) => setLocalWeights(prev => ({ ...prev, enableAdvancedTransitMultiplier: e.target.checked }))}
                  style={{ accentColor: 'var(--primary)', transform: 'scale(1.2)' }}
                />
              </label>
            </div>

            {localWeights.enableAdvancedTransitMultiplier && (
              <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px', marginTop: '0.75rem', border: '1px solid var(--border)' }}>
                <h5 style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: 'var(--foreground)' }}>Lordship Advanced Multipliers</h5>
                
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {[
                    { key: 'advancedMaleficAsc', label: 'Malefic from Asc', desc: '6,8,12 lord exalted or in 1,5,9 transit houses' },
                    { key: 'advancedMaleficMoon', label: 'Malefic from Moon', desc: '6,8,12 lord exalted or in 1,5,9 transit houses' },
                    { key: 'advancedBeneficAsc', label: 'Benefic from Asc', desc: '1,5,9 lord exalted, own sign, or in 1,5,9 transit houses' },
                    { key: 'advancedBeneficMoon', label: 'Benefic from Moon', desc: '1,5,9 lord exalted, own sign, or in 1,5,9 transit houses' }
                  ].map(slider => (
                    <div key={slider.key} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--foreground)' }}>{slider.label}</span>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="2"
                          value={localWeights[slider.key as keyof typeof localWeights] as number ?? 1.0}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val)) setLocalWeights(prev => ({ ...prev, [slider.key]: val }));
                          }}
                          style={{
                            width: '60px', padding: '2px 4px', background: 'var(--bg)',
                            border: '1px solid var(--border)', color: 'var(--foreground)',
                            borderRadius: '4px', textAlign: 'right'
                          }}
                        />
                      </div>
                      <input 
                        type="range" 
                        min="0" max="2" step="0.1"
                        value={localWeights[slider.key as keyof typeof localWeights] as number ?? 1.0} 
                        onChange={(e) => setLocalWeights(prev => ({ ...prev, [slider.key]: parseFloat(e.target.value) }))}
                        style={{ width: '100%', accentColor: 'var(--primary)' }}
                      />
                      <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)' }}>{slider.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
`;

content = content.replace(
  /(\s*)<\/div>\s*<\/div>\s*<div style=\{\{ \s*marginBottom: '2rem',/,
  toggleToAdd + '$1</div>\n        </div>\n        <div style={{ \n          marginBottom: \'2rem\','
);

fs.writeFileSync('src/components/TaraNirnaySettings.tsx', content);
console.log('Patched TaraNirnaySettings.tsx');
