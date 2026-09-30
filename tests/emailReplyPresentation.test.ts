import test from 'node:test'
import assert from 'node:assert/strict'
import {decodeEmailText,emailReplyPresentation} from '../app/services/emailReplyPresentation.ts'

test('Spanish reply displays only the new message, keeping decoded quoted history available',()=>{
 const result=emailReplyPresentation('Respuesta recibida!\n\r\nEl 2026-09-30 23:38, Test escribi&oacute;:\nHola, prueba t&eacute;cnica &laquo;recibida&raquo;.')
 assert.equal(result.body,'Respuesta recibida!')
 assert.match(result.quotedBody,/escribió:/)
 assert.match(result.quotedBody,/técnica «recibida»/)
})
test('English and Outlook reply separators preserve both parts',()=>{
 assert.equal(emailReplyPresentation('Thanks!\nOn Wed, 30 Sep 2026, Test wrote:\n> Original').body,'Thanks!')
 assert.equal(emailReplyPresentation('Received\nFrom: Test\nSent: Wednesday\nTo: Artist\nSubject: Booking\nOriginal').body,'Received')
 assert.equal(emailReplyPresentation('Recibido\n-----Mensaje original-----\nTexto anterior').body,'Recibido')
})
test('plain messages and prose about writing are not truncated',()=>{
 const body='El artista escribió: quiero actuar.\nOn stage I wrote: hello.\nDe: Barcelona\nLugar pendiente.'
 assert.deepEqual(emailReplyPresentation(body),{body,quotedBody:''})
})
test('inline replies remain visible and quote-only mail never produces an empty bubble',()=>{
 const inline='Hola\n> Primera pregunta\nMi respuesta\n> Otra pregunta\nOtra respuesta'
 assert.equal(emailReplyPresentation(inline).body,inline)
 assert.deepEqual(emailReplyPresentation('> Solo cita'),{body:'> Solo cita',quotedBody:''})
 assert.equal(emailReplyPresentation('Respuesta\n> Anterior\n> Más texto').body,'Respuesta')
})
test('entity decoding returns text, handles numeric entities and leaves invalid code points intact',()=>{
 assert.equal(decodeEmailText('&#243; &#xF3; &lt;script&gt; &amp; &#x110000; &#xD800;'),'ó ó <script> & &#x110000; &#xD800;')
})
