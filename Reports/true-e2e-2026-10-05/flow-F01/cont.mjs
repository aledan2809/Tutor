import {chromium,devices,BASE,mk,DIR} from './lib.mjs';
import fs from 'fs';
const tag=process.argv[2]; const vp=tag.startsWith('mobile')?'mobile':'desktop';
const b=await chromium.launch();
const ctx=await b.newContext({...(vp==='mobile'?{viewport:{width:375,height:812},deviceScaleFactor:2,isMobile:true,hasTouch:true,userAgent:devices['iPhone 13'].userAgent}:{viewport:{width:1440,height:900}}),storageState:`${DIR}/${tag}-auth.json`});
const p=await ctx.newPage(); const m=mk(tag+'-c',p);
const st=JSON.parse(fs.readFileSync(`${DIR}/${tag}-steps.json`)); const prev=st.steps.at(-1);
await p.goto(BASE+'/ro/dashboard'); await p.waitForTimeout(1500);
const t0=Date.now(); const stamp=async(n,x={})=>{await p.waitForTimeout(1200); await m.snap(n,{sinceWizard:((Date.now()-t0)/1000).toFixed(1),...x});};
const pick=p.getByText('Matematica cl. VIII').first(); if(await pick.isVisible().catch(()=>false)){ await pick.click(); m.tap(); } await stamp('after-pick-subject');

const btn=p.getByRole('button',{name:/Începe testul/}).or(p.getByText('Începe testul'));
const bb=await btn.first().boundingBox(); console.log('btn y',bb&&bb.y,'vh',await p.evaluate(()=>innerHeight));
await btn.first().click(); m.tap(); await stamp('after-start-test');
console.log(p.url()); console.log((await p.evaluate(()=>document.body.innerText)).slice(0,1500));
fs.writeFileSync(`${DIR}/${m.log.tag}-steps.json`,JSON.stringify(m.log,null,1));
await ctx.storageState({path:`${DIR}/${tag}-auth.json`});
await b.close();
