import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('individual settings reuse the shared language and appearance controls', async () => {
  const page = await readFile(new URL('../app/pages/workspace.vue', import.meta.url), 'utf8')
  assert.match(page, /isAgency \? 'settings-panel--agency' : 'settings-panel--individual'/)
  const module = page.match(/<section v-if="!isAgency" class="settings-preferences settings-preferences--individual"[\s\S]*?<\/section>/)?.[0]
  assert.ok(module)
  assert.match(module, /aria-labelledby="individual-preferences-title"/)
  assert.match(module, /<CuePreferencesControl compact labels \/>/)
  assert.doesNotMatch(module, /settings-options/)
})

test('individual mobile settings cancel the negative heading gutter and sticky offset', async () => {
  const page = await readFile(new URL('../app/pages/workspace.vue', import.meta.url), 'utf8')
  const heading = page.match(/\.workspace \.settings-panel--individual > \.editor-heading \{([^}]+)\}/)?.[1]
  assert.ok(heading)
  assert.match(heading, /margin:0!important/)
  assert.match(heading, /position:static!important/)
  assert.match(heading, /max-width:100%/)
  assert.match(page, /\.workspace \.settings-panel--individual > \.editor-heading h2 \{[\s\S]*?overflow-wrap:anywhere/)
})

test('individual actions and access submit use rounded controls without rounding workspace navigation', async () => {
  const page = await readFile(new URL('../app/pages/workspace.vue', import.meta.url), 'utf8')
  const access = await readFile(new URL('../app/pages/access.vue', import.meta.url), 'utf8')
  assert.match(page, /\.workspace:not\(\.workspace--agency\) :is\(\.primary-button,\.delete-button,\.demo-action,\.demo-secondary-action,\.demo-danger-action\) \{\s*border-radius:var\(--cue-radius-control,8px\)!important/)
  assert.match(access, /\.access-submit \{[^}]*border-radius:var\(--cue-radius-control,8px\)/)
  assert.match(access, /\.access-tabs button \{[^}]*border-radius:999px/)
})
