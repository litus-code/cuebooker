import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'
import { stripTypeScriptTypes } from 'node:module'

const source = await readFile(new URL('../app/components/BookingCoreInbox.vue', import.meta.url), 'utf8')

test('admission copy matches the verified-account notification recipient and displays capacity', async () => {
  const panel = await readFile(new URL('../app/components/ConnectedMailboxPanel.vue', import.meta.url), 'utf8')
  assert.match(panel, /correo verificado de tu cuenta de Cuebooker/)
  assert.match(panel, /Plazas de correo completas/)
  assert.match(panel, /Acceso aprobado/)
  assert.doesNotMatch(panel, /Te avisaremos en'[^\n]*requestedEmail/)
})

test('archive uses a branded accessible dialog and a visible button', () => {
  const { descriptor } = parse(source)
  compileScript(descriptor, { id: 'archive-test' })
  const template = compileTemplate({ source: descriptor.template!.content, filename: 'BookingCoreInbox.vue', id: 'archive-test' })
  assert.deepEqual(template.errors, [])
  assert.doesNotMatch(source, /window\.(confirm|alert)\(/)
  assert.match(source, /<dialog[^>]+aria-labelledby="core-archive-title"[^>]+aria-describedby="core-archive-description"/)
  assert.match(source, /@cancel.prevent="closeArchiveModal"/)
  assert.match(source, /autofocus @click="closeArchiveModal"/)
  assert.match(source, /core-inbox__archive:focus-visible/)
  assert.match(source, /core-inbox__archive svg/)
})

test('archive waits for confirmation, binds the booking and preserves retry after failure', async () => {
  const block = source.slice(source.indexOf('async function toggleArchive()'), source.indexOf('function formatDate(')).replace(/watch\(\(\) => \[props.workspaceId[\s\S]*?\n\}\)\n/, '')
  const script = stripTypeScriptTypes(block, { mode: 'transform' })
  const props = { canOperate: true, workspaceId: 'workspace', demoData: null }
  const selectedBooking = { value: { id: 'booking', archived_at: null } }
  const pendingArchive = { value: null as any }
  const archiving = { value: false }, archiveError = { value: '' }, archiveView = { value: 'inbox' }
  let opened = 0, closed = 0, failure = false
  const calls: unknown[][] = []
  const archiveDialog = { value: { showModal: () => opened++, close: () => closed++ } }
  const bookingCore = { setBookingArchived: async (...args: unknown[]) => { calls.push(args); if (failure) throw Error('private provider detail') } }
  const state = new Function('props', 'selectedBooking', 'pendingArchive', 'archiving', 'archiveError', 'archiveView', 'archiveDialog', 'bookingCore', 'nextTick', 'loadActivity', 'emit', `${script};return {toggleArchive,closeArchiveModal,confirmArchive}`)(props, selectedBooking, pendingArchive, archiving, archiveError, archiveView, archiveDialog, bookingCore, async () => {}, async () => {}, () => {})
  await state.toggleArchive()
  assert.equal(opened, 1)
  assert.equal(calls.length, 0)
  state.closeArchiveModal()
  await state.confirmArchive()
  assert.equal(calls.length, 0)
  await state.toggleArchive()
  props.workspaceId = 'other'
  await state.confirmArchive()
  assert.equal(calls.length, 0)
  props.workspaceId = 'workspace'
  failure = true
  await state.confirmArchive()
  assert.equal(archiveError.value, 'We could not save the change. Try again.')
  assert.notEqual(pendingArchive.value, null)
  assert.equal(archiving.value, false)
  failure = false
  await state.confirmArchive()
  assert.deepEqual(calls.at(-1), ['workspace', 'booking', true])
  assert.equal(archiveView.value, 'archived')
  assert.equal(pendingArchive.value, null)
  assert.equal(closed, 2)
})
