import {chromium,devices,BASE,mk} from './lib.mjs';
import fs from 'fs';
const VP=process.argv[2]||'mobile';
const opts= VP==='mobile'?{viewport:{width:375,height:812},deviceScaleFactor:2,isMobile:true,hasTouch:true,userAgent:devices['iPhone 13'].userAgent}:{viewport:{width:1440,height:900}};
const b=await chromium.launch(); const ctx=await b.newContext({...opts,storageState:`${VP}-child-state.json`}); const p=await ctx.newPage(); const m=mk(VP+'-c4',p);
const res=JSON.parse(fs.readFileSync(`${VP}-child-out.json`)); let taps=4; const t0=Date.now()-12.9*1000;
const dump=async(name)=>{ await p.waitForTimeout(1200); await m.snap(name);
  const txt=(await p.innerText('body')).replace(/\n+/g,' | ').slice(0,700);
  res.steps.push({name,url:p.url().replace(BASE,''),sec:((Date.now()-t0)/1000).toFixed(1),taps,txt}); console.log('\n#',name,p.url().replace(BASE,''),((Date.now()-t0)/1000).toFixed(1)+'s taps',taps,'\n  ',txt); };
p.on('dialog',d=>{console.log('DIALOG',d.message());d.accept()});
await p.goto(BASE+'/ro/dashboard/practice?start=quick&domain=matematica-v-viii'); await p.waitForLoadState('networkidle');
await p.locator('select').first().selectOption({label:'Clasa a VIII-a'}); await p.waitForTimeout(1000);
const start=p.getByRole('button',{name:'Începe sesiunea'}).first();
await start.evaluate(e=>e.scrollIntoView({block:'center'})); await p.waitForTimeout(300); await m.snap('start-btn-visible');
await start.click(); taps++; await dump('after-start-no-ticks');
if(!/practice\/[a-z0-9]+/.test(p.url())){
  // tick first 3 checkboxes
  const cbs=p.locator('input[type=checkbox]'); 
  for(let i=0;i<3;i++){ await cbs.nth(i).scrollIntoViewIfNeeded(); await cbs.nth(i).check({force:true}).catch(()=>{}); taps++; }
  await start.evaluate(e=>e.scrollIntoView({block:'center'})); await start.click(); taps++; await dump('after-start-ticks');
}
fs.writeFileSync(`${VP}-child-out.json`,JSON.stringify(res,null,1)); fs.writeFileSync(`${VP}-child-log4.json`,JSON.stringify(m.log,null,1));
await b.close();
