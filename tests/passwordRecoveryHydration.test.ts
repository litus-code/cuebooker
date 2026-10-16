import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import { runInNewContext } from 'node:vm'
import { ref, computed, readonly } from 'vue'

const page = await readFile(new URL('../app/pages/reset-password.vue', import.meta.url), 'utf8')
const pageSource = stripTypeScriptTypes(page.split('<script setup lang="ts">')[1]!.split('</script>')[0]!)
const authSource = stripTypeScriptTypes((await readFile(new URL('../app/composables/useCueAuth.ts', import.meta.url), 'utf8'))
  .replace(/^import .*\n/gm, '').replace('export function', 'function').replaceAll('import.meta.client', 'true'))
const recoveryHash = '#access_token=fixture-access&refresh_token=fixture-refresh&type=recovery&expires_in=3600'

async function openRecovery(hash: string, options: { rejectToken?: boolean; stored?: object } = {}) {
  const rejectToken = options.rejectToken
  const storage = new Map<string, string>()
  if (options.stored) storage.set('cuebooker.auth.session.v2', JSON.stringify(options.stored))
  const location = { hash: '', pathname: '/reset-password', search: '' }
  const states = new Map<string, any>()
  const calls: {url: string; options: any}[] = []
  const mounted: (() => Promise<void>)[] = [], ready: (() => Promise<void>)[] = []
  const context = {
    ref, computed, readonly, URLSearchParams,
    useState: (key: string, init: () => unknown) => { if (!states.has(key)) states.set(key, ref(init())); return states.get(key) },
    useRuntimeConfig: () => ({ public: { supabaseUrl: 'https://fixture.invalid', supabasePublishableKey: 'fixture-public' } }),
    localStorage: { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value), removeItem: (key: string) => storage.delete(key) },
    window: { location, history: { replaceState: (_state: unknown, _title: string, _url: string) => { location.hash = '' } } },
    document: { title: 'Recovery' },
    $fetch: async (url: string, options: any) => {
      calls.push({url, options})
      if (url.endsWith('/auth/v1/user') && !options.method) {
        if (rejectToken) throw new Error('invalid_token')
        return { id: 'qa-user', email: 'qa@example.com' }
      }
      if (url.includes('/rest/v1/profiles')) return []
      return null
    }
  }
  // Run the actual composable, including server token verification and session persistence.
  const auth: any = runInNewContext(authSource + '\nuseCueAuth()', context)
  await auth.initialize()
  const state: any = runInNewContext(pageSource + '\n;({ready,invalid,completed,password,confirmPassword,submit})', {
    ...context, useCueAuth: () => auth, useCuePreferences: () => ({ locale: ref('es') }), useHead: () => {},
    onMounted: (fn: () => Promise<void>) => mounted.push(fn),
    onNuxtReady: (fn: () => Promise<void>) => ready.push(fn)
  })
  // The prerendered payload has no fragment until Nuxt restores the original URL.
  for (const fn of mounted) await fn()
  location.hash = hash
  for (const fn of ready) await fn()
  return { auth, state, calls, storage, location }
}

test('recovery waits for the restored fragment, verifies the token and removes credentials from the URL', async () => {
  const { auth, state, calls, location } = await openRecovery(recoveryHash)
  assert.equal(state.ready.value, true)
  assert.equal(state.invalid.value, false)
  assert.equal(auth.session.value.recovery, true)
  assert.equal(calls[0]?.options.headers.Authorization, 'Bearer fixture-access')
  assert.equal(location.hash, '')
})

test('a verified recovery session survives reload and allows a password update followed by sign-out', async () => {
  const first = await openRecovery(recoveryHash)
  const { auth, state, calls, storage } = await openRecovery('', { stored: first.auth.session.value })
  assert.equal(state.ready.value, true)
  state.password.value = state.confirmPassword.value = 'Fixture-new-password-123'
  await state.submit()
  assert.equal(calls.find(call => call.options.method === 'PUT')?.options.body.password, 'Fixture-new-password-123')
  assert.ok(calls.some(call => call.url.endsWith('/auth/v1/logout')))
  assert.equal(state.completed.value, true)
  assert.equal(auth.session.value, null)
  assert.equal(storage.has('cuebooker.auth.session.v2'), false)
})

test('expired and incomplete recovery links never grant recovery access or write a password', async () => {
  for (const hash of ['', '#type=recovery&access_token=fixture-access', recoveryHash]) {
    const { auth, state, calls } = await openRecovery(hash, { rejectToken: true })
    assert.equal(state.ready.value, false)
    assert.equal(state.invalid.value, true)
    assert.equal(auth.session.value, null)
    assert.equal(calls.some(call => call.options.method === 'PUT'), false)
  }
})

test('ordinary sign-in sessions cannot enter recovery without a verified recovery link', async () => {
  const session = { access_token: 'ordinary-access', refresh_token: 'ordinary-refresh', started_at: Date.now(), expires_at: Math.floor(Date.now() / 1000) + 3600, user: { id: 'qa-user' } }
  const { auth, state } = await openRecovery('', { stored: session })
  assert.equal(state.ready.value, false)
  assert.equal(state.invalid.value, true)
  await assert.rejects(auth.setRecoveredPassword('Fixture-new-password-123'), /recovery_session_required/)
})
