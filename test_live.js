(async () => {
  const puppeteer = (await import('puppeteer')).default;
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  
  await page.goto('https://taranirnay.com', { waitUntil: 'networkidle0' });
  
  console.log('Page loaded. Waiting for 5 seconds...');
  await new Promise(r => setTimeout(r, 5000));
  
  console.log('Clicking Generate Chart...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const genBtn = btns.find(b => b.textContent && b.textContent.includes('Generate Chart'));
    if (genBtn) genBtn.click();
  });
  
  console.log('Waiting 10 seconds for crash...');
  await new Promise(r => setTimeout(r, 10000));
  
  console.log('Taking screenshot...');
  await page.screenshot({ path: 'taranirnay_test.png' });
  
  await browser.close();
})();
