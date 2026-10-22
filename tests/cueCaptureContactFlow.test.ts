import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import { matchCaptureContact } from '../app/services/cueContactDetails.ts'
import { localInterpretationToSmartCapture } from '../app/services/captureEngine.ts'
import { createBookingCoreApi } from '../app/services/bookingCoreApi.ts'

const source = await readFile(new URL('../app/components/CueCapturePanel.vue',import.meta.url),'utf8')
function harness() {
  const state:any = Object.fromEntries(['contactName','contactEmail','contactPhone','existingContactId','existingCounterpartyId','counterpartyName','venueName','eventName','city','countryCode','eventDate','startTime','endTime','eventTimezone','offer','feeBasis','initialNote','nextMoveLabel','nextMoveDueAt','errorMessage','interpretationMessage'].map(key=>[key,{value:''}]))
  Object.assign(state, {source:{value:'phone'},currency:{value:'EUR'},contactMode:{value:'new'},counterpartyMode:{value:'new'},counterpartyKind:{value:'venue'},captureArtistId:{value:'artist'},captureArtists:{value:[]},contacts:{value:[]},counterparties:{value:[]},smartResult:{value:null},moreOpen:{value:false},submitting:{value:false},text:{value:{minimum:'context required',error:'invalid offer'}}})
  const calls:any[] = [], events:any[] = []
  const api = {createManualBooking:async(input:any)=>{calls.push(input);return {id:'saved'}}}
  const props = {workspaceId:'workspace',locale:'es'}
  const functions = source.slice(source.indexOf('function applyEntityMatches('),source.indexOf('function discardSmartResult(')) + source.slice(source.indexOf('function parseOfferMinor('),source.indexOf('function onKeydown('))
  const normalizeEntityName = (value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase()
  const actions = new Function(...Object.keys(state),'props','analytics','productTelemetry','bookingCore','emit','reset','normalizeEntityName','matchCaptureContact',stripTypeScriptTypes(functions)+ ';return {applySmartResult,submit}')(...Object.values(state),props,{track(){}},{record:async()=>{}},api,(...args:any[])=>events.push(args),()=>{},normalizeEntityName,matchCaptureContact)
  return {...state,...actions,calls,events}
}

test('Apply then Create sends the dictated person/email/phone and keeps venue separate',async()=>{
  const ui=harness()
  const raw='El contacto directo es con Álex y su correo es agency@gmail.com. Teléfono +34 612 34 56 78.'
  ui.smartResult.value=localInterpretationToSmartCapture(raw,'es',{})
  ui.smartResult.value.counterparty.name.value='Órbita'
  ui.smartResult.value.event.venueName.value='Órbita'
  ui.contacts.value=[{id:'other-alex',name:'Alex',email:'other@example.invalid',phone:null}]
  ui.applySmartResult()
  assert.equal(ui.contactMode.value,'new')
  assert.equal(ui.contactName.value,'Álex')
  assert.equal(ui.contactEmail.value,'agency@gmail.com')
  assert.equal(ui.contactPhone.value,'+34612345678')
  await ui.submit()
  assert.equal(ui.calls.length,1)
  assert.equal(ui.calls[0].existingContactId,null)
  assert.equal(ui.calls[0].contactName,'Álex')
  assert.equal(ui.calls[0].contactEmail,'agency@gmail.com')
  assert.equal(ui.calls[0].contactPhone,'+34612345678')
  assert.equal(ui.calls[0].venueName,'Órbita')
  assert.equal(ui.events[0][0],'created')
})

test('email-only capture requests the missing name instead of silently dropping contact data',async()=>{
  const ui=harness()
  ui.smartResult.value=localInterpretationToSmartCapture('Email: agency@gmail.com','es',{})
  ui.applySmartResult()
  await ui.submit()
  assert.equal(ui.calls.length,0)
  assert.match(ui.errorMessage.value,/nombre del contacto/)
  assert.equal(ui.contactEmail.value,'agency@gmail.com')
  ui.contactName.value='Álex'
  await ui.submit()
  assert.equal(ui.calls[0].contactEmail,'agency@gmail.com')
})

test('real booking API forwards all contact fields to the existing atomic creation RPC',async()=>{
  const previous=(globalThis as any).$fetch
  let request:any
  ;(globalThis as any).$fetch=async(url:any,options:any)=>{request={url,...options};return {id:'saved'}}
  try {
    const api=createBookingCoreApi({baseUrl:'https://fixture.invalid',publishableKey:'fixture',accessToken:()=> 'test',userId:()=> 'user'})
    await api.createManualBooking({workspaceId:'workspace',artistId:'artist',source:'phone',contactName:'Álex',contactEmail:'agency@gmail.com',contactPhone:'+34612345678'} as any)
    assert.match(request.url,/\/rpc\/create_smart_cue_booking$/)
    assert.equal(request.body.contact_name,'Álex')
    assert.equal(request.body.contact_email,'agency@gmail.com')
    assert.equal(request.body.contact_phone,'+34612345678')
    assert.equal(request.body.existing_contact_id,null)
  } finally { (globalThis as any).$fetch=previous }
})
