import test from 'node:test'
import assert from 'node:assert/strict'
import { extractCueContactDetails, completeCaptureContact, matchCaptureContact } from '../app/services/cueContactDetails.ts'
import { createCaptureEngine, localInterpretationToSmartCapture } from '../app/services/captureEngine.ts'
import { interpretCueText } from '../app/services/cueInterpreter.ts'

const screenshot = 'Sería un jet de dos horas el caché está pendiente de negociar y tenemos que confirmar el horario el contacto directo es con Álex y esto Tiene un correo que es el agency@gmail.com'
const empty = (raw = '') => localInterpretationToSmartCapture(raw, 'es', {})

test('owner screenshot extracts the person and actual email independently from the venue', () => {
  const raw = `La sala es Órbita. ${screenshot}`
  const result = empty(raw)
  assert.equal(result.contact.name.value, 'Álex')
  assert.equal(result.contact.email.value, 'agency@gmail.com')
  assert.equal(result.contact.phone.value, null)
  assert.equal(result.contact.name.confidence, 'high')
  assert.ok(raw.includes(result.contact.email.evidence!))
  assert.ok(raw.includes(result.contact.name.evidence!))
})

for (const name of ['Alex', 'Pepito', 'Menganito', 'María', 'María del Carmen', 'Álex García', "O'Connor"]) {
  test(`explicit contact label supports ${name}`, () => {
    assert.equal(extractCueContactDetails(`Nombre del contacto es ${name}, la sala es Nitsa.`).name?.value, name)
  })
}

test('literal and spoken email punctuation preserve useful address characters', () => {
  assert.equal(extractCueContactDetails('su correo es alex.garcia+booking@gmail.com.').email?.value, 'alex.garcia+booking@gmail.com')
  assert.equal(extractCueContactDetails('El correo electrónico es alex punto garcia arroba gmail punto com').email?.value, 'alex.garcia@gmail.com')
  assert.equal(extractCueContactDetails('Mail: alex guion booking arroba my-agency punto co punto uk').email?.value, 'alex-booking@my-agency.co.uk')
})

test('phone labels accept international and local grouped numbers, without reading times/fees as phones', () => {
  assert.equal(extractCueContactDetails('su teléfono es el +34 612 34 56 78.').phone?.value, '+34612345678')
  assert.equal(extractCueContactDetails('Móvil: 612-345-678').phone?.value, '612345678')
  assert.equal(extractCueContactDetails('1200 euros, 18:00 a 20:00, 24/10/2026').phone, undefined)
  assert.equal(extractCueContactDetails('teléfono: 24/10/2026').phone, undefined)
})

test('club/festival labels and email local parts do not invent a person', () => {
  for (const raw of ['El club se llama Órbita, correo booking@orbita.com.', 'Nombre de la sala es Nitsa.', 'Festival Sónar, teléfono 612345678.', 'Mi nombre es Litus.']) {
    assert.equal(extractCueContactDetails(raw).name, undefined, raw)
  }
})

test('ambiguous contact candidates stay unfilled rather than selecting the wrong recipient', () => {
  const parsed = extractCueContactDetails('Contacto es Alex. Contacto es María. Mail a@one.com y b@two.com. Teléfono 612345678, móvil 622345678.')
  assert.equal(parsed.name, undefined)
  assert.equal(parsed.email, undefined)
  assert.equal(parsed.phone, undefined)
  assert.equal(extractCueContactDetails('el correo no es wrong@gmail.com').email, undefined)
})

test('completes empty provider fields while retaining reviewed AI contact data and other booking fields', () => {
  const provider = empty('')
  provider.contact.name = {value:'María', confidence:'high', evidence:'María'}
  provider.event.venueName.value = 'Órbita'
  const result = completeCaptureContact(provider, 'El contacto es María. Email: maria@agency.com, teléfono 612345678.')
  assert.equal(result.contact.name, provider.contact.name)
  assert.equal(result.contact.email.value, 'maria@agency.com')
  assert.equal(result.contact.phone.value, '612345678')
  assert.equal(result.event, provider.event)
  assert.equal(provider.contact.email.value, null)
})

for (const mode of ['text', 'audio', 'rate-limit', 'audio-failure'] as const) {
  test(`preserves screenshot contact through ${mode}`, async () => {
    let extractions = 0
    const engine = createCaptureEngine({
      analyzeText: async () => { extractions++; if (mode === 'rate-limit') throw {statusCode:429}; return empty() },
      analyzeAudio: async () => { if (mode === 'audio-failure') throw {data:{transcript:screenshot}}; return empty(screenshot) },
      interpretText: interpretCueText
    })
    const result = mode === 'audio' || mode === 'audio-failure'
      ? await engine.analyzeAudio({workspaceId:'w',artistId:'a',locale:'es',audio:new Blob(['voice'])})
      : await engine.analyzeText({workspaceId:'w',artistId:'a',locale:'es',text:screenshot})
    assert.equal(result.result.contact.name.value,'Álex')
    assert.equal(result.result.contact.email.value,'agency@gmail.com')
    if (mode === 'rate-limit') assert.equal(extractions,1)
    if (mode === 'audio-failure') assert.equal(extractions,0)
  })
}

test('existing-contact matching never silently drops newly supplied metadata or selects a homonym', () => {
  const old = {id:'old',name:'Alex',email:null,phone:null}
  assert.equal(matchCaptureContact([old], 'Álex', 'agency@gmail.com', null), null)
  assert.equal(matchCaptureContact([old], 'Alex', null, '612345678'), null)
  assert.equal(matchCaptureContact([old, {...old,id:'other'}], 'Alex', null, null),null)
  const known = {...old,email:'agency@gmail.com',phone:'+34 612 34 56 78'}
  assert.equal(matchCaptureContact([known], 'Álex', 'AGENCY@gmail.com', '+34612345678')?.id,'old')
  assert.equal(matchCaptureContact([old], null, null, null),null)
})

test('explicit person label corrects an AI name confused with the club', () => {
  const provider = empty('')
  provider.contact.name = {value:'Órbita',confidence:'medium',evidence:'La sala Órbita'}
  provider.event.venueName.value = 'Órbita'
  const result = completeCaptureContact(provider, 'La sala Órbita. El contacto es Álex, su correo es agency@gmail.com.')
  assert.equal(result.contact.name.value,'Álex')
  assert.equal(result.event.venueName.value,'Órbita')
})

test('explicit email/phone correct conflicting provider values and ignore the speaker own details', () => {
  const provider = empty('')
  provider.contact.email.value='wrong@example.invalid'
  provider.contact.phone.value='999999999'
  const result = completeCaptureContact(provider,'Contacto es María. Correo maria@agency.com, teléfono 612345678.')
  assert.equal(result.contact.email.value,'maria@agency.com')
  assert.equal(result.contact.phone.value,'612345678')
  assert.equal(extractCueContactDetails('Mi correo es personal@example.com, mi teléfono 612345678.').email,undefined)
  assert.equal(extractCueContactDetails('Mi correo es personal@example.com, mi teléfono 612345678.').phone,undefined)
})
