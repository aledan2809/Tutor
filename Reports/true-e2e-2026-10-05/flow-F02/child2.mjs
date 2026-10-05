import {chromium,devices,BASE,mk} from './lib.mjs';
import fs from 'fs';
const VP=process.argv[2]||'mobile';
const opts= VP==='mobile'?{viewport:{width:375,height:812},deviceScaleFactor:2,isMobile:true,hasTouch:true,userAgent:devices['iPhone 13'].userAgent}:{viewport:{width:1440,height:900}};
const b=await chromium.launch(); const ctx=await b.newContext({...opts,storageState:`${VP}-child-state.json`}); const p=await ctx.newPage(); const m=mk(VP+'-c2',p);
const prev=JSON.parse(fs.readFileSync(`${VP}-child-out.json`)); const base=parseFloat(prev.steps.at(-1).sec); let taps=1; const t0=Date.now()-base*1000; const res=prev;
const dump=async(name)=>{ await p.waitForTimeout(900); await m.snap(name);
  const txt=(await p.innerText('main').catch(()=>p.innerText('body'))).replace(/\n+/g,' | ').slice(0,600);
  const btns=await p.evaluate(()=>[...document.querySelectorAll('main button,main a[href],main [role=button]')].filter(e=>e.offsetParent).map(e=>{const r=e.getBoundingClientRect();return (e.innerText||e.getAttribute('aria-label')||'').trim().replace(/\n/g,' ').slice(0,40)+(r.top>innerHeight?' [BELOW]':'')}).filter(Boolean).slice(0,14));
  res.steps.push({name,url:p.url().replace(BASE,''),sec:((Date.now()-t0)/1000).toFixed(1),taps,txt,btns}); console.log('\n#',name,p.url().replace(BASE,''),((Date.now()-t0)/1000).toFixed(1)+'s taps',taps,'\n  ',txt,'\n  ',btns.join(' ; ')); };
await p.goto(BASE+'/ro/dashboard'); await p.waitForLoadState('networkidle');
await p.getByText('Matematica cl. VIII').first().click(); taps++; await p.waitForLoadState('networkidle'); await dump('after-subject');
for(let i=0;i<5;i++){
  const cands=[/Începe testul/i,/Începe/i,/Continuă/i,/Pornește/i,/Alege/i,/Start/i];
  let clicked=false;
  for(const c of cands){ const l=p.locator('main button, main a[href]').filter({hasText:c}).first(); if(await l.count() && await l.isVisible()){ console.log('click',c); await l.click(); taps++; clicked=true; break; } }
  if(!clicked){ console.log('no candidate'); break; }
  await p.waitForLoadState('networkidle'); await dump('step'+(i+1));
  if(/practice\//.test(p.url())) break;
}
fs.writeFileSync(`${VP}-child-out.json`,JSON.stringify(res,null,1)); fs.writeFileSync(`${VP}-child-log2.json`,JSON.stringify(m.log,null,1));
await b.close();
