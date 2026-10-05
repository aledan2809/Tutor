import { createRequire } from 'module'; import fs from 'fs'; import { execSync } from 'child_process';
const { chromium } = createRequire('/Users/danciulescu/Projects/Tester-Gateway/package.json')('playwright');
const c = JSON.parse(execSync(`python3 -c "
import shlex,json
d={}
for l in open('/Users/danciulescu/Projects/Master/credentials/tutor-test-users.env'):
    l=l.strip()
    if not l or l.startswith('#') or '=' not in l: continue
    k,v=l.split('=',1)
    try: v=shlex.split(v)[0]
    except Exception: pass
    d[k]=v
print(json.dumps({'e':d['WATCHER_EMAIL'],'p':d['WATCHER_PASSWORD']}))"`));
const BASE='https://etutor.ro'; const out={};
for (const [vn,vp] of [['mobile',{viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true}],['desktop',{viewport:{width:1440,height:900}}]]) {
  const b=await chromium.launch(); const ctx=await b.newContext({...vp,locale:'ro-RO'}); const page=await ctx.newPage(); const bad=[]; let n=0; const L=[];
  page.on('response',r=>{if(r.status()>=400)bad.push(r.status()+' '+r.url().slice(0,120))});
  const snap=async(name,full=false)=>{n++;const f=`b-${vn}-${String(n).padStart(2,'0')}-${name}.png`;await page.screenshot({path:f,fullPage:full});
    const d=await page.evaluate(()=>({url:location.href,body:document.body.innerText,btns:[...document.querySelectorAll('a,button')].filter(e=>e.offsetParent).map(e=>[(e.innerText||'').trim().slice(0,50),Math.round(e.getBoundingClientRect().top)]).filter(x=>x[0]),vh:innerHeight}));
    L.push({name,f,bad:[...bad],...d});bad.length=0;};
  await page.goto(`${BASE}/ro/auth/signin`,{waitUntil:'networkidle'});
  await page.fill('#email',c.e);await page.fill('#password',c.p);
  await Promise.all([page.waitForURL(u=>!u.pathname.includes('signin')),page.click('button[type=submit]')]);
  await page.waitForTimeout(3000);
  await page.click('text=Respinge').catch(()=>{});
  await page.goto(`${BASE}/ro/dashboard/watcher`,{waitUntil:'networkidle'}); await page.waitForTimeout(2500);
  const t=Date.now();
  await page.locator('text=Test Student').first().click(); await page.waitForTimeout(2500);
  const tChapter=(Date.now()-t)/1000;
  await snap('chapter'); await snap('chapter-full',true);
  const hrefs=await page.$$eval('a',as=>as.map(a=>a.getAttribute('href')).filter(h=>h&&h.includes('/watcher/')));
  // child detail
  const det=hrefs.find(h=>!/notifications|setari/.test(h));
  out[vn]={tChapter,hrefs:[...new Set(hrefs)]};
  if(det){await page.goto(BASE+det,{waitUntil:'networkidle'});await page.waitForTimeout(2000);await snap('detail');await snap('detail-full',true);}
  await page.goto(`${BASE}/ro/dashboard/watcher/notifications`,{waitUntil:'networkidle'});await page.waitForTimeout(1500);await snap('notifs');
  out[vn].L=L; await b.close(); await new Promise(r=>setTimeout(r,20000));
}
fs.writeFileSync('steps2.json',JSON.stringify(out,null,1));
for(const v in out){console.log('==',v,out[v].tChapter,out[v].hrefs);for(const s of out[v].L)console.log(s.name,s.url,s.bad)}
