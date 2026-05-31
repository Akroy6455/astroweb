const fs = require('fs');

function patchAstrologyAgain() {
  let content = fs.readFileSync('src/lib/astrology.ts', 'utf8');
  content = content.replace(
    /adLordNavtaraMultiplier,\s*advancedTriggers/g,
    `adLordNavtaraMultiplier,
      mdPlanet: mdLord,
      adPlanet: adLord,
      advancedTriggers`
  );
  fs.writeFileSync('src/lib/astrology.ts', content);
}

function patchTransitChart() {
  let content = fs.readFileSync('src/components/TransitChart.tsx', 'utf8');

  // Update Interface
  content = content.replace(
    /adLordNavtaraMultiplier\?: number;/g,
    `adLordNavtaraMultiplier?: number;
  mdPlanet?: string;
  adPlanet?: string;
  advancedTriggers?: Record<string, { mAsc: boolean, mMoon: boolean, bAsc: boolean, bMoon: boolean }>;`
  );

  // Update processedData hook
  const newProcessedData = `
    return data.map(d => {
      const avgM = weights.enableTransitMultiplier ? d.avgMultiplier : 1.0;
      const mdAdM = weights.enableMdAdTransitMultiplier ? (d.mdLordMultiplier * d.adLordMultiplier) : 1.0;
      
      const navtaraAvgM = weights.enableNavtaraTransit && d.avgNavtaraMultiplier ? d.avgNavtaraMultiplier : 1.0;
      const navtaraMdAdM = weights.enableNavtaraMdAd && d.mdLordNavtaraMultiplier && d.adLordNavtaraMultiplier ? (d.mdLordNavtaraMultiplier * d.adLordNavtaraMultiplier) : 1.0;

      const calcAdvM = (planet) => {
        if (!d.advancedTriggers || !planet || !d.advancedTriggers[planet]) return 1.0;
        const t = d.advancedTriggers[planet];
        let sum = 0; let count = 0;
        if (t.mAsc) { sum += (weights.advancedMaleficAsc ?? 0.6); count++; }
        if (t.mMoon) { sum += (weights.advancedMaleficMoon ?? 0.8); count++; }
        if (t.bAsc) { sum += (weights.advancedBeneficAsc ?? 1.4); count++; }
        if (t.bMoon) { sum += (weights.advancedBeneficMoon ?? 1.2); count++; }
        return count > 0 ? (sum / count) : 1.0;
      };

      let advAvgM = 1.0;
      let advMdAdM = 1.0;

      if (weights.enableAdvancedTransitMultiplier && d.advancedTriggers) {
        const planets = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
        advAvgM = planets.reduce((acc, p) => acc + calcAdvM(p), 0) / 7;
        advMdAdM = calcAdvM(d.mdPlanet) * calcAdvM(d.adPlanet);
      }

      const M = avgM * mdAdM * navtaraAvgM * navtaraMdAdM * advAvgM * advMdAdM;
      let finalScore = 0;
      const includeBase = weights.enableBaseNdsInTransit ?? true;
      if (includeBase) {
        if (d.baseNds >= 0) {
          finalScore = d.baseNds * M;
        } else {
          finalScore = d.baseNds / Math.max(0.01, M);
        }
      } else {
        finalScore = M * 100;
      }
      return { ...d, finalScore, advAvgM, advMdAdM, M };
    });
  `;

  content = content.replace(
    /return data\.map\(d => \{[\s\S]*?return \{ \.\.\.d, finalScore \};\s*\}\);/,
    newProcessedData
  );

  // Update Tooltip
  // Find "Total Multiplier:" and add rows right before it
  const tooltipAdd = `
            {weights.enableAdvancedTransitMultiplier && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
                <span>Lordship Avg:</span>
                <span style={{ fontWeight: 600 }}>x{(hoveredPoint as any).advAvgM.toFixed(2)}</span>
              </div>
            )}

            {weights.enableAdvancedTransitMultiplier && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
                <span>Lordship MD/AD:</span>
                <span style={{ fontWeight: 600 }}>x{(hoveredPoint as any).advMdAdM.toFixed(2)}</span>
              </div>
            )}
            
            <div style={{ borderTop: '1px dashed var(--border)', margin: '0.5rem 0', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span>Total Multiplier:</span>
              <span style={{ fontWeight: 700 }}>
                x{((hoveredPoint as any).M).toFixed(2)}
              </span>
            </div>
  `;

  content = content.replace(
    /<div style=\{\{ borderTop: '1px dashed var\(--border\)', margin: '0\.5rem 0', paddingTop: '0\.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '0\.85rem' \}\}>[\s\S]*?<\/div>/,
    tooltipAdd
  );

  fs.writeFileSync('src/components/TransitChart.tsx', content);
}

function patchExportTimeline() {
  let content = fs.readFileSync('src/components/ExportTimeline.tsx', 'utf8');

  // Update Interface
  content = content.replace(
    /adLordNavtaraMultiplier\?: number;/g,
    `adLordNavtaraMultiplier?: number;
  mdPlanet?: string;
  adPlanet?: string;
  advancedTriggers?: Record<string, { mAsc: boolean, mMoon: boolean, bAsc: boolean, bMoon: boolean }>;`
  );

  // Update processTransitData
  const newProcessTransitData = `
    return transitData.map(d => {
      const avgM = weights.enableTransitMultiplier ? d.avgMultiplier : 1.0;
      const mdAdM = weights.enableMdAdTransitMultiplier ? (d.mdLordMultiplier * d.adLordMultiplier) : 1.0;
      
      const navtaraAvgM = weights.enableNavtaraTransit && d.avgNavtaraMultiplier ? d.avgNavtaraMultiplier : 1.0;
      const navtaraMdAdM = weights.enableNavtaraMdAd && d.mdLordNavtaraMultiplier && d.adLordNavtaraMultiplier ? (d.mdLordNavtaraMultiplier * d.adLordNavtaraMultiplier) : 1.0;

      const calcAdvM = (planet) => {
        if (!d.advancedTriggers || !planet || !d.advancedTriggers[planet]) return 1.0;
        const t = d.advancedTriggers[planet];
        let sum = 0; let count = 0;
        if (t.mAsc) { sum += (weights.advancedMaleficAsc ?? 0.6); count++; }
        if (t.mMoon) { sum += (weights.advancedMaleficMoon ?? 0.8); count++; }
        if (t.bAsc) { sum += (weights.advancedBeneficAsc ?? 1.4); count++; }
        if (t.bMoon) { sum += (weights.advancedBeneficMoon ?? 1.2); count++; }
        return count > 0 ? (sum / count) : 1.0;
      };

      let advAvgM = 1.0;
      let advMdAdM = 1.0;

      if (weights.enableAdvancedTransitMultiplier && d.advancedTriggers) {
        const planets = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
        advAvgM = planets.reduce((acc, p) => acc + calcAdvM(p), 0) / 7;
        advMdAdM = calcAdvM(d.mdPlanet) * calcAdvM(d.adPlanet);
      }

      const M = avgM * mdAdM * navtaraAvgM * navtaraMdAdM * advAvgM * advMdAdM;
      let finalScore = 0;
      const includeBase = weights.enableBaseNdsInTransit ?? true;
      if (includeBase) {
        if (d.baseNds >= 0) {
          finalScore = d.baseNds * M;
        } else {
          finalScore = d.baseNds / Math.max(0.01, M);
        }
      } else {
        finalScore = M * 100;
      }
      return { ...d, finalScore };
    });
  `;

  content = content.replace(
    /return transitData\.map\(d => \{[\s\S]*?return \{ \.\.\.d, finalScore \};\s*\}\);/,
    newProcessTransitData
  );

  fs.writeFileSync('src/components/ExportTimeline.tsx', content);
}

patchAstrologyAgain();
patchTransitChart();
patchExportTimeline();
console.log('Patched transit logic and ui');
