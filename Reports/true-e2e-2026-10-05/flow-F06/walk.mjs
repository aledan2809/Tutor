import { createRequire } from 'module'; import fs from 'fs';
const req = createRequire('/Users/danciulescu/Projects/Tester-Gateway/package.json');
const { chromium, devices } = req('playwright');
const BASE='http://localhost:3113', DIR='/Users/danciulescu/Projects/Tutor/Reports/true-e2e-2026-10-05/flow-F06', MAIL='/Users/danciulescu/Projects/Tutor/Reports/true-e2e-2026-10-05/mailbox';
const vp=process.argv[2]||'mobile';
const ctxOpts = vp==='mobile'?{viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,userAgent:devices['iPhone 13'].userAgent}:{viewport:{width:1440,height:900}};
const ts=Date.now(); const stored=`qa-e2e-1005-f06-${vp}-${ts}@example.com`; const OLD='QaE2e!1005x', NEW='NouaParola!1005';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const mails=(to)=>fs.readdirSync(MAIL).map(f=>{try{return {f,...JSON.parse(fs.readFileSync(`${MAIL}/${f}`,'utf8'))}}catch{return null}}).filter(j=>j&&JSON.stringify(j.to).toLowerCase().includes(to.toLowerCase())).sort((a,b)=>a.at<b.at?-1:1);
async function waitMail(to, n, ms=60000){const end=Date.now()+ms; while(Date.now()<end){const m=mails(to); if(m.length>=n) return m; await sleep(500);} return mails(to);}
const log={vp,email:stored,steps:[],defects:[],notes:[]}; let n=0, taps=0;
const b=await chromium.launch();
async function mkpage(ctx,tag){const p=await ctx.newPage(); p.on('console',m=>{if(m.type()==='error')(log.console??=[]).push({tag,url:p.url(),text:m.text().slice(0,200)})}); p.on('response',r=>{if(r.status()>=400)(log.http??=[]).push({tag,url:r.url().replace(BASE,''),status:r.status()})}); return p;}
async function snap(p,name,extra={}){n++; const f=`${vp}-${String(n).padStart(2,'0')}-${name}.png`; await p.screenshot({path:`${DIR}/${f}`});
 const info=await p.evaluate(()=>({text:document.body.innerText.slice(0,600),prim:[...document.querySelectorAll('button,a[href]')].filter(e=>e.offsetParent).slice(0,12).map(e=>{const r=e.getBoundingClientRect();return {t:(e.innerText||e.getAttribute('aria-label')||'').trim().slice(0,50),below:r.top>innerHeight}}),sw:document.documentElement.scrollWidth>innerWidth+1}));
 log.steps.push({n,name,file:f,url:p.url().replace(BASE,''),sec:+((Date.now()-T0)/1000).toFixed(1),taps,...info,...extra}); return info;}
let T0=Date.now();
// --- setup: register account (old session lives in ctxA)
const ctxA=await b.newContext(ctxOpts); const pa=await mkpage(ctxA,'A');
await pa.goto(BASE+'/ro/auth/register'); await pa.waitForTimeout(800);
await pa.getByPlaceholder('Numele tău').fill('Qa F06');
await pa.getByPlaceholder('tu@exemplu.ro').fill(stored);
const sel=pa.locator('select'); await sel.nth(0).selectOption('15'); await sel.nth(1).selectOption({index:5}); await sel.nth(2).selectOption('2000');
await pa.getByPlaceholder('Minimum 8 caractere').fill(OLD); await pa.getByPlaceholder('Repetă parola').fill(OLD);
await pa.getByRole('button',{name:'Respinge'}).click().catch(()=>{}); await pa.waitForTimeout(300);
await pa.getByRole('button',{name:'Creează cont'}).click();
await pa.waitForURL(/dashboard/,{timeout:25000}).catch(()=>{}); await pa.waitForTimeout(1500);
log.notes.push('setup: register -> '+pa.url());
const ses0=await pa.evaluate(()=>fetch('/api/auth/session').then(r=>r.json())); log.notes.push('old session before reset: '+JSON.stringify(!!ses0?.user));

// --- flow
const ctxB=await b.newContext(ctxOpts); const p=await mkpage(ctxB,'B');
T0=Date.now(); taps=0;
await p.goto(BASE+'/ro/auth/signin'); await p.waitForTimeout(700); await snap(p,'signin');
const link=p.getByText(/Ai uitat parola/i).first(); const lb=await link.boundingBox(); log.notes.push('forgot link y='+lb?.y+' vh='+(ctxOpts.viewport.height));
await link.click(); taps++; await p.waitForURL(/forgot-password/); await p.waitForTimeout(500);
const f1=await snap(p,'forgot-empty');
await p.locator('#email').fill(stored.toUpperCase()); 
const tSub=Date.now(); await p.getByRole('button',{name:/Trimite|link/i}).first().click(); taps++;
await p.getByText(/Uită-te|email/i).first().waitFor({timeout:10000}).catch(()=>{}); await p.waitForTimeout(600);
log.submitToScreenMs=Date.now()-tSub; const f2=await snap(p,'forgot-sent');
// enumeration check via API
const t1=Date.now(); const rExist=await p.evaluate(e=>fetch('/api/auth/forgot-password',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:e,locale:'ro'})}).then(async r=>({s:r.status,b:await r.text()})),stored);
const t2=Date.now(); const rMiss=await p.evaluate(()=>fetch('/api/auth/forgot-password',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:'qa-e2e-1005-nu-exista-'+Date.now()+'@example.com',locale:'ro'})}).then(async r=>({s:r.status,b:await r.text()})));
const t3=Date.now(); log.enumeration={existing:rExist,missing:rMiss,sameBody:rExist.b===rMiss.b,msExisting:t2-t1,msMissing:t3-t2};
// mail
const ml=await waitMail(stored,1); const m1=ml[0]; 
if(!m1){log.status='BLOCKED';log.notes.push('no reset mail');fs.writeFileSync(`${DIR}/${vp}-steps.json`,JSON.stringify(log,null,1));await b.close();process.exit(0);}
log.mail={subject:m1.subject,at:m1.at,delayAfterSubmitSec:((new Date(m1.at)-tSub)/1000).toFixed(1),count:ml.length,text:(m1.text||'').slice(0,600),hasEtutorBrand:/eTutor\.ro/.test(m1.text||m1.html),htmlLinkText:(m1.html.match(/>([^<]*Alege[^<]*)</)||[])[1]};
const url=(m1.links||[]).find(l=>l.includes('reset-password'));
await p.goto(url); await p.waitForTimeout(800); await snap(p,'reset-form');
// short pwd
await p.locator('#new-password').fill('abc'); await p.locator('#confirm-password').fill('abc'); await p.getByRole('button',{name:/Salvează|Schimb|parol/i}).last().click(); taps++; await p.waitForTimeout(500); const sh=await snap(p,'reset-short');
// mismatch
await p.locator('#new-password').fill(NEW); await p.locator('#confirm-password').fill(NEW+'x'); await p.getByRole('button',{name:/Salvează|Schimb|parol/i}).last().click(); taps++; await p.waitForTimeout(500); await snap(p,'reset-mismatch');
// valid
await p.locator('#confirm-password').fill(NEW); const bt=await p.getByRole('button',{name:/Salvează|Schimb|parol/i}).last().boundingBox(); log.notes.push('save button y='+bt?.y);
await p.getByRole('button',{name:/Salvează|Schimb|parol/i}).last().click(); taps++; await p.getByText(/Gata/i).first().waitFor({timeout:15000}).catch(()=>{}); await p.waitForTimeout(500); await snap(p,'reset-done');
// sign in
await p.getByRole('link',{name:/Intră/i}).first().click(); taps++; await p.waitForURL(/signin/); await p.waitForTimeout(600); await snap(p,'signin-after');
const inputs=p.locator('input'); await p.locator('input[type=email],input[name=email],#email').first().fill(stored); await p.locator('input[type=password]').first().fill(NEW);
await p.getByRole('button',{name:/Intră|Autentific/i}).last().click(); taps++; await p.waitForURL(/dashboard/,{timeout:25000}).catch(()=>{}); await p.waitForTimeout(1500);
const firstValue=((Date.now()-T0)/1000); const ok=/dashboard/.test(p.url()); await snap(p,'logged-in',{ok});
log.firstValue={reached:ok,sec:+firstValue.toFixed(1),taps};
// reuse link
const p2=await ctxB.newPage(); await p2.goto(url); await p2.waitForTimeout(800);
await p2.locator('#new-password').fill('Alta!Parola1005'); await p2.locator('#confirm-password').fill('Alta!Parola1005'); await p2.getByRole('button',{name:/Salvează|Schimb|parol/i}).last().click(); await p2.waitForTimeout(1200);
n++; const fr=`${vp}-${n}-reuse.png`; await p2.screenshot({path:`${DIR}/${fr}`}); log.reuse={file:fr,text:(await p2.evaluate(()=>document.body.innerText)).slice(0,500),newLinkCta:await p2.getByText(/link nou/i).count()};
// two links in a row
const before=mails(stored).length; 
for(let i=0;i<2;i++) await p.evaluate(e=>fetch('/api/auth/forgot-password',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email:e,locale:'ro'})}),stored);
await sleep(4000); const after=mails(stored).length; log.twoInARow={before,after,newMails:after-before};
// old session
const ses1=await pa.evaluate(()=>fetch('/api/auth/session').then(r=>r.json())); await pa.goto(BASE+'/ro/dashboard'); await pa.waitForTimeout(2000);
log.oldSession={sessionApiUserAfter:!!ses1?.user,urlAfterGoto:pa.url().replace(BASE,'')}; n++; await pa.screenshot({path:`${DIR}/${vp}-${n}-old-session.png`});
if(process.env.WAIT){await sleep(310000); const s2=await pa.evaluate(()=>fetch('/api/auth/session').then(r=>r.json())); await pa.goto(BASE+'/ro/dashboard'); await pa.waitForTimeout(2500); log.oldSessionAfter5min={sessionApiUser:!!s2?.user,urlAfterGoto:pa.url().replace(BASE,'')}; n++; await pa.screenshot({path:`${DIR}/${vp}-${n}-old-session-5min.png`});}
fs.writeFileSync(`${DIR}/${vp}-steps.json`,JSON.stringify(log,null,1));
console.log(JSON.stringify({oldSessionAfter5min:log.oldSessionAfter5min,firstValue:log.firstValue,mail:log.mail,enumeration:log.enumeration,reuse:log.reuse,twoInARow:log.twoInARow,oldSession:log.oldSession,http:log.http,console:log.console,submitToScreenMs:log.submitToScreenMs},null,1));
await b.close();
