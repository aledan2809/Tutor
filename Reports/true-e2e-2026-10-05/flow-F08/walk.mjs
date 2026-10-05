import { createRequire } from 'module';
import fs from 'fs'; import { execSync } from 'child_process';
const { chromium } = createRequire('/Users/danciulescu/Projects/Tester-Gateway/package.json')('playwright');
const creds = JSON.parse(execSync(`python3 -c "
import shlex,json
d={}
for l in open('/Users/danciulescu/Projects/Master/credentials/tutor-test-users.env'):
    l=l.strip()
    if not l or l.startswith('#') or '=' not in l: continue
    k,v=l.split('=',1); 
    try: v=shlex.split(v)[0]
    except Exception: pass
    d[k]=v
print(json.dumps({'e':d.get('WATCHER_EMAIL'),'p':d.get('WATCHER_PASSWORD')}))"`).toString());
const BASE='https://etutor.ro'; const OUT=process.cwd();
const results={};
for (const [vn,vp] of [['mobile',{viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1'}],['desktop',{viewport:{width:1440,height:900}}]]) {
  const b=await chromium.launch(); const ctx=await b.newContext({...vp,locale:'ro-RO'}); const page=await ctx.newPage();
  const log=[]; let n=0; const errs=[]; const bad=[];
  page.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,200))});
  page.on('response',r=>{if(r.status()>=400)bad.push(r.status()+' '+r.url().slice(0,150))});
  const snap=async(name)=>{n++;const f=`${vn}-${String(n).padStart(2,'0')}-${name}.png`;await page.screenshot({path:`${OUT}/${f}`});
    const info=await page.evaluate(()=>{const vh=innerHeight;const els=[...document.querySelectorAll('a,button')].filter(e=>e.offsetParent);
      return {title:document.title,h1:[...document.querySelectorAll('h1,h2')].map(e=>e.innerText.trim()).slice(0,8),
       btns:els.map(e=>({t:(e.innerText||e.getAttribute('aria-label')||'').trim().slice(0,60),y:Math.round(e.getBoundingClientRect().top),href:e.getAttribute('href')})).filter(x=>x.t).slice(0,40),
       vh, body:document.body.innerText.slice(0,2500), hscroll:document.documentElement.scrollWidth>innerWidth}});
    log.push({step:n,name,url:page.url(),shot:f,errs:[...errs],bad:[...bad],...info});errs.length=0;bad.length=0;};
  const t0=Date.now();
  await page.goto(`${BASE}/ro/auth/signin`,{waitUntil:'networkidle'}); await snap('signin');
  await page.fill('#email',creds.e); await page.fill('#password',creds.p);
  const tl=Date.now();
  await Promise.all([page.waitForURL(u=>!u.pathname.includes('signin'),{timeout:30000}).catch(()=>{}),page.click('button[type=submit]')]);
  await page.waitForLoadState('networkidle').catch(()=>{}); await snap('after-login');
  await page.goto(`${BASE}/ro/dashboard/watcher`,{waitUntil:'networkidle'}); const tList=(Date.now()-tl)/1000; await snap('watcher-list');
  const m={loginToListSec:tList};
  // child links
  const kids=await page.$$eval('a[href*="/dashboard/watcher/"]',as=>as.map(a=>a.getAttribute('href')));
  m.kidLinks=[...new Set(kids)];
  // open first child chapter: click first card-ish element
  const first=await page.$('a[href*="/dashboard/watcher/"]:not([href*="notifications"]):not([href*="setari"])');
  if(first){await first.scrollIntoViewIfNeeded().catch(()=>{});await first.click().catch(()=>{});await page.waitForLoadState('networkidle').catch(()=>{});await snap('child-detail');
    await page.evaluate(()=>scrollTo(0,document.body.scrollHeight));await page.waitForTimeout(500);await snap('child-detail-bottom');}
  else { // maybe chapter is inline: try clicking first child name
    const card=await page.$('[class*=card], article, li');if(card){await card.click().catch(()=>{});await page.waitForTimeout(1500);await snap('card-click');}}
  for (const p of ['dashboard/watcher/notifications','dashboard/family','dashboard/watcher/setari']) {
    await page.goto(`${BASE}/ro/${p}`,{waitUntil:'networkidle'}).catch(()=>{}); await snap(p.split('/').pop());}
  m.totalSec=(Date.now()-t0)/1000; results[vn]={m,log};
  await b.close();
}
fs.writeFileSync('steps.json',JSON.stringify(results,null,1));
for (const v in results){console.log('==',v,JSON.stringify(results[v].m));for(const s of results[v].log)console.log(s.step,s.name,s.url,'bad:',s.bad.length,'errs:',s.errs.length,'h:',s.h1.join(' | ').slice(0,200));}
