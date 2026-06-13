import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Keep the module import cheap — connect.ts imports @/lib/prisma at top.
vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import {
  makeConnectSeams,
  createConnectLink,
  telegramNudgesEnabled,
  telegramConfigured,
} from "@/lib/telegram/connect";

// Minimal in-memory fake of the slice of Prisma the seams touch.
function fakeDb() {
  const tokens = new Map<string, { userId: string; expiresAt: Date }>();
  const users = new Map<string, { telegramChatId: string | null; telegramUsername: string | null; telegramLinkedAt: Date | null }>();
  const calls: string[] = [];
  const db = {
    tokens,
    users,
    calls,
    telegramConnectToken: {
      async create({ data }: any) {
        tokens.set(data.nonce, { userId: data.userId, expiresAt: data.expiresAt });
        return data;
      },
      async delete({ where }: any) {
        const t = tokens.get(where.nonce);
        if (!t) {
          const e: any = new Error("not found");
          e.code = "P2025";
          throw e;
        }
        tokens.delete(where.nonce);
        return { nonce: where.nonce, ...t };
      },
      async deleteMany({ where }: any) {
        let n = 0;
        for (const [nonce, t] of tokens) {
          if (t.userId === where.userId && where.expiresAt?.lt && t.expiresAt < where.expiresAt.lt) {
            tokens.delete(nonce);
            n++;
          }
        }
        return { count: n };
      },
    },
    user: {
      async update({ where, data }: any) {
        calls.push(`update:${where.id}`);
        const u = users.get(where.id) ?? { telegramChatId: null, telegramUsername: null, telegramLinkedAt: null };
        users.set(where.id, { ...u, ...data });
        return users.get(where.id);
      },
      async updateMany({ where, data }: any) {
        calls.push(`updateMany:${where.telegramChatId}`);
        let n = 0;
        for (const [id, u] of users) {
          if (u.telegramChatId === where.telegramChatId && (!where.NOT || id !== where.NOT.id)) {
            users.set(id, { ...u, ...data });
            n++;
          }
        }
        return { count: n };
      },
    },
    async $transaction(ops: Promise<unknown>[]) {
      return Promise.all(ops);
    },
  };
  return db;
}

describe("telegram connect — consumeToken (single-use + expiry)", () => {
  it("valid token → userId, and is consumed (single-use)", async () => {
    const db = fakeDb();
    db.tokens.set("good", { userId: "u1", expiresAt: new Date(Date.now() + 60000) });
    const seams = makeConnectSeams(db as any);
    expect(await seams.consumeToken("good")).toBe("u1");
    // second consume → gone
    expect(await seams.consumeToken("good")).toBeNull();
  });

  it("missing token → null (delete throws P2025)", async () => {
    const seams = makeConnectSeams(fakeDb() as any);
    expect(await seams.consumeToken("nope")).toBeNull();
  });

  it("expired token → null (but still consumed/cleaned up)", async () => {
    const db = fakeDb();
    db.tokens.set("old", { userId: "u9", expiresAt: new Date(Date.now() - 1000) });
    const seams = makeConnectSeams(db as any);
    expect(await seams.consumeToken("old")).toBeNull();
    expect(db.tokens.has("old")).toBe(false); // expired rows don't linger
  });
});

describe("telegram connect — bindChat (unique-safe rebind)", () => {
  it("binds chat to user with username + linkedAt", async () => {
    const db = fakeDb();
    db.users.set("u1", { telegramChatId: null, telegramUsername: null, telegramLinkedAt: null });
    const seams = makeConnectSeams(db as any);
    await seams.bindChat("u1", { chatId: 555, username: "alex" });
    const u = db.users.get("u1")!;
    expect(u.telegramChatId).toBe("555");
    expect(u.telegramUsername).toBe("alex");
    expect(u.telegramLinkedAt).toBeInstanceOf(Date);
    // clears prior owners first, then sets target
    expect(db.calls).toEqual(["updateMany:555", "update:u1"]);
  });

  it("re-binding a chat from an old account moves it (no unique clash)", async () => {
    const db = fakeDb();
    db.users.set("old", { telegramChatId: "555", telegramUsername: "alex", telegramLinkedAt: new Date() });
    db.users.set("new", { telegramChatId: null, telegramUsername: null, telegramLinkedAt: null });
    const seams = makeConnectSeams(db as any);
    await seams.bindChat("new", { chatId: 555, username: "alex" });
    expect(db.users.get("old")!.telegramChatId).toBeNull();
    expect(db.users.get("new")!.telegramChatId).toBe("555");
  });
});

describe("telegram connect — unbindChat", () => {
  it("clears the binding for a chat", async () => {
    const db = fakeDb();
    db.users.set("u1", { telegramChatId: "555", telegramUsername: "alex", telegramLinkedAt: new Date() });
    const seams = makeConnectSeams(db as any);
    await seams.unbindChat!(555);
    expect(db.users.get("u1")!.telegramChatId).toBeNull();
  });
});

describe("telegram connect — createConnectLink", () => {
  const OLD = { ...process.env };
  beforeEach(() => { process.env.TELEGRAM_BOT_TOKEN = "tok"; });
  afterEach(() => { process.env = { ...OLD }; });

  it("returns null when bot username not configured", async () => {
    delete process.env.TELEGRAM_BOT_USERNAME;
    const db = fakeDb();
    expect(await createConnectLink("u1", db as any)).toBeNull();
    expect(db.tokens.size).toBe(0); // no orphan token minted
  });

  it("mints + stores a token and builds the deep link", async () => {
    process.env.TELEGRAM_BOT_USERNAME = "etutor_notif_bot";
    const db = fakeDb();
    const res = await createConnectLink("u1", db as any);
    expect(res).not.toBeNull();
    expect(res!.url).toContain("t.me/etutor_notif_bot");
    expect(res!.expiresInSec).toBeGreaterThanOrEqual(60);
    // the minted nonce is the one stored, and it's in the URL
    const [nonce] = [...db.tokens.keys()];
    expect(res!.url).toContain(nonce);
    expect(db.tokens.get(nonce)!.userId).toBe("u1");
  });
});

describe("telegram feature gates", () => {
  const OLD = { ...process.env };
  afterEach(() => { process.env = { ...OLD }; });

  it("telegramConfigured reflects bot token presence", () => {
    process.env.TELEGRAM_BOT_TOKEN = "x";
    expect(telegramConfigured()).toBe(true);
    delete process.env.TELEGRAM_BOT_TOKEN;
    expect(telegramConfigured()).toBe(false);
  });

  it("telegramNudgesEnabled requires BOTH token and flag=true", () => {
    process.env.TELEGRAM_BOT_TOKEN = "x";
    process.env.FEATURE_TELEGRAM_NUDGES = "false";
    expect(telegramNudgesEnabled()).toBe(false);
    process.env.FEATURE_TELEGRAM_NUDGES = "true";
    expect(telegramNudgesEnabled()).toBe(true);
    delete process.env.TELEGRAM_BOT_TOKEN;
    expect(telegramNudgesEnabled()).toBe(false);
  });
});
