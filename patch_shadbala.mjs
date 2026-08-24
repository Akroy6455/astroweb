import * as fs from 'fs';

let content = fs.readFileSync('src/lib/shadbala.ts', 'utf8');

// We need to inject the PyJHora Ahargana functions somewhere at the top.
const aharganaFunctions = 
// PyJHora Ahargana Logic for Kaala Bala
function getDaysElapsedSinceBase(year: number, baseYear = 1951, baseDays = 174) {
  const totalYears = year - baseYear;
  let leapYears = 0;
  for (let y = baseYear + 1; y <= year; y++) {
    if ((y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0)) leapYears++;
  }
  const nonLeapYears = totalYears - leapYears;
  return baseDays + (leapYears * 366) + (nonLeapYears * 365);
}

function inverseLagrange(xs: number[], ys: number[], x: number) {
  let result = 0;
  for (let i = 0; i < xs.length; i++) {
    let term = ys[i];
    for (let j = 0; j < xs.length; j++) {
      if (j !== i) {
        term = term * (x - xs[j]) / (xs[i] - xs[j]);
      }
    }
    result += term;
  }
  return result;
}
;

// Insert the functions after the imports
content = content.replace(/(import sweph from 'sweph';)/, $1\n);

fs.writeFileSync('src/lib/shadbala.ts', content, 'utf8');
