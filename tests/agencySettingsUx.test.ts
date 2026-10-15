import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { compile, parse } from '@vue/compiler-dom'
import { parse as parseSfc } from '@vue/compiler-sfc'
import * as Vue from 'vue'
import { renderToString } from '@vue/server-renderer'

const workspace = parseSfc(await readFile(new URL('../app/pages/workspace.vue', import.meta.url), 'utf8')).descriptor.template!.content
function element(source: string, predicate: (node: any) => boolean): any {
  function find(node: any): any {
    if (node.type === 1 && predicate(node)) return node
    for (const child of node.children || []) { const match = find(child); if (match) return match }
  }
  return find(parse(source))
}
const attr = (node: any, name: string) => node.props?.find((p: any) => p.type === 6 && p.name === name)?.value?.content
async function render(source: string, data: Record<string, any>) {
  const compiled = Function('Vue', compile(source, { mode: 'function' }).code)(Vue)
  compiled._rc = true
  const app = Vue.createSSRApp({ data: () => data, render: compiled })
  for (const [name, id] of [['AgencyCatalogEditor', 'catalog'], ['AgencyTeamPanel', 'team'], ['ConnectedMailboxPanel', 'mailbox'], ['CuePreferencesControl', 'preferences']]) {
    app.component(name, { inheritAttrs: false, render: () => Vue.h('div', { id: `fixture-${id}` }) })
  }
  app.component('WorkspaceNotifications', { inheritAttrs: false, render(this: any) { return this.$slots.trigger({ toggle() {}, unread: 1 }) } })
  app.component('InfoPopover', { props: ['label'], render(this: any) { return Vue.h('button', { 'aria-label': this.label }, 'i') } })
  return renderToString(app)
}
const settings = element(workspace, n => attr(n, 'class') === 'editor-panel settings-panel').loc.source
const context = (isAgency: boolean, canOperateAgency = true) => ({ isAgency, canOperateAgency, agencyWorkspaceId: 'workspace', agencyWorkspaceRole: 'owner', bookingCoreWorkspaceId: 'workspace', auth: { session: { value: { user: { id: 'user' } } } }, preferences: { locale: { value: 'es' } }, copy: { accountPrivate: 'Cuenta', settingsTitle: 'Ajustes', close: 'Cerrar' }, APP_RELEASE_LABEL: 'test', closeSettings() {}, chooseArtist() {} })
test('agency settings reading order keeps management together, then preferences, then one mailbox', async () => {
  const html = await render(settings, context(true))
  const positions = ['catalog', 'team', 'preferences', 'mailbox'].map(id => html.indexOf(`id="fixture-${id}"`))
  assert.ok(positions.every(p => p >= 0))
  assert.deepEqual([...positions].sort((a, b) => a - b), positions)
  assert.equal((html.match(/id="fixture-mailbox"/g) || []).length, 1)
})
test('layout retains the existing mailbox visibility gate and individual reading order', async () => {
  assert.doesNotMatch(await render(settings, context(true, false)), /id="fixture-mailbox"/)
  const html = await render(settings, context(false))
  assert.doesNotMatch(html, /id="fixture-(catalog|team)"/)
  assert.ok(html.indexOf('id="fixture-mailbox"') < html.indexOf('id="fixture-preferences"'))
})
test('every icon-only agency navigation destination retains a translated explicit accessible name', async () => {
  const nav = element(workspace, n => attr(n, 'id') === 'workspace-navigation').loc.source
  for (const locale of ['es', 'en']) {
    const html = await render(nav, { ...context(true), preferences: { locale: { value: locale } }, workspaceBootResolved: true, activeView: 'overview', settingsOpen: false, copy: { overview: 'Overview', bookings: 'Bookings', calendar: 'Calendar', history: 'History', settings: 'Settings' }, changeView() {}, openSettings() {}, openNotificationBooking() {} })
    const root = parse(html)
    const buttons: any[] = []
    function walk(n: any) { if (n.tag === 'button') buttons.push(n); for (const c of n.children || []) walk(c) }
    walk(root)
    assert.equal(buttons.length, 7)
    for (const button of buttons) assert.ok(attr(button, 'aria-label'))
    assert.equal(attr(buttons.find(n => attr(n, 'data-workspace-view') === 'roster'), 'aria-label'), locale === 'es' ? 'Artistas' : 'Artists')
  }
})
test('team help stays inside the final translated word group, never a separate heading flex item', async () => {
  const source = parseSfc(await readFile(new URL('../app/components/AgencyTeamPanel.vue', import.meta.url), 'utf8')).descriptor.template!.content
  const title = element(source, n => attr(n, 'id') === 'agency-team-title').loc.source
  for (const es of [true, false]) {
    const html = await render(title, { es })
    assert.match(html, es ? /Trabaja con tu / : /Work with your /)
    const tail = element(html, n => attr(n, 'class') === 'agency-team__heading-tail')
    assert.ok(tail)
    assert.ok(tail.loc.source.includes(es ? 'equipo.' : 'team.'))
    assert.ok(element(tail.loc.source, n => n.tag === 'button'))
  }
})
