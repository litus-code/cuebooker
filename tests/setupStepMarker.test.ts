import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'

test('completion marker renders an accent SVG check only for completed steps, otherwise its number', async () => {
  const { descriptor } = parse(await readFile(new URL('../app/components/SetupStepMarker.vue', import.meta.url), 'utf8'))
  const script = stripTypeScriptTypes(compileScript(descriptor, { id: 'marker' }).content.replace(/from ["']vue["']/g, `from ${JSON.stringify(import.meta.resolve('vue'))}`), { mode: 'transform' })
  const component = (await import(`data:text/javascript;base64,${Buffer.from(script).toString('base64')}`)).default
  const template = compileTemplate({ source: descriptor.template!.content, filename: 'SetupStepMarker.vue', id: 'marker' })
  assert.equal(template.errors.length, 0)
  const code = template.code.replace(/from ["']vue["']/g, `from ${JSON.stringify(import.meta.resolve('vue'))}`)
  component.render = (await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`)).render
  const pending = await renderToString(createSSRApp(component, { complete: false, index: '02' }))
  assert.match(pending, /02/)
  assert.doesNotMatch(pending, /<svg/)
  const complete = await renderToString(createSSRApp(component, { complete: true, index: '02' }))
  assert.match(complete, /<svg/)
  assert.match(complete, /m7 12 3 3 7-7/)
  assert.match(complete, /aria-hidden="true"/)
  assert.match(descriptor.styles[0].content, /color:var\(--cue-accent\)/)
})

test('DJ and Agency markers use saved readiness, never sharing clicks', async () => {
  const dj = await readFile(new URL('../app/components/IndividualSetupPanel.vue', import.meta.url), 'utf8')
  const agency = await readFile(new URL('../app/components/AgencySetupPanel.vue', import.meta.url), 'utf8')
  assert.match(dj, /SetupStepMarker :complete="profileReady" index="01"/)
  assert.match(dj, /SetupStepMarker :complete="receivingReady" index="02"/)
  assert.match(dj, /SetupStepMarker :complete="false" index="03"/)
  assert.match(agency, /SetupStepMarker :complete="Boolean\(step.done\)"/)
  assert.doesNotMatch(dj + agency, /[✅✔✓]/)
})
