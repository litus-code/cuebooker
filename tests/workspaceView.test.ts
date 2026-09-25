import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import {
  explicitWorkspaceViewFromQuery,
  normalizeWorkspaceView,
  workspaceViewFromQuery
} from '../app/domain/workspaceView.ts'

test('workspace route chooses each supported surface directly', () => {
  for (const view of ['overview', 'bookings', 'calendar', 'history', 'profile', 'passport', 'cue-id']) {
    assert.equal(explicitWorkspaceViewFromQuery(view), view)
  }
})

test('a booking deep link always resolves to Bookings', () => {
  assert.equal(explicitWorkspaceViewFromQuery(undefined, 'booking-123'), 'bookings')
})

test('missing route remains unresolved until persisted state is checked', () => {
  assert.equal(explicitWorkspaceViewFromQuery(undefined, undefined), null)
  assert.equal(normalizeWorkspaceView('settings'), null)
  assert.equal(workspaceViewFromQuery(undefined, undefined), 'overview')
})

test('workspace keeps one structural skeleton per navigation surface', async () => {
  const source = await readFile(new URL('../app/pages/workspace.vue', import.meta.url), 'utf8')
  for (const surface of ['overview', 'bookings', 'calendar', 'history', 'profile', 'passport', 'cue-id', 'settings']) {
    assert.match(source, new RegExp(`workspace-skeleton--${surface}`))
  }
})

test('workspace navigation selection is driven by aria-current', async () => {
  const source = await readFile(new URL('../app/pages/workspace.vue', import.meta.url), 'utf8')
  const navigation = source.slice(source.indexOf('<nav id="workspace-navigation"'), source.indexOf('</nav>', source.indexOf('<nav id="workspace-navigation"')))
  assert.match(navigation, /isWorkspaceNavigationCurrent/)
  assert.doesNotMatch(navigation, /class=.{0,40}active|:class=.{0,80}active/)
})


test('profile is an explicit workspace surface instead of a fallback branch', async () => {
  const source = await readFile(new URL('../app/pages/workspace.vue', import.meta.url), 'utf8')
  assert.match(source, /v-else-if="activeView === 'profile'"/)
  assert.doesNotMatch(source, /<section v-else class="view profile-view/)
})

test('route synchronization does not force Overview when the URL has no explicit workspace view', async () => {
  const source = await readFile(new URL('../app/pages/workspace.vue', import.meta.url), 'utf8')
  const routeWatchStart = source.indexOf("watch(() => [route.query.view, route.query.booking]")
  const routeWatchEnd = source.indexOf("watch(() => route.query.artist", routeWatchStart)
  const routeWatch = source.slice(routeWatchStart, routeWatchEnd)
  assert.match(routeWatch, /explicitWorkspaceViewFromQuery/)
  assert.match(routeWatch, /if \(!next\) return/)
  assert.doesNotMatch(routeWatch, /workspaceViewFromQuery\(value, booking\)/)
})

test('bookings skeleton broad blocks have explicit geometry', async () => {
  const source = await readFile(new URL('../app/pages/workspace.vue', import.meta.url), 'utf8')
  assert.match(source, /skeleton-panel--booking-list-block/)
  assert.match(source, /skeleton-panel--booking-detail-block/)
  assert.match(source, /\.skeleton-panel--booking-list-block\{/)
  assert.match(source, /\.skeleton-panel--booking-detail-block\{/)
})

test('artist surfaces stop blocking on optional profile hydration', async () => {
  const source = await readFile(new URL('../app/pages/workspace.vue', import.meta.url), 'utf8')
  assert.match(source, /The base artist record is enough to render Profile, Passport and CUE ID/)
  assert.match(source, /void Promise\.all\(\[/)
  assert.match(source, /\['profile', 'passport', 'cue-id'\]\.includes\(activeView\.value\)/)
})

test('workspace boot uses one bounded deadline instead of additive auth waits', async () => {
  const source = await readFile(new URL('../app/pages/workspace.vue', import.meta.url), 'utf8')
  assert.match(source, /withWorkspaceTimeout\(\(async \(\) => \{/)
  assert.match(source, /\}\)\(\), 8000, 'workspace_boot'\)/)
  assert.doesNotMatch(source, /withWorkspaceTimeout\(auth\.initialize\(\), 8000, 'auth'\)/)
})

test('neutral loading copy is visually hidden and only used for accessibility', async () => {
  const source = await readFile(new URL('../app/pages/workspace.vue', import.meta.url), 'utf8')
  assert.match(source, /\.sr-only \{/)
  assert.match(source, /clip:rect\(0,0,0,0\)/)
  assert.match(source, /<span class="sr-only">\{\{ copy\.loading \}\}<\/span>/)
})
