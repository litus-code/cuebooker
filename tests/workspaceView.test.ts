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
