#!/usr/bin/env node
/**
 * Register the Telegram bot webhook for Tutor (etutor.ro).
 *
 * Usage (reads .env in cwd or explicit env vars):
 *   TELEGRAM_BOT_TOKEN=... TELEGRAM_WEBHOOK_SECRET=... \
 *     node scripts/setup-telegram-webhook.mjs [--url https://etutor.ro] [--delete]
 *
 * Run once per environment after deploy (idempotent — setWebhook overwrites).
 * Tutor uses its OWN bot (separate from @master_alerts) — one bot owns one
 * webhook, so this is safe and isolated.
 */
import { readFileSync, existsSync } from "node:fs";

// Minimal .env loader (no deps) — explicit env always wins.
if (existsSync(".env")) {
  for (const line of readFileSync(".env", "utf8").split("\n")) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

const token = process.env.TELEGRAM_BOT_TOKEN;
const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
if (!token) {
  console.error("TELEGRAM_BOT_TOKEN missing");
  process.exit(1);
}

const args = process.argv.slice(2);
const del = args.includes("--delete");
const urlIdx = args.indexOf("--url");
const explicitUrl = urlIdx >= 0 ? args[urlIdx + 1] : undefined;
if (urlIdx >= 0 && !explicitUrl) {
  console.error("--url requires a value");
  process.exit(1);
}
const base = (explicitUrl || process.env.AUTH_URL || "https://etutor.ro").replace(/\/$/, "");

const api = `https://api.telegram.org/bot${token}`;

async function call(method, payload) {
  const res = await fetch(`${api}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload ?? {}),
  });
  const json = await res.json();
  if (!json.ok) throw new Error(`${method}: ${json.description}`);
  return json.result;
}

if (del) {
  await call("deleteWebhook");
  console.log("Webhook deleted.");
} else {
  if (!secret) {
    console.error("TELEGRAM_WEBHOOK_SECRET missing — the webhook route is fail-closed and will reject every update without it. Set it first.");
    process.exit(1);
  }
  const url = `${base}/api/webhooks/telegram`;
  await call("setWebhook", {
    url,
    secret_token: secret,
    allowed_updates: ["message"],
  });
  console.log(`Webhook set → ${url}`);
}
const info = await call("getWebhookInfo");
console.log("getWebhookInfo:", JSON.stringify(info, null, 2));
