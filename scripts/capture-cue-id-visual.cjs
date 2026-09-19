const { chromium } = require('playwright');
// capture refined Club Minimal head

async function capture({ width, height, name }) {
  const browser = await chromium.launch({
    headless: true,
    args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader']
  });
  const page = await browser.newPage({ viewport: { width, height } });

  page.on('console', message => {
    console.log('[browser-console]', message.type(), message.text());
  });
  page.on('pageerror', error => {
    console.log('[page-error]', error?.stack || error?.message || String(error));
  });

  await page.goto('https://pr-75.cuebooker-staging.pages.dev/cue-id', {
    waitUntil: 'networkidle'
  });

  const accept = page.getByRole('button', {
    name: /Aceptar cookies|Accept cookies/i
  });

  if (await accept.count()) {
    await accept.first().click().catch(() => {});
  }

  const stage = page.locator('.cue-id-stage');
  await stage.scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, 1));
  await page.waitForTimeout(1200);

  console.log('[capture]', name, 'stage-visible=', await stage.isVisible());
  console.log('[capture]', name, 'canvas-before=', await page.locator('.cue-id-stage canvas').count());
  console.log('[capture]', name, 'diagnostics-before=', await page.locator('.cue-id-stage__diagnostics').innerText().catch(() => 'missing'));

  await page.waitForFunction(() => {
    const diagnostic = document.querySelector('.cue-id-stage__diagnostics');
    if (!diagnostic) return false;
    const text = diagnostic.textContent || '';
    return /club-minimal-candidate/i.test(text);
  }, { timeout: 15000 }).catch(() => {});

  await page.waitForTimeout(1500);
  console.log('[capture]', name, 'canvas-after=', await page.locator('.cue-id-stage canvas').count());
  console.log('[capture]', name, 'diagnostics-after=', await page.locator('.cue-id-stage__diagnostics').innerText().catch(() => 'missing'));
  await stage.screenshot({ path: name });
  await browser.close();
}

(async () => {
  await capture({
    width: 1440,
    height: 1000,
    name: 'cue-id-desktop-auto.png'
  });

  await capture({
    width: 390,
    height: 844,
    name: 'cue-id-mobile-auto.png'
  });
})().catch(error => {
  console.error(error);
  process.exit(1);
});
