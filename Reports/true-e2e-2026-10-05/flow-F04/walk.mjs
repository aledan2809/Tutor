import {chromium,BASE,mk} from './lib.mjs'; import fs from 'fs';
const CODE=process.env.CODE||fs.readFileSync('code.txt','utf8').trim();
const vp=process.argv[2]||'mobile'; const tag=vp==='mobile'?'M':'D';
const opts=vp==='mobile'?{viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true}:{viewport:{width:1440,height:900}};
const b=await chromium.launch(); const ctx=await b.newContext(opts); const page=await ctx.newPage(); const m=mk(tag,page);
const email=`qa-e2e-1005-f04-child-${vp}@example.com`, pw='QaE2e-1005-pass!';
const out=(s)=>console.log(`[${tag}] ${s} @${page.url().replace(BASE,'')} t=${((Date.now()-m.t0())/1000).toFixed(1)}s taps=${m.taps}`);
const T=async(loc)=>{m.tap();await loc.click();};
let code=process.env.UNUSED?'':CODE;
await page.goto(BASE+'/ro/family/join'); await m.snap('join-landing'); out('landing');
{const r0=page.getByRole('button',{name:'Respinge'}); if(await r0.count()){await m.snap('cookie-banner-over-join'); await r0.click();}}
await page.locator('main input').first().fill(CODE.toLowerCase()); m.tap();
await T(page.getByRole('button',{name:'Verifică codul'})); await page.waitForTimeout(1200); await m.snap('verified');
out(await page.innerText('main').then(t=>t.replace(/\n+/g,' | ').slice(0,200)));
await T(page.locator('main').getByRole('button',{name:'Accept'})); await page.waitForURL(/signin/,{timeout:8000}); await page.waitForTimeout(1000); await m.snap('signin-redirect'); out('signin');
// cookie banner
const rej=page.getByRole('button',{name:'Respinge'}); if(await rej.count()){ m.log.cookieBannerOnSignin=true; }
await T(page.getByRole('link',{name:/Fă-ți unul/})); await page.waitForURL(/register/,{timeout:8000}); await page.waitForTimeout(1200); await m.snap('register'); out('register');
if(await rej.count()) await rej.click();
const role=await page.locator('[role=radio][aria-checked=true]').innerText().catch(()=>'?'); m.log.roleChecked=role;
await page.locator('input[type=text]').first().fill(`qa-e2e-1005 Copil ${vp}`);
await page.locator('input[type=email]').first().fill(email);
const sels=page.locator('select'); const n=await sels.count(); m.log.selects=n;
if(n>=3){ await sels.nth(0).selectOption('15'); await sels.nth(1).selectOption({index:5}); await sels.nth(2).selectOption({label:'2008'}).catch(async()=>sels.nth(2).selectOption('2008')); }
const pws=page.locator('input[type=password]'); for(let i=0;i<await pws.count();i++) await pws.nth(i).fill(pw);
m.log.registerInputs=await page.locator('input:visible,select:visible').count();
await page.evaluate(()=>window.scrollTo(0,0)); await m.snap('register-filled');
const t1=Date.now(); await T(page.locator('button[type=submit]'));
await page.waitForURL(/family\/join/,{timeout:20000}).catch(()=>{}); await page.waitForTimeout(1500); await m.snap('back-on-join'); out('after-register ('+((Date.now()-t1)/1000).toFixed(1)+'s)');
const body=await page.innerText('body'); m.log.joinAfterRegister=body.replace(/\n+/g,' | ').slice(0,250);
const val=await page.locator('main input').first().inputValue().catch(()=>null); m.log.codePrefilled=val;
const v=page.getByRole('button',{name:'Verifică codul'}); if(await v.count()){ await T(v); await page.waitForTimeout(1200); await m.snap('re-verify'); }
await T(page.locator('main').getByRole('button',{name:'Accept'})); await page.waitForTimeout(2000); await m.snap('accepted'); out('accepted: '+await page.innerText('main').then(t=>t.replace(/\n+/g,' | ').slice(0,150)));
await T(page.getByRole('link',{name:'Mergi la panou'})); await page.waitForTimeout(3500); await m.snap('panou'); out('panou');
m.log.panouText=await page.innerText('body').then(t=>t.replace(/\n+/g,' | ').slice(0,500));
m.log.firstValueSec=((Date.now()-m.t0())/1000).toFixed(1); m.log.firstValueTaps=m.taps;
fs.writeFileSync(`steps-${tag}.json`,JSON.stringify(m.log,null,1)); await ctx.storageState({path:`child-state-${tag}.json`}); await b.close();
