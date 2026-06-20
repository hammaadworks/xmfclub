const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:3331/login');
  await page.fill('input[type="text"]', 'XC260004');
  
  // 0, 4, 8, 5, 2, 6 -> 0: top-left, 4: center, 8: bottom-right, 5: right-center, 2: top-right, 6: bottom-left
  // The dots are in a 3x3 grid. 
  const dot0 = await page.$('div[data-index="0"]');
  const dot4 = await page.$('div[data-index="4"]');
  const dot8 = await page.$('div[data-index="8"]');
  const dot5 = await page.$('div[data-index="5"]');
  const dot2 = await page.$('div[data-index="2"]');
  const dot6 = await page.$('div[data-index="6"]');
  
  const box0 = await dot0.boundingBox();
  const box4 = await dot4.boundingBox();
  const box8 = await dot8.boundingBox();
  const box5 = await dot5.boundingBox();
  const box2 = await dot2.boundingBox();
  const box6 = await dot6.boundingBox();

  await page.mouse.move(box0.x + box0.width / 2, box0.y + box0.height / 2);
  await page.mouse.down();
  await page.mouse.move(box4.x + box4.width / 2, box4.y + box4.height / 2, { steps: 5 });
  await page.mouse.move(box8.x + box8.width / 2, box8.y + box8.height / 2, { steps: 5 });
  await page.mouse.move(box5.x + box5.width / 2, box5.y + box5.height / 2, { steps: 5 });
  await page.mouse.move(box2.x + box2.width / 2, box2.y + box2.height / 2, { steps: 5 });
  await page.mouse.move(box6.x + box6.width / 2, box6.y + box6.height / 2, { steps: 5 });
  await page.mouse.up();
  
  await page.waitForTimeout(1000);
  const url = page.url();
  console.log("Current URL:", url);
  const error = await page.evaluate(() => document.body.innerText.includes('Invalid'));
  console.log("Has error text:", error);
  await browser.close();
})();
