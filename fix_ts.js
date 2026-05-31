const fs = require('fs');
let content = fs.readFileSync('src/components/ExportTimeline.tsx', 'utf8');

// Replace usages of d.endDate, d.mdLord, d.adLord, d.score with the correct ones:
content = content.replace(
  /const activeDasha = dashaData\.find\(d => \{\s*const dTime = new Date\(d\.date\)\.getTime\(\);\s*const dEnd = new Date\(d\.endDate\)\.getTime\(\);\s*return tTime >= dTime && tTime <= dEnd;\s*\}\);/m,
  `const activeDashaIndex = dashaData.findIndex(d => new Date(d.date).getTime() > tTime);
      const activeDasha = activeDashaIndex > 0 ? dashaData[activeDashaIndex - 1] : (activeDashaIndex === 0 ? dashaData[0] : dashaData[dashaData.length - 1]);`
);

content = content.replace(/activeDasha\.mdLord/g, 'activeDasha.mdPlanet');
content = content.replace(/activeDasha\.adLord/g, 'activeDasha.adPlanet');
content = content.replace(/activeDasha\.score/g, 'activeDasha.percentage');

content = content.replace(
  /const maxTime = new Date\(dashaData\[dashaData\.length - 1\]\.endDate\)\.getTime\(\);/,
  `const maxTime = new Date(dashaData[dashaData.length - 1].date).getTime() + (30 * 24 * 60 * 60 * 1000);`
);

content = content.replace(
  /const tEnd = new Date\(d\.endDate\)\.getTime\(\);/g,
  `const tEnd = i < dashaData.length - 1 ? new Date(dashaData[i+1].date).getTime() : new Date(d.date).getTime() + (30 * 24 * 60 * 60 * 1000);`
);

// We need to add 'i' to the dashaData.forEach loop
content = content.replace(
  /dashaData\.forEach\(d => \{/,
  `dashaData.forEach((d, i) => {`
);

content = content.replace(
  /d\.mdLord/g,
  `d.mdPlanet`
);
content = content.replace(
  /d\.adLord/g,
  `d.adPlanet`
);
content = content.replace(
  /d\.score/g,
  `d.percentage`
);

fs.writeFileSync('src/components/ExportTimeline.tsx', content);
console.log('Fixed typescript errors in ExportTimeline.tsx');
