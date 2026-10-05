import {createRequire} from 'module';
const {chromium}=createRequire('/Users/danciulescu/Projects/Tester-Gateway/package.json')('playwright');
const b=await chromium.launch();const p=await b.newPage();
const r=await p.goto('https://etutor.ro/ro/login',{waitUntil:'networkidle'});console.log(r.status(),p.url());
console.log(await p.$$eval('input,button',e=>e.map(x=>x.outerHTML.slice(0,120))));await b.close();
