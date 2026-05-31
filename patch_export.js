const fs = require('fs');
let content = fs.readFileSync('src/app/page.tsx', 'utf8');

// 1. Add import
if (!content.includes('import ExportTimeline from')) {
  content = content.replace(
    /import ThemeSwitcher from '@\/components\/ThemeSwitcher';/,
    `import ThemeSwitcher from '@/components/ThemeSwitcher';\nimport ExportTimeline from '@/components/ExportTimeline';`
  );
}

// 2. Add ExportTimeline to TaraNirnay tab
content = content.replace(
  /<DashaChart data=\{activeDashaTimeSeries\}>\s*<TaraNirnaySettings\s*weights=\{ndsWeights\}\s*onSave=\{handleSaveNdsWeights\}\s*\/>\s*<\/DashaChart>/,
  `<DashaChart data={activeDashaTimeSeries}>\n                      <TaraNirnaySettings \n                        weights={ndsWeights} \n                        onSave={handleSaveNdsWeights}\n                      />\n                    </DashaChart>\n                    {data?.transitTimeSeries && (\n                      <ExportTimeline \n                        dashaData={activeDashaTimeSeries} \n                        transitData={data.transitTimeSeries} \n                        weights={ndsWeights} \n                      />\n                    )}`
);

fs.writeFileSync('src/app/page.tsx', content);
console.log('Patched page.tsx for ExportTimeline');
