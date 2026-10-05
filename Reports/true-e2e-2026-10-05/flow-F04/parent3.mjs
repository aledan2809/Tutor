import {chromium,BASE} from './lib.mjs';
const b=await chromium.launch(); const ctx=await b.newContext({storageState:'parent-state.json',viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
const page=await ctx.newPage(); const t0=Date.now(); page.on('response',r=>{if(r.status()>=300)console.log(r.status(),r.url().replace(BASE,''))});
await page.goto(BASE+'/ro/dashboard/watcher'); await page.waitForTimeout(5000); console.log(page.url(), ((Date.now()-t0)/1000));
const r=page.getByRole('button',{name:'Respinge'}); if(await r.count()) await r.click();
console.log((await page.innerText('body')).replace(/\n+/g,' | ').slice(200,1600)); await page.screenshot({path:'PW-watcher.png'});
await b.close();
