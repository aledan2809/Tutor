import {chromium,BASE,mk} from './lib.mjs'; import fs from 'fs';
const b=await chromium.launch(); const ctx=await b.newContext({storageState:'child-state-M.json',viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
const page=await ctx.newPage(); const m=mk('H3',page); let taps=0; const t0=Date.now();
await page.goto(BASE+'/ro/dashboard/practice?start=quick&domain=matematica-v-viii'); await page.waitForTimeout(3000);
const r=page.getByRole('button',{name:'Respinge'}); if(await r.count()) await r.click();
console.log('options',await page.locator('select option').allInnerTexts());
await page.locator('select').first().selectOption({index:1}); taps++; await page.waitForTimeout(2000); await m.snap('class-chosen');
console.log((await page.innerText('main')).replace(/\n+/g,' | ').slice(0,900));
const bts=await page.evaluate(()=>[...document.querySelectorAll('main button,main a')].filter(e=>e.offsetParent).map(e=>{const r=e.getBoundingClientRect();return [e.innerText.trim().slice(0,40),Math.round(r.top),e.disabled]}));
console.log(JSON.stringify(bts));
await page.getByText('Numere naturale').first().click(); taps++; await page.getByRole('button',{name:'Salvează și continuă'}).click(); taps++; await page.waitForTimeout(2500); await m.snap('saved');
console.log('after save:', (await page.innerText('main')).replace(/\n+/g,' | ').slice(0,300));
const st=page.getByRole('button',{name:'Începe sesiunea'}); console.log('start visible',await st.count()); 
if(await st.count()){ await st.first().scrollIntoViewIfNeeded(); await m.snap('start-btn'); await st.first().click(); taps++; await page.waitForTimeout(4000); await m.snap('question'); console.log('Q:',page.url(),(await page.innerText('main')).replace(/\n+/g,' | ').slice(0,400)); }
console.log('taps from dashboard',taps,'sec',(Date.now()-t0)/1000);
fs.writeFileSync('grid3.json',JSON.stringify(m.log)); await b.close();
