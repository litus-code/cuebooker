const { chromium } = require('playwright');

async function capture({ width, height, name }) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width, height } });

  await page.goto('https://pr-75.cuebooker-staging.pages.dev/cue-id', {
    waitUntil: 'networkidle'
  });

  const accept = page.getByRole('button', { name: /Aceptar cookies|Accept cookies/i });
  if (await accept.count()) {
    await accept.first().click().catch(() => {});
  }

  const stage = page.locator('.cue-id-stage');
  await stage.scrollIntoViewIfNeeded();
  await page.waitForTimeout(5000);
  await stage.screenshot({ path: name });

  await browser.close();
}

(async () => {
  await capture({ width: 1440, height: 1000, name: 'cue-id-desktop-editorial-medium.png' });
  await capture({ width: 390, height: 844, name: 'cue-id-mobile-editorial-medium.png' });
})().catch(error => {
  console.error(error);
  process.exit(1);
});

// post-first-frame-fix recapture
