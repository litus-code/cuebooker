import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { parse as parseSfc } from '@vue/compiler-sfc'
import { compile, parse } from '@vue/compiler-dom'
import * as Vue from 'vue'
import { renderToString } from '@vue/server-renderer'
const template = parseSfc(await readFile(new URL('../app/components/PublicBookingForm.vue',import.meta.url),'utf8')).descriptor.template!.content
function find(node: any): any { if(node.type===1 && node.tag==='details')return node;for(const child of node.children||[]){const result=find(child);if(result)return result} }
const source = find(parse(template)).loc.source
const render = Function('Vue',compile(source,{mode:'function'}).code)(Vue)
render._rc = true
test('short commercial preview folds event details without changing ordinary preview or live form defaults', async()=>{
  for(const [preview,collapsePreviewDetails,open] of [[true,true,false],[true,false,true],[false,false,false]]){
    const html = await renderToString(Vue.createSSRApp({data:()=>({preview,collapsePreviewDetails,copy:{details:'Event details'},form:{},fieldErrors:{},minEventDate:'',maxEventDate:'',clearFieldError(){},validateField(){}}),render}))
    assert.equal(/<details[^>]*\sopen(?:[\s=>])/.test(html),open)
    assert.match(html,/<summary>Event details<\/summary>/)
  }
})
