import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import { runInNewContext } from 'node:vm'
const source = stripTypeScriptTypes((await readFile(new URL('../app/plugins/mobile-header-scroll.client.ts', import.meta.url), 'utf8')).replace('export default ', ''))
function fixture(publicHeader = true) {
  const classes = new Set<string>(), rootClasses = new Set<string>()
  const list = (values: Set<string>) => ({ add: (v: string) => values.add(v), remove: (v: string) => values.delete(v), contains: (v: string) => values.has(v) })
  const header = { classList: list(classes), offsetHeight: 72, hasAttribute: () => publicHeader }
  const events: Record<string, Function> = {}, hooks: Record<string, Function> = {}
  let observer: Function = () => {}
  const window = { scrollY: 0, innerWidth: 390, matchMedia: (query: string) => ({ matches: window.innerWidth <= Number(query.match(/(\d+)px/)![1]) }), requestAnimationFrame: (fn: Function) => fn(), addEventListener: (name: string, fn: Function) => events[name] = fn }
  const document = { documentElement: { classList: list(rootClasses), style: { setProperty() {} } }, querySelector: (selector: string) => !publicHeader || selector.includes('[data-public-header]') ? header : null, addEventListener() {} }
  runInNewContext(source, { window, document, defineNuxtPlugin: (fn: Function) => fn({ hook: (name: string, fn: Function) => hooks[name] = fn }), MutationObserver: class { constructor(fn: Function) { observer = fn } observe() {} } })
  hooks['app:mounted']()
  return { window, classes, scroll(y: number) { window.scrollY = y; events.scroll() }, resize(width: number) { window.innerWidth = width; events.resize() }, menu(open: boolean) { open ? rootClasses.add('mobile-menu-open') : rootClasses.delete('mobile-menu-open'); observer() }, route() { hooks['page:finish']() } }
}
test('new public headers hide on downward scroll and reveal on accumulated small upward movements or at top', () => {
  const page = fixture()
  page.scroll(200); assert.ok(page.classes.has('site-header--hidden'))
  for (const y of [198, 196, 194, 192]) page.scroll(y)
  assert.equal(page.classes.has('site-header--hidden'), false)
  page.scroll(400); page.scroll(0)
  assert.equal(page.classes.has('site-header--hidden'), false)
})
test('open menu, desktop transition and route change reveal public headers', () => {
  const page = fixture()
  page.resize(1024); page.scroll(200); assert.ok(page.classes.has('site-header--hidden'))
  page.menu(true); page.scroll(400); assert.equal(page.classes.has('site-header--hidden'), false)
  page.menu(false); page.scroll(600); assert.ok(page.classes.has('site-header--hidden'))
  page.resize(1440); assert.equal(page.classes.has('site-header--hidden'), false)
  page.resize(390); page.scroll(800); page.route(); assert.equal(page.classes.has('site-header--hidden'), false)
})
test('legacy site headers retain their existing mobile breakpoint', () => {
  const page = fixture(false)
  page.resize(1024); page.scroll(200); assert.equal(page.classes.has('site-header--hidden'), false)
  page.resize(390); page.scroll(400); assert.ok(page.classes.has('site-header--hidden'))
})
