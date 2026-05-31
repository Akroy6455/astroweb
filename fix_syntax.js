const fs = require('fs');
let content = fs.readFileSync('src/components/ExportTimeline.tsx', 'utf8');

// Replace \` with `
content = content.replace(/\\`/g, '`');
// Replace \${ with ${
content = content.replace(/\\\$\{/g, '${');
// Replace \\n with \n in the csv content
content = content.replace(/\\\\n/g, '\\n');

fs.writeFileSync('src/components/ExportTimeline.tsx', content);
console.log('Fixed syntax errors in ExportTimeline.tsx');
