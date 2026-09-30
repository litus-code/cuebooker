import assert from 'node:assert/strict'
import test from 'node:test'
import { safeAgencyImage,agencyCatalogPreview } from '../app/domain/agencyCatalog.ts'
import type { AgencyCatalog } from '../app/domain/agencyCatalog.ts'
test('public agency media and channel links accept only HTTPS without embedded credentials',()=>{
 for(const value of ['javascript:alert(1)','http://image.example/a','data:text/html,foo','https://user:secret@example.com/a','garbage',null]) assert.equal(safeAgencyImage(value),undefined)
 assert.equal(safeAgencyImage('https://example.com/image.webp'),'https://example.com/image.webp')
})
test('draft preview includes only explicitly chosen eligible artists, without changing stored catalogue',()=>{
 const base={name:'Agency',slug:'agency',published:false,artists:[{id:'a',eligible:true},{id:'b',eligible:false},{id:'c',eligible:true}]} as AgencyCatalog
 assert.deepEqual(agencyCatalogPreview(base,['a','b']).artists.map(a=>a.id),['a'])
 assert.equal(base.artists.length,3)
 assert.deepEqual(agencyCatalogPreview(base,[]).artists,[])
})

test('agency uploads reject unsupported and oversized files before network upload',async()=>{
 const {agencyMediaExtension}=await import('../app/domain/agencyCatalog.ts')
 assert.equal(agencyMediaExtension({type:'image/png',size:2048}),'png')
 assert.equal(agencyMediaExtension({type:'image/webp',size:8*1024*1024}),'webp')
 for(const type of ['image/svg+xml','text/html','application/pdf',''])assert.throws(()=>agencyMediaExtension({type,size:200}),/invalid_type/)
 for(const size of [0,8*1024*1024+1])assert.throws(()=>agencyMediaExtension({type:'image/jpeg',size}),/too_large/)
})
