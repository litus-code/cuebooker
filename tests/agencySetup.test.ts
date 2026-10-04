import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { parse, compileScript } from '@vue/compiler-sfc'
import { stripTypeScriptTypes } from 'node:module'
import { ref, computed, reactive, watch, onBeforeUnmount, nextTick, createRenderer, h } from 'vue'
import { agencySetupProgress, type AgencySetupInput } from '../app/domain/agencySetup.ts'

const blank = (): AgencySetupInput => ({ agency: { name: 'Agency', bio: null, contactEmail: null }, artist: null, receivingReady: false, hasBooking: false })
const prepared = (): AgencySetupInput => ({ agency: { name: 'Agency', bio: 'Club artists', contactEmail: 'booking@example.test' }, artist: { id: 'artist-1', name: 'Artist', bio: 'Techno artist', city: 'Barcelona', genres: ['Techno'] }, receivingReady: true, hasBooking: false })

test('agency setup is derived from saved readiness, and private/manual operation remains possible', () => {
  const empty = agencySetupProgress(blank())
  assert.equal(empty.completed, 0)
  assert.equal(empty.canCapture, false)
  const privateAgency = agencySetupProgress({ ...prepared(), receivingReady: false })
  assert.equal(privateAgency.completed, 2)
  assert.equal(privateAgency.artistReady, true)
  assert.equal(privateAgency.canCapture, true)
  assert.equal(privateAgency.show, true)
  assert.equal(agencySetupProgress(prepared()).completed, 3)
  assert.equal(agencySetupProgress(prepared()).show, true)
  assert.equal(agencySetupProgress({ ...blank(), hasBooking: true }).show, false)
  assert.equal(agencySetupProgress({ ...prepared(), agency: { name: 'Agency', bio: ' ', contactEmail: 'invalid' } }).agencyReady, false)
  assert.equal(agencySetupProgress({ ...prepared(), artist: { ...prepared().artist!, genres: [] } }).artistReady, false)
})

test('actual setup loader handles existing/archived bookings, saved steps, errors, retry, scope races and demo isolation', async () => {
  const { descriptor } = parse(await readFile(new URL('../app/components/AgencySetupPanel.vue', import.meta.url), 'utf8'))
  const compiled = compileScript(descriptor, { id: 'agency-setup' }).content
  const domain = new URL('../app/domain/agencySetup.ts', import.meta.url).href
  const code = stripTypeScriptTypes(compiled.replace("'../domain/agencySetup'", JSON.stringify(domain)).replace(/from ['"]vue['"]/g, `from ${JSON.stringify(import.meta.resolve('vue'))}`), { mode: 'transform' })
  const module = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)
  const calls: any[] = []
  let existing: any[] = []
  let failBookings = false, failMailbox = false
  let pendingResolve: ((value: any[]) => void) | null = null
  let delayOld = false
  let published = false, catalogVisible = false
  const globals = {
    ref, computed, watch, onBeforeUnmount,
    useBookingCore: () => ({ listBookings: async (workspace: string, limit: number) => {
      calls.push(['bookings', workspace, limit])
      if (failBookings) throw new Error('failed')
      if (delayOld && workspace === 'agency-a') return new Promise<any[]>(resolve => { pendingResolve = resolve })
      return existing
    } }),
    useAgencyCatalog: () => ({ load: async (workspace: string) => { calls.push(['catalog', workspace]); return { name: 'Agency', bio: 'Club artists', contactEmail: 'booking@example.test', published, artists: [{ eligible: true, catalogVisible, acceptingRequests: false }] } } }),
    useArtistProfile: () => ({ getProfile: async (id: string, sync: boolean) => { calls.push(['profile', id, sync]); return { artist: { id, stage_name: 'Artist', bio: 'Techno artist', city: 'Barcelona', primary_genres: ['Techno'] } } } }),
    useConnectedMailbox: () => ({ status: async (workspace: string) => { calls.push(['mailbox', workspace]); if (failMailbox) throw new Error('unavailable'); return { connections: [{ status: 'connected' }] } } })
  }
  const previous = new Map(Object.keys(globals).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]))
  for (const [key, value] of Object.entries(globals)) Object.defineProperty(globalThis, key, { value, configurable: true, writable: true })
  const events: any[] = []
  const props = reactive({ workspaceId: 'agency-a', artists: [] as any[], locale: 'es', revision: 0, canCapture: true, demoState: undefined as AgencySetupInput | undefined })
  let state: any
  const renderer = createRenderer({ createElement: () => ({}), insert: () => {}, remove: () => {}, createText: () => ({}), createComment: () => ({}), setText: () => {}, setElementText: () => {}, parentNode: () => null, nextSibling: () => null, patchProp: () => {} })
  const app = renderer.createApp({ setup() { state = module.default.setup(props, { expose: () => {}, emit: (...args: any[]) => events.push(args) }); return () => h('span') } })
  try {
    app.mount({})
    await state.load()
    assert.equal(state.progress.value.artistReady, false)
    state.act('artist')
    assert.deepEqual(events.pop(), ['addArtist'])
    props.artists = [{ id: 'retired', roster_active: false }, { id: 'artist-1', roster_active: true }]
    await nextTick(); await state.load()
    assert.equal(state.progress.value.completed, 3)
    assert.ok(calls.some(call => call[0] === 'profile' && call[1] === 'artist-1' && call[2] === false))
    state.act('agency')
    assert.deepEqual(events.pop(), ['settings', 'agency'])
    state.act('receiving')
    assert.deepEqual(events.pop(), ['settings', 'agency'])
    failMailbox = true
    await state.load()
    assert.equal(state.progress.value.completed, 2)
    assert.equal(state.mailboxUnknown.value, true)
    published = true
    await state.load()
    assert.equal(state.progress.value.receivingReady, false)
    catalogVisible = true
    await state.load()
    assert.equal(state.progress.value.receivingReady, true)
    published = false
    await state.load()
    assert.equal(state.progress.value.receivingReady, false)
    failBookings = true
    await state.load()
    assert.equal(state.error.value, true)
    assert.equal(state.progress.value, null)
    failBookings = false
    existing = [{ id: 'old-booking', artist_id: null, archived_at: '2026-10-01' }]
    calls.length = 0
    await state.load()
    assert.equal(state.progress.value.show, false)
    assert.deepEqual(calls, [['bookings', 'agency-a', 1]])
    existing = []
    delayOld = true
    const oldLoad = state.load()
    props.workspaceId = 'agency-b'
    await nextTick(); await state.load()
    assert.equal(state.progress.value.show, true)
    pendingResolve!([{ id: 'other-workspace-booking' }])
    await oldLoad
    assert.equal(state.progress.value.show, true)
    props.demoState = blank()
    await nextTick(); calls.length = 0; await state.load()
    assert.equal(state.progress.value.completed, 0)
    assert.equal(calls.length, 0)
    props.demoState = { ...prepared(), hasBooking: true }
    await nextTick(); await state.load()
    assert.equal(state.progress.value.show, false)
    assert.equal(calls.length, 0)
    assert.match(descriptor.template!.content, /:disabled="!progress.canCapture"/)
    assert.match(descriptor.template!.content, /v-if="error \|\| progress\?\.show"/)
  } finally {
    app.unmount()
    for (const [key, value] of previous) { if (value) Object.defineProperty(globalThis, key, value); else delete (globalThis as any)[key] }
  }
})

test('setup actions integrate with existing live flows while anonymous preview never persists data', async () => {
  const workspace = await readFile(new URL('../app/pages/workspace.vue', import.meta.url), 'utf8')
  const agency = await readFile(new URL('../app/components/AgencyWorkspace.vue', import.meta.url), 'utf8')
  const preview = await readFile(new URL('../app/pages/preview-agency-setup.vue', import.meta.url), 'utf8')
  assert.match(agency, /view === 'overview' && canManageRoster && !demoData/)
  assert.match(agency, /@add-artist="showAdd = true"/)
  assert.match(workspace, /bookingCoreOperationsRevision \+ \(settingsOpen \? 1 : 0\)/)
  assert.match(workspace, /@setup-settings="openAgencySetupSettings"/)
  assert.match(preview, /:demo-state="demo"/)
  assert.match(preview, /appEnv === 'staging'/)
  assert.match(preview, /noindex,nofollow/)
  assert.doesNotMatch(preview, /\$fetch\(|completeOnboarding\(|\.save\(/)
})
