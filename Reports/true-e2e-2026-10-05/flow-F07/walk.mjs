import {createRequire} from 'module';
import fs from 'fs'; import {execSync} from 'child_process';
const {chromium}=createRequire('/Users/danciulescu/Projects/Tester-Gateway/package.json')('playwright');
const env=JSON.parse(execSync(`python3 -c "
import shlex,json
d={}
for l in open('/Users/danciulescu/Projects/Master/credentials/tutor-test-users.env'):
    l=l.strip()
    if '=' in l and not l.startswith('#'):
        k,v=l.split('=',1)
        s=shlex.split(v); d[k]=s[0] if s else ''
print(json.dumps(d))"`).toString());
const EMAIL=env.STUDENT_EMAIL, PASS=env.STUDENT_PASSWORD;
const BASE='https://etutor.ro';
const out=[];
async function run(name,ctxOpts){
  const dir=`./${name}`; fs.mkdirSync(dir,{recursive:true});
  const b=await chromium.launch(); const ctx=await b.newContext(ctxOpts); const p=await ctx.newPage();
  const log=[]; const errs=[]; const bad=[]; let dashReq=[]; let n=0; let clicks=0;
  p.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,200))});
  p.on('response',r=>{if(r.status()>=400)bad.push(r.status()+' '+r.url())});
  p.on('request',r=>{if(r.url().includes('/api/student/dashboard'))dashReq.push(Date.now())});
  const t0=Date.now();
  async function snap(label,extra={}){
    n++; const f=`${dir}/${String(n).padStart(2,'0')}-${label}.png`;
    await p.screenshot({path:f,fullPage:false});
    const vp=p.viewportSize();
    const info=await p.evaluate((vh)=>{
      const els=[...document.querySelectorAll('a,button')].filter(e=>e.offsetParent&&e.innerText.trim()).map(e=>{const r=e.getBoundingClientRect();return {t:e.innerText.trim().slice(0,50),y:Math.round(r.top),h:Math.round(r.height),w:Math.round(r.width),below:r.top>vh}});
      return {els:els.slice(0,40),text:document.body.innerText.slice(0,1500)};
    },vp.height);
    log.push({step:n,label,url:p.url(),title:await p.title(),sec:((Date.now()-t0)/1000).toFixed(1),clicks,shot:f,...info,...extra});
  }
  await p.goto(BASE+'/ro/auth/signin',{waitUntil:'networkidle'}); await snap('signin');
  await p.fill('input[type=email],input[name=email]',EMAIL); await p.fill('input[type=password]',PASS);
  const tl=Date.now(); clicks++;
  await Promise.all([p.waitForURL(/dashboard/,{timeout:30000}).catch(()=>{}),p.click('button[type=submit]')]);
  await p.waitForLoadState('networkidle').catch(()=>{});
  await p.waitForTimeout(1500);
  await snap('after-login',{loginToPanelMs:Date.now()-tl,dashboardRequests:dashReq.length});
  fs.writeFileSync(dir+'/pre.html',await p.content());
  // find continue
  const cont=p.locator('button:has-text("Continuă"),a:has-text("Continuă")').first();
  const has=await cont.count();
  log.push({note:'continue button count',has});
  if(has){
    const bb=await cont.boundingBox(); log.push({note:'continue bbox',bb,vh:p.viewportSize().height});
    clicks++; const tc=Date.now();
    await cont.click(); await p.waitForTimeout(5000); await p.waitForLoadState('networkidle').catch(()=>{});
    await snap('after-continue',{ms:Date.now()-tc});
    fs.writeFileSync(dir+'/after-continue.html',await p.content());
  }
  // back to dashboard
  await p.goto(BASE+'/ro/dashboard',{waitUntil:'networkidle'}); await p.waitForTimeout(1000); await snap('back-home');
  // toggle
  const full=p.locator('button:has-text("Panou complet")').first();
  if(await full.count()){clicks++;await full.click();await p.waitForTimeout(800);await snap('full-panel');
    await p.reload({waitUntil:'networkidle'});await p.waitForTimeout(800);await snap('full-persisted');
    const tod=p.locator('button:has-text("Astăzi")').first(); if(await tod.count()){clicks++;await tod.click();await p.waitForTimeout(800);await snap('today-again');}}
  // exam-bank
  await p.goto(BASE+'/ro/dashboard/exam-bank',{waitUntil:'networkidle'}).catch(()=>{}); await p.waitForTimeout(1500); await snap('exam-bank');
  await p.goto(BASE+'/ro/dashboard/settings/notifications',{waitUntil:'networkidle'}).catch(()=>{}); await p.waitForTimeout(1000); await snap('notif-settings');
  await p.goto(BASE+'/ro/dashboard',{waitUntil:'networkidle'}); await p.waitForTimeout(800);
  fs.writeFileSync(dir+'/steps.json',JSON.stringify({log,errs,bad,dashReq:dashReq.length},null,1));
  await b.close();
  return {name,dashReq:dashReq.length,errs,bad};
}
out.push(await run('mobile',{viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'}));
out.push(await run('desktop',{viewport:{width:1440,height:900}}));
console.log(JSON.stringify(out,null,1));
