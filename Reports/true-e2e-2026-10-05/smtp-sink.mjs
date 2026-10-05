// Cutie poștală falsă pentru stiva QA (SMTP 127.0.0.1:2525): fiecare mesaj ajunge ca fișier .json în ./mailbox.
import net from "node:net";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const { simpleParser } = createRequire("/Users/danciulescu/Projects/Consult/package.json")("mailparser");
const DIR = path.join(path.dirname(new URL(import.meta.url).pathname), "mailbox");
fs.mkdirSync(DIR, { recursive: true });
let n = 0;
const srv = net.createServer((sock) => {
  let buf = "", inData = false, lines = [], to = [], authWait = false;
  const w = (l) => sock.write(l + "\r\n");
  w("220 fake");
  sock.on("data", (c) => {
    buf += c.toString("utf8");
    let i;
    while ((i = buf.indexOf("\r\n")) >= 0) {
      const line = buf.slice(0, i); buf = buf.slice(i + 2);
      if (inData) {
        if (line === ".") {
          inData = false; const rcpt = to.map((t) => t.toLowerCase()); const raw = lines.join("\r\n"); lines = []; to = [];
          simpleParser(raw).then((m) => {
            const text = m.text || "";
            const html = m.html || "";
            const links = [...new Set([...(html + " " + text).matchAll(/https?:\/\/[^\s"'<>)]+/g)].map((x) => x[0]))];
            const f = path.join(DIR, `${Date.now()}-${++n}-${rcpt[0]?.replace(/[^a-z0-9@.-]/g, "_") || "x"}.json`);
            fs.writeFileSync(f, JSON.stringify({ at: new Date().toISOString(), to: rcpt, subject: m.subject ?? "", text, html, links }, null, 2));
          }).catch(() => {});
          w("250 OK");
        } else lines.push(line.startsWith("..") ? line.slice(1) : line);
        continue;
      }
      if (authWait) { authWait = false; w("235 OK"); continue; }
      const up = line.toUpperCase();
      if (up.startsWith("EHLO") || up.startsWith("HELO")) sock.write("250-fake\r\n250-AUTH PLAIN LOGIN\r\n250 8BITMIME\r\n");
      else if (up.startsWith("AUTH")) { if (line.trim().split(/\s+/).length > 2) w("235 OK"); else { authWait = true; w("334 "); } }
      else if (up.startsWith("RCPT")) { to.push((line.match(/<([^>]+)>/) || [])[1] ?? ""); w("250 OK"); }
      else if (up.startsWith("DATA")) { inData = true; w("354 go"); }
      else if (up.startsWith("QUIT")) { w("221 bye"); sock.end(); }
      else w("250 OK");
    }
  });
  sock.on("error", () => {});
});
srv.listen(2525, "127.0.0.1", () => console.log("smtp sink on 127.0.0.1:2525 →", DIR));
