import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import { parse, compileScript } from '@vue/compiler-sfc'
import { computed, ref, readonly, createRenderer, h, reactive, nextTick } from 'vue'

test('actual onboarding auth command persists the selected avatar before completing registration', async () => {
  const source = await readFile(new URL('../app/composables/useCueAuth.ts', import.meta.url), 'utf8')
  const campaign = new URL('../app/domain/campaignAnalytics.ts', import.meta.url).href
  const team = new URL('../app/domain/agencyTeam.ts', import.meta.url).href
  const code = stripTypeScriptTypes(source.replace("'../domain/campaignAnalytics'", JSON.stringify(campaign)).replace(/import \{ campaignSignupMetadata \}[^\n]+\n/, "const campaignSignupMetadata = async () => ({})\n").replace("'../domain/agencyTeam'", JSON.stringify(team)).replaceAll('import.meta.client', 'true'), { mode: 'transform' })
  const module = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)
  const states = new Map<string, any>()
  const requests: any[] = []
  let rejectPreference = false
  const globals = {
    computed, readonly,
    useRuntimeConfig: () => ({ public: { supabaseUrl: 'https://example.test', supabasePublishableKey: 'test' } }),
    useState: (name: string, init: () => any) => {
      if (!states.has(name)) states.set(name, ref(init()))
      return states.get(name)
    },
    localStorage: { setItem: () => {}, removeItem: () => {} },
    $fetch: async (url: string, options: any) => {
      requests.push({ url, ...options })
      if (url.endsWith('/auth/v1/user')) {
        if (rejectPreference) throw new Error('preference_failed')
        return { id: 'dj-1', user_metadata: options.body.data }
      }
      if (url.endsWith('/profiles')) return [{ user_id: 'dj-1', onboarding_completed: true }]
      return { workspace_id: 'workspace-1' }
    }
  }
  const previous = new Map(Object.keys(globals).map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]))
  for (const [key, value] of Object.entries(globals)) Object.defineProperty(globalThis, key, { value, configurable: true, writable: true })
  try {
    const auth = module.useCueAuth()
    states.get('cue-auth-session').value = { access_token: 'test-token', refresh_token: 'test-refresh', started_at: Date.now(), expires_at: Math.floor(Date.now() / 1000) + 3600, user: { id: 'dj-1', user_metadata: { cuebooker_locale: 'es' } } }
    const input = { accountType: 'dj', displayName: 'Test', entityName: 'Artist', entitySlug: 'artist', avatarBody: 'female' }
    await auth.completeOnboarding(input)
    assert.equal(requests[0].url, 'https://example.test/auth/v1/user')
    assert.equal(requests[0].method, 'PUT')
    assert.equal(requests[0].headers.Authorization, 'Bearer test-token')
    assert.deepEqual(requests[0].body.data, { cuebooker_locale: 'es', cuebooker_avatar_body: 'female' })
    assert.equal(auth.session.value.user.user_metadata.cuebooker_avatar_body, 'female')
    assert.match(requests[1].url, /complete_onboarding$/)
    requests.length = 0
    await auth.completeOnboarding({ ...input, avatarBody: 'male' })
    assert.equal(auth.session.value.user.user_metadata.cuebooker_avatar_body, 'male')
    requests.length = 0
    await auth.completeOnboarding({ ...input, accountType: 'agency', avatarBody: undefined })
    assert.match(requests[0].url, /complete_onboarding$/)
    requests.length = 0
    rejectPreference = true
    await assert.rejects(auth.completeOnboarding(input), /preference_failed/)
    assert.equal(requests.length, 1)
    requests.length = 0
    await assert.rejects(auth.completeOnboarding({ ...input, avatarBody: 'invalid' }), /invalid_avatar_body/)
    assert.equal(requests.length, 0)
  } finally {
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor)
      else delete (globalThis as any)[key]
    }
  }
})

test('actual teaser updates the 3D preview body reactively and emits the avatar choice', async () => {
  const { descriptor } = parse(await readFile(new URL('../app/components/CueIdTeaser.vue', import.meta.url), 'utf8'))
  const compiled = compileScript(descriptor, { id: 'avatar-teaser' }).content
  const domain = new URL('../app/domain/cueIdStylizedCreator.ts', import.meta.url).href
  const code = stripTypeScriptTypes(compiled.replace("'../domain/cueIdStylizedCreator'", JSON.stringify(domain)).replace(/from ['"]vue['"]/g, `from ${JSON.stringify(import.meta.resolve('vue'))}`), { mode: 'transform' })
  const module = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)
  ;(globalThis as any).computed = computed
  ;(globalThis as any).useCuePreferences = () => ({ locale: ref('es') })
  const props = reactive({ body: 'male', bodySelectable: true, artistName: 'Test', compact: true, previewHref: '' })
  const events: any[] = []
  let state: any
  const renderer = createRenderer({ createElement: () => ({}), insert: () => {}, remove: () => {}, createText: () => ({}), createComment: () => ({}), setText: () => {}, setElementText: () => {}, parentNode: () => null, nextSibling: () => null, patchProp: () => {} })
  const app = renderer.createApp({ setup() { state = module.default.setup(props, { expose: () => {}, emit: (...args: any[]) => events.push(args) }); return () => h('span') } })
  try {
    app.mount({})
    assert.equal(state.previewAvatarConfig.value.body, 'male')
    props.body = 'female'
    await nextTick()
    assert.equal(state.previewAvatarConfig.value.body, 'female')
    state.emit('update:body', 'male')
    assert.deepEqual(events, [['update:body', 'male']])
    assert.match(descriptor.template!.content, /:aria-pressed="body === option"/)
    assert.match(descriptor.template!.content, /Hombre.*Mujer.*Male.*Female/)
  } finally { app.unmount(); delete (globalThis as any).computed; delete (globalThis as any).useCuePreferences }
})

test('artist and agency settings omit both removed blocks and the creator restores a user-scoped draft', async () => {
  const workspace = await readFile(new URL('../app/pages/workspace.vue', import.meta.url), 'utf8')
  const onboarding = await readFile(new URL('../app/pages/onboarding.vue', import.meta.url), 'utf8')
  const creator = await readFile(new URL('../app/pages/cue-id.vue', import.meta.url), 'utf8')
  assert.doesNotMatch(workspace, /class="settings-group settings-group--demo"/)
  assert.doesNotMatch(workspace, /class="password-form"/)
  assert.match(onboarding, /v-model:body="cueIdBody"/)
  assert.match(onboarding, /avatarBody: accountType.value === 'dj' \? cueIdBody.value : undefined/)
  assert.match(creator, /labDraftKey = user \? `\$\{LAB_DRAFT_KEY\}:\$\{user.id\}` : LAB_DRAFT_KEY/)
  assert.match(creator, /cuebooker_avatar_body === 'female'/)
  assert.match(creator, /if \(fromOnboarding.value\) restored.body = initial.body/)
  assert.doesNotMatch(creator, /localStorage\.(getItem|setItem|removeItem)\(LAB_DRAFT_KEY/)
})
