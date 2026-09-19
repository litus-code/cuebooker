const { chromium } = require('playwright');

async function capture({ width, height, name }) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width, height } });

  page.on('console', msg => {
    console.log('[browser-console]', msg.type(), msg.text());
  });
  page.on('pageerror', error => {
    console.log('[page-error]', error.message);
  });
  page.on('response', response => {
    if (response.url().includes('.glb')) {
      console.log('[glb-response]', response.status(), response.url(), response.headers()['content-length'] || 'no-length');
    }
  });

  await page.goto('https://pr-75.cuebooker-staging.pages.dev/cue-id', {
    waitUntil: 'networkidle'
  });

  const accept = page.getByRole('button', { name: /Aceptar cookies|Accept cookies/i });
  if (await accept.count()) {
    await accept.first().click().catch(() => {});
  }

  const stage = page.locator('.cue-id-stage');
  await stage.scrollIntoViewIfNeeded();
  await page.waitForTimeout(6500);

  const diagnostic = page.locator('.cue-id-stage__diagnostics');
  console.log('[diagnostics]', (await diagnostic.textContent().catch(() => null)) || 'missing');

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
