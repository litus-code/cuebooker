import test from 'node:test'
import assert from 'node:assert/strict'
import {validateMailboxDraft,validateReviewedMailboxDraft} from '../supabase/functions/_shared/mailboxBookingDraft.ts'
import {classifyBookingMail} from '../supabase/functions/_shared/mailboxClassifier.ts'
const draft={eventDate:'2026-10-24',startTime:'23:00',endTime:'01:00',venue:'Sala de prueba',city:'Barcelona',offerAmountMinor:50000,currency:'EUR',artistName:'DJ Ficticio',contactPhone:null,warnings:[]}
test('draft accepts explicitly reviewed overnight schedule and amount without any booking decision',()=>{
 assert.equal(validateMailboxDraft(draft).endTime,'01:00')
 const {artistName,warnings,...data}=draft
 const review={...data,contactName:'Contacto',eventTimezone:'Europe/Madrid'}
 assert.equal(validateReviewedMailboxDraft(review).offerAmountMinor,50000)
 assert.throws(()=>validateReviewedMailboxDraft({...review,status:'confirmed'}))
 assert.throws(()=>validateReviewedMailboxDraft({...review,email:'someone-else@example.invalid'}))
 assert.throws(()=>validateReviewedMailboxDraft({...review,eventDate:null}),{message:'booking_time_requires_date'})
 assert.throws(()=>validateReviewedMailboxDraft({...review,currency:null}),{message:'booking_currency_required'})
})
test('draft rejects impossible dates, invalid hours and negative or fractional cents',()=>{
 for(const bad of [{eventDate:'2026-02-30'},{startTime:'25:00'},{offerAmountMinor:-1},{offerAmountMinor:0.5},{currency:'euros'},{warnings:['x'.repeat(241)]}])assert.throws(()=>validateMailboxDraft({...draft,...bad}))
})
test('extraction requires a draft and strips an invented year even from valid model JSON',async()=>{
 let sent:any
 const result=await classifyBookingMail([{id:'one',subject:'Disponibilidad',body:'DJ Ficticio, 24 de octubre, de 23:00 a 01:00, 500 €.'}],'test',(async(_url:any,init:any)=>{sent=JSON.parse(init.body);return Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify({messages:[{id:'one',kind:'booking',reason:'Pide actuación',draft}]})}}]})}) as typeof fetch,true)
 assert.equal(result[0].draft?.eventDate,null)
 assert.match(result[0].draft!.warnings[0],/año/)
 assert.equal(sent.response_format.json_schema.schema.properties.messages.items.required.includes('draft'),true)
 assert.match(sent.messages[0].content,/Never infer.*confirmations/)
})
