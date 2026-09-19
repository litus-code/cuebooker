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
  await page.waitForTimeout(700);

  await page.waitForFunction(() => {
    const diagnostic = document.querySelector('.cue-id-stage__diagnostics');
    if (!diagnostic) return false;
    const text = diagnostic.textContent || '';
    return /asset\s+club-minimal-candidate-medium-v1/i.test(text)
      && /ready\s+\d+ms/i.test(text);
  }, { timeout: 15000 });

  await page.waitForTimeout(600);
  await stage.screenshot({ path: name });
  await browser.close();
}

(async () => {
  await capture({ width: 1440, height: 1000, name: 'cue-id-desktop-medium-editorial.png' });
  await capture({ width: 390, height: 844, name: 'cue-id-mobile-medium-editorial.png' });
})().catch(error => {
  console.error(error);
  process.exit(1);
});
