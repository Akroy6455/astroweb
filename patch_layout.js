const fs = require('fs');
let content = fs.readFileSync('src/app/layout.tsx', 'utf8');

content = content.replace(
  /import CookieConsent from "@\/components\/CookieConsent";/,
  `import CookieConsent from "@/components/CookieConsent";\nimport { ThemeProvider } from "@/components/ThemeProvider";`
);

content = content.replace(
  /<body className="min-h-full flex flex-col">([\s\S]*?)<\/body>/,
  `<body className="min-h-full flex flex-col">\n        <ThemeProvider>\n$1\n        </ThemeProvider>\n      </body>`
);

fs.writeFileSync('src/app/layout.tsx', content);
console.log('Patched layout.tsx');
