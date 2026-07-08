const fs = require('fs');
let content = fs.readFileSync('src/lib/nds_engine.ts', 'utf8');

// Update calculateNDS signature
content = content.replace(
  'export function calculateNDS(planet: Planet, yogaState: YogaState, positions: any[], praveshData: any, awasthas: any, weights: NDSWeights, isRecursive: boolean = false): NDSResult {',
  'export function calculateNDS(planet: Planet, yogaState: YogaState, positions: any[], praveshData: any, awasthas: any, weights: NDSWeights, specialLagnas?: any, divisionalCharts?: any, isRecursive: boolean = false): NDSResult {'
);

// Update generateDashaTimeSeries signature
content = content.replace(
  'export function generateDashaTimeSeries(dashaSequence: DashaPeriod[], chartData: any, ndsWeights: NDSWeights): DashaTimePoint[] {',
  'export function generateDashaTimeSeries(dashaSequence: DashaPeriod[], chartData: any, ndsWeights: NDSWeights, specialLagnas?: any, divisionalCharts?: any): DashaTimePoint[] {'
);

// Update internal call to calculateNDS
content = content.replace(
  'const mdResult = calculateNDS(mdPlanet as Planet, chartData.yogaState, chartData.positions, mdPravesh, chartData.awasthas, ndsWeights);',
  'const mdResult = calculateNDS(mdPlanet as Planet, chartData.yogaState, chartData.positions, mdPravesh, chartData.awasthas, ndsWeights, specialLagnas, divisionalCharts);'
);
content = content.replace(
  'const adResult = calculateNDS(adPlanet as Planet, chartData.yogaState, chartData.positions, adPravesh, chartData.awasthas, adWeights);',
  'const adResult = calculateNDS(adPlanet as Planet, chartData.yogaState, chartData.positions, adPravesh, chartData.awasthas, adWeights, specialLagnas, divisionalCharts);'
);
content = content.replace(
  'const pdResult = calculateNDS(pdPlanet as Planet, chartData.yogaState, chartData.positions, pdPravesh, chartData.awasthas, pdWeights);',
  'const pdResult = calculateNDS(pdPlanet as Planet, chartData.yogaState, chartData.positions, pdPravesh, chartData.awasthas, pdWeights, specialLagnas, divisionalCharts);'
);

fs.writeFileSync('src/lib/nds_engine.ts', content);
