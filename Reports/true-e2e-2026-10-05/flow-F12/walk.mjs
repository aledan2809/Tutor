import { createRequire } from 'module';
import fs from 'fs'; import { execSync } from 'child_process';
const { chromium, devices } = createRequire('/Users/danciulescu/Projects/Tester-Gateway/package.json')('playwright');
const DIR = '/Users/danciulescu/Projects/Tutor/Reports/true-e2e-2026-10-05/flow-F12';
const BASE = 'https://etutor.ro';
const py = k => execSync(`python3 -c "import shlex;[print(shlex.split(l.split('=',1)[1])[0]) for l in open('/Users/danciulescu/Projects/Master/credentials/tutor-test-users.env') if l.startswith('${k}=')]"`).toString().trim();
const EMAIL = py('INSTRUCTOR_EMAIL'), PASS = py('INSTRUCTOR_PASSWORD');
const out = {};
for (const [vn, ctxOpts] of [['mobile', { ...devices['iPhone 13'], viewport:{width:390,height:844}, locale:'ro-RO' }], ['desktop', { viewport:{width:1440,height:900}, locale:'ro-RO' }]]) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext(ctxOpts); const p = await ctx.newPage();
  const log = []; let n = 0; let errs = [], bad = [];
  p.on('console', m => m.type()==='error' && errs.push(m.text().slice(0,150)));
  p.on('response', r => r.status()>=400 && bad.push(r.status()+' '+r.url().replace(BASE,'').slice(0,100)));
  const t0 = Date.now();
  async function snap(name, extra={}) {
    n++; const f = `${vn}-${String(n).padStart(2,'0')}-${name}.png`;
    await p.screenshot({ path: `${DIR}/${f}` });
    const info = await p.evaluate(() => {
      const vh = innerHeight;
      const els = [...document.querySelectorAll('a,button')].filter(e=>e.offsetParent).map(e=>({t:(e.innerText||e.getAttribute('aria-label')||'').trim().slice(0,50), y:Math.round(e.getBoundingClientRect().top), h:e.getAttribute('href')}));
      return { title: document.title, h1: [...document.querySelectorAll('h1,h2')].map(h=>h.innerText.trim().slice(0,60)).slice(0,6), body: document.body.innerText.slice(0,900), ctas: els.filter(e=>e.t).slice(0,40), overflowX: document.documentElement.scrollWidth>innerWidth+2, vh };
    });
    log.push({ step:n, name, shot:f, url:p.url().replace(BASE,''), sec:((Date.now()-t0)/1000).toFixed(1), ...info, errs:[...errs], bad:[...bad], ...extra }); errs=[]; bad=[];
  }
  async function go(path, name) { const s=Date.now(); await p.goto(BASE+path,{waitUntil:'networkidle',timeout:45000}).catch(e=>log.push({goErr:String(e).slice(0,100)})); await p.waitForTimeout(800); await snap(name,{loadMs:Date.now()-s}); }
  await p.goto(BASE+'/ro/auth/signin',{waitUntil:'networkidle'});
  await p.locator('button',{hasText:/^Accept$/}).first().click({timeout:3000}).catch(()=>{});
  await snap('signin');
  await p.fill('#email',EMAIL); await p.fill('#password',PASS);
  await p.locator('form button[type="submit"]').first().click();
  await p.waitForURL(u=>!u.pathname.includes('/auth/signin'),{timeout:20000}).catch(()=>{}); await p.waitForLoadState('networkidle').catch(()=>{}); await p.waitForTimeout(1000);
  await snap('after-login');
  await go('/ro/dashboard/instructor','panou');
  await go('/ro/dashboard/instructor/groups','grupe');
  const gl = await p.evaluate(()=>[...document.querySelectorAll('a[href*="/groups/"]')].map(a=>a.getAttribute('href')).filter(h=>!h.endsWith('/new')));
  await go('/ro/dashboard/instructor/groups/new','grupa-noua');
  if (gl[0]) await go(gl[0].replace(/^\/?/,'/'),'grupa-detaliu'); else log.push({note:'no group links'});
  await go('/ro/dashboard/instructor/students','elevi');
  const sl = await p.evaluate(()=>[...document.querySelectorAll('a[href*="/students/"]')].map(a=>a.getAttribute('href')));
  if (sl[0]) await go(sl[0],'elev-detaliu'); else log.push({note:'no student links'});
  await go('/ro/dashboard/instructor/reports','rapoarte');
  const gen = p.locator('button',{hasText:/previzual|genereaz|generate|preview/i}).first();
  if (await gen.count()) { await gen.click().catch(()=>{}); await p.waitForTimeout(3000); await snap('rapoarte-preview'); }
  await go('/ro/certificat/id-inexistent-qa','certificat');
  out[vn] = { groupLinks: gl.slice(0,5), studentLinks: sl.slice(0,5), log };
  await browser.close();
}
fs.writeFileSync(DIR+'/steps.json', JSON.stringify(out,null,1));
for (const v of Object.keys(out)) for (const s of out[v].log) console.log(v, s.step, s.name, s.url, s.sec+'s', s.loadMs, 'ovX', s.overflowX, '|', (s.h1||[]).join(' / '), '| bad', (s.bad||[]).join(';'));
