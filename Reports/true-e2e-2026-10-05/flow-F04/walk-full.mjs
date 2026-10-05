// F04 — copilul intră cu codul de familie. Rulează: node walk-full.mjs mobile|desktop
import {chromium,BASE,DIR} from './lib.mjs'; import fs from 'fs';
const vp=process.argv[2]||'mobile'; const tag=vp==='mobile'?'M':'D';
const opts=vp==='mobile'?{viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true}:{viewport:{width:1440,height:900}};
const PW='QaE2e-1005-pass!'; const pe=`qa-e2e-1005-f04-parent-${vp}@example.com`, ce=`qa-e2e-1005-f04-child-${vp}@example.com`;
const b=await chromium.launch(); const out={vp,steps:[],issues:[],notes:{}};
let n=0; const t00=Date.now();
function mkctx(){return b.newContext(opts);}
async function snap(page,name,extra={}){ n++; const f=`R${tag}-${String(n).padStart(2,'0')}-${name}.png`; await page.screenshot({path:`run/${f}`});
  const prim=await page.evaluate(()=>[...document.querySelectorAll('button,a[href],[role=button]')].filter(e=>e.offsetParent&&!e.closest('nav')).slice(0,16).map(e=>{const r=e.getBoundingClientRect();return {t:(e.innerText||e.getAttribute('aria-label')||'').trim().slice(0,50),belowFold:r.top>innerHeight}}));
  const rec={n,name,file:`run/${f}`,url:page.url().replace(BASE,''),prim,...extra}; out.steps.push(rec); return rec; }
const wire=(page,label)=>{page.on('response',r=>{if(r.status()>=400)(out.http??=[]).push({ctx:label,url:r.url().replace(BASE,''),status:r.status()})}); page.on('console',m=>{if(m.type()==='error')(out.console??=[]).push({ctx:label,text:m.text().slice(0,200)})});};
const body=async(p,len=300)=>(await p.innerText('body')).replace(/\n+/g,' | ').slice(0,len);
const rej=async(p)=>{const r=p.getByRole('button',{name:'Respinge'}); if(await r.count()){await r.click().catch(()=>{});return true;}return false;};

// 1. părinte
const pc=await mkctx(); const pp=await pc.newPage(); wire(pp,'parent');
const rr=await pp.request.post(BASE+'/api/auth/register',{data:{name:`qa-e2e-1005 Parinte ${vp}`,email:pe,password:PW,role:'PARENT',domainSlugs:[]}}); out.notes.parentRegister=rr.status();
await pp.goto(BASE+'/ro/auth/signin'); await pp.locator('input:not([type=password]):not([type=hidden])').first().fill(pe); await pp.locator('input[type=password]').first().fill(PW);
await pp.click('button[type=submit]'); await pp.waitForTimeout(3500);
await pp.goto(BASE+'/ro/dashboard/family'); await pp.waitForTimeout(2500);
await pp.getByRole('button',{name:'Adaugă copil'}).click(); await pp.waitForTimeout(800); const cookieOverCta=await pp.getByRole('button',{name:'Respinge'}).count();
await snap(pp,'parent-add-child',{cookieOverCta}); await rej(pp);
await pp.getByRole('button',{name:'Cod de familie'}).click(); await snap(pp,'parent-code-choice');
await pp.getByRole('button',{name:'Trimite invitația'}).click(); await pp.waitForTimeout(2500);
const ptxt=await pp.innerText('body'); const mm=ptxt.match(/Cod:\s*([A-Z0-9]{6,10})/); const CODE=mm&&mm[1]; out.notes.code=CODE;
out.notes.copyButtons=await pp.locator('button',{hasText:/copiaz|copy/i}).count();
out.notes.codeContext=ptxt.replace(/\n+/g,' | ').split('Cod de familie')[1]?.slice(0,260);
await snap(pp,'parent-code-shown');
if(!CODE){out.blocked='no code'; fs.writeFileSync(`run/steps-${tag}.json`,JSON.stringify(out,null,1)); await b.close(); process.exit(1);}

// 2. negative (sesiune curată)
const nc=await mkctx(); const np=await nc.newPage(); wire(np,'neg'); await np.goto(BASE+'/ro/family/join'); await rej(np);
out.notes.joinLang=await np.evaluate(()=>document.documentElement.lang);
out.notes.joinBg=await np.evaluate(()=>getComputedStyle(document.querySelector('main > div')).backgroundColor+' | body '+getComputedStyle(document.body).backgroundColor);
const tryc=async(c,name)=>{await np.locator('main input').first().fill(c); const bt=np.getByRole('button',{name:'Verifică codul'}); const dis=await bt.isDisabled(); if(!dis){await bt.click(); await np.waitForTimeout(1200);} const t=(await np.innerText('main')).replace(/\n+/g,' | ').slice(0,200); await snap(np,name,{input:c}); out.notes['neg_'+name]={input:c,buttonDisabled:dis,text:t}; };
await tryc('ZZZZ9999','inexistent'); await tryc('abc','too-short'); await tryc(`  ${CODE.slice(0,4).toLowerCase()} ${CODE.slice(4).toLowerCase()} `,'spaces-lower');
out.notes.noPrefixUrl=await (async()=>{await np.goto(BASE+'/family/join'); return np.url().replace(BASE,'');})();
await nc.close();

// 3. copil
const cc=await mkctx(); const page=await cc.newPage(); wire(page,'child'); let taps=0; const T=async(l)=>{taps++; await l.click();}; const t0=Date.now(); const sec=()=>((Date.now()-t0)/1000).toFixed(1);
await page.goto(BASE+'/ro/family/join'); await snap(page,'join-landing',{sec:sec()});
out.notes.cookieBannerOnJoin=await rej(page);
await page.locator('main input').first().fill(CODE.toLowerCase()); taps++;
await T(page.getByRole('button',{name:'Verifică codul'})); await page.waitForTimeout(1200); await snap(page,'verified',{sec:sec(),taps,text:await body(page)});
await T(page.locator('main').getByRole('button',{name:'Accept'})); await page.waitForURL(/signin/,{timeout:8000}); await page.waitForTimeout(800); await snap(page,'signin',{sec:sec(),taps});
const so=await rej(page); await T(page.getByRole('link',{name:/Fă-ți unul/})); await page.waitForURL(/register/,{timeout:8000}); await page.waitForTimeout(1200);
out.notes.registerUrl=page.url().replace(BASE,''); await rej(page);
out.notes.roleChecked=await page.locator('[role=radio][aria-checked=true]').innerText().catch(()=>'?'); await snap(page,'register',{sec:sec(),taps});
await page.locator('input[type=text]').first().fill(`qa-e2e-1005 Copil ${vp}`); await page.locator('input[type=email]').first().fill(ce); const sels=page.locator('select'); out.notes.registerSelects=await sels.count();
out.notes.registerSelectOptions=await sels.evaluateAll(s=>s.map(x=>[...x.options].slice(0,3).map(o=>o.text)));
await sels.nth(0).selectOption('15'); await sels.nth(1).selectOption({index:5}); await sels.nth(2).selectOption({label:'2008'}).catch(()=>sels.nth(2).selectOption('2008'));
const pws=page.locator('input[type=password]'); for(let i=0;i<await pws.count();i++) await pws.nth(i).fill(PW);
out.notes.registerVisibleFields=await page.locator('input:visible,select:visible').count(); await page.evaluate(()=>scrollTo(0,0)); await snap(page,'register-filled',{sec:sec(),taps});
const tr=Date.now(); await T(page.locator('button[type=submit]')); await page.waitForURL(/family\/join/,{timeout:20000}).catch(()=>{}); await page.waitForTimeout(1500);
out.notes.registerSubmitSec=((Date.now()-tr)/1000).toFixed(1); out.notes.afterRegisterUrl=page.url().replace(BASE,''); out.notes.codePrefilled=await page.locator('main input').first().inputValue().catch(()=>null);
await snap(page,'back-on-join',{sec:sec(),taps,text:await body(page,200)});
const v=page.getByRole('button',{name:'Verifică codul'}); if(await v.count()){await T(v); await page.waitForTimeout(1200); await snap(page,'re-verify',{sec:sec(),taps});}
await T(page.locator('main').getByRole('button',{name:'Accept'})); await page.waitForTimeout(2000); const acc=await snap(page,'accepted',{sec:sec(),taps,text:await body(page,200)});
out.notes.acceptedText=acc.text; out.notes.joinedSec=sec(); out.notes.joinedTaps=taps;
await T(page.getByRole('link',{name:'Mergi la panou'})); await page.waitForTimeout(3500); await rej(page); await snap(page,'panou',{sec:sec(),taps,text:await body(page,500)}); out.notes.panouSec=sec(); out.notes.panouTaps=taps;
// 4. prima grilă — drumul ghidat
const subj=page.getByText('Matematica cl. VIII').first(); const tg=Date.now(); const taps0=taps;
await T(subj); await page.waitForTimeout(3000); await snap(page,'after-subject',{sec:sec(),taps,text:await body(page,300)});
const st=page.getByRole('button',{name:/Începe testul/}); if(await st.count()){ await T(st.first()); await page.waitForTimeout(3500); await snap(page,'after-begin-test',{sec:sec(),taps,text:await body(page,400)}); }
out.notes.guidedHttp409=(out.http||[]).filter(h=>h.status===409).length;
// calea manuală
await page.goto(BASE+'/ro/dashboard/practice?start=quick&domain=matematica-v-viii'); await page.waitForTimeout(2500); await rej(page);
await page.locator('select').first().selectOption({index:1}); taps++; await page.waitForTimeout(1800);
await page.getByText('Numere naturale').first().click(); taps++; await page.getByRole('button',{name:'Salvează și continuă'}).click(); taps++; await page.waitForTimeout(2500);
const bs=page.getByRole('button',{name:'Începe sesiunea'}); out.notes.startSessionVisible=await bs.count();
if(await bs.count()){ await bs.first().scrollIntoViewIfNeeded(); out.notes.startSessionBelowFold=await bs.first().evaluate(e=>e.getBoundingClientRect().top>innerHeight); await T(bs.first()); await page.waitForTimeout(4000); }
const q=await snap(page,'first-question-attempt',{sec:sec(),taps,text:await body(page,400)}); out.notes.firstGridSec=sec(); out.notes.firstGridTaps=taps; out.notes.totalChildSec=sec();
await cc.close();

// 5. cod folosit a doua oară
const uc=await mkctx(); const up=await uc.newPage(); await up.goto(BASE+'/ro/family/join'); await rej(up); await up.locator('main input').first().fill(CODE); await up.getByRole('button',{name:'Verifică codul'}).click(); await up.waitForTimeout(1200);
out.notes.usedCode=(await up.innerText('main')).replace(/\n+/g,' | ').slice(0,200); await snap(up,'used-code'); await uc.close();

// 6. părintele vede copilul
await pp.goto(BASE+'/ro/dashboard/family'); await pp.waitForTimeout(2500); await rej(pp); out.notes.parentFamilyText=await body(pp,700); await snap(pp,'parent-family');
await pp.goto(BASE+'/ro/dashboard/watcher'); await pp.waitForTimeout(4000); await rej(pp); out.notes.parentWatcherText=await body(pp,700); out.notes.childInWatcher=out.notes.parentWatcherText.includes(`Copil ${vp}`); await snap(pp,'parent-watcher');
await pc.close(); await b.close(); out.totalSec=((Date.now()-t00)/1000).toFixed(0);
fs.writeFileSync(`run/steps-${tag}.json`,JSON.stringify(out,null,1)); console.log(JSON.stringify(out.notes,null,1));
