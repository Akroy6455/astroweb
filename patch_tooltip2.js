const fs = require('fs');
let content = fs.readFileSync('src/components/TransitChart.tsx', 'utf8');

const oldBlockRegex = /<div style=\{\{ fontSize: '0\.85rem', color: 'var\(--text-muted\)', marginBottom: '0\.5rem' \}\}>[\s\S]*?<\/div>\s*<\/div>\s*\)\}\s*<\/div>/m;

const newBlock = `            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
              <div style={{ fontSize: '0.95rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {new Date(hoveredPoint.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: hoveredPoint.finalScore >= 0 ? '#22c55e' : '#ef4444' }}>
                {hoveredPoint.finalScore.toFixed(1)}
              </div>
            </div>

            {(weights.enableBaseNdsInTransit ?? true) && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
                <span>Base Score:</span>
                <span style={{ fontWeight: 600 }}>{hoveredPoint.baseNds.toFixed(1)}</span>
              </div>
            )}

            {weights.enableTransitMultiplier && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
                <span>Avg Transit:</span>
                <span style={{ fontWeight: 600 }}>x{hoveredPoint.avgMultiplier.toFixed(2)}</span>
              </div>
            )}

            {weights.enableMdAdTransitMultiplier && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
                <span>BAV MD/AD:</span>
                <span style={{ fontWeight: 600 }}>x{(hoveredPoint.mdLordMultiplier * hoveredPoint.adLordMultiplier).toFixed(2)}</span>
              </div>
            )}

            {weights.enableNavtaraTransit && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
                <span>Navtara Avg:</span>
                <span style={{ fontWeight: 600 }}>x{(hoveredPoint.avgNavtaraMultiplier || 1.0).toFixed(2)}</span>
              </div>
            )}

            {weights.enableNavtaraMdAd && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
                <span>Navtara MD/AD:</span>
                <span style={{ fontWeight: 600 }}>x{((hoveredPoint.mdLordNavtaraMultiplier || 1.0) * (hoveredPoint.adLordNavtaraMultiplier || 1.0)).toFixed(2)}</span>
              </div>
            )}

            <div style={{ borderTop: '1px dashed var(--border)', margin: '0.5rem 0', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span>Total Multiplier:</span>
              <span style={{ fontWeight: 700 }}>
                x{(
                  (weights.enableTransitMultiplier ? hoveredPoint.avgMultiplier : 1.0) * 
                  (weights.enableMdAdTransitMultiplier ? (hoveredPoint.mdLordMultiplier * hoveredPoint.adLordMultiplier) : 1.0) * 
                  (weights.enableNavtaraTransit ? (hoveredPoint.avgNavtaraMultiplier || 1.0) : 1.0) * 
                  (weights.enableNavtaraMdAd ? ((hoveredPoint.mdLordNavtaraMultiplier || 1.0) * (hoveredPoint.adLordNavtaraMultiplier || 1.0)) : 1.0)
                ).toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>`;

content = content.replace(oldBlockRegex, newBlock);

fs.writeFileSync('src/components/TransitChart.tsx', content);
console.log('Patched tooltip again in TransitChart.tsx');
