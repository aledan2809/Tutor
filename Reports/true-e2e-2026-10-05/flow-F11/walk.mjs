import { createRequire } from 'module';
import fs from 'fs';
import { prisma } from './db.mjs';
const req = createRequire('/Users/danciulescu/Projects/Tester-Gateway/package.json');
const { chromium, devices } = req('playwright');
const BASE='http://localhost:3113', DIR=process.cwd();
const vp = process.argv[2]||'mobile';
const P='qa-e2e-1005';
const ADMIN=`${P}-admin`, APASS='QaE2e-1005-pass!';
const sfx = vp==='mobile'?'m':'d';
const ph1=`0799${sfx==='m'?'100':'200'}001`, ph2=`0799${sfx==='m'?'100':'200'}002`, ph3=`0799${sfx==='m'?'100':'200'}003`;
// cleanup students from previous run
await prisma.recipient.deleteMany({where:{lastName:{contains:P}}});
await prisma.user.deleteMany({where:{username:{startsWith:`${P}-s`}}});
const dA=await prisma.domain.findUnique({where:{slug:`${P}-cu-lectii`}}), dB=await prisma.domain.findUnique({where:{slug:`${P}-fara-lectii`}});
const browser = await chromium.launch();
const ctxOpts = vp==='mobile' ? {...devices['iPhone 13'], viewport:{width:390,height:844}, deviceScaleFactor:2, locale:'ro-RO'} : {viewport:{width:1440,height:900}, locale:'ro-RO'};
const log={vp,steps:[],console:[],http:[],notes:[]};
let n=0, taps=0, t0=Date.now();
async function mkPage(){ const ctx=await browser.newContext(ctxOpts); const page=await ctx.newPage();
  page.on('console',m=>{if(m.type()==='error')log.console.push({url:page.url().replace(BASE,''),text:m.text().slice(0,250)})});
  page.on('response',r=>{if(r.status()>=400)log.http.push({url:r.url().replace(BASE,''),status:r.status()})});
  return {ctx,page};}
async function snap(page,name,extra={}){ n++; const f=`${vp}-${String(n).padStart(2,'0')}-${name}.png`;
  await page.screenshot({path:`${DIR}/${f}`});
  const info=await page.evaluate(()=>({h1:document.querySelector('h1')?.innerText, vis:[...document.querySelectorAll('button,a[href],[role=button]')].filter(e=>e.offsetParent&&!e.closest('nav')).slice(0,14).map(e=>{const r=e.getBoundingClientRect();return {t:(e.innerText||e.getAttribute('aria-label')||'').trim().slice(0,50),below:r.top>innerHeight}}), hscroll:document.documentElement.scrollWidth>innerWidth+1, body:document.body.innerText.slice(0,400)}));
  log.steps.push({n,name,file:f,url:page.url().replace(BASE,''),title:await page.title(),sec:((Date.now()-t0)/1000).toFixed(1),taps,...info,...extra}); console.log(n,name,page.url().replace(BASE,''),info.h1);}
const tap=async(loc)=>{taps++; await loc.click();};
async function cookie(page,count){ const b=page.getByRole('button',{name:'Respinge'}); await b.waitFor({timeout:4000}).catch(()=>{}); if(await b.count()){ if(count) taps++; await b.click(); await page.waitForTimeout(300);} }
// ---- admin
const {ctx:actx,page:ap}=await mkPage();
await ap.goto(`${BASE}/ro/auth/signin`); await cookie(ap,false); await ap.fill('#email',ADMIN); await ap.fill('#password',APASS);
await tap(ap.locator('button[type=submit]').first()); await ap.waitForURL(u=>!u.pathname.includes('signin'),{timeout:20000}); await snap(ap,'admin-login'); 
// import
let t=Date.now(); await ap.goto(`${BASE}/ro/dashboard/admin/import-cursanti`); log.notes.push({importLoadMs:Date.now()-t}); await snap(ap,'import-empty-cookiebanner'); await cookie(ap,false);
await ap.selectOption('#materie',dA.id);
const csv=`Nume;Prenume;Functie;Marca;Telefon;Judet;Localitate;Oficiu\nPopescu ${P}-${sfx};Ion;factor;PR-1;${ph1};Olt;Slatina;OP Slatina 3\nIonescu ${P}-${sfx};Maria;ghiseu;PR-2;${ph2};Olt;Slatina;OP Slatina 1\n`;
fs.writeFileSync(`${DIR}/cursanti-${sfx}.csv`,csv);
await ap.setInputFiles('input[type=file]',`${DIR}/cursanti-${sfx}.csv`); taps++;
await ap.waitForTimeout(500); await snap(ap,'import-file-loaded');
await tap(ap.getByRole('button',{name:/Vezi ce am înțeles/})); await ap.waitForSelector('text=de adăugat'); await snap(ap,'import-preview');
const applyBtn=ap.getByRole('button',{name:/Importă/}); log.notes.push({applyBtnText:await applyBtn.innerText().catch(()=>null)});
await tap(applyBtn); await ap.waitForSelector('text=Gata:',{timeout:15000}); await snap(ap,'import-done');
// Domain B import 1 row for empty-course landing
await ap.selectOption('#materie',dB.id); await ap.fill('#lista',`Nume;Prenume;Telefon\nVasilescu ${P}-${sfx};Ana;${ph3}\n`);
await tap(ap.getByRole('button',{name:/Vezi ce am înțeles/})); await ap.waitForSelector('text=de adăugat'); await tap(ap.getByRole('button',{name:/Importă/})); await ap.waitForSelector('text=Gata:');
// invitatii
await ap.goto(`${BASE}/ro/dashboard/admin/invitatii`); await snap(ap,'invitatii');
const opts=await ap.locator('#materie option').allInnerTexts().catch(()=>[]); log.notes.push({invitatiiMaterii:opts});
const hasForm=await ap.locator('#telefon').count();
if(hasForm){ await ap.selectOption('#materie',dA.id); await ap.fill('#telefon',ph1); await ap.fill('#nume',`Popescu ${P}-${sfx}`); await ap.fill('#prenume','Ion');
  await tap(ap.getByRole('button',{name:/Trimite/}).last()); await ap.waitForTimeout(2500); await snap(ap,'invitatii-send-result'); }
log.notes.push({invitatiiLinkVisible: /acces\//.test(await ap.innerText('body'))});
// token from DB
const rA=await prisma.recipient.findFirst({where:{domainId:dA.id,phone:{endsWith:ph1.slice(1)}}}), rB=await prisma.recipient.findFirst({where:{domainId:dB.id}});
log.notes.push({tokenA:rA?.token,tokenB:rB?.token,invitedAt:rA?.invitedAt,openedAtBefore:rA?.openedAt});
// ---- student
const {ctx:sctx,page:sp}=await mkPage(); n=n; taps=0; t0=Date.now();
t=Date.now(); await sp.goto(`${BASE}/ro/acces/${rA.token}`); log.notes.push({accesLoadMs:Date.now()-t}); await snap(sp,'acces-landing'); await cookie(sp,true);
const openedAt=(await prisma.recipient.findUnique({where:{id:rA.id}})).openedAt; log.notes.push({openedAtAfterOpen:openedAt});
// try weak/mismatch first
await sp.fill('#user','Ion Popescu!'); await sp.fill('#p1','12'); await sp.fill('#p2','12');
await snap(sp,'acces-fields-filled-bad');
const submitBtn=sp.getByRole('button',{name:/Intră la curs/});
await tap(submitBtn); await sp.waitForTimeout(800); await snap(sp,'acces-bad-submit');
await sp.fill('#user',`${P}-s${sfx}1`); await sp.fill('#p1','QaE2e-1005-ok!'); await sp.fill('#p2','QaE2e-1005-ok2');
await tap(submitBtn); await sp.waitForTimeout(500); await snap(sp,'acces-mismatch');
await sp.fill('#p2','QaE2e-1005-ok!');
await snap(sp,'acces-good-filled');
const t1=Date.now(); await tap(submitBtn);
await sp.waitForURL(u=>!u.pathname.includes('/acces/'),{timeout:20000}).catch(()=>{}); await sp.waitForLoadState('networkidle').catch(()=>{});
log.notes.push({activateToLandingMs:Date.now()-t1, firstValueSec:((Date.now()-t0)/1000).toFixed(1), firstValueTaps:taps});
await snap(sp,'first-value');
if(await sp.getByText('Data nașterii').count()){ const sel=sp.locator('select'); const opts=await sel.nth(1).locator('option').allInnerTexts(); log.notes.push({ageGate:true,monthOpts:opts.slice(0,4)}); await sel.nth(0).selectOption({index:15}); await sel.nth(1).selectOption({index:5}); await sel.nth(2).selectOption({label:'1985'}).catch(async()=>{await sel.nth(2).selectOption({index:40})}); taps+=3; await tap(sp.getByRole('button',{name:'Continuă'})); await sp.waitForTimeout(2500); await sp.waitForLoadState('networkidle').catch(()=>{}); await snap(sp,'after-age-gate'); log.notes.push({afterAgeGateTaps:taps,sec:((Date.now()-t0)/1000).toFixed(1)}); if(await sp.getByText('Data nașterii e salvată').count()){ await tap(sp.getByRole('button',{name:'Continuă'})); await sp.waitForTimeout(2500); await sp.waitForLoadState('networkidle').catch(()=>{}); await snap(sp,'after-second-continue'); log.notes.push({realContentTaps:taps,sec:((Date.now()-t0)/1000).toFixed(1)}); } }
const lessonLink=sp.locator('a[href*="/dashboard/lessons/"]').first();
if(await lessonLink.count()){ await tap(lessonLink); await sp.waitForLoadState('networkidle'); await snap(sp,'lesson-open'); log.notes.push({lessonOpenedTaps:taps,sec:((Date.now()-t0)/1000).toFixed(1)}); }
// second open of same link (fresh context)
const {ctx:s2ctx,page:s2}=await mkPage();
await s2.goto(`${BASE}/ro/acces/${rA.token}`); await snap(s2,'acces-second-open');
// token B: course without lessons
const {ctx:s3ctx,page:s3}=await mkPage();
await s3.goto(`${BASE}/ro/acces/${rB.token}`); await cookie(s3,false); await s3.fill('#user',`${P}-s${sfx}2`); await s3.fill('#p1','QaE2e-1005-ok!'); await s3.fill('#p2','QaE2e-1005-ok!');
await s3.getByRole('button',{name:/Intră la curs/}).click();
await s3.waitForURL(u=>!u.pathname.includes('/acces/'),{timeout:20000}).catch(()=>{}); await s3.waitForLoadState('networkidle').catch(()=>{});
await snap(s3,'empty-course-landing');
if(await s3.getByText('Data nașterii').count()){ const sel=s3.locator('select'); await sel.nth(0).selectOption({index:15}); await sel.nth(1).selectOption({index:5}); await sel.nth(2).selectOption({index:40}); await s3.getByRole('button',{name:'Continuă'}).click(); await s3.waitForTimeout(2500); await s3.waitForLoadState('networkidle').catch(()=>{}); await snap(s3,'empty-course-after-age'); if(await s3.getByText('Data nașterii e salvată').count()){ await s3.getByRole('button',{name:'Continuă'}).click(); await s3.waitForTimeout(2500); await s3.waitForLoadState('networkidle').catch(()=>{}); await snap(s3,'empty-course-after-second'); } }
// invalid token
await s2.goto(`${BASE}/ro/acces/tokeninexistent123`); await snap(s2,'acces-invalid-token');
// admin roster
await ap.goto(`${BASE}/ro/dashboard/admin/cursanti?materie=${dA.id}`); await snap(ap,'roster'); 
{const bt=await ap.innerText('body'); log.notes.push({rosterText:bt.slice(bt.indexOf('Toți')).slice(0,1500)}); await ap.screenshot({path:`${DIR}/${vp}-roster-full.png`,fullPage:true});}
fs.writeFileSync(`${DIR}/steps-${vp}.json`,JSON.stringify(log,null,1));
await browser.close(); await prisma.$disconnect();
