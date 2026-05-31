const fs = require('fs');
let content = fs.readFileSync('src/components/TaraNirnaySettings.tsx', 'utf8');

const regex = /<h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', color: 'var\(--primary\)' }}>Ashtakavarga Transit Multiplier \(Monthly\)<\/h4>/;

const repl = `<h4 style={{ margin: '0 0 1rem 0', fontSize: '0.95rem', color: 'var(--primary)' }}>Transit Flow Multipliers (Monthly)</h4>`;
content = content.replace(regex, repl);

const regex2 = /(<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>\s*<div>\s*<span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var\(--foreground\)' }}>Enable MD\/AD Lord Transit Multiplier<\/span>.*?<\/label>\s*<\/div>)/s;

const repl2 = `$1

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.75rem', marginBottom: '0.75rem' }}>
              <div>
                <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--foreground)' }}>Enable Navtara Transit Multiplier</span>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Multiply Dasha score by average 9-planet Navtara in transiting nakshatra.</p>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={localWeights.enableNavtaraTransit ?? false} 
                  onChange={(e) => setLocalWeights(prev => ({ ...prev, enableNavtaraTransit: e.target.checked }))}
                  style={{ accentColor: 'var(--primary)', transform: 'scale(1.2)' }}
                />
              </label>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--foreground)' }}>Enable MD/AD Lord Navtara Multiplier</span>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Further multiply by current MD & AD lord Navtara.</p>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={localWeights.enableNavtaraMdAd ?? false} 
                  onChange={(e) => setLocalWeights(prev => ({ ...prev, enableNavtaraMdAd: e.target.checked }))}
                  style={{ accentColor: 'var(--primary)', transform: 'scale(1.2)' }}
                />
              </label>
            </div>`;

content = content.replace(regex2, repl2);

fs.writeFileSync('src/components/TaraNirnaySettings.tsx', content);
console.log('Done patch_settings.js');
