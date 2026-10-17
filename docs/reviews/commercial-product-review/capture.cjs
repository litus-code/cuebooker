const {
  chromium
} = require(process.env.CUEBOOKER_PLAYWRIGHT_MODULE || '/workspace/.cuebooker-browser/node_modules/playwright');
const fs = require('node:fs/promises');
const assert = require('node:assert/strict');
const origin = process.env.CUEBOOKER_CAPTURE_ORIGIN || 'http://127.0.0.1:4182';
const outputDir = process.env.CUEBOOKER_CAPTURE_OUTPUT || '/tmp/cuebooker-product-captures';
const root = process.cwd();
if (!['localhost', '127.0.0.1'].includes(new URL(origin).hostname)) throw new Error('Capture requires a local static server');
const W = '10000000-0000-4000-8000-000000000001',
  O = '20000000-0000-4000-8000-000000000001',
  U = '30000000-0000-4000-8000-000000000001',
  A = '40000000-0000-4000-8000-000000000001',
  B = '40000000-0000-4000-8000-000000000002',
  K = '50000000-0000-4000-8000-000000000001';
const now = '2026-10-16T12:00:00Z';
const artist = (id, name) => ({
  id,
  stage_name: name,
  slug: name.toLowerCase(),
  city: 'Barcelona',
  artist_image_path: null,
  cover_image_path: null
});
const artists = [artist(A, 'ORBIT'), artist(B, 'NOVA')];
const booking = {
  id: K,
  workspace_id: W,
  artist_id: A,
  primary_contact_id: '70000000-0000-4000-8000-000000000001',
  counterparty_id: null,
  source: 'email',
  origin_channel: 'email',
  capture_method: 'manual',
  status: 'in_conversation',
  event_name: 'Noche orbital',
  venue_name: 'Sala Horizonte',
  city: 'Barcelona',
  country_code: 'ES',
  event_date: '2026-11-07',
  start_time: '23:00',
  end_time: '01:00',
  event_timezone: 'Europe/Madrid',
  offer_amount_minor: 120000,
  currency: 'EUR',
  fee_basis: 'event',
  archived_at: null,
  created_by: U,
  created_at: now,
  updated_at: now
};
const activity = {
  id: '60000000-0000-4000-8000-000000000001',
  workspace_id: W,
  booking_id: K,
  type: 'email',
  direction: 'inbound',
  contact_id: null,
  actor_user_id: null,
  body: '¿Tienes disponibilidad para el 24 de octubre? Nos gustaría contar con ORBIT en Sala Horizonte. Proponemos un set de dos horas.',
  metadata: {},
  visibility: 'workspace',
  occurred_at: now,
  created_by: U,
  created_at: now
};
const profile = {
  stageName: 'ORBIT',
  slug: 'orbit-fixture',
  bio: 'Sesiones de house y electrónica que conectan la pista de principio a fin.',
  city: 'Barcelona',
  countryCode: 'ES',
  languages: ['es', 'en'],
  primaryGenres: ['House'],
  secondaryGenres: ['Electronic'],
  performanceFormats: ['DJ set'],
  eventTypes: ['Club'],
  yearsActive: 5,
  websiteUrl: 'https://example.invalid',
  instagramUrl: 'https://instagram.com/example',
  soundcloudUrl: 'https://soundcloud.com/example',
  mixcloudUrl: null,
  youtubeUrl: null,
  spotifyUrl: null,
  coverUrl: '/images/profile/cuebooker-default-cover.webp',
  coverPositionY: 50,
  artistImageUrl: null,
  artistCutoutUrl: null,
  artistImageStyle: 'photo',
  artistImagePositionX: 50,
  artistImagePositionY: 50,
  artistImageScale: 1,
  acceptingRequests: true,
  passport: null
};
(async () => {
  await fs.mkdir(outputDir, {
    recursive: true
  });
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox']
  });
  for (const theme of ['dark', 'light']) for (const locale of ['es', 'en']) {
    const p = await browser.newPage({
      viewport: {
        width: 1440,
        height: 1050
      },
      reducedMotion: 'reduce'
    });
    await p.addInitScript(({
      locale,
      U,
      theme
    }) => {
      localStorage.setItem('cuebooker.auth.session.v2', JSON.stringify({
        access_token: 'fixture-session',
        refresh_token: 'fixture-refresh',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        started_at: Date.now(),
        user: {
          id: U,
          email: 'owner@example.invalid'
        }
      }));
      localStorage.setItem('cuebooker-locale', locale);
      localStorage.setItem('cuebooker-theme', theme);
      localStorage.setItem('cuebooker:analytics-consent:v2', 'denied');
    }, {
      locale,
      U,
      theme
    });
    await p.route('**/*', r => {
      const url = new URL(r.request().url());
      return url.origin === new URL(origin).origin || url.hostname === 'agency-ux-fixture.invalid' ? r.continue() : r.abort();
    });
    await p.route('https://agency-ux-fixture.invalid/**', async r => {
      const u = new URL(r.request().url()),
        name = u.pathname.split('/').at(-1);
      let body = [];
      const data = {
        profiles: [{
          user_id: U,
          display_name: 'Equipo ORBIT',
          onboarding_completed: true
        }],
        artist_members: artists.map(a => ({
          artist_id: a.id,
          role: 'manager'
        })),
        artists,
        organization_members: [{
          organization_id: O,
          role: 'owner'
        }],
        organizations: [{
          id: O,
          name: 'Órbita Agency',
          slug: 'orbita',
          type: 'agency'
        }],
        workspace_members: [{
          workspace_id: W,
          user_id: U,
          role: 'owner'
        }],
        workspaces: [{
          id: W,
          name: 'Órbita Agency',
          kind: 'agency',
          created_by: U,
          created_at: now,
          updated_at: now
        }],
        workspace_artists: artists.map(a => ({
          workspace_id: W,
          artist_id: a.id,
          created_by: U,
          created_at: now,
          roster_active: true
        })),
        ensure_booking_workspace: W,
        bookings: [booking, {
          ...booking,
          id: '50000000-0000-4000-8000-000000000003',
          status: 'confirmed',
          event_name: 'Sesión Horizonte',
          event_date: '2026-10-24'
        }, {
          ...booking,
          id: '50000000-0000-4000-8000-000000000002',
          artist_id: B,
          status: 'confirmed',
          event_name: 'Sesión NOVA',
          event_date: '2026-10-30'
        }, {...booking,id:'50000000-0000-4000-8000-000000000004',status:'confirmed',city:'Madrid',venue_name:'Club Central',event_name:'Sesión de prueba',event_date:'2026-10-02'}, {...booking,id:'50000000-0000-4000-8000-000000000005',status:'confirmed',city:'Lisboa',country_code:'PT',venue_name:'Espacio Atlántico',event_name:'Sesión de prueba',event_date:'2026-10-09'}],
        contacts: [{
          id: '70000000-0000-4000-8000-000000000001',
          workspace_id: W,
          name: 'Promotor de ejemplo',
          email: 'promotor@example.invalid',
          phone: null,
          role_label: null,
          notes: null,
          created_by: U,
          created_at: now,
          updated_at: now
        }],
        booking_activities: [activity],
        activities: [activity],
        booking_holds: [],
        holds: [],
        next_moves: [],
        booking_next_moves: [],
        user: {
          id: U,
          email: 'owner@example.invalid'
        },
        'get-public-artist-profile': {
          artist: profile
        }
      };
      if (name in data) body = data[name];else if (name.includes('catalog')) body = {
        name: 'Órbita Agency',
        slug: 'orbita',
        published: true,
        tagline: 'Roster de ejemplo',
        artists: []
      };else if (name === 'connected-mailbox') body = {
        connections: [],
        beta: {
          available: true,
          status: 'not_requested',
          approvalRequired: true
        }
      };else if (name.includes('billing') || name.includes('entitlement')) body = null;
      if (name === 'bookings') {
        for (const field of ['status', 'artist_id']) {
          const filter = u.searchParams.get(field);
          if (filter?.startsWith('eq.')) body = body.filter(row => row[field] === filter.slice(3));
        }
      }
      await r.fulfill({
        json: body
      });
    });
    await p.goto(origin + '/workspace/?view=bookings', {
      waitUntil: 'networkidle'
    });
    await p.waitForTimeout(500);
    assert.match(await p.locator('body').innerText(), /ORBIT/);
    await p.screenshot({
      path: `${outputDir}/product-roster-${theme}-${locale}.jpg`,
      type: 'jpeg',
      quality: 88
    });
    await p.goto(`${origin}/workspace/?view=bookings&artist=${A}&booking=${K}`, {
      waitUntil: 'networkidle'
    });
    await p.waitForTimeout(500);
    assert.match(await p.locator('body').innerText(), /ORBIT/);
    await p.screenshot({
      path: `${outputDir}/product-conversation-${theme}-${locale}.jpg`,
      type: 'jpeg',
      quality: 88
    });
    await p.goto(`${origin}/workspace/?view=calendar&artist=${A}&rosterMonth=2026-10&rosterDay=2026-10-24`, {
      waitUntil: 'networkidle'
    });
    await p.waitForTimeout(500);
    assert.match(await p.locator('body').innerText(), /ORBIT/);
    await p.screenshot({
      path: `${outputDir}/product-calendar-${theme}-${locale}.jpg`,
      type: 'jpeg',
      quality: 88
    });
    await p.goto(`${origin}/workspace/?view=passport&artist=${A}`, {waitUntil:'networkidle'});
    await p.locator('.passport-constellation__node').first().waitFor();
    assert.ok(await p.locator('.passport-constellation__node').count() >= 1);
    await p.locator('.passport-constellation__node').first().click();
    await p.waitForTimeout(200);
    await p.screenshot({path:`${outputDir}/product-passport-${theme}-${locale}.jpg`,type:'jpeg',quality:90});
    await p.route(origin + '/orbit-fixture', async r => r.fulfill({
      contentType: 'text/html',
      body: await fs.readFile(`${root}/.output/public/200.html`)
    }));
    await p.goto(origin + '/orbit-fixture', {
      waitUntil: 'networkidle'
    });
    await p.waitForTimeout(300);
    assert.match(await p.locator('body').innerText(), /ORBIT/);
    await p.screenshot({
      path: `${outputDir}/product-profile-${theme}-${locale}.jpg`,
      type: 'jpeg',
      quality: 88
    });
    await p.locator('.public-artist-profile__sound').evaluate(e => e.scrollIntoView({
      block: 'start'
    }));
    assert.match(await p.locator('body').innerText(), /ORBIT/);
    await p.screenshot({
      path: `${outputDir}/product-profile-details-${theme}-${locale}.jpg`,
      type: 'jpeg',
      quality: 88
    });
    await fs.writeFile(`${outputDir}/product-page-${theme}-${locale}.txt`, await p.locator('body').innerText());
    await p.close();
  }
  await browser.close();
})().catch(e => {
  console.error(e);
  process.exit(1);
});
