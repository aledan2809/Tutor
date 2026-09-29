// Verificarea Legal Hub pentru acordul părintelui (GuardianConsent), pe baza locală legal_ga și serverul
// Legal de probă (:3120, cheile de test). Rulare: node Reports/acord-parinte-2026-09-29/verificare-legal-hub.mjs
import { createHmac, createHash, randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";

const BASE = process.env.LEGAL_BASE ?? "http://localhost:3120";
const KEY = "local-tutor-hmac-key-not-real-0123456789";
const PRO_KEY = "local-pro-hmac-key-not-real-012345678901";
const RUN = randomBytes(4).toString("hex");
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; console.log("  ✔", m); } else { fail++; console.log("  ✘", m); } };
const sql = (q) => execFileSync("docker", ["exec", "legal-postgres-dev", "psql", "-U", "legal_dev", "-d", "legal_ga", "-Atc", q], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
const sqlTry = (q) => { try { sql(q); return null; } catch (e) { return String(e.stderr || e.message); } };

function sign(userId, body, { key = KEY, app = "tutor", nonce } = {}) {
  const ts = String(Date.now());
  const n = nonce ?? randomBytes(12).toString("hex");
  const h = createHash("sha256").update(body).digest("hex");
  const sig = createHmac("sha256", key).update([app, ts, n, userId, h].join("\n")).digest("base64");
  return { "content-type": "application/json", "x-app-slug": app, "x-app-timestamp": ts, "x-app-nonce": n, "x-app-signature": sig, "x-user-id": userId };
}
async function post(obj, opts = {}) {
  const body = JSON.stringify(obj);
  const headers = opts.headers ?? sign(opts.userId ?? obj.subjectRef, body, opts);
  const r = await fetch(`${BASE}${opts.path ?? "/api/v1/guardian-consents"}`, { method: "POST", headers, body });
  let j = null; try { j = await r.json(); } catch {}
  return { status: r.status, body: j };
}

const doc = await (await fetch(`${BASE}/api/v1/public/legal/tutor/parental_consent?locale=ro`)).json();
const docEn = await (await fetch(`${BASE}/api/v1/public/legal/tutor/PARENTAL_CONSENT?locale=en`)).json();
console.log("Public document");
ok(doc?.version?.id && doc.document.type === "PARENTAL_CONSENT" && doc.document.locale === "ro", "RO text served with its version id");
ok(docEn?.version?.id && docEn.document.locale === "en" && docEn.version.id !== doc.version.id, "EN text served, its own version id");
ok(/în cel mult 30 de zile/.test(doc.version.contentMarkdown) && /următoarele 30 de zile/.test(doc.version.contentMarkdown), "RO text: paid accounts within 30 days, silence erased after 30 more days");
const V = doc.version.id;
const privacyV = sql(`select dv.id from "DocumentVersion" dv join "LegalDocument" ld on ld.id=dv."documentId" where ld.type<>'PARENTAL_CONSENT' and dv."publishedAt" is not null limit 1`);

const child = `cmchild${RUN}`, child2 = `cmchild2${RUN}`, child3 = `cmchild3${RUN}`, child4 = `cmchild4${RUN}`;
const email = `Mama.${RUN}@Example.ro`;
const answer = (subjectRef, event, requestId, extra = {}) => ({ event, appSlug: "tutor", subjectRef, requestId, guardianEmail: email, documentVersionId: V, ...extra });

console.log("Recording");
const g = await post(answer(child, "GIVEN", `tutor:answer:${RUN}aaaaaaaa`, { ipAddress: "10.9.8.7", userAgent: "UA-test" }));
ok(g.status === 201 && g.body?.id && g.body?.event === "GIVEN", `GIVEN → 201 (${g.status})`);
const again = await post(answer(child, "GIVEN", `tutor:answer:${RUN}aaaaaaaa`));
ok(again.status === 200 && again.body?.id === g.body?.id && again.body?.duplicate && again.body?.event === "GIVEN", `retry → 200 with the stored event (${again.status})`);
const reuse = await post(answer(child, "REFUSED", `tutor:answer:${RUN}aaaaaaaa`));
ok(reuse.status === 409 && reuse.body?.code === "request-used" && reuse.body?.storedEvent === "GIVEN", `another answer on the same link → 409 + the first answer (${reuse.status} ${reuse.body?.storedEvent})`);
const row = sql(`select "guardianRef"||'|'||coalesce("ipAddress",'')||'|'||coalesce("userAgent",'')||'|'||"documentHash"||'|'||"controllerEntityId" from "GuardianConsent" where id='${g.body.id}'`);
const expectRef = "email:" + createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
ok(row.startsWith(expectRef + "|10.9.8.7|UA-test|" + doc.version.contentHash), "row: hashed parent, IP, UA, document hash");
ok(sql(`select count(*) from "GuardianConsent" where "guardianRef" ilike '%mama%' or "subjectRef" ilike '%@%'`) === "0", "no raw email stored anywhere");

console.log("Refusals");
ok((await post(answer(child, "GIVEN", `tutor:answer:${RUN}bbbbbbbb`), { key: "wrong-key-wrong-key-wrong-key-wrong-key" })).status === 401, "wrong key → 401");
ok((await post(answer(child, "GIVEN", `tutor:answer:${RUN}cccccccc`), { headers: { "content-type": "application/json" } })).status === 401, "unsigned → 401");
ok((await post(answer(child, "GIVEN", `tutor:answer:${RUN}dddddddd`), { userId: "someone-else" })).status === 400, "signed for another subject → 400");
ok((await post({ ...answer(child, "GIVEN", `tutor:answer:${RUN}eeeeeeee`), appSlug: "pro" })).status === 400, "body names another app → 400");
ok((await post({ ...answer(child, "GIVEN", `tutor:answer:${RUN}ffffffff`), documentVersionId: privacyV })).status === 422, "a non-parental text → 422");
ok((await post({ ...answer(child, "GIVEN", `tutor:answer:${RUN}gggggggg`), documentVersionId: "nope" })).status === 422, "unknown text → 422");
ok((await post({ event: "SUBJECT_ERASED", appSlug: "tutor", subjectRef: child, requestId: `tutor:erased:${RUN}hhhhhhh`, reason: "OTHER", guardianEmail: email })).status === 400, "erasure marker with a parent's email → 400");
const body = JSON.stringify(answer(child3, "GIVEN", `tutor:answer:${RUN}iiiiiiii`));
const h = sign(child3, body);
const r1 = await fetch(`${BASE}/api/v1/guardian-consents`, { method: "POST", headers: h, body });
const r2 = await fetch(`${BASE}/api/v1/guardian-consents`, { method: "POST", headers: h, body });
ok(r1.status === 201 && r2.status === 401, `captured request replayed → 401 (${r1.status}/${r2.status})`);

console.log("Keys stay in their lane");
const crBody = JSON.stringify({ appSlug: "pro", documentVersionId: privacyV, consentText: "I agree to the terms of service", method: "IN_APP" });
const cr = await fetch(`${BASE}/api/v1/consents/record`, { method: "POST", headers: sign(`victim${RUN}`, crBody), body: crBody });
ok(cr.status === 401, `tutor key on consents/record → 401 (${cr.status})`);
const proG = await post({ ...answer(child4, "GIVEN", `pro:answer:${RUN}jjjjjjjj`), appSlug: "pro" }, { key: PRO_KEY, app: "pro" });
ok(proG.status === 401, `pro key on guardian-consents → 401 (${proG.status})`);
const anonBody = JSON.stringify({ appSlug: "tutor", documentVersionId: V, consentText: "I agree to the parental text", method: "IN_APP" });
const anon = await fetch(`${BASE}/api/v1/consents/record`, { method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": `10.77.${RUN.charCodeAt(0) % 200}.9` }, body: anonBody });
ok(anon.status === 422, `parental text on consents/record → 422 (${anon.status})`);

console.log("Refusal, then erasure");
ok((await post(answer(child2, "REFUSED", `tutor:answer:${RUN}kkkkkkkk`, { documentVersionId: docEn.version.id }))).status === 201, "REFUSED → 201");
const er = await post({ event: "SUBJECT_ERASED", appSlug: "tutor", subjectRef: child2, requestId: `tutor:erased:${child2}`, reason: "GUARDIAN_REFUSED" });
ok(er.status === 201, `SUBJECT_ERASED → 201 (${er.status})`);
const er2 = await post({ event: "SUBJECT_ERASED", appSlug: "tutor", subjectRef: child2, requestId: `tutor:erased:${child2}`, reason: "GUARDIAN_REFUSED" });
ok(er2.status === 200 && er2.body?.duplicate, "the same marker again → 200");
const er3 = await post({ event: "SUBJECT_ERASED", appSlug: "tutor", subjectRef: child2, requestId: `tutor:erased2:${child2}`, reason: "OTHER" });
ok(er3.status === 200 && er3.body?.id === er.body?.id, "a second marker under another key → 200, the first one (erased once is erased)");
const late = await post(answer(child2, "GIVEN", `tutor:answer:${RUN}llllllll`));
ok(late.status === 409 && late.body?.code === "subject-erased", `answer after erasure → 409 subject-erased (${late.status})`);
ok(sql(`select coalesce("guardianRef",'∅')||coalesce("ipAddress",'∅')||coalesce("documentVersionId",'∅') from "GuardianConsent" where "requestId"='tutor:erased:${child2}'`) === "∅∅∅", "erasure marker carries nothing about the parent");

console.log("A parent's answer beats „no answer”");
const noAns = await post({ event: "SUBJECT_ERASED", appSlug: "tutor", subjectRef: child, requestId: `tutor:erased:${child}`, reason: "NO_GUARDIAN_ANSWER" });
ok(noAns.status === 409 && noAns.body?.code === "answer-exists" && noAns.body?.storedEvent === "GIVEN", `„no answer” marker after a GIVEN → 409 answer-exists GIVEN (${noAns.status})`);
ok(sql(`select count(*) from "GuardianConsent" where "subjectRef"='${child}' and event='SUBJECT_ERASED'`) === "0", "no erasure recorded for the child whose parent agreed");
const raceChild = `cmrace${RUN}`;
const [ra, rb] = await Promise.all([
  post(answer(raceChild, "GIVEN", `tutor:answer:${RUN}race0001`)),
  post({ event: "SUBJECT_ERASED", appSlug: "tutor", subjectRef: raceChild, requestId: `tutor:erased:${raceChild}`, reason: "NO_GUARDIAN_ANSWER" }),
]);
const events = sql(`select string_agg(event, ',' order by "createdAt") from "GuardianConsent" where "subjectRef"='${raceChild}'`);
ok((events === "GIVEN" && rb.status === 409) || (events === "SUBJECT_ERASED" && ra.status === 409), `race: exactly one of them wins (${events}; ${ra.status}/${rb.status})`);

console.log("Database guards");
ok(/append-only/.test(sqlTry(`update "GuardianConsent" set "ipAddress"='x' where id='${g.body.id}'`) ?? ""), "UPDATE refused by trigger");
ok(/append-only/.test(sqlTry(`delete from "GuardianConsent" where id='${g.body.id}'`) ?? ""), "DELETE refused by trigger");
ok(/append-only/.test(sqlTry(`truncate "GuardianConsent"`) ?? ""), "TRUNCATE refused by trigger");
const ctrl = row.split("|")[4];
ok(/shape_check/.test(sqlTry(`insert into "GuardianConsent"(id,"appSlug","subjectRef",event,"controllerEntityId","requestId") values ('x${RUN}','tutor','c','GIVEN','${ctrl}','r${RUN}xxxxxxxxxxxxxxx')`) ?? ""), "an answer without parent/text refused by CHECK");
ok(/event_check/.test(sqlTry(`insert into "GuardianConsent"(id,"appSlug","subjectRef",event,reason,"controllerEntityId","requestId") values ('y${RUN}','tutor','c','WITHDRAWN','OTHER','${ctrl}','s${RUN}xxxxxxxxxxxxxxx')`) ?? ""), "an unknown event refused by CHECK");
ok(sqlTry(`insert into "GuardianConsent"(id,"appSlug","subjectRef",event,reason,"controllerEntityId","requestId") values ('z${RUN}','pro','c','SUBJECT_ERASED','INACTIVE','${ctrl}','tutor:erased:${child2}')`) === null, "the same requestId under another app is allowed (unique per app)");
ok(/foreign key|violates/.test(sqlTry(`delete from "DocumentVersion" where id='${V}'`) ?? ""), "the text shown cannot be deleted while an answer points at it");

console.log("Consent status");
const cs = await (await fetch(`${BASE}/api/v1/public/consent-status?globalUserId=${child}&appSlug=tutor`)).json();
ok(Array.isArray(cs.status) && cs.status.length > 0 && !cs.status.some((s) => s.type === "PARENTAL_CONSENT"), `parental text not listed for re-consent (${(cs.status || []).map((s) => s.type).join(",")})`);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
