const fs = require('fs');

let content = fs.readFileSync('src/app/page.tsx', 'utf-8');

content = content.replace("setError(SERVER HTTP ERROR : );", "setError(SERVER HTTP ERROR  + apiRes.status + :  + text.substring(0, 100));");

fs.writeFileSync('src/app/page.tsx', content, 'utf-8');
