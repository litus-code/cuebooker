const { chromium } = require('playwright');

async function capture({ width, height, name }) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width, height } });

  page.on('console', msg => {
    console.log('[browser-console]', msg.type(), msg.text());
  });
  page.on('pageerror', error => {
    console.log('[pageerror]', error.message);
  });
  page.on('requestfailed', request => {
    console.log('[requestfailed]', request.url(), request.failure()?.errorText);
  });
  page.on('response', response => {
    if (/club-minimal-candidate|CueIdScene/i.test(response.url())) {
      console.log(
        '[response]',
        response.status(),
        response.url(),
        response.headers()['content-length'] || 'no-content-length'
      );
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
  await page.waitForTimeout(8000);

  const diagnostics = await page.locator('.cue-id-stage__diagnostics').textContent().catch(() => null);
  const sceneClass = await page.locator('.cue-id-scene').getAttribute('class').catch(() => null);
  const canvasCount = await page.locator('.cue-id-stage canvas').count();
  const resources = await page.evaluate(() =>
    performance.getEntriesByType('resource')
      .map(entry => entry.name)
      .filter(name => /club-minimal-candidate|CueIdScene/i.test(name))
  );

  console.log('[diagnostics]', diagnostics);
  console.log('[scene-class]', sceneClass);
  console.log('[canvas-count]', canvasCount);
  console.log('[resources]', JSON.stringify(resources));

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
