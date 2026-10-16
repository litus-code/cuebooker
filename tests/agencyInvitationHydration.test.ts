import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import { runInNewContext } from 'node:vm'
import { ref, computed } from 'vue'
import { AGENCY_INVITE_STORAGE, validAgencyInviteToken } from '../app/domain/agencyTeam.ts'

const page = await readFile(new URL('../app/pages/agency-invite.vue', import.meta.url), 'utf8')
const source = stripTypeScriptTypes(page.split('<script setup lang="ts">')[1]!.split('</script>')[0]!.replace(/^import .*\n/gm, ''))

async function openInvitation(options: { hash?: string; saved?: string; signedIn?: boolean }) {
  const route = { hash: '' }
  const stored = new Map<string, string>()
  if (options.saved) stored.set(AGENCY_INVITE_STORAGE, options.saved)
  const mounted: (() => Promise<void>)[] = [], ready: (() => Promise<void>)[] = [], reviews: string[] = []
  const state: any = runInNewContext(source + '\n;({token,error,busy,invitation})', {
    ref, computed, URLSearchParams, AGENCY_INVITE_STORAGE, validAgencyInviteToken,
    useCueAuth: () => ({ signedIn: ref(Boolean(options.signedIn)), initialize: async () => {} }),
    useAgencyTeam: () => ({ reviewInvitation: async (token: string) => { reviews.push(token); return { agency_name: 'QA', role: 'manager' } } }),
    useRoute: () => route,
    useRouter: () => ({ replace: async ({hash}: {hash: string}) => { route.hash = hash } }),
    useCuePreferences: () => ({ locale: ref('es') }), useHead: () => {},
    sessionStorage: { getItem: (key: string) => stored.get(key) ?? null, setItem: (key: string, value: string) => stored.set(key, value) },
    onMounted: (fn: () => Promise<void>) => mounted.push(fn),
    onNuxtReady: (fn: () => Promise<void>) => ready.push(fn)
  })
  // Nuxt 4.6 prerender hydration initially exposes the payload route without its fragment.
  for (const fn of mounted) await fn()
  route.hash = options.hash ?? ''
  for (const fn of ready) await fn()
  return { state, stored, reviews, route }
}

test('direct invitation reads the restored fragment after prerender hydration, then removes it from the URL', async () => {
  const token = 'a'.repeat(64)
  const {state, stored, reviews, route} = await openInvitation({hash: '#token=' + token})
  assert.equal(state.token.value, token)
  assert.equal(state.error.value, '')
  assert.equal(state.busy.value, false)
  assert.equal(stored.get(AGENCY_INVITE_STORAGE), token)
  assert.equal(route.hash, '')
  assert.deepEqual(reviews, []) // Reading the link does not accept an invitation or call authenticated APIs.
})

test('return from sign-in recovers the invitation from this tab and reviews without accepting it', async () => {
  const token = 'b'.repeat(64)
  const {state, reviews} = await openInvitation({saved: token, signedIn: true})
  assert.equal(state.error.value, '')
  assert.deepEqual(reviews, [token])
  assert.equal(state.invitation.value.role, 'manager')
})

test('missing or malformed invitation remains unavailable after hydration', async () => {
  for (const hash of ['', '#token=short']) {
    const {state, reviews} = await openInvitation({hash})
    assert.equal(state.token.value, '')
    assert.match(state.error.value, /Abre el enlace original/)
    assert.equal(state.busy.value, false)
    assert.deepEqual(reviews, [])
  }
})
