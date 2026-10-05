import { writeFileSync } from "node:fs";
import { client, env, brief, sleep, BASE } from "./lib.mjs";
const AVI="cmnoldd7100007slwe2ukyvc4";
const R=[]; const rec=(id,v,ev)=>{R.push({id,v,ev});console.log(id,v,"|",ev.join(" ; ").slice(0,600));};
const e=(l,r)=>`${l}→${brief(r,70)} ${r.ms}ms`;
const mk=async(em,pw)=>{const c=client(em);const l=await c.login(env[em],env[pw]);c.user=l.user;return c;};
const ST=await mk("TUTOR_TEST_STUDENT_EMAIL","TUTOR_TEST_STUDENT_PASSWORD");
const W=await mk("TUTOR_TEST_WATCHER_EMAIL","TUTOR_TEST_WATCHER_PASSWORD");
const IN=await mk("TUTOR_TEST_INSTRUCTOR_EMAIL","TUTOR_TEST_INSTRUCTOR_PASSWORD");
const AD=await mk("TUTOR_TEST_ADMIN_EMAIL","TUTOR_TEST_ADMIN_PASSWORD");
const SA=await mk("SUPERADMIN_EMAIL","SUPERADMIN_PASSWORD");
const J=await mk("JOURNEY_EMAIL","JOURNEY_PASSWORD");
console.log("logins",[ST,W,IN,AD,SA,J].map(c=>c.user?.role||"NONE").join(","));
const SID=ST.user?.id;
const pick=q=>{const o=q.options;if(Array.isArray(o)&&o.length){const x=o[0];return typeof x==="string"?x:(x?.text??x?.label??x?.id??"a");}return "a";};
const open=[];
// E1
{const ev=[];const s=await ST.post("/api/aviation/session/start",{type:"quick"});ev.push(e("start",s));let v="FAIL";
 const sid=s.json?.sessionId;const qs=s.json?.questions||[];
 if(sid){open.push(sid);let n=0;for(const q of qs.slice(0,3)){const a=await ST.post("/api/aviation/session/answer",{sessionId:sid,questionId:q.id,answer:pick(q),responseTime:4000});ev.push(e("answer",a));if(a.status===200)n++;}
 const c=await ST.post("/api/aviation/session/complete",{sessionId:sid});ev.push(e("complete",c));if(n===3&&c.status===200)v="PASS";}
 rec("E1",v,ev);}
const t=async(id,fn)=>{try{await fn()}catch(x){rec(id,"FAIL",[String(x).slice(0,150)])}};
await t("E2",async()=>{const f=await ST.get("/api/aviation/exam/formats");const ev=[e("formats",f)];const fm=f.json?.formats?.[0]||(Array.isArray(f.json)?f.json[0]:null);let v="PARTIAL";
 if(fm){const x=await ST.post("/api/aviation/exam/start",{formatId:fm.id,mode:"PRACTICE"});ev.push(e("exam/start",x));if(x.status===403)v="PASS";else if(x.status===200||x.status===201){v="PASS";const id=x.json?.sessionId;if(id)ev.push(e("submit",await ST.post("/api/aviation/exam/submit",{sessionId:id,answers:[]})));}}
 rec("E2",v,ev);});
await t("E3",async()=>{const g=await ST.get(`/api/student/assessment?domainId=${AVI}`);rec("E3",g.status===200&&g.json?"PASS":"FAIL",[e("assessment GET",g)]);});
const G=async(id,c,paths,okc=[200])=>{const ev=[];let bad=0;for(const p of paths){const r=await c.get(p);ev.push(`${p.slice(0,55)}→${r.status}`);if(!okc.includes(r.status))bad++;}rec(id,bad?"FAIL":"PASS",ev);};
await t("E4",()=>G("E4",ST,["/api/aviation/bibliography","/api/student/bibliography"],[200,404]));
await t("E5",()=>G("E5",ST,["/api/aviation/xp","/api/aviation/progress","/api/aviation/streak","/api/aviation/achievements","/api/student/dashboard?domainId="+AVI]));
await t("E6",()=>G("E6",ST,["/api/notifications","/api/notifications/preferences"]));
await t("E7",()=>G("E7",IN,["/api/dashboard/instructor/groups?domainId="+AVI]));
await t("E8",()=>G("E8",IN,["/api/dashboard/instructor/students?domainId="+AVI+"&limit=20","/api/dashboard/instructor/students/"+SID+"?domainId="+AVI]));
await t("E9",()=>G("E9",AD,["/api/admin/questions?domainId="+AVI+"&limit=5"]));
await t("E10",async()=>{await G("E10",IN,["/api/dashboard/instructor/reports?domainId="+AVI,"/api/dashboard/instructor/analytics?domainId="+AVI]);});
await t("E11",()=>G("E11",AD,["/api/admin/questions?limit=5"]));
await t("E12",()=>G("E12",AD,["/api/admin/domains","/api/student/domains"]));
await t("E13",()=>G("E13",AD,["/api/admin/lessons","/api/admin/bibliography"],[200,404]));
await t("E14",async()=>{const l=await W.get("/api/dashboard/watcher");const ids=(l.json?.students||[]).map(s=>s.id??s.userId);const ev=[e("watcher",l),"children="+ids.length];let v=l.status===200?"PASS":"FAIL";
 if(ids[0]){const c=await W.get("/api/dashboard/watcher/"+ids[0]);ev.push(e("child",c));if(c.status!==200)v="FAIL";}rec("E14",v,ev);});
await t("E15",()=>G("E15",SA,["/api/admin/users","/api/admin/vouchers","/api/admin/audit","/api/admin/revenue","/api/admin/feedback"],[200]));
await t("E16",async()=>{const ev=[];let v="PASS";for(let i=0;i<3;i++){const a=client("x");const l=await a.login(env.TUTOR_TEST_STUDENT_EMAIL,"wrong-"+Date.now());ev.push(`try${i+1} user=${l.user?"PRESENT":"null"} cb=${l.callbackStatus} loc=${(l.location||"").replace(BASE,"").slice(0,50)}`);if(l.user)v="FAIL";}
 const g=client("g");const r=await g.get("/api/student/dashboard");ev.push("anon dashboard→"+r.status);if(r.status!==401)v="FAIL";rec("E16",v,ev);});
await t("E17",async()=>{const g=client("g");const ev=[];let v="PASS";for(const p of ["/ro","/en"]){const r=await g.get(p,{redirect:"follow"});const lang=(r.text.match(/<html[^>]*lang="([^"]+)"/)||[])[1];const ti=(r.text.match(/<title>([^<]*)/)||[])[1];ev.push(`${p}→${r.status} lang=${lang} title=${(ti||"").slice(0,50)}`);if(r.status!==200||!lang?.startsWith(p.slice(1)))v="FAIL";}rec("E17",v,ev);});
// F1/F2
await sleep(30000);
await t("F1",async()=>{const [a,b]=await Promise.all([ST.post("/api/aviation/session/start",{type:"quick"}),J.post("/api/aviation/session/start",{type:"quick"})]);const ev=[e("STUDENT",a),e("JOURNEY",b)];
 if(a.json?.sessionId)open.push(a.json.sessionId);
 let v="PARTIAL";if(a.status===200&&b.status===200)v=a.json.sessionId!==b.json.sessionId?"PASS":"FAIL";else if(a.status===200&&[403,404].includes(b.status))ev.push("JOURNEY not enrolled in aviation (expected; enrolled only math)");
 rec("F1",v,ev);});
await t("F2",async()=>{const [s,w]=await Promise.all([ST.get("/api/aviation/progress"),W.get("/api/dashboard/watcher/"+SID+"?domainId="+AVI)]);
 const so=s.json?.overall;const ev=[e("student",s),e("watcher",w),"studentOverall="+JSON.stringify(so&&{a:so.totalAttempts,acc:so.accuracy})];
 const txt=JSON.stringify(w.json||{});const m=so&&txt.includes(`"totalAttempts":${so.totalAttempts}`);ev.push("watcherContainsSameAttempts="+m);
 rec("F2",s.status===200&&w.status===200?(m?"PASS":"PARTIAL"):"FAIL",ev);});
// stress
const st=async(name,path,n,c)=>{const g=c||client("g");const t0=Date.now();const rs=await Promise.all(Array.from({length:n},()=>g.get(path,{redirect:"manual"})));const l=rs.map(r=>r.ms).sort((a,b)=>a-b);const cnt={};rs.forEach(r=>cnt[r.status]=(cnt[r.status]||0)+1);
 const o={name,n,p50:l[Math.floor(n*.5)],p95:l[Math.min(n-1,Math.floor(n*.95))],max:l[n-1],wall:Date.now()-t0,codes:cnt};console.log("STRESS",JSON.stringify(o));return o;};
const S=[];
for(const p of ["/ro","/ro/parinte","/ro/preturi","/ro/auth/signin"])S.push(await st(p,p,30));
await sleep(65000);
S.push(await st("/api/aviation/progress (auth)","/api/aviation/progress",10,ST));
await sleep(60000);
for(const id of open){await ST.post("/api/aviation/session/complete",{sessionId:id});}
writeFileSync("rezultate.json",JSON.stringify({R,S,at:new Date().toISOString()},null,1));
console.log("SUM",R.map(r=>r.id+"="+r.v).join(" "));
