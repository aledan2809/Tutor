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
const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,locale:'ro-RO'}); const page=await ctx.newPage();
await page.goto('https://etutor.ro/ro/auth/signin',{waitUntil:'networkidle'});
await page.fill('#email',c.e);await page.fill('#password',c.p);
await Promise.all([page.waitForURL(u=>!u.pathname.includes('signin')),page.click('button[type=submit]')]);
await page.waitForTimeout(3000); await page.click('text=Respinge').catch(()=>{});
const pages={detail:'/ro/dashboard/watcher/cmmnztvrsrdfe175ec2ea247b9',family:'/ro/dashboard/family',abon:'/ro/dashboard/subscription',setari:'/ro/dashboard/watcher/setari'};
for(const [k,p] of Object.entries(pages)){
  const bad=[];page.on('response',r=>{if(r.status()>=400)bad.push(r.status()+r.url().slice(18,90))});
  const t=Date.now();await page.goto('https://etutor.ro'+p,{waitUntil:'networkidle'});await page.waitForTimeout(1500);
  await page.screenshot({path:`c-${k}.png`});
  const body=await page.evaluate(()=>document.body.innerText.replace(/\n+/g,' | '));
  console.log('###',k,page.url(),((Date.now()-t)/1000).toFixed(1)+'s',bad.slice(0,3));console.log(body.slice(330,1800));
  page.removeAllListeners('response'); await page.waitForTimeout(8000);
}
await b.close();
