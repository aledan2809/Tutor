import { createRequire } from 'module';
import fs from 'fs';
const req = createRequire('/Users/danciulescu/Projects/Tester-Gateway/package.json');
export const { chromium, devices } = req('playwright');
export const BASE='http://localhost:3113';
export const DIR='/Users/danciulescu/Projects/Tutor/Reports/true-e2e-2026-10-05/flow-F01';
export const MAIL='/Users/danciulescu/Projects/Tutor/Reports/true-e2e-2026-10-05/mailbox';
export function mk(tag, page){
  const log={tag,steps:[],console:[],http:[]}; let n=0; let t0=Date.now(); let taps=0;
  page.on('console',m=>{if(m.type()==='error')log.console.push({url:page.url(),text:m.text().slice(0,300)})});
  page.on('response',r=>{if(r.status()>=400)log.http.push({url:r.url().replace(BASE,''),status:r.status()})});
  return {log, tap(){taps++}, get taps(){return taps}, t0:()=>t0,
   async snap(name, extra={}){ n++; const f=`${tag}-${String(n).padStart(2,'0')}-${name}.png`;
     await page.screenshot({path:`${DIR}/${f}`,fullPage:false});
     const prim=await page.evaluate(()=>[...document.querySelectorAll('button,a[href],[role=button]')].filter(e=>e.offsetParent&&!e.closest('nav')).slice(0,14).map(e=>{const r=e.getBoundingClientRect();return {t:(e.innerText||e.getAttribute('aria-label')||'').trim().slice(0,50),belowFold:r.top>innerHeight}}));
     log.steps.push({n,name,file:f,url:page.url().replace(BASE,''),title:await page.title(),sec:((Date.now()-t0)/1000).toFixed(1),taps,prim,...extra}); }};
}
export function latestMail(to, ms=60000){ return (async()=>{const end=Date.now()+ms; while(Date.now()<end){ for(const f of fs.readdirSync(MAIL)){ try{const j=JSON.parse(fs.readFileSync(`${MAIL}/${f}`,'utf8')); if(JSON.stringify(j.to).toLowerCase().includes(to.toLowerCase())) return j;}catch{} } await new Promise(r=>setTimeout(r,1500)); } return null;})(); }
