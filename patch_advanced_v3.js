const fs = require('fs');

let content = fs.readFileSync('src/lib/astrology.ts', 'utf8');

const debilitatedCode = `
      const isDebilitated = (p === 'Sun' && transitSignName === 'Libra') || 
                            (p === 'Moon' && transitSignName === 'Scorpio') || 
                            (p === 'Mars' && transitSignName === 'Cancer') || 
                            (p === 'Mercury' && transitSignName === 'Pisces') || 
                            (p === 'Jupiter' && transitSignName === 'Capricorn') || 
                            (p === 'Venus' && transitSignName === 'Virgo') || 
                            (p === 'Saturn' && transitSignName === 'Aries');
`;

// Insert it right after the isExalted definition
content = content.replace(
  /\(p === 'Saturn' && transitSignName === 'Libra'\);\s*/,
  "(p === 'Saturn' && transitSignName === 'Libra');\n" + debilitatedCode + "\n"
);

fs.writeFileSync('src/lib/astrology.ts', content);
