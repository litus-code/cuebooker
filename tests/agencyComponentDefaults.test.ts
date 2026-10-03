import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { parse, compileScript } from '@vue/compiler-sfc'
import { parse as parseJS } from '@babel/parser'
import { createSSRApp, h } from 'vue'
import { renderToString } from '@vue/server-renderer'

async function compiledProps(file: string) {
  const source = await readFile(new URL(`../app/components/${file}`, import.meta.url), 'utf8')
  const { descriptor } = parse(source, { filename: file })
  const script = compileScript(descriptor, { id: file })
  const ast = parseJS(script.content, { sourceType: 'module', plugins: ['typescript'] })
  const exported = ast.program.body.find((node: any) => node.type === 'ExportDefaultDeclaration') as any
  const options = exported.declaration.arguments[0]
  const props = options.properties.find((node: any) => node.key.name === 'props').value
  return Function(`return (${script.content.slice(props.start, props.end)})`)()
}

for (const [file, flag] of [['AgencyWorkspace.vue', 'canCapture'], ['BookingCoreAttention.vue', 'canOperate'], ['BookingCoreInbox.vue', 'canOperate'], ['BookingCoreOperations.vue', 'canOperate']]) {
  test(`${file}: omitted operation flag stays enabled; explicit viewer permission stays disabled`, async () => {
    const props = await compiledProps(file)
    const component = { props, inheritAttrs: false, render(this: any) { return h('span', String(this[flag])) } }
    const required = { workspaceId: 'test', agencyName: 'Test', artists: [], bookings: [], view: 'overview', locale: 'es', canManageRoster: false, booking: {id:'test'}, createArtist: async () => false }
    assert.equal(await renderToString(createSSRApp(component, required)), '<span>true</span>')
    assert.equal(await renderToString(createSSRApp(component, { ...required, [flag]: false })), '<span>false</span>')
  })
}
