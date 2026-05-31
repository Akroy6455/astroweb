const fs = require('fs');

function patchFile(filepath) {
  let content = fs.readFileSync(filepath, 'utf8');

  // The logic is currently:
  // const includeBase = weights.enableBaseNdsInTransit ?? true;
  // const finalScore = includeBase ? (d.baseNds * avgM * mdAdM * navtaraAvgM * navtaraMdAdM) : (avgM * mdAdM * navtaraAvgM * navtaraMdAdM * 100);

  const newLogic = `      const includeBase = weights.enableBaseNdsInTransit ?? true;
      const M = avgM * mdAdM * navtaraAvgM * navtaraMdAdM;
      let finalScore = 0;
      
      if (includeBase) {
        if (d.baseNds >= 0) {
          finalScore = d.baseNds * M;
        } else {
          finalScore = d.baseNds / Math.max(0.01, M);
        }
      } else {
        finalScore = M * 100;
      }`;

  content = content.replace(
    /const includeBase = weights\.enableBaseNdsInTransit \?\? true;\s*const finalScore = includeBase \? \(d\.baseNds \* avgM \* mdAdM \* navtaraAvgM \* navtaraMdAdM\) : \(avgM \* mdAdM \* navtaraAvgM \* navtaraMdAdM \* 100\);/g,
    newLogic
  );

  fs.writeFileSync(filepath, content);
  console.log('Patched ' + filepath);
}

patchFile('src/components/TransitChart.tsx');
patchFile('src/components/ExportTimeline.tsx');
