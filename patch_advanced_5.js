const fs = require('fs');

function fix(file) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/const calcAdvM = \(planet\) => \{/g, 'const calcAdvM = (planet?: string) => {');
  fs.writeFileSync(file, content);
}

fix('src/components/TransitChart.tsx');
fix('src/components/ExportTimeline.tsx');
