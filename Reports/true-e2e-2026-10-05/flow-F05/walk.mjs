import {prisma,chromium,devices,BASE,DIR,ADMIN,PW} from './lib.mjs';
import fs from 'fs';
const dom=await prisma.domain.findFirst({where:{name:'Matematica cl. VIII'},select:{id:true,joinCode:true}});
const CODE=dom.joinCode; console.log('code',CODE);
const all=[];
for (const vp of ['mobile','desktop']) {
  const b=await chromium.launch();
  const ctxOpts = vp==='mobile' ? {...devices['iPhone 13'],viewport:{width:390,height:844},deviceScaleFactor:2,locale:'ro-RO'} : {viewport:{width:1440,height:900},locale:'ro-RO'};
  const ctx=await b.newContext(ctxOpts); const page=await ctx.newPage();
  const log={vp,steps:[],console:[],http:[]}; let n=0,taps=0,t0=Date.now();
  page.on('console',m=>{if(m.type()==='error')log.console.push({url:page.url().replace(BASE,''),text:m.text().slice(0,200)})});
  page.on('response',r=>{if(r.status()>=400)log.http.push({url:r.url().replace(BASE,''),status:r.status()})});
  const snap=async(name,extra={})=>{n++;const f=`${vp}-${String(n).padStart(2,'0')}-${name}.png`;await page.screenshot({path:`${DIR}/${f}`});
    const prim=await page.evaluate(()=>[...document.querySelectorAll('button,a[href],[role=button],input')].filter(e=>e.offsetParent).slice(0,16).map(e=>{const r=e.getBoundingClientRect();return {t:(e.innerText||e.placeholder||e.getAttribute('aria-label')||'').trim().slice(0,50),belowFold:r.top>innerHeight}}));
    const body=(await page.innerText('body')).slice(0,500);
    log.steps.push({n,name,file:f,url:page.url().replace(BASE,''),sec:((Date.now()-t0)/1000).toFixed(1),taps,prim,body,...extra});};
  const phone='07'+String(Date.now()).slice(-8); const tag=`qa-e2e-1005-${vp}`;
  // wrong code
  let t=Date.now(); await page.goto(`${BASE}/ro/acces/XXXXXXXX`,{waitUntil:'networkidle'}); await snap('wrong-code-landing',{loadMs:Date.now()-t});
  await page.fill('#g-nume',tag); await page.fill('#g-prenume','Test'); await page.fill('#g-tel',phone.replace(/^07/,'06')); taps+=1;
  await page.click('text=Intră la curs'); await page.waitForTimeout(2500); await snap('wrong-code-after-submit');
  // good code
  t0=Date.now(); taps=0; await ctx.clearCookies();
  t=Date.now(); await page.goto(`${BASE}/ro/acces/${CODE}`,{waitUntil:'networkidle'}); await snap('good-landing',{loadMs:Date.now()-t});
  await page.fill('#g-nume',tag); await page.fill('#g-prenume','Test'); await page.fill('#g-tel',phone); taps+=1;
  await snap('good-filled');
  await page.click('text=Intră la curs'); taps++;
  await page.waitForURL(/dashboard/,{timeout:20000}).catch(()=>{}); await page.waitForLoadState('networkidle').catch(()=>{}); await snap('after-enter',{firstValueSec:((Date.now()-t0)/1000).toFixed(1)});
  await page.waitForTimeout(1500); await snap('after-enter-settled');
  const u=await prisma.user.findMany({where:{name:{contains:tag}},select:{id:true,name:true,isGuest:true}});
  const d2=await prisma.domain.findUnique({where:{id:dom.id},select:{joinCodeUses:true}});
  const enr=u[0]? await prisma.enrollment.findMany({where:{userId:u[0].id},select:{domainId:true,status:true}}).catch(e=>String(e).slice(0,100)):null;
  log.db={users:u,uses:d2.joinCodeUses,enr};
  // second entry same phone
  await ctx.clearCookies(); await page.goto(`${BASE}/ro/acces/${CODE}`,{waitUntil:'networkidle'});
  await page.fill('#g-nume',tag); await page.fill('#g-prenume','Test'); await page.fill('#g-tel',phone);
  await page.click('text=Intră la curs'); await page.waitForURL(/dashboard/,{timeout:20000}).catch(()=>{}); await page.waitForTimeout(1500); await snap('second-entry');
  log.db.afterSecond={users:await prisma.user.count({where:{name:{contains:tag}}}),recips:await prisma.recipient.findMany({where:{phone:{contains:phone.slice(-8)}},select:{userId:true,phone:true}}),uses:(await prisma.domain.findUnique({where:{id:dom.id},select:{joinCodeUses:true}})).joinCodeUses};
  // authenticated other account
  await ctx.clearCookies();
  const csrf=await (await ctx.request.get(BASE+'/api/auth/csrf')).json();
  const reg=await ctx.request.post(BASE+'/api/auth/register',{data:{name:`${tag} logged`,email:`${tag}-logged@example.test`,password:PW,role:'STUDENT',birthDate:'1990-01-01'}});
  await prisma.user.updateMany({where:{email:`${tag}-logged@example.test`},data:{emailVerified:new Date()}});
  await ctx.request.post(BASE+'/api/auth/callback/credentials',{form:{csrfToken:csrf.csrfToken,email:`${tag}-logged@example.test`,password:PW,json:'true'}});
  t0=Date.now(); await page.goto(`${BASE}/ro/acces/${CODE}`); await page.waitForURL(/dashboard/,{timeout:20000}).catch(()=>{}); await page.waitForLoadState('networkidle').catch(()=>{}); await snap('logged-in-auto',{sec2:((Date.now()-t0)/1000).toFixed(1)});
  all.push(log); await b.close();
}
fs.writeFileSync(`${DIR}/steps.json`,JSON.stringify(all,null,1));
for(const l of all){console.log('==',l.vp);for(const s of l.steps)console.log(s.n,s.name,s.url,s.sec+'s','|',s.body.replace(/\n+/g,' / ').slice(0,260));console.log(JSON.stringify(l.db));console.log('http',JSON.stringify(l.http));console.log('console',JSON.stringify(l.console).slice(0,400));}
await prisma.$disconnect();
