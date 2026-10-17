import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { parse, compileScript } from '@vue/compiler-sfc'
import { stripTypeScriptTypes } from 'node:module'
import { computed, reactive, createRenderer, h, nextTick } from 'vue'

test('summary labels accent only the first word while retaining the translated remainder', async () => {
  const { descriptor } = parse(await readFile(new URL('../app/components/SummaryMetricLabel.vue', import.meta.url), 'utf8'))
  const compiled = compileScript(descriptor, { id: 'summary-metric-label' }).content
  const code = stripTypeScriptTypes(compiled.replace(/from ['"]vue['"]/g, `from ${JSON.stringify(import.meta.resolve('vue'))}`), { mode: 'transform' })
  const module = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)
  ;(globalThis as any).computed = computed
  const props = reactive({ label: 'Bookings reales' })
  let state: any
  const renderer = createRenderer({ createElement: () => ({}), insert: () => {}, remove: () => {}, createText: () => ({}), createComment: () => ({}), setText: () => {}, setElementText: () => {}, parentNode: () => null, nextSibling: () => null, patchProp: () => {} })
  const app = renderer.createApp({ setup() { state = module.default.setup(props, { expose: () => {} }); return () => h('span') } })
  try {
    app.mount({})
    for (const [label, first, rest] of [['Bookings reales', 'Bookings', ' reales'], ['Holds este mes · octubre de 2026', 'Holds', ' este mes · octubre de 2026'], ['Confirmados · octubre de 2026', 'Confirmados', ' · octubre de 2026'], ['Días ocupados · octubre de 2026', 'Días', ' ocupados · octubre de 2026'], ['Occupied days', 'Occupied', ' days'], ['Confirmed', 'Confirmed', ''], ['', '', '']]) {
      props.label = label
      await nextTick()
      assert.equal(state.parts.value[1], first)
      assert.equal(state.parts.value[2], rest)
    }
    assert.match(descriptor.template!.content, /<em>\{\{ parts\[1\] \}\}<\/em>\{\{ parts\[2\] \}\}/)
    assert.match(descriptor.styles[0].content, /color:var\(--cue-accent\)/)
  } finally { app.unmount(); delete (globalThis as any).computed }
})

test('only the four operational overview metrics receive the first-word treatment', async () => {
  const workspace = await readFile(new URL('../app/pages/workspace.vue', import.meta.url), 'utf8')
  assert.equal((workspace.match(/<SummaryMetricLabel /g) || []).length, 4)
  assert.match(workspace, /summary-card--profile[^\n]*<span>\{\{ copy.profileCard \}\}<\/span>/)
})
