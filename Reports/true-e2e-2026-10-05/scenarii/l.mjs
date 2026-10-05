import {client,env,BASE} from "./lib.mjs";
for (const [a,b] of [["TUTOR_TEST_STUDENT_EMAIL","TUTOR_TEST_STUDENT_PASSWORD"],["TUTOR_TEST_WATCHER_EMAIL","TUTOR_TEST_WATCHER_PASSWORD"],["STUDENT_EMAIL","STUDENT_PASSWORD"],["WATCHER_EMAIL","WATCHER_PASSWORD"],["INSTRUCTOR_EMAIL","INSTRUCTOR_PASSWORD"]]){
 const c=client(a);const l=await c.login(env[a],env[b]);console.log(a,l.callbackStatus,(l.location||"").replace(BASE,"").slice(0,70),l.user?Object.keys(l.user).join(","):null, l.user?.role, env[a]?.slice(0,3));}
