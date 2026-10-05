import {chromium,devices,BASE,DIR} from './lib.mjs';
import fs from 'fs';
const st=JSON.parse(fs.readFileSync(`${DIR}/final-mobile-adult-steps.json`)); const email=st.email;
const b=await chromium.launch();
for(const [label,em] of [['lowercase',email.toLowerCase()],['exact-case',email],['lowercase-again',email.toLowerCase()]]){
 const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
 const p=await ctx.newPage(); const calls=[]; p.on('response',r=>{if(/auth|callback|signin/.test(r.url()))calls.push(r.status()+' '+r.url().replace(BASE,'').slice(0,80))});
 await p.goto(BASE+'/ro/auth/signin'); await p.waitForTimeout(800); await p.getByRole('button',{name:'Respinge'}).click().catch(()=>{});
 await p.locator('input[type=text],input[type=email]').first().fill(em); await p.getByPlaceholder('••••••••').fill('QaE2e!1005x');
 const t=Date.now(); await p.locator('button[type=submit]').click();
 await p.waitForURL(/dashboard/,{timeout:15000}).catch(()=>{});
 console.log(label,'->',p.url().replace(BASE,''),((Date.now()-t)/1000).toFixed(1)+'s',calls.slice(-4));
 await ctx.close(); await new Promise(r=>setTimeout(r,2000));
}
await b.close();
