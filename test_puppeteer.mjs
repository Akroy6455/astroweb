import puppeteer from 'puppeteer';

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  console.log('Navigating...');
  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  } catch(e) {
    console.error('Nav failed, server not ready?', e);
    await browser.close();
    process.exit(1);
  }
  
  console.log('Filling form...');
  await page.type('input[name="name"]', 'Test');
  
  console.log('Clicking button...');
  await page.click('button.submit-btn'); // Assuming the first submit btn is Generate Charts
  
  console.log('Waiting for response...');
  // Wait for either the results or the error to appear
  try {
    await page.waitForFunction(() => {
      const errorText = document.body.innerText;
      return errorText.includes('An error occurred in the Server Components render') || errorText.includes('Dasha');
    }, { timeout: 10000 });
  } catch(e) {}
  
  console.log('Taking screenshot...');
  await page.screenshot({path: 'puppeteer_test.png'});
  
  const content = await page.content();
  if (content.includes('An error occurred')) {
    console.log('ERROR FOUND ON PAGE');
  } else {
    console.log('SUCCESS OR DIFFERENT ERROR');
  }
  
  await browser.close();
})();
