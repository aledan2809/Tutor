import {createRequire} from 'module';
const {chromium,devices}=createRequire('/Users/danciulescu/Projects/Tester-Gateway/package.json')('playwright');
import {execSync} from 'child_process';
const py=`import shlex
for l in open('/Users/danciulescu/Projects/Master/credentials/tutor-test-users.env'):
    l=l.strip()
    if l.startswith('WATCHER_EMAIL') or l.startswith('WATCHER_PASSWORD'):
        k,v=l.split('=',1);print(k+'\\t'+shlex.split(v)[0])`;
const cr=Object.fromEntries(execSync('python3 -',{input:py}).toString().trim().split('\n').map(l=>l.split('\t')));
const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true});const p=await c.newPage();
await p.goto('https://etutor.ro/ro/auth/signin');await p.fill('#email',cr.WATCHER_EMAIL);await p.fill('#password',cr.WATCHER_PASSWORD);await p.click('form button[type=submit]');await p.waitForTimeout(4000);
await p.goto('https://etutor.ro/ro/dashboard/watcher/setari',{waitUntil:'networkidle'});
await p.getByText('Cât de des te anunțăm').scrollIntoViewIfNeeded();await p.screenshot({path:'mobile-06-cadenta-viewport.png'});
await p.getByText('Rezumat zilnic la ora').first().scrollIntoViewIfNeeded();await p.screenshot({path:'mobile-07-digest-viewport.png'});
console.log(await p.evaluate(()=>scrollY+' / '+document.body.scrollHeight));await b.close();
