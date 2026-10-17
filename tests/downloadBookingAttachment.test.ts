import test from 'node:test'
import assert from 'node:assert/strict'
import {downloadBookingAttachment} from '../app/services/downloadBookingAttachment.ts'
test('signed bytes download with original filename without navigating, then release the blob URL',async t=>{
 t.mock.timers.enable({apis:['setTimeout']})
 const bytes=Uint8Array.from([137,80,78,71,13,10,26,10])
 let fetched:any,received:Blob|undefined,clicked=false,removed=false,revoked=''
 const link:any={style:{},click(){clicked=true},remove(){removed=true}}
 const oldDocument=globalThis.document
 ;(globalThis as any).document={createElement:(tag:string)=>{assert.equal(tag,'a');return link},body:{appendChild:(item:any)=>assert.equal(item,link)}}
 t.mock.method(globalThis,'fetch',async(url:any,options:any)=>{fetched={url,options};return new Response(bytes,{headers:{'content-type':'image/png'}})})
 t.mock.method(URL,'createObjectURL',(blob:Blob)=>{received=blob;return 'blob:download-fixture'})
 t.mock.method(URL,'revokeObjectURL',(url:string)=>{revoked=url})
 try{
  await downloadBookingAttachment('https://fixture.invalid/signed','contrato final.png')
  assert.deepEqual(fetched,{url:'https://fixture.invalid/signed',options:{credentials:'omit',cache:'no-store'}})
  assert.deepEqual(new Uint8Array(await received!.arrayBuffer()),bytes)
  assert.equal(link.href,'blob:download-fixture');assert.equal(link.download,'contrato final.png')
  assert.equal(clicked,true);assert.equal(removed,true);assert.equal(revoked,'')
  t.mock.timers.tick(60000);assert.equal(revoked,'blob:download-fixture')
 }finally{if(oldDocument)(globalThis as any).document=oldDocument;else delete (globalThis as any).document}
})
test('expired or unavailable attachment does not trigger a browser download',async t=>{
 t.mock.method(globalThis,'fetch',async()=>new Response('denied',{status:403}))
 let created=false;t.mock.method(URL,'createObjectURL',()=>{created=true;return 'blob:unexpected'})
 await assert.rejects(downloadBookingAttachment('https://fixture.invalid/expired','file.pdf'),{message:'attachment_download_failed'})
 assert.equal(created,false)
})
