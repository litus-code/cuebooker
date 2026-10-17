import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'

const panel = await readFile(new URL('../app/components/WorkspaceNotifications.vue', import.meta.url), 'utf8')
const workspace = await readFile(new URL('../app/pages/workspace.vue', import.meta.url), 'utf8')
const item = { id: 'notice', workspace_id: 'workspace', booking_id: 'booking', read_at: null }
const deferred = () => { let resolve!: (value: any) => void; const promise = new Promise<any>(done => { resolve = done }); return { promise, resolve } }

function harness(api: any) {
  const state = { open: { value: true }, loading: { value: false }, error: { value: '' }, items: { value: [{ ...item }] }, unread: { value: 1 } }
  const events: unknown[][] = []
  const block = panel.slice(panel.indexOf('async function refreshCount()'), panel.indexOf('function handleDocumentClick('))
  const script = stripTypeScriptTypes(block, { mode: 'transform' })
  const actions = new Function('notifications', 'props', 'copy', ...Object.keys(state), 'emit', `let countRevision=0, loadRevision=0; ${script}; return {refreshCount,load,markAll,select}`)(api, { locale: 'es' }, { value: { retry: 'retry' } }, ...Object.values(state), (...args: unknown[]) => events.push(args))
  return { ...state, events, ...actions }
}

test('notification selection navigates immediately even while marking read is pending', async () => {
  const write = deferred()
  const ui = harness({ markRead: () => write.promise, unreadCount: async () => 0 })
  const selected = ui.select(item)
  assert.equal(ui.open.value, false)
  assert.deepEqual(ui.events, [['openBooking', item]])
  assert.equal(ui.unread.value, 1)
  write.resolve({ ...item, read_at: 'saved' })
  await selected
  assert.equal(ui.unread.value, 0)
  assert.equal(ui.items.value[0].read_at, 'saved')
})

test('an older unread response cannot restore the badge after a successful read', async () => {
  const stale = deferred()
  let counts = 0
  const ui = harness({ unreadCount: () => ++counts === 1 ? stale.promise : Promise.resolve(0), markRead: async () => ({ ...item, read_at: 'saved' }) })
  const refresh = ui.refreshCount()
  await ui.select(item)
  stale.resolve(1)
  await refresh
  assert.equal(ui.unread.value, 0)
})

test('opening the list clears only successfully persisted reads and retains unseen notices', async () => {
  let reads = 0
  const ui = harness({ list: async () => [{ ...item }], unreadCount: async () => reads ? 1 : 2, markRead: async () => { reads++; return { ...item, read_at: 'saved' } } })
  await ui.load()
  assert.equal(ui.unread.value, 1)
  assert.ok(ui.items.value[0].read_at)
})

test('failed read or count requests do not invent a cleared badge or block navigation', async () => {
  const ui = harness({ unreadCount: async () => { throw Error('offline') }, markRead: async () => { throw Error('offline') } })
  await ui.refreshCount()
  await ui.select(item)
  assert.equal(ui.unread.value, 1)
  assert.equal(ui.events[0][0], 'openBooking')
  assert.equal(ui.events[1][0], 'readError')
})

test('opening a booking exits Settings and editors and removes the OAuth callback query', () => {
  const block = workspace.slice(workspace.indexOf('function openRealBooking('), workspace.indexOf('async function openBookingCalendar('))
  const script = stripTypeScriptTypes(block, { mode: 'transform' })
  const settingsOpen = { value: true }, profileEditSection = { value: 'identity' }, editorOpen = { value: true }
  const focus = { value: '' }, view = { value: 'overview' }
  let navigation: any
  const open = new Function('settingsOpen','profileEditSection','editorOpen','realBookingFocusId','activeView','markBookingNotificationsRead','route','router','selectedArtistId','isAgency',`${script}; return openRealBooking`)(settingsOpen, profileEditSection, editorOpen, focus, view, () => {}, { query: { booking: 'booking', mailbox: 'connected', setup: 'profile', section: 'identity' } }, { replace: (target: unknown) => { navigation = target; return Promise.resolve() } }, { value: 'artist' }, { value: false })
  open('booking')
  assert.equal(settingsOpen.value, false)
  assert.equal(profileEditSection.value, null)
  assert.equal(editorOpen.value, false)
  assert.equal(focus.value, 'booking')
  assert.equal(view.value, 'bookings')
  assert.equal(navigation.query.mailbox, undefined)
  assert.equal(navigation.query.setup, undefined)
  assert.equal(navigation.query.section, undefined)
})
