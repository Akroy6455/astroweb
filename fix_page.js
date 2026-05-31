const fs = require('fs');
let content = fs.readFileSync('src/app/page.tsx', 'utf8');

// 1. Add import
if (!content.includes('import ThemeSwitcher from')) {
  content = content.replace(
    /import LocationAutocomplete from '@\/components\/LocationAutocomplete';/,
    `import LocationAutocomplete from '@/components/LocationAutocomplete';\nimport ThemeSwitcher from '@/components/ThemeSwitcher';`
  );
}

fs.writeFileSync('src/app/page.tsx', content);
console.log('Fixed page import');
