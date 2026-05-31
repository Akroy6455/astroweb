const fs = require('fs');

function patchNdsEngine() {
  let content = fs.readFileSync('src/lib/nds_engine.ts', 'utf8');

  // Add to NDSWeights interface
  if (!content.includes('enableAdvancedTransitMultiplier?: boolean;')) {
    content = content.replace(
      /enableBaseNdsInTransit\?: boolean;/,
      `enableBaseNdsInTransit?: boolean;
  enableAdvancedTransitMultiplier?: boolean;
  advancedMaleficAsc?: number;
  advancedMaleficMoon?: number;
  advancedBeneficAsc?: number;
  advancedBeneficMoon?: number;`
    );
  }

  // Add to DEFAULT_NDS_WEIGHTS
  if (!content.includes('enableAdvancedTransitMultiplier: true,')) {
    content = content.replace(
      /enableBaseNdsInTransit: false,/,
      `enableBaseNdsInTransit: false,
  enableAdvancedTransitMultiplier: true,
  advancedMaleficAsc: 0.6,
  advancedMaleficMoon: 0.8,
  advancedBeneficAsc: 1.4,
  advancedBeneficMoon: 1.2,`
    );
  }

  fs.writeFileSync('src/lib/nds_engine.ts', content);
  console.log('Patched nds_engine.ts');
}

function patchActions() {
  let content = fs.readFileSync('src/app/actions.ts', 'utf8');
  
  // Need to pass positions and lagna to generateMonthlyTransitTimeSeries
  // It is currently called as: transitTimeSeries = generateMonthlyTransitTimeSeries(dashaTimeSeries, ashtakavarga, panchang);
  content = content.replace(
    /transitTimeSeries = generateMonthlyTransitTimeSeries\(dashaTimeSeries, ashtakavarga, panchang\);/g,
    'transitTimeSeries = generateMonthlyTransitTimeSeries(dashaTimeSeries, ashtakavarga, panchang, positions, lagna);'
  );
  
  fs.writeFileSync('src/app/actions.ts', content);
  console.log('Patched actions.ts');
}

patchNdsEngine();
patchActions();
