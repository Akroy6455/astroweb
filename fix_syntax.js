const fs = require('fs');
let content = fs.readFileSync('src/components/TaraNirnaySettings.tsx', 'utf8');

content = content.replace(
  /<\/div>\s*<div style=\{\{ display: 'grid', gridTemplateColumns: 'repeat\(auto-fill, minmax\(300px, 1fr\)\)', gap: '1\.5rem' \}\}>/,
  `</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>`
);

fs.writeFileSync('src/components/TaraNirnaySettings.tsx', content);
console.log('Fixed syntax');
