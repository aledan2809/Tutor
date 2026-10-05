import {chromium,BASE,mk} from './lib.mjs';
const b=await chromium.launch(); const ctx=await b.newContext({storageState:'parent-state.json',viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
const page=await ctx.newPage();
for(const [n,u] of [['watcher','/ro/dashboard/watcher'],['family','/ro/dashboard/family']]){
await page.goto(BASE+u); await page.waitForTimeout(3500); const r=page.getByRole('button',{name:'Respinge'}); if(await r.count()) await r.click();
console.log(n,(await page.innerText('body')).replace(/\n+/g,' | ').slice(250,1500));
await page.screenshot({path:`PW-${n}-full.png`,fullPage:true}); }
await b.close();
