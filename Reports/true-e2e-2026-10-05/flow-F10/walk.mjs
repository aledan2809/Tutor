import {createRequire} from 'module';import fs from 'fs';import {execSync} from 'child_process';
const {chromium}=createRequire('/Users/danciulescu/Projects/Tester-Gateway/package.json')('playwright');
const env=JSON.parse(execSync(`python3 -c "
import shlex,json
d={}
for l in open('/Users/danciulescu/Projects/Master/credentials/tutor-test-users.env'):
    l=l.strip()
    if not l or l.startswith('#') or '=' not in l: continue
    k,v=l.split('=',1); p=shlex.split(v); d[k]=p[0] if p else ''
print(json.dumps(d))"`).toString());
const E=env.WATCHER_EMAIL||env.TUTOR_TEST_WATCHER_EMAIL,P=env.WATCHER_PASSWORD||env.TUTOR_TEST_WATCHER_PASSWORD;
const B='https://etutor.ro';const log=[];
for(const [vn,vp] of [['mobile',{viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148'}],['desktop',{viewport:{width:1440,height:900}}]]){
 const br=await chromium.launch();const ctx=await br.newContext(vp);const pg=await ctx.newPage();
 let errs=[],bad=[];pg.on('console',m=>m.type()==='error'&&errs.push(m.text().slice(0,150)));pg.on('response',r=>r.status()>=400&&bad.push(r.status()+' '+r.url().slice(0,100)));
 let n=0;const snap=async(name,extra={})=>{n++;const f=`${vn}-${String(n).padStart(2,'0')}-${name}.png`;await pg.screenshot({path:f,fullPage:true});
  const info=await pg.evaluate(()=>({url:location.href,title:document.title,btns:[...document.querySelectorAll('a,button')].filter(e=>e.offsetParent).map(e=>(e.innerText||'').trim().replace(/\s+/g,' ')).filter(t=>t&&t.length<60).slice(0,60),
   body:document.body.innerText.slice(0,6000),vh:innerHeight}));
  log.push({vn,step:name,shot:f,errs:[...errs],bad:[...bad],...info,...extra});errs=[];bad=[];};
 const go=async(u)=>{const t=Date.now();await pg.goto(B+u,{waitUntil:'networkidle',timeout:45000}).catch(()=>{});return Date.now()-t;};
 let t=await go('/ro/preturi');await snap('preturi',{ms:t});
 // positions of CTA
 const cta=await pg.$$eval('a',as=>as.filter(a=>/Alege/.test(a.innerText)).map(a=>({t:a.innerText.trim(),h:a.getAttribute('href'),y:Math.round(a.getBoundingClientRect().top+scrollY)})));log.push({vn,ctaPositions:cta});
 await pg.click('a:has-text("Alege Family"):not(:has-text("Trio"))');await pg.waitForLoadState('networkidle').catch(()=>{});await snap('click-family-anon');
 await go('/ro/auth/login');await pg.click('button:has-text("Respinge")').catch(()=>{});await snap('login');
 await pg.fill('input[type=text],input[type=email]',E);await pg.fill('input[type=password]',P);await pg.click('button:has-text("Autentificare")');await pg.waitForURL(/dashboard/,{timeout:30000}).catch(()=>{});await pg.waitForLoadState('networkidle').catch(()=>{});await snap('after-login');
 t=await go('/ro/preturi');await snap('preturi-auth',{ms:t});
 const fam=pg.locator('a:has-text("Alege Family")').first();const href=await fam.getAttribute('href');
 await fam.click();await pg.waitForLoadState('networkidle').catch(()=>{});await snap('click-family-auth',{famHref:href});
 t=await go('/ro/dashboard/packages');await snap('packages',{ms:t});
 t=await go('/ro/dashboard/packages?plan=FAMILY');await snap('packages-plan',{ms:t});
 t=await go('/ro/anual');await snap('anual',{ms:t});
 t=await go('/ro/dashboard/packages/anual');await snap('packages-anual',{ms:t});
 await br.close();}
fs.writeFileSync('steps.json',JSON.stringify(log,null,1));
