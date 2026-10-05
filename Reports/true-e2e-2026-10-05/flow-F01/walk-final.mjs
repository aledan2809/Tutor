// F01 final consolidated walk: student self-signup -> first question. Usage: node walk-final.mjs mobile|desktop [adult|minor]
import {chromium,devices,BASE,DIR,MAIL} from './lib.mjs';
import fs from 'fs';
const vp=process.argv[2]||'mobile', kind=process.argv[3]||'adult';
const tag=`final-${vp}-${kind}`;
const b=await chromium.launch();
const ctx=await b.newContext(vp==='mobile'?{viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,userAgent:devices['iPhone 13'].userAgent}:{viewport:{width:1440,height:900}});
const p=await ctx.newPage();
const log={tag,steps:[],console:[],http:[],taps:0,typed:0}; let n=0;
p.on('console',m=>{if(m.type()==='error')log.console.push({url:p.url().replace(BASE,''),text:m.text().slice(0,200)})});
p.on('response',r=>{if(r.status()>=400)log.http.push({url:r.url().replace(BASE,''),status:r.status()})});
const T0=Date.now(); const sec=()=>+((Date.now()-T0)/1000).toFixed(1);
async function snap(name,extra={}){n++;const f=`${tag}-${String(n).padStart(2,'0')}-${name}.png`;await p.screenshot({path:`${DIR}/${f}`});
 log.steps.push({n,name,file:f,url:p.url().replace(BASE,''),title:await p.title(),sec:sec(),taps:log.taps,typed:log.typed,...extra});}
log.cookieBlocks=[];
const tap=async(loc,why)=>{try{await loc.click({timeout:4000});}catch(e){const rb=p.getByRole('button',{name:'Respinge'}); if(await rb.isVisible().catch(()=>false)){log.cookieBlocks.push({where:why,url:p.url().replace(BASE,'')}); await snap('blocked-by-cookie-banner-'+why.replace(/\W+/g,'-')); await rb.click(); log.taps++; await p.waitForTimeout(300); await loc.click();} else throw e;} log.taps++;log.lastTap=why;};
const ts=Date.now(); const email=`Qa-e2e-1005-elev-${ts}@example.com`; const pe=`qa-e2e-1005-parinte-consent-${ts}@example.com`;
const year=kind==='minor'?'2012':'2008';
await p.goto(BASE+'/ro'); await p.waitForTimeout(600);
// CTA visibility on landing: which elements are covered / above fold
const cta=await p.evaluate(()=>{const out={};for(const t of ['Fă-ți cont gratuit','Începe testul','Autentificare','Vezi demo-ul complet']){const e=[...document.querySelectorAll('a,button')].find(x=>x.innerText&&x.innerText.includes(t));if(!e){out[t]=null;continue}const r=e.getBoundingClientRect();const cx=r.left+r.width/2,cy=Math.min(r.top+r.height/2,innerHeight-1);const top=document.elementFromPoint(cx,cy);out[t]={top:Math.round(r.top),vh:innerHeight,aboveFold:r.top<innerHeight&&r.bottom>0,coveredBy:top&&!e.contains(top)&&!top.contains(e)?(top.closest('[class]')?.className||'').slice(0,60)+' '+(top.innerText||'').slice(0,40):null};}
 out.banner=!![...document.querySelectorAll('*')].find(x=>/Folosim cookie-uri/.test(x.innerText||'')&&x.children.length<8);return out;});
log.landingCTA=cta; await snap('landing',{cta});
await tap(p.getByText('Fă-ți cont gratuit').first(),'landing CTA'); await p.waitForURL(/register/); await p.waitForTimeout(700);
log.registerTitle=await p.title(); await snap('register-empty');
const fields=await p.evaluate(()=>[...document.querySelectorAll('input,select')].filter(e=>e.offsetParent).map(e=>e.placeholder||e.name||e.id||e.tagName));
log.registerFields=fields; log.subjectCheckboxes=await p.locator('input[type=checkbox]').count();
await p.getByPlaceholder('Numele tău').fill('Qa Elev'); await p.getByPlaceholder('tu@exemplu.ro').fill(email); log.typed+=2;
const sel=p.locator('select'); await sel.nth(0).selectOption('15'); await sel.nth(1).selectOption({index:5}); await sel.nth(2).selectOption(year); log.taps+=3;
if(kind==='minor'){await p.locator('#parent-email').fill(pe); log.typed++;}
await p.getByPlaceholder('Minimum 8 caractere').fill('QaE2e!1005x'); await p.getByPlaceholder('Repetă parola').fill('QaE2e!1005x'); log.typed+=2;
const hasBanner=await p.getByRole('button',{name:'Respinge'}).isVisible().catch(()=>false); log.cookieBannerOnRegister=hasBanner;
await snap('register-filled',{cookieBanner:hasBanner});
const submit=p.getByRole('button',{name:'Creează cont'}); const sb=await submit.boundingBox(); log.submitY=sb&&Math.round(sb.y);
const t1=Date.now(); await tap(submit,'submit');
await p.waitForURL(/dashboard/,{timeout:20000}).catch(()=>{}); await p.waitForLoadState('networkidle').catch(()=>{});
log.submitToDashboardSec=+((Date.now()-t1)/1000).toFixed(1); await snap('dashboard-wizard1');
await tap(p.getByText('Matematica cl. VIII').first(),'wizard subject'); await p.waitForTimeout(1200); await snap('wizard-step2');
await tap(p.getByText('Începe testul').first(),'start test'); await p.waitForTimeout(2500);
log.afterStartUrl=p.url().replace(BASE,''); await snap('after-start');
// calibration: choose class
const classSel=p.locator('select').first();
if(await classSel.isVisible().catch(()=>false)){
  const opts=await classSel.locator('option').allInnerTexts(); log.classOptions=opts;
  await classSel.selectOption({label:'Clasa a VIII-a'}).catch(async()=>{await classSel.selectOption({index:opts.length-1})}); log.taps++; await p.waitForTimeout(1500);
  const save=p.getByRole('button',{name:'Salvează și continuă'}); const bb=await save.boundingBox(); const vh=await p.evaluate(()=>innerHeight);
  const checks=await p.locator('input[type=checkbox]').count(); log.curriculum={checkboxes:checks,saveY:bb&&Math.round(bb.y+ (await p.evaluate(()=>scrollY))),vh,scrollsNeeded:bb?Math.ceil((bb.y+(await p.evaluate(()=>scrollY)))/vh):null};
  await snap('class-chosen');
  await save.scrollIntoViewIfNeeded(); await snap('save-button');
  await tap(save,'save curriculum'); await p.waitForTimeout(500);
}
await p.waitForURL(/practice\/[a-z0-9]{10,}/,{timeout:15000}).catch(()=>{});
await p.waitForSelector('text=/Întrebarea 1/',{timeout:10000}).catch(()=>{});
log.firstValueSec=sec(); log.firstValueUrl=p.url().replace(BASE,'');
const body=await p.evaluate(()=>document.body.innerText); log.firstQuestionText=body.replace(/\n+/g,' | ').slice(0,500);
const eng=body.match(/\b(Loading|Submit|Sign in|Next|Question|Start|Continue|Failed|Error|Welcome|Dashboard)\b/g); log.englishWords=eng;
await snap('first-question');
// answer one
const optLoc=p.locator('button,[role=button],label').filter({hasText:/^\s*[A-D][\.\)]/}).first();
if(await optLoc.count()){await optLoc.scrollIntoViewIfNeeded(); await tap(optLoc,'answer'); await p.waitForTimeout(1200); await snap('answered'); log.answeredSec=sec();}
log.totalSecToFirstQuestion=log.firstValueSec;
// mail
if(kind==='minor'){const end=Date.now()+30000;let found=null;while(Date.now()<end&&!found){for(const f of fs.readdirSync(MAIL)){try{const j=JSON.parse(fs.readFileSync(`${MAIL}/${f}`));if(JSON.stringify(j.to).toLowerCase().includes(pe.toLowerCase())){found=j;break}}catch{}}await p.waitForTimeout(1000);} log.parentMail=found&&{to:found.to,subject:found.subject,links:found.links,text:found.text?.slice(0,500)};
  if(found?.links?.length){const l=found.links.find(x=>/acord-parinte/.test(x));if(l){const pg=await ctx.newPage();await pg.goto(l.replace(/^https?:\/\/[^/]+/,BASE));await pg.waitForTimeout(1500);await pg.screenshot({path:`${DIR}/${tag}-consent-page.png`});log.consentPage={url:l,text:(await pg.evaluate(()=>document.body.innerText)).replace(/\n+/g,' | ').slice(0,900)};}}}
// lowercase login (adult only)
if(kind==='adult'){await ctx.clearCookies(); await p.goto(BASE+'/ro/auth/signin'); await p.waitForTimeout(800); log.signinTitle=await p.title();
 await p.getByRole('button',{name:'Respinge'}).click().catch(()=>{});
 await p.locator('input[type=text],input[type=email]').first().fill(email.toLowerCase()); await p.getByPlaceholder('••••••••').fill('QaE2e!1005x'); await p.locator('button[type=submit]').click();
 await p.waitForTimeout(3500); log.lowercaseLoginUrl=p.url().replace(BASE,''); await snap('login-lowercase');}
log.email=email; log.pe=pe; log.totalSec=sec();
fs.writeFileSync(`${DIR}/${tag}-steps.json`,JSON.stringify(log,null,1));
console.log(JSON.stringify({tag,taps:log.taps,typed:log.typed,firstValueSec:log.firstValueSec,firstValueUrl:log.firstValueUrl,submitToDashboardSec:log.submitToDashboardSec,console:log.console,http:log.http,eng:log.englishWords,regTitle:log.registerTitle,fields:log.registerFields,cb:log.subjectCheckboxes,cta:log.landingCTA,curr:log.curriculum,lc:log.lowercaseLoginUrl,mail:log.parentMail&&log.parentMail.subject},null,1));
await b.close();
