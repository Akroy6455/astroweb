const fs = require('fs');
let content = fs.readFileSync('src/components/TaraNirnaySettings.tsx', 'utf8');

// 1. Add Descriptions
content = content.replace(
  /lajita: "Applied if the planet is in Lajjitadi Avastha/,
  `combustionBadLord: "Applied to combusted planets if Sun rules houses 2, 3, 6, 7, 8, or 12.",
  combustionGoodLord: "Applied to combusted planets if Sun rules houses 1, 4, 5, 9, 10, or 11.",
  lajita: "Applied if the planet is in Lajjitadi Avastha`
);

// 2. Update groups
content = content.replace(
  /'vargottama', 'combustion', 'sushupti'/,
  `'vargottama', 'combustionBadLord', 'combustionGoodLord', 'sushupti'`
);

// 3. Inject enableCombustionTradeoff UI
const tradeoffHtml = `
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div>
              <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--foreground)' }}>Enable Sun Combustion Tradeoff</span>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sun absorbs the exact points that are added or reduced from combusted planets.</p>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={localWeights.enableCombustionTradeoff ?? false} 
                onChange={(e) => setLocalWeights(prev => ({ ...prev, enableCombustionTradeoff: e.target.checked }))}
                style={{ accentColor: 'var(--primary)', transform: 'scale(1.2)' }}
              />
            </label>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>`;

content = content.replace(
  /<\/div>\s*<\/div>\s*<div style=\{\{ display: 'grid', gridTemplateColumns: 'repeat\(auto-fill, minmax\(300px, 1fr\)\)', gap: '1\.5rem' \}\}>/,
  tradeoffHtml
);

fs.writeFileSync('src/components/TaraNirnaySettings.tsx', content);
console.log('Patch complete.');
