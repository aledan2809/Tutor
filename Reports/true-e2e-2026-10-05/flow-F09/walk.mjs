import {createRequire} from 'module';
import fs from 'fs'; import {execSync} from 'child_process';
const req=createRequire('/Users/danciulescu/Projects/Tester-Gateway/package.json');
const {chromium,devices}=req('playwright');
const py=`import shlex
for l in open('/Users/danciulescu/Projects/Master/credentials/tutor-test-users.env'):
    l=l.strip()
    if l.startswith('WATCHER_EMAIL') or l.startswith('WATCHER_PASSWORD'):
        k,v=l.split('=',1);print(k+'\\t'+shlex.split(v)[0])`;
const cr=Object.fromEntries(execSync('python3 -',{input:py}).toString().trim().split('\n').map(l=>l.split('\t')));
const B='https://etutor.ro', out=process.cwd(), log=[];
const vps={mobile:{viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,userAgent:devices['iPhone 13'].userAgent},desktop:{viewport:{width:1440,height:900}}};
const br=await chromium.launch();
for(const [vn,opt] of Object.entries(vps)){
 const ctx=await br.newContext(opt); const p=await ctx.newPage(); const errs=[],bad=[];
 p.on('console',m=>m.type()==='error'&&errs.push(m.text().slice(0,150)));
 p.on('response',r=>r.status()>=400&&bad.push(r.status()+' '+r.url().slice(0,100)));
 const t0=Date.now(); let n=0;
 const snap=async(name,extra={})=>{n++;const f=`${vn}-${String(n).padStart(2,'0')}-${name}.png`;await p.screenshot({path:f,fullPage:true});
  const txt=(await p.innerText('body')).slice(0,3000);
  const btns=await p.$$eval('button,a',e=>e.map(x=>({t:x.innerText.trim().slice(0,50),y:Math.round(x.getBoundingClientRect().top)})).filter(x=>x.t).slice(0,40));
  log.push({vp:vn,step:name,url:p.url(),title:await p.title(),sec:(Date.now()-t0)/1000,btns,txt,errs:[...errs],bad:[...bad],...extra});};
 await p.goto(B+'/ro/auth/signin',{waitUntil:'networkidle'});
 await p.fill('#email',cr.WATCHER_EMAIL);
 await p.fill('#password',cr.WATCHER_PASSWORD);
 await p.click('form button[type=submit]'); await p.waitForTimeout(4000); await snap('after-login');
 for(const [nm,path] of [['setari','/ro/dashboard/watcher/setari'],['settings-notif','/ro/dashboard/settings/notifications'],['watcher-notif','/ro/dashboard/watcher/notifications']]){
  const s=Date.now(); await p.goto(B+path,{waitUntil:'networkidle'}).catch(()=>{}); await p.waitForTimeout(1500);
  const extra={loadSec:(Date.now()-s)/1000,hscroll:await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth)};
  if(nm==='setari'){
   extra.timeInput=await p.$$eval('input[type=time],select',e=>e.map(x=>({tag:x.tagName,type:x.type,val:x.value,y:Math.round(x.getBoundingClientRect().top),vis:x.offsetParent!==null})));
   extra.radios=await p.$$eval('input[type=radio]',e=>e.map(x=>x.parentElement.innerText.trim().slice(0,80)+' checked='+x.checked));}
  await snap(nm,extra);
  if(nm==='setari'){await p.reload({waitUntil:'networkidle'});await snap('setari-reload');}
 }
 await ctx.close();
}
await br.close(); fs.writeFileSync('steps.json',JSON.stringify(log,null,1));
