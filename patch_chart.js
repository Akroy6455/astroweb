const fs = require('fs');
let content = fs.readFileSync('src/components/TransitChart.tsx', 'utf8');

const interfaceRegex = /interface TransitDataPoint \{[\s\S]*?\}/;
const interfaceRepl = `interface TransitDataPoint {
  date: string;
  baseNds: number;
  avgMultiplier: number;
  mdLordMultiplier: number;
  adLordMultiplier: number;
  avgNavtaraMultiplier?: number;
  mdLordNavtaraMultiplier?: number;
  adLordNavtaraMultiplier?: number;
}`;
content = content.replace(interfaceRegex, interfaceRepl);

const useMemoRegex = /const processedData = useMemo\(\(\) => \{[\s\S]*?\}, \[data, weights\]\);/;
const useMemoRepl = `const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.map(d => {
      const avgM = weights.enableTransitMultiplier ? d.avgMultiplier : 1.0;
      const mdAdM = weights.enableMdAdTransitMultiplier ? (d.mdLordMultiplier * d.adLordMultiplier) : 1.0;
      
      const navtaraAvgM = weights.enableNavtaraTransit && d.avgNavtaraMultiplier ? d.avgNavtaraMultiplier : 1.0;
      const navtaraMdAdM = weights.enableNavtaraMdAd && d.mdLordNavtaraMultiplier && d.adLordNavtaraMultiplier ? (d.mdLordNavtaraMultiplier * d.adLordNavtaraMultiplier) : 1.0;

      const includeBase = weights.enableBaseNdsInTransit ?? true;
      const finalScore = includeBase ? (d.baseNds * avgM * mdAdM * navtaraAvgM * navtaraMdAdM) : (avgM * mdAdM * navtaraAvgM * navtaraMdAdM * 100);
      return { ...d, finalScore };
    });
  }, [data, weights]);`;
content = content.replace(useMemoRegex, useMemoRepl);

const tooltipRegex = /<div style=\{\{ display: 'flex', justifyContent: 'space-between', marginBottom: '0\.5rem', fontSize: '0\.9rem', opacity: weights\.enableMdAdTransitMultiplier \? 1 : 0\.4 \}\}>\s*<span>MD\/AD Lords:<\/span>\s*<span style=\{\{ fontWeight: 600 \}\}>x\{\(hoveredPoint\.mdLordMultiplier \* hoveredPoint\.adLordMultiplier\)\.toFixed\(2\)\}<\/span>\s*<\/div>/;
const tooltipRepl = `<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.9rem', opacity: weights.enableMdAdTransitMultiplier ? 1 : 0.4 }}>
              <span>BAV MD/AD:</span>
              <span style={{ fontWeight: 600 }}>x{(hoveredPoint.mdLordMultiplier * hoveredPoint.adLordMultiplier).toFixed(2)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.9rem', opacity: weights.enableNavtaraTransit ? 1 : 0.4 }}>
              <span>Navtara Avg:</span>
              <span style={{ fontWeight: 600 }}>x{(hoveredPoint.avgNavtaraMultiplier || 1.0).toFixed(2)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.9rem', opacity: weights.enableNavtaraMdAd ? 1 : 0.4 }}>
              <span>Navtara MD/AD:</span>
              <span style={{ fontWeight: 600 }}>x{((hoveredPoint.mdLordNavtaraMultiplier || 1.0) * (hoveredPoint.adLordNavtaraMultiplier || 1.0)).toFixed(2)}</span>
            </div>`;
content = content.replace(tooltipRegex, tooltipRepl);

fs.writeFileSync('src/components/TransitChart.tsx', content);
console.log('Done patch_chart.js');
