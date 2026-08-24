(async () => {
  const puppeteer = (await import('puppeteer')).default;
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR STACK:', err.stack || err.toString()));
  
  console.log('Navigating...');
  await page.goto('https://taranirnay.com', { waitUntil: 'domcontentloaded' });
  
  console.log('Waiting 10 seconds for crash...');
  await new Promise(r => setTimeout(r, 10000));
  
  await browser.close();
})();
