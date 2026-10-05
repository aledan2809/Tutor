import {chromium,BASE,mk} from './lib.mjs';
const b=await chromium.launch(); const ctx=await b.newContext({storageState:'parent-state.json',viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
const page=await ctx.newPage(); const m=mk('PC',page);
for(const [n,u] of [['monitor','/ro/dashboard/watcher'],['family','/ro/dashboard/family'],['children','/ro/dashboard/children']]){
 await page.goto(BASE+u); await page.waitForTimeout(3000); const r=page.getByRole('button',{name:'Respinge'}); if(await r.count()) await r.click(); await m.snap(n);
 console.log(n,page.url().replace(BASE,''),(await page.innerText('main')).replace(/\n+/g,' | ').slice(0,450)); }
await b.close();
