(async () => {
  const puppeteer = (await import('puppeteer')).default;
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR STACK:', err.stack || err.toString()));
  
  console.log('Navigating to localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });
  
  console.log('Waiting 10 seconds for crash...');
  await new Promise(r => setTimeout(r, 10000));
  
  await browser.close();
})();
