import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
import { parse, compileScript } from '@vue/compiler-sfc'
import { ref, computed } from 'vue'
import { createCaptureEngine } from '../app/services/captureEngine.ts'
import { interpretCueText } from '../app/services/cueInterpreter.ts'
async function harness(withSpeech=true) {
 const {descriptor}=parse(await readFile(new URL('../app/components/CueVoiceInput.vue',import.meta.url),'utf8'))
 const code=compileScript(descriptor,{id:'voice-test'}).content.replace("'../services/voiceCaptureMode'",JSON.stringify(new URL('../app/services/voiceCaptureMode.ts',import.meta.url).href)).replace(/from ['"]vue['"]/g,`from ${JSON.stringify(import.meta.resolve('vue'))}`)
 const module=await import(`data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(code,{mode:'transform'})).toString('base64')}`)
 const events:any[][]=[],mount:Array<()=>void>=[],unmount:Array<()=>void>=[];let stops=0,tracks=0
 class Recorder {static isTypeSupported(type:string){return type==='audio/mp4'} state='inactive';mimeType='audio/mp4';ondataavailable:any;onstop:any;onerror:any;start(){this.state='recording'}stop(){this.state='inactive';queueMicrotask(()=>{this.ondataavailable?.({data:new Blob(['audio'],{type:this.mimeType})});this.onstop?.()})}}
 class Speech {onresult:any;onend:any;onerror:any;start(){}stop(){stops++;setTimeout(()=>{this.onresult?.({resultIndex:0,results:[{isFinal:true,0:{transcript:'Héctor de Nitsa para el 10/10, 1200 EUR'}}]});this.onend?.()},10)}abort(){this.onend?.()}}
 const globals={ref,computed,onMounted:(fn:()=>void)=>mount.push(fn),onBeforeUnmount:(fn:()=>void)=>unmount.push(fn),MediaRecorder:Recorder,window:{MediaRecorder:Recorder,...(withSpeech?{SpeechRecognition:Speech}:{}),setInterval:()=>1,clearInterval:()=>{},setTimeout,clearTimeout},navigator:{mediaDevices:{getUserMedia:async()=>({getTracks:()=>[{stop:()=>tracks++}]})}}}
 const previous=Object.keys(globals).map(key=>[key,Object.getOwnPropertyDescriptor(globalThis,key)] as const)
 for(const [key,value] of Object.entries(globals))Object.defineProperty(globalThis,key,{value,configurable:true,writable:true})
 const state=module.default.setup({modelValue:'',locale:'es'},{expose(){},emit:(...args:any[])=>events.push(args)});mount.forEach(fn=>fn())
 return{state,events,stops:()=>stops,tracks:()=>tracks,unmount:()=>unmount.forEach(fn=>fn()),restore(){unmount.forEach(fn=>fn());for(const [key,value]of previous){if(value)Object.defineProperty(globalThis,key,value);else delete(globalThis as any)[key]}}}
}
test('voice stop waits for final dictation and recovers fields if server transcription fails',async()=>{const h=await harness();try{await h.state.startRecorder();h.state.stopRecorder();h.state.stopRecorder();await new Promise(r=>setTimeout(r,40));const captures=h.events.filter(e=>e[0]==='audioCaptured');assert.equal(captures.length,1);assert.equal(captures[0][2],'cuebooker-capture.m4a');assert.equal(captures[0][3],'Héctor de Nitsa para el 10/10, 1200 EUR');assert.equal(h.stops(),1);assert.equal(h.tracks(),1);const engine=createCaptureEngine({analyzeAudio:async()=>{throw Error('audio_failed')},analyzeText:async()=>{throw Error('text_failed')},interpretText:interpretCueText});const result=await engine.analyzeAudio({workspaceId:'workspace',artistId:'artist',locale:'es',audio:captures[0][1],fallbackTranscript:captures[0][3]});assert.equal(result.result.offer.amountMinor.value,120000);assert.equal(result.result.transcript,captures[0][3])}finally{h.restore()}})
test('no browser speech recognition still submits recorded audio',async()=>{const h=await harness(false);try{await h.state.startRecorder();h.state.stopRecorder();await new Promise(r=>setTimeout(r,20));const capture=h.events.find(e=>e[0]==='audioCaptured');assert.ok(capture?.[1].size);assert.equal(capture?.[3],'')}finally{h.restore()}})
test('closing voice capture releases microphone without submitting audio',async()=>{const h=await harness();try{await h.state.startRecorder();h.unmount();await new Promise(r=>setTimeout(r,20));assert.equal(h.events.filter(e=>e[0]==='audioCaptured').length,0);assert.ok(h.tracks()>0)}finally{h.restore()}})
