import {chromium,BASE,mk} from './lib.mjs'; import fs from 'fs';
const b=await chromium.launch(); const ctx=await b.newContext({storageState:'child-state-M.json',viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
const page=await ctx.newPage(); const m=mk('G',page); let taps=0;
await page.goto(BASE+'/ro/dashboard'); await page.waitForTimeout(2500);
const r=page.getByRole('button',{name:'Respinge'}); if(await r.count()) await r.click();
const log=async(n)=>{await m.snap(n); console.log(n,page.url().replace(BASE,''),'taps',taps,'|',(await page.innerText('body')).replace(/\n+/g,' | ').slice(0,350));};
await page.getByText('Matematica cl. VIII').first().click(); taps++; await page.waitForTimeout(3000); await log('after-subject');
for(let i=0;i<6;i++){
  const cands=[/Începe/i,/Continu/i,/Start/i,/Mai departe/i,/Test scurt/i,/Trimite|Răspunde|Verific/i];
  let clicked=false;
  for(const c of cands){const bt=page.getByRole('button',{name:c}).or(page.getByRole('link',{name:c})).first(); if(await bt.count() && await bt.isVisible()){console.log('click',c); await bt.click(); taps++; clicked=true; await page.waitForTimeout(3000); await log('step'+i); break;}}
  if(!clicked){ console.log('no known CTA'); break; }
  if(/grila|întrebare/i.test(await page.innerText('body')) && /A\)|a\)|\bB\b/.test(await page.innerText('body'))) { console.log('QUESTION VISIBLE'); break;}
}
fs.writeFileSync('grid.json',JSON.stringify({taps,log:m.log},null,1)); await b.close();
