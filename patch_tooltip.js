const fs = require('fs');
let content = fs.readFileSync('src/components/TransitChart.tsx', 'utf8');

const replacement = `            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem', opacity: weights.enableNavtaraMdAd ? 1 : 0.4 }}>
              <span>Navtara MD/AD:</span>
              <span style={{ fontWeight: 600 }}>x{((hoveredPoint.mdLordNavtaraMultiplier || 1.0) * (hoveredPoint.adLordNavtaraMultiplier || 1.0)).toFixed(2)}</span>
            </div>

            <div style={{ borderTop: '1px dashed var(--border)', margin: '0.5rem 0', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
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

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem' }}>`;

content = content.replace(
  /<div style=\{\{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem', opacity: weights.enableNavtaraMdAd \? 1 : 0.4 \}\}>\s*<span>Navtara MD\/AD:<\/span>\s*<span style=\{\{ fontWeight: 600 \}\}>x\{\(\(hoveredPoint.mdLordNavtaraMultiplier \|\| 1.0\) \* \(hoveredPoint.adLordNavtaraMultiplier \|\| 1.0\)\).toFixed\(2\)\}<\/span>\s*<\/div>\s*<div style=\{\{ borderTop: '1px solid var\(--border\)', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem' \}\}>/m,
  replacement
);

fs.writeFileSync('src/components/TransitChart.tsx', content);
console.log('Patched tooltip in TransitChart.tsx');
