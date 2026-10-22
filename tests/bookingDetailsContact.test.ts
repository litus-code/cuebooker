import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import { parse, compileScript, compileTemplate } from '@vue/compiler-sfc'
import { createBookingCoreApi } from '../app/services/bookingCoreApi.ts'

const source = await readFile(new URL('../app/components/BookingCoreEditor.vue', import.meta.url), 'utf8')
function harness(contact: any = null) {
  const props = { workspaceId: 'workspace', locale: 'es', contact, booking: { id: 'booking', primary_contact_id: contact?.id || null, status: 'new', event_name: 'Original' } }
  const state = { form: {} as any, saving: { value: false }, errorMessage: { value: '' }, open: { value: true } }
  const calls: any[] = [], events: any[] = []
  const api = { updateBookingDetails: async (input: any) => { calls.push(input); return { id: 'booking', primary_contact_id: 'saved' } } }
  const block = source.slice(source.indexOf('function syncForm()'), source.indexOf('</script>'))
    .replace(/watch\([^\n]+\n/g, '')
  const actions = new Function('props','form','saving','errorMessage','open','copy','bookingCore','nextTick','emit','triggerButton','editorDialog',
    stripTypeScriptTypes(block, { mode: 'transform' }) + '; return {syncForm, save};'
  )(props, state.form, state.saving, state.errorMessage, state.open, { value: { contactRequired: 'name required', invalidEmail: 'email invalid', error: 'retry' } }, api, async () => {}, (...args: any[]) => events.push(args), { value: null }, { value: null })
  actions.syncForm()
  return { ...state, ...actions, props, api, calls, events }
}
test('one editor compiles with booking and contact sections even without a saved contact', () => {
  const { descriptor } = parse(source)
  compileScript(descriptor, { id: 'booking-contact' })
  assert.deepEqual(compileTemplate({ source: descriptor.template!.content, filename: 'BookingCoreEditor.vue', id: 'booking-contact' }).errors, [])
  for (const field of ['contactName', 'contactEmail', 'contactPhone']) assert.ok(source.includes('v-model="form.' + field + '"'))
})
test('missing contact is submitted with booking facts through one command', async () => {
  const ui = harness()
  Object.assign(ui.form, { contactName: 'Marta', contactEmail: 'marta@example.invalid', contactPhone: '+34 600000000' })
  await ui.save()
  assert.equal(ui.calls.length, 1)
  assert.deepEqual(ui.calls[0].contact, { id: null, name: 'Marta', email: 'marta@example.invalid', phone: '+34 600000000' })
  assert.equal(ui.calls[0].eventName, 'Original')
  assert.equal(ui.open.value, false)
  assert.equal(ui.events[0][0], 'saved')
})
test('existing contact preloads editable fields and preserves its identity', async () => {
  const ui = harness({ id: 'person', name: 'Marta', email: 'old@example.invalid', phone: '123' })
  assert.equal(ui.form.contactName, 'Marta')
  ui.form.contactEmail = 'new@example.invalid'
  await ui.save()
  assert.equal(ui.calls[0].contact.id, 'person')
  assert.equal(ui.calls[0].contact.email, 'new@example.invalid')
})
test('invalid contact input never writes; empty contact stays optional', async () => {
  const ui = harness()
  ui.form.contactEmail = 'bad'
  await ui.save()
  assert.equal(ui.calls.length, 0)
  ui.form.contactName = 'Marta'
  await ui.save()
  assert.equal(ui.errorMessage.value, 'email invalid')
  assert.equal(ui.calls.length, 0)
  ui.form.contactEmail = ''; ui.form.contactName = ''
  await ui.save()
  assert.equal(ui.calls.length, 1)
})
test('failed atomic save keeps the entered fields for retry and does not emit success', async () => {
  const ui = harness()
  ui.form.contactName = 'Marta'
  ui.api.updateBookingDetails = async () => { throw Error('offline') }
  await ui.save()
  assert.equal(ui.open.value, true)
  assert.equal(ui.form.contactName, 'Marta')
  assert.equal(ui.saving.value, false)
  assert.equal(ui.events.length, 0)
})
test('API preserves the old command for legacy callers and binds atomic contact identity', async () => {
  const original = (globalThis as any).$fetch, calls: any[] = []
  try {
    ;(globalThis as any).$fetch = async (url: string, options: any) => { calls.push({ url, ...options }); return { id: 'booking' } }
    const api = createBookingCoreApi({ baseUrl: 'https://example.invalid', publishableKey: 'test', accessToken: () => 'test', userId: () => 'test' })
    await api.updateBookingDetails({ workspaceId: 'workspace', bookingId: 'booking' })
    await api.updateBookingDetails({ workspaceId: 'workspace', bookingId: 'booking', contact: { id: null, name: ' Marta ', email: 'marta@example.invalid', phone: '' } })
    assert.ok(calls[0].url.endsWith('/update_booking_details'))
    assert.ok(calls[1].url.endsWith('/update_booking_details_with_contact'))
    assert.equal(calls[1].body.expected_contact_id, null)
    assert.equal(calls[1].body.next_contact_name, 'Marta')
    assert.equal(calls[1].body.next_contact_phone, null)
  } finally { (globalThis as any).$fetch = original }
})
