import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'
import { ref, computed, reactive, watch, onBeforeUnmount, nextTick, createRenderer, h } from 'vue'
import { APP_RELEASE_LABEL } from '../app/domain/appRelease.ts'

test('both account modes display one release label at the end of Settings', async () => {
  const source = await readFile(new URL('../app/pages/workspace.vue', import.meta.url), 'utf8')
  assert.match(APP_RELEASE_LABEL, /^Beta \d+\.\d+\.\d+$/)
  assert.match(source, /<p class="settings-release">Cuebooker · \{\{ APP_RELEASE_LABEL \}\}<\/p>\s*<\/aside>/)
  assert.equal(source.match(/class="settings-release"/g)?.length, 1)
})

test('individual setup reads mailbox consent, handles failures and stale scopes, and never connects from a click', async () => {
  const { descriptor } = parse(await readFile(new URL('../app/components/IndividualSetupPanel.vue', import.meta.url), 'utf8'))
  const script = compileScript(descriptor, { id: 'individual-setup' }).content
  const code = stripTypeScriptTypes(script.replace(/from ['"]vue['"]/g, `from ${JSON.stringify(import.meta.resolve('vue'))}`), { mode: 'transform' })
  const module = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)
  let saved: any[] = [], fail = false, delayed = false, resolveOld: any
  const calls: string[] = []
  const globals = { ref, computed, watch, onBeforeUnmount, useConnectedMailbox: () => ({ status: async (workspace: string) => {
    calls.push(workspace)
    if (fail) throw new Error('unavailable')
    if (delayed && workspace === 'solo-a') return new Promise(resolve => { resolveOld = resolve })
    return { connections: saved }
  } }) }
  const previous = new Map(Object.keys(globals).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]))
  for (const [key, value] of Object.entries(globals)) Object.defineProperty(globalThis, key, { value, configurable: true, writable: true })
  const props = reactive({ workspaceId: 'solo-a', locale: 'es', revision: 0, profileReady: false, published: false, acceptingRequests: false, bookingUrl: 'https://example.invalid/dj?booking=1', demoConnections: undefined as any })
  let state: any
  const renderer = createRenderer({ createElement: () => ({}), insert: () => {}, remove: () => {}, createText: () => ({}), createComment: () => ({}), setText: () => {}, setElementText: () => {}, parentNode: () => null, nextSibling: () => null, patchProp: () => {} })
  const app = renderer.createApp({ setup() { state = module.default.setup(props, { expose: () => {}, emit: () => {} }); return () => h('span') } })
  try {
    app.mount({}); await state.load()
    assert.equal(state.receivingReady.value, false)
    saved = [{ status: 'connected', background: { enabled: false } }]
    await state.load()
    assert.equal(state.connected.value, true)
    assert.equal(state.detectionReady.value, false)
    saved[0].background.enabled = true
    await state.load()
    assert.equal(state.receivingReady.value, true)
    assert.equal(state.formReady.value, false, 'mailbox does not require a public profile')
    saved = [{ status: 'reconnect_required', background: { enabled: true } }]
    await state.load()
    assert.equal(state.detectionReady.value, false)
    props.published = true
    assert.equal(state.formReady.value, false)
    props.acceptingRequests = true
    assert.equal(state.formReady.value, true)
    props.bookingUrl = ''
    assert.equal(state.formReady.value, false)
    fail = true; await state.load()
    assert.equal(state.unknown.value, true)
    assert.equal(state.detectionReady.value, false)
    fail = false; saved = []; await state.load()
    assert.equal(state.unknown.value, false)
    delayed = true
    const old = state.load()
    props.workspaceId = 'solo-b'; await nextTick(); await state.load()
    resolveOld({ connections: [{ status: 'connected', background: { enabled: true } }] }); await old
    assert.equal(state.detectionReady.value, false)
    props.demoConnections = [{ status: 'connected', background: { enabled: true } }]
    await nextTick(); calls.length = 0; await state.load()
    assert.equal(state.detectionReady.value, true)
    assert.equal(calls.length, 0)
    props.locale = 'en'
    assert.equal(state.es.value, false)
    assert.match(descriptor.template!.content, /v-if="formReady"/)
    assert.match(descriptor.template!.content, /emit\('action', 'mailbox'\)/)
    assert.match(descriptor.template!.content, /emit\('action', 'booking'\)/)
    assert.equal(compileTemplate({ source: descriptor.template!.content, filename: 'IndividualSetupPanel.vue', id: 'individual-setup' }).errors.length, 0)
  } finally {
    app.unmount()
    for (const [key, value] of previous) { if (value) Object.defineProperty(globalThis, key, value); else delete (globalThis as any)[key] }
  }
})

test('live actions open the real destinations without publication or consent mutations', async () => {
  const source = await readFile(new URL('../app/pages/workspace.vue', import.meta.url), 'utf8')
  const body = source.match(/async function runActivationStep\(id: string\) \{([\s\S]*?)\n\}\n/)![1]
  const calls: any[] = []
  const published = ref(false), accepting = ref(false), section = ref(null), guide = ref(false)
  const run = new Function('openAgencySetupSettings', 'profileGuideActive', 'changeView', 'nextTick', 'profileEditSection', 'toggleProfileEditSection', 'publicProfilePublished', 'publicProfileAcceptingRequests', 'publicBookingUrl', 'copyProfileValue', 'preferences', 'openCueCapture', `return async function(id) {${body}}`)(
    async (...args: any[]) => calls.push(['settings', ...args]), guide, async (view: string) => calls.push(['view', view]), async () => {}, section, async (name: string) => { section.value = name as any; calls.push(['edit', name]) }, published, accepting, ref('https://example.invalid/dj?booking=1'), async (...args: any[]) => calls.push(['copy', ...args]), { locale: ref('es') }, () => calls.push(['capture'])
  )
  await run('mailbox'); assert.deepEqual(calls.splice(0), [['settings', 'mailbox']])
  await run('profile'); assert.deepEqual(calls.splice(0), [['view', 'profile'], ['edit', 'identity']]); assert.equal(guide.value, false)
  await run('form'); assert.deepEqual(calls.splice(0), [['view', 'profile']]); assert.equal(published.value, false)
  published.value = true
  await run('form'); assert.deepEqual(calls.splice(0), [['view', 'profile'], ['edit', 'booking']]); assert.equal(accepting.value, false)
  accepting.value = true
  await run('share'); assert.equal(calls.splice(0)[0][0], 'copy')
  await run('booking'); assert.deepEqual(calls.splice(0), [['view', 'bookings'], ['capture']])
  assert.match(source, /const firstRunActivation = computed\(\(\) =>\s*!isAgency.value[\s\S]*?Boolean\(bookingCoreWorkspaceId.value\)[\s\S]*?!cueCoreLoading.value[\s\S]*?realBookings.value.length === 0/)
  assert.match(source, /:revision="bookingCoreOperationsRevision \+ \(settingsOpen \? 1 : 0\)"/)
  assert.doesNotMatch(source, /const activationSteps/)
})

test('anonymous first-run preview uses the real panel and fictional mailbox states only', async () => {
  const source = await readFile(new URL('../app/pages/preview-first-run.vue', import.meta.url), 'utf8')
  assert.match(source, /IndividualSetupPanel/)
  assert.match(source, /:demo-connections="demoConnections"/)
  assert.match(source, /scenario !== 'received'/)
  assert.match(source, /appEnv === 'staging'/)
  assert.match(source, /noindex,nofollow/)
  assert.doesNotMatch(source, /\$fetch\(|\.connect\(|\.save\(|\.authorizeBackground\(/)
})
