/* Compiled UI only. Local endpoints, artificial data, no real account/email/enquiry.
 * Start the isolated bridge from scripts/test-campaign-analytics.mjs for --funnel.
 */
const {chromium}=require(process.env.CUEBOOKER_PLAYWRIGHT_MODULE||'/workspace/.cuebooker-browser/node_modules/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs/promises');
const origin=process.env.CUEBOOKER_REVIEW_ORIGIN||'http://127.0.0.1:4184';
const bridge=process.env.CUEBOOKER_CAMPAIGN_BRIDGE||'http://127.0.0.1:4190';
const output=process.env.CUEBOOKER_REVIEW_OUTPUT||'/tmp/cuebooker-campaign-review';
assert.ok(['127.0.0.1','localhost'].includes(new URL(origin).hostname));
const axePath=process.env.CUEBOOKER_AXE_PATH||'/workspace/.cuebooker-browser/node_modules/axe-core/axe.min.js';
async function prefs(p,locale,theme,consent='denied'){
 await p.addInitScript(({locale,theme,consent})=>{localStorage.setItem('cuebooker-locale',locale);localStorage.setItem('cuebooker-theme',theme);if(!localStorage.getItem('cuebooker:analytics-consent:v2'))localStorage.setItem('cuebooker:analytics-consent:v2',consent)},{locale,theme,consent});
}
async function scrollMenu(p,width){
 if(width!==390)return;
 const scroll=async(y)=>{await p.evaluate(y=>window.scrollTo({top:y,behavior:'instant'}),y);await p.waitForFunction(y=>Math.abs(scrollY-y)<2,y)};
 await scroll(0);await scroll(400);await p.waitForFunction(()=>document.querySelector('[data-public-header]').classList.contains('site-header--hidden'));
 await scroll(200);await p.waitForFunction(()=>!document.querySelector('[data-public-header]').classList.contains('site-header--hidden'));
 await p.locator('.public-menu-toggle').click();await p.getByRole('dialog').waitFor();await p.keyboard.press('Escape');await p.waitForFunction(()=>!document.documentElement.classList.contains('mobile-menu-open'));
}
async function axe(p,target){
 await p.addScriptTag({path:axePath});
 const issues=await p.evaluate(target=>window.axe.run(document.querySelector(target),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}),target);
 if(issues.violations.length)console.log(JSON.stringify(issues.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))));
 assert.equal(issues.violations.length,0);
}
(async()=>{
 await fs.mkdir(output,{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.CUEBOOKER_CHROMIUM||'/usr/bin/chromium',args:['--no-sandbox']});
 if(!process.argv.includes('--funnel-only'))for(const path of ['/','/dj/','/agency/'])for(const locale of ['es','en'])for(const theme of ['light','dark'])for(const width of [390,1440]){
  const p=await browser.newPage({viewport:{width,height:1000},reducedMotion:'reduce'}),errors=[];let optional=0;
  p.on('pageerror',e=>errors.push(e.message));await prefs(p,locale,theme);
  await p.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin===origin)return r.continue();optional++;return r.abort()});
  await p.goto(origin+path+'?utm_source=review&utm_campaign=product_update&ref=review-2026',{waitUntil:'networkidle'});
  await p.waitForFunction(({locale,theme})=>document.documentElement.lang===locale&&document.documentElement.dataset.theme===theme,{locale,theme});
  await scrollMenu(p,width);
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.equal(await p.locator('h1').count(),1);
  if(path==='/'){
   assert.match(await p.locator('.home-ecosystem-summary__future a').getAttribute('href'),/\/dj\?.*utm_campaign=product_update.*#cue-id/);
   assert.equal(await p.locator('img[src*="cue-id-"]').count(),0);
  }else{
   const arrows=p.locator('.cl-channel-list .cl-button-arrow');assert.equal(await arrows.count(),5);
   const sizes=await arrows.evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect(),b=e.closest('button').getBoundingClientRect();return {width:r.width,height:r.height,alignment:Math.abs((r.y+r.height/2)-(b.y+b.height/2))}}));
   assert.ok(sizes.every(s=>s.width===20&&s.height===20&&s.alignment<1));
   assert.equal(await p.locator('.public-booking-form__details').getAttribute('open'),null);
   if(path==='/dj/'){
    assert.equal(await p.locator('#cue-id img').count(),2);
    assert.equal(await p.locator('#passport img[src*="passport-"]').count(),1);
    assert.ok(await p.locator('#passport').evaluate(e=>Boolean(e.compareDocumentPosition(document.querySelector('#cue-id'))&Node.DOCUMENT_POSITION_FOLLOWING)));
    assert.match(await p.locator('#cue-id .cl-eyebrow').innerText(),locale==='es'?/En desarrollo/:/In development/);
    const pair=await p.locator('#cue-id img').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().y));assert.equal(pair[0],pair[1]);
   }else assert.match(await p.locator('.cl-access-note').first().innerText(),/roster/);
  }
  await p.evaluate(()=>{for(const i of document.images)i.loading='eager'});await p.waitForFunction(()=>[...document.images].every(i=>i.complete&&i.naturalWidth>0));
  await axe(p,'.home-v2,.commercial-audience');
  if(locale==='es')await p.screenshot({path:`${output}/${path==='/'?'home':path.replaceAll('/','')}-${theme}-${width}.jpg`,fullPage:true,type:'jpeg',quality:80});
  assert.equal(optional,0);assert.deepEqual(errors,[]);console.log('PASS public',path,locale,theme,width);await p.close();
 }
 if(process.argv.includes('--funnel')||process.argv.includes('--funnel-only'))await fetch(bridge+'/fixture/reset',{method:'POST'});
 if(process.argv.includes('--funnel')||process.argv.includes('--funnel-only'))for(const audience of ['agency','dj']){
  const p=await browser.newPage({viewport:{width:390,height:1000},reducedMotion:'reduce'}),errors=[],traffic=[];
  p.on('pageerror',e=>errors.push(e.message));await prefs(p,'es','dark','granted');
  await p.route('**/*',async r=>{
   const u=new URL(r.request().url());if(u.origin===origin)return r.continue();
   if(u.hostname==='www.googletagmanager.com')return r.fulfill({contentType:'application/javascript',body:''});
   if(u.hostname!=='agency-ux-fixture.invalid')return r.abort(); // Third-party resources stay blocked in this fixture.
   const path=u.pathname+u.search;
   traffic.push({path,body:r.request().postDataJSON()});
   const reply=await fetch(bridge+path,{method:r.request().method(),...(r.request().postData()?{body:r.request().postData(),headers:{'Content-Type':'application/json'}}:{})});
   return r.fulfill({status:reply.status,contentType:'application/json',body:await reply.text()});
  });
  await p.goto(`${origin}/${audience}/?utm_source=instagram&utm_campaign=beta_launch&ref=campaign-2026`,{waitUntil:'networkidle'});
  const initialViews=traffic.filter(t=>t.path.endsWith('/campaign-analytics')&&t.body?.event_name==='page_view');
  if(initialViews.length!==1)console.log('INITIAL VIEW DEBUG',p.url(),initialViews.map(t=>t.body.dimensions),await p.evaluate(()=>(window.dataLayer||[]).filter(e=>e.event==='page_view')));
  assert.equal(initialViews.length,1,'one initial persisted view');
  await p.locator('.cl-primary').click();await p.locator('.access-form').waitFor();
  assert.match(p.url(),new RegExp('source='+audience));assert.match(p.url(),/utm_campaign=beta_launch/);
  const inputs=p.locator('.access-form input');await inputs.nth(0).fill('Test artist');await inputs.nth(1).fill(`${audience}@example.invalid`);await inputs.nth(2).fill('local-fixture-password');
  await p.locator('.access-form button[type="submit"]').click();await p.locator('.onboarding-form').waitFor();
  await p.locator('.type-grid button').nth(audience==='agency'?1:0).click();
  const form=p.locator('.onboarding-form input');await form.nth(0).fill('Fixture owner');await form.nth(1).fill('ORBIT fixture');
  const finished=p.waitForResponse(r=>r.url().endsWith('/complete_onboarding')&&r.status()===200);
  await p.locator('.onboarding-submit').click();await finished;
  await fetch(bridge+'/fixture/operations',{method:'POST'});
  await p.goto(origin+'/beta-analytics/',{waitUntil:'networkidle'});
  await p.getByRole('button',{name:'Campañas',exact:true}).click();
  await p.locator('.campaign-funnel').waitFor();await p.getByText('Sin datos para estos filtros.',{exact:true}).waitFor();
  await p.locator('.campaign-funnel select').last().selectOption('test');await p.getByRole('button',{name:'Aplicar filtros'}).click();
  await p.waitForFunction(()=>document.querySelector('.campaign-funnel__table')?.innerText.includes('Primera solicitud'));
  await p.locator('.campaign-funnel select').last().selectOption('live');assert.match(await p.locator('.campaign-funnel__dataset').innerText(),/DATOS DE PRUEBA/,'unsubmitted filter changes cannot relabel test results as live');await p.locator('.campaign-funnel select').last().selectOption('test');
  const report=await (await fetch(bridge+'/fixture/report')).json();
  const registration=report.rows.find(r=>r.step==='registration');assert.equal(registration.users,audience==='agency'?1:2);
  assert.equal(report.rows.find(r=>r.step==='activation').workspaces,audience==='agency'?1:2);
  assert.equal(await p.evaluate(()=>Boolean(JSON.parse(localStorage.getItem('cuebooker.auth.session.v2')).user.user_metadata?.cuebooker_campaign)),false);
  const signup=traffic.find(t=>t.path.includes('/signup'));assert.equal(signup.body.data.cuebooker_campaign.source,audience);assert.equal(signup.body.data.cuebooker_campaign.ref,'campaign-2026');assert.equal(signup.body.data.cuebooker_campaign.utm_campaign,'beta_launch');
  const events=await p.evaluate(()=>window.dataLayer||[]);
  assert.doesNotMatch(JSON.stringify(events),/local-fixture-password|@example.invalid|Fixture owner/);
  for(const name of ['signup_click','signup_started','signup_completed','onboarding_completed']){
   // dataLayer belongs to the new document after goto; persisted checks above are authoritative.
   const transmitted=traffic.filter(t=>t.path.endsWith('/campaign-analytics')&&t.body?.event_name===name);
   assert.equal(transmitted.length,['signup_click','signup_started'].includes(name)?1:0);
  }
  for(const locale of ['es','en'])for(const theme of ['light','dark'])for(const width of [390,1440]){
   await p.evaluate(({locale,theme})=>{localStorage.setItem('cuebooker-locale',locale);localStorage.setItem('cuebooker-theme',theme)},{locale,theme});
   // Preferences are loaded once per document; open a fresh document without replacing auth fixtures.
   await p.setViewportSize({width,height:1000});
   await p.addInitScript(({locale,theme})=>{localStorage.setItem('cuebooker-locale',locale);localStorage.setItem('cuebooker-theme',theme)},{locale,theme});
   await p.goto(origin+'/beta-analytics/',{waitUntil:'networkidle'});await p.getByRole('button',{name:locale==='es'?'Campañas':'Campaigns',exact:true}).click();
   await p.locator('.campaign-funnel select').last().selectOption('test');await p.getByRole('button',{name:locale==='es'?'Aplicar filtros':'Apply filters',exact:true}).click();
   await p.locator('.campaign-funnel__table').first().waitFor();assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await axe(p,'.campaign-funnel');
   await p.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
   if(audience==='agency'&&locale==='es')await p.screenshot({path:`${output}/analytics-${theme}-${width}.jpg`,fullPage:true,type:'jpeg',quality:80});
   console.log('PASS panel',audience,locale,theme,width);
  }
  // Request missing deployment, then empty response, then denied authorization: no fake fallback.
  await p.route('**/get_campaign_funnel',r=>r.fulfill({status:404,json:{message:'fixture_missing_rpc'}}));
  await p.getByRole('button',{name:'Apply filters'}).click();await p.getByText(/The funnel cannot be queried/).waitFor();
  await p.route('**/is_internal_admin',r=>r.fulfill({json:false}));await p.reload({waitUntil:'networkidle'});assert.equal(await p.locator('.campaign-funnel').count(),0);
  assert.deepEqual(errors,[]);console.log('PASS persisted browser funnel + gate',audience);await p.close();
 }
 if(process.argv.includes('--funnel')||process.argv.includes('--funnel-only')){
  const baseline=await (await fetch(bridge+'/fixture/report')).json();
  const p=await browser.newPage({viewport:{width:390,height:1000},reducedMotion:'reduce'});await prefs(p,'es','dark','unknown');let collectors=0,tags=0;
  await p.route('**/*',async r=>{
   const u=new URL(r.request().url());if(u.origin===origin)return r.continue();
   if(u.hostname==='www.googletagmanager.com'){tags++;return r.fulfill({contentType:'application/javascript',body:''})}
   if(u.hostname!=='agency-ux-fixture.invalid')return r.abort();
   if(u.pathname.endsWith('/campaign-analytics'))collectors++;
   const reply=await fetch(bridge+u.pathname+u.search,{method:r.request().method(),...(r.request().postData()?{body:r.request().postData(),headers:{'Content-Type':'application/json'}}:{})});
   return r.fulfill({status:reply.status,contentType:'application/json',body:await reply.text()});
  });
  await p.goto(origin+'/dj/?ref=campaign-2026&utm_campaign=beta_launch',{waitUntil:'networkidle'});
  await p.getByRole('button',{name:'Rechazar',exact:true}).click();assert.equal(tags,0);assert.equal(collectors,0);
  assert.equal(await p.evaluate(()=>localStorage.getItem('cuebooker.referral.first-touch.v1')),null);
  await p.locator('.cl-primary').click();const inputs=p.locator('.access-form input');await inputs.nth(0).fill('Rejected fixture');await inputs.nth(1).fill('denied@example.invalid');await inputs.nth(2).fill('local-fixture-password');
  const finished=p.waitForResponse(r=>r.url().includes('/signup')&&r.status()===200);await p.locator('.access-form button[type="submit"]').click();await finished;
  assert.equal(tags,0);assert.equal(collectors,0);assert.equal(await p.evaluate(()=>localStorage.getItem('cuebooker:campaign-consented:v1')),null);
  const after=await (await fetch(bridge+'/fixture/report')).json();assert.equal(after.rows.find(r=>r.step==='registration').users,baseline.rows.find(r=>r.step==='registration').users);
  console.log('PASS actual reject choice → no GTM, identifier, referral or persisted campaign signup');await p.close();
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
