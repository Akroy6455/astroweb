const fs = require('fs');
let content = fs.readFileSync('src/components/TransitChart.tsx', 'utf8');

content = content.replace(/\\`/g, '`');
content = content.replace(/\\\$/g, '$');

fs.writeFileSync('src/components/TransitChart.tsx', content);
console.log('Fixed backslashes');
