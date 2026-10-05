import {chromium,devices,BASE,mk,DIR} from './lib.mjs';
import fs from 'fs';
const tag=process.argv[2]; const vp=tag.startsWith('mobile')?'mobile':'desktop';
const b=await chromium.launch();
const ctx=await b.newContext({...(vp==='mobile'?{viewport:{width:375,height:812},deviceScaleFactor:2,isMobile:true,hasTouch:true,userAgent:devices['iPhone 13'].userAgent}:{viewport:{width:1440,height:900}}),storageState:`${DIR}/${tag}-auth.json`});
const p=await ctx.newPage(); const m=mk(tag+'-d',p);
await p.goto(BASE+'/ro/dashboard/practice?start=quick&domain=matematica-v-viii'); await p.waitForTimeout(2500);
const info=await p.evaluate(()=>({sel:[...document.querySelectorAll('select')].map(s=>[s.options.length,[...s.options].slice(0,12).map(o=>o.text)]),btns:[...document.querySelectorAll('button')].filter(e=>e.offsetParent).map(e=>e.innerText.trim().slice(0,40)),cbs:document.querySelectorAll('input[type=checkbox]').length}));
console.log(JSON.stringify(info));
await m.snap('practice-landing');
const t0=Date.now();
await p.locator('select').first().selectOption({label:'Clasa a VIII-a'}); m.tap(); await p.waitForTimeout(2500); await m.snap('class-chosen');
console.log(await p.evaluate(()=>document.body.innerText.split('Materia parcursă')[1]?.slice(0,1500)));
console.log('cbs',await p.locator('input[type=checkbox]').count());
for (const t of ['Salvează și continuă','Salvează']) { const bt=p.getByRole('button',{name:t}).first(); if(await bt.isVisible().catch(()=>false)){ const bb=await bt.boundingBox(); console.log('save btn y',bb.y,'vh',await p.evaluate(()=>innerHeight)); break;} }


const sv=p.getByRole('button',{name:/Salvează/}).first();
await sv.scrollIntoViewIfNeeded(); await m.snap('save-button-area');
await sv.click(); m.tap(); await p.waitForTimeout(3500); await m.snap('after-save');
console.log('URL',p.url(),'sec',(Date.now()-t0)/1000);
console.log((await p.evaluate(()=>document.body.innerText)).replace(/\n+/g,' | ').slice(560,1500));
fs.writeFileSync(`${DIR}/${m.log.tag}-steps.json`,JSON.stringify(m.log,null,1));
await ctx.storageState({path:`${DIR}/${tag}-auth.json`});
await b.close();
