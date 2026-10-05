import {chromium,devices,BASE,mk,DIR} from './lib.mjs';
import fs from 'fs';
const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:375,height:812},deviceScaleFactor:2,isMobile:true,hasTouch:true,userAgent:devices['iPhone 13'].userAgent});
const p=await ctx.newPage(); const m=mk('mobile-consent',p);
await p.goto(BASE+'/ro/acord-parinte/74423b64a17bbdf77e6bdbea13241a054e69418a92bcaefb7f1a975020f225c9'); await p.waitForTimeout(2000); await m.snap('consent-page');
console.log((await p.evaluate(()=>document.body.innerText)).replace(/\n+/g,' | ').slice(0,900));
console.log(JSON.stringify(m.log.steps[0].prim.slice(0,8)));
fs.writeFileSync(`${DIR}/mobile-consent-steps.json`,JSON.stringify(m.log,null,1)); await b.close();
