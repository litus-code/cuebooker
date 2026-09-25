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

test('a booking deep link resolves to Bookings', () => {
  assert.equal(explicitWorkspaceViewFromQuery(undefined, 'booking-123'), 'bookings')
})

test('missing route can still resolve to Overview through the stable fallback', () => {
  assert.equal(explicitWorkspaceViewFromQuery(undefined, undefined), null)
  assert.equal(normalizeWorkspaceView('settings'), null)
  assert.equal(workspaceViewFromQuery(undefined, undefined), 'overview')
})

test('stable workspace keeps Profile as a real rendered surface', async () => {
  const source = await readFile(new URL('../app/pages/workspace.vue', import.meta.url), 'utf8')
  assert.match(source, /class="view profile-view profile-view--presence"/)
  assert.match(source, /<WorkspaceArtistProfile/)
})

test('workspace navigation exposes Profile and uses aria-current', async () => {
  const source = await readFile(new URL('../app/pages/workspace.vue', import.meta.url), 'utf8')
  const start = source.indexOf('<nav id="workspace-navigation"')
  const end = source.indexOf('</nav>', start)
  const navigation = source.slice(start, end)

  assert.match(navigation, /data-workspace-view="profile"/)
  assert.match(navigation, /changeView\('profile'\)/)
  assert.match(navigation, /aria-current/)
})

test('direct route synchronization can select Profile', async () => {
  const source = await readFile(new URL('../app/pages/workspace.vue', import.meta.url), 'utf8')
  const start = source.indexOf("watch(() => [route.query.view, route.query.booking]")
  const end = source.indexOf("watch(() => route.query.artist", start)
  const routeWatch = source.slice(start, end)

  assert.match(routeWatch, /workspaceViewFromQuery|explicitWorkspaceViewFromQuery/)
  assert.match(routeWatch, /activeView\.value = next/)
})

test('workspace keeps structural loading surfaces for primary modules', async () => {
  const source = await readFile(new URL('../app/pages/workspace.vue', import.meta.url), 'utf8')
  for (const surface of ['overview', 'bookings', 'calendar', 'history', 'profile', 'passport', 'cue-id']) {
    assert.match(source, new RegExp(`workspace-skeleton--${surface}`))
  }
})
