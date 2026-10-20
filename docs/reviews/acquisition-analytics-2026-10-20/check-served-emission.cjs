const {chromium}=require(process.env.CUEBOOKER_PLAYWRIGHT_MODULE || '/workspace/.cuebooker-browser/node_modules/playwright');
const {execFile}=require('node:child_process'),{promisify}=require('node:util'),assert=require('node:assert/strict'),fs=require('node:fs');
const run=promisify(execFile),cache=new Map(),origin='https://cuebooker.com';
(async()=>{const browser=await chromium.launch({executablePath:process.env.CUEBOOKER_CHROMIUM || '/usr/bin/chromium',args:['--no-sandbox']});const evidence=[];
for(const consent of ['accept','reject']){
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),signals=[];
 await page.addInitScript(()=>localStorage.setItem('cuebooker-locale','es'));
 await page.route('**/*',async route=>{const req=route.request(),url=new URL(req.url());
  if(url.pathname.endsWith('/functions/v1/campaign-analytics')){const b=req.postDataJSON();signals.push({event:b.event_name,dimensions:b.dimensions});return route.fulfill({status:200,contentType:'application/json',body:'{"accepted":true}'})}
  if(url.origin!==origin)return route.abort();
  if(req.method()!=='GET')throw Error('Unexpected production write');
  if(!cache.has(url.href))cache.set(url.href,run('curl',['--fail','--silent','--show-error','--suppress-connect-headers','--include',url.href],{encoding:'buffer',maxBuffer:20*1024*1024}));
  const {stdout}=await cache.get(url.href),boundary=stdout.indexOf('\r\n\r\n'),head=stdout.subarray(0,boundary).toString();
  await route.fulfill({status:Number(head.match(/^HTTP\/\S+ (\d+)/)[1]),contentType:head.split('\r\n').find(x=>/^content-type:/i.test(x))?.split(':').slice(1).join(':').trim(),body:stdout.subarray(boundary+4)});
 });
 await page.goto(origin+'/?utm_source=instagram&utm_medium=social&utm_campaign=launch2026',{waitUntil:'networkidle'});assert.equal(signals.length,0);
 await page.getByRole('button',{name:consent==='accept'?'Aceptar':'Rechazar',exact:true}).click();
 if(consent==='accept')await page.waitForFunction(()=>localStorage.getItem('cuebooker:campaign-consented:v1'));
 await page.locator('.home-hero a').first().click();await page.locator('.access-form').waitFor();
 const result={consent,signals,signupUrl:new URL(page.url()).pathname+new URL(page.url()).search,optionalIdentifier:await page.evaluate(()=>Boolean(localStorage.getItem('cuebooker:campaign-consented:v1')))};
 if(consent==='reject'){assert.equal(signals.length,0);assert.equal(result.optionalIdentifier,false)}else{assert.equal(signals.filter(x=>x.event==='page_view').length,1);assert.equal(signals.filter(x=>x.event==='signup_click').length,1)}
 evidence.push(result);await page.close();
}
await browser.close();fs.writeFileSync('/tmp/cuebooker-production-emission-evidence.json',JSON.stringify({scope:'Production static asset emission only; collector requests intercepted, never forwarded. No production event/account created. Chromium, not Edge.',cases:evidence},null,2));console.log('PASS deployed production emission: consent accept/reject, one initial view + CTA; no backend writes');})().catch(e=>{console.error(e);process.exit(1)});
