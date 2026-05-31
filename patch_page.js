const fs = require('fs');
let content = fs.readFileSync('src/app/page.tsx', 'utf8');

content = content.replace(
  /import UserProfile from "@\/components\/UserProfile";/,
  `import UserProfile from "@/components/UserProfile";\nimport ThemeSwitcher from "@/components/ThemeSwitcher";`
);

content = content.replace(
  /<div className="header-brand">/,
  `<div className="header-brand">\n          <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}><ThemeSwitcher /></div>`
);

fs.writeFileSync('src/app/page.tsx', content);
console.log('Patched page.tsx');
