import {prisma,chromium,devices,BASE,DIR,PW} from './lib.mjs';
import fs from 'fs';
const vp=process.argv[2]; const CODE=process.argv[3];
const dom=await prisma.domain.findFirst({where:{name:'Matematica cl. VIII'},select:{id:true}});
const b=await chromium.launch();
const ctxOpts = vp==='mobile' ? {...devices['iPhone 13'],viewport:{width:390,height:844},deviceScaleFactor:2,locale:'ro-RO'} : {viewport:{width:1440,height:900},locale:'ro-RO'};
const ctx=await b.newContext(ctxOpts); const page=await ctx.newPage();
const log={vp,steps:[],console:[],http:[],net:[]}; let n=0,taps=0,t0=Date.now();
page.on('console',m=>{if(m.type()==='error')log.console.push({url:page.url().replace(BASE,''),text:m.text().slice(0,200)})});
page.on('response',r=>{if(r.status()>=400)log.http.push({url:r.url().replace(BASE,'').slice(0,80),status:r.status()})});
page.on('request',r=>{if(/guest-access|domains\/join/.test(r.url()))log.net.push(r.method()+' '+r.url().replace(BASE,'').slice(0,60)+' @'+((Date.now()-t0)/1000).toFixed(1))});
const snap=async(name,extra={})=>{n++;const f=`${vp}2-${String(n).padStart(2,'0')}-${name}.png`;await page.screenshot({path:`${DIR}/${f}`});
  const prim=await page.evaluate(()=>[...document.querySelectorAll('button,a[href],[role=button],input')].filter(e=>e.offsetParent).slice(0,30).map(e=>{const r=e.getBoundingClientRect();return {t:(e.innerText||e.placeholder||e.getAttribute('aria-label')||'').trim().slice(0,50),belowFold:r.top>innerHeight}}));
  const body=(await page.innerText('body')).slice(0,900);
  log.steps.push({n,name,file:f,url:page.url().replace(BASE,''),sec:((Date.now()-t0)/1000).toFixed(1),taps,prim,body,...extra});};
const phone='07'+String(Date.now()).slice(-8); const tag=`qa-e2e-1005-${vp}`;
const cnt=async()=>({users:await prisma.user.count({where:{name:{contains:tag}}}),uses:(await prisma.domain.findUnique({where:{id:dom.id},select:{joinCodeUses:true}})).joinCodeUses});
log.db={start:await cnt()};
// A wrong code
let t=Date.now(); await page.goto(`${BASE}/ro/acces/XXXXXXXX`,{waitUntil:'networkidle'}); await snap('wrong-code-landing',{loadMs:Date.now()-t});
await page.fill('#g-nume',tag); await page.fill('#g-prenume','Test'); await page.fill('#g-tel','0711222333'); taps=3;
await page.click('text=Intră la curs'); await page.waitForTimeout(2500); await snap('wrong-code-after-submit'); log.db.afterWrong=await cnt();
// B good code
await ctx.clearCookies(); t0=Date.now(); taps=0;
t=Date.now(); await page.goto(`${BASE}/ro/acces/${CODE}`,{waitUntil:'networkidle'}); await snap('good-landing',{loadMs:Date.now()-t});
await page.fill('#g-nume',tag); await page.fill('#g-prenume','Test'); await page.fill('#g-tel',phone); taps=4; // 3 fields + submit
await snap('good-filled');
await page.click('text=Intră la curs');
await page.waitForURL(/dashboard/,{timeout:20000}).catch(()=>{}); await page.waitForLoadState('networkidle').catch(()=>{});
await snap('after-enter',{firstValueSec:((Date.now()-t0)/1000).toFixed(1)}); await page.waitForTimeout(2000); await snap('after-enter-settled');
log.db.afterEnter=await cnt();
log.db.guestUsers=await prisma.user.findMany({where:{name:{contains:tag}},select:{id:true,name:true,isGuest:true,username:true,email:true,accountRole:true}});
const u1=log.db.guestUsers[0];
log.db.enr=u1?await prisma.enrollment.findMany({where:{userId:u1.id},select:{domainId:true,isActive:true,roles:true}}):null;
log.db.recipient=await prisma.recipient.findMany({where:{phone:'40'+phone.slice(1)},select:{userId:true,phone:true,firstName:true,lastName:true,openedAt:true}});
// navigate lessons nav screens
for (const [name,path] of [['grile','/ro/dashboard/questions'],['domenii','/ro/dashboard/domains'],['abonament','/ro/dashboard/subscription']]) { await page.goto(BASE+path,{waitUntil:'networkidle'}).catch(()=>{}); await snap('nav-'+name); }
// C second entry same phone
await ctx.clearCookies(); t0=Date.now(); taps=0; await page.goto(`${BASE}/ro/acces/${CODE}`,{waitUntil:'networkidle'});
await page.fill('#g-nume',tag); await page.fill('#g-prenume','Test'); await page.fill('#g-tel',phone);
await page.click('text=Intră la curs'); await page.waitForURL(/dashboard/,{timeout:20000}).catch(()=>{}); await page.waitForTimeout(2000); await snap('second-entry');
log.db.afterSecond=await cnt();
log.db.recipientAfter=await prisma.recipient.findMany({where:{phone:'40'+phone.slice(1)},select:{userId:true}});
log.db.oldUserStillLinked=(await prisma.recipient.count({where:{userId:u1?.id}}));
// D logged-in other account
await ctx.clearCookies();
const csrf=await (await ctx.request.get(BASE+'/api/auth/csrf')).json();
const em=`${tag}-logged@example.test`;
await ctx.request.post(BASE+'/api/auth/register',{data:{name:`${tag} logged`,email:em,password:PW,role:'STUDENT',birthDate:'1990-01-01'}});
await prisma.user.updateMany({where:{email:em},data:{emailVerified:new Date()}});
await ctx.request.post(BASE+'/api/auth/callback/credentials',{form:{csrfToken:csrf.csrfToken,email:em,password:PW,json:'true'}});
t0=Date.now(); await page.goto(`${BASE}/ro/acces/${CODE}`); await page.waitForURL(/dashboard/,{timeout:20000}).catch(()=>{}); await page.waitForLoadState('networkidle').catch(()=>{}); await snap('logged-in-auto',{sec2:((Date.now()-t0)/1000).toFixed(1)});
const lu=await prisma.user.findFirst({where:{email:em}}); log.db.loggedEnr=await prisma.enrollment.findMany({where:{userId:lu.id},select:{domainId:true,isActive:true,roles:true}});
log.db.final=await cnt();
fs.writeFileSync(`${DIR}/steps2-${vp}.json`,JSON.stringify(log,null,1));
for(const s of log.steps)console.log(s.n,s.name,s.url,s.sec+'s','|',s.body.replace(/\n+/g,' / ').slice(0,300));
console.log(JSON.stringify(log.db,null,0));console.log('net',log.net);console.log('http',JSON.stringify(log.http));console.log('console',JSON.stringify(log.console).slice(0,300));
await b.close();await prisma.$disconnect();
