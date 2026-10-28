import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Real migrations, applied in order to a throwaway database file.
const MIGRATIONS = join(dirname(fileURLToPath(import.meta.url)), "../../../../../lib/db/migrations");

let dir = "";
let dbm: typeof import("@/lib/db");
let links: typeof import("./links");
let seq = 0;

before(async () => {
  dir = mkdtempSync(join(tmpdir(), "quizme-links-"));
  process.env.TURSO_DATABASE_URL = `file:${join(dir, "test.db")}`;
  dbm = await import("@/lib/db");
  for (const file of readdirSync(MIGRATIONS).filter((f) => f.endsWith(".sql")).sort()) {
    await dbm.client.executeMultiple(readFileSync(join(MIGRATIONS, file), "utf8"));
  }
  links = await import("./links");
});

after(() => {
  dbm.client.close();
  rmSync(dir, { recursive: true, force: true });
});

function nextJid(): string {
  seq += 1;
  return `4477009${String(seq).padStart(5, "0")}@s.whatsapp.net`;
}

async function newUser() {
  seq += 1;
  const [row] = await dbm.db
    .insert(dbm.usersTable)
    .values({ clerkId: `clerk_test_${seq}`, name: `Student ${seq}`, email: `student${seq}@test.dev` })
    .returning();
  return row;
}

async function requestToken(jid: string): Promise<string> {
  const result = await links.createLinkRequest(jid);
  if (!result.ok) throw new Error(`link request refused: ${result.reason}`);
  return result.token;
}

const WRONG_TOKEN = "A".repeat(43);

test("a valid token links the WhatsApp number to the existing user row", async () => {
  const user = await newUser();
  const jid = nextJid();
  const token = await requestToken(jid);

  const result = await links.confirmLinkRequest(token, user.id);

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.user.id, user.id);
  const link = await links.activeLinkForJid(jid);
  assert.equal(link?.userId, user.id);
});

test("a token is single-use: replaying it after a successful link fails", async () => {
  const user = await newUser();
  const jid = nextJid();
  const token = await requestToken(jid);
  assert.equal((await links.confirmLinkRequest(token, user.id)).ok, true);

  const replay = await links.confirmLinkRequest(token, user.id);

  assert.deepEqual(replay, { ok: false, reason: "invalid_or_expired" });
});

test("an expired token is rejected and creates no link", async () => {
  const user = await newUser();
  const jid = nextJid();
  const token = await requestToken(jid);
  const past = new Date(Date.now() - 60_000).toISOString();
  await dbm.client.execute({
    sql: "UPDATE whatsapp_link_codes SET expires_at = ? WHERE wa_jid = ?",
    args: [past, jid],
  });

  const result = await links.confirmLinkRequest(token, user.id);

  assert.deepEqual(result, { ok: false, reason: "invalid_or_expired" });
  assert.equal(await links.activeLinkForJid(jid), undefined);
});

test("a wrong token is rejected and creates no link", async () => {
  const user = await newUser();
  const jid = nextJid();
  await requestToken(jid);

  const result = await links.confirmLinkRequest(WRONG_TOKEN, user.id);

  assert.deepEqual(result, { ok: false, reason: "invalid_or_expired" });
  assert.equal(await links.activeLinkForJid(jid), undefined);
});

test("repeated wrong tokens lock the user out, even with a valid token", async () => {
  const user = await newUser();
  const jid = nextJid();
  const token = await requestToken(jid);

  for (let i = 0; i < 10; i += 1) {
    await links.confirmLinkRequest(WRONG_TOKEN, user.id);
  }
  const result = await links.confirmLinkRequest(token, user.id);

  assert.deepEqual(result, { ok: false, reason: "rate_limited" });
  assert.equal(await links.activeLinkForJid(jid), undefined);
});

test("a number may request at most 5 link tokens per hour", async () => {
  const jid = nextJid();
  for (let i = 0; i < 5; i += 1) {
    assert.equal((await links.createLinkRequest(jid)).ok, true);
  }

  assert.deepEqual(await links.createLinkRequest(jid), { ok: false, reason: "rate_limited" });
});

test("a newer request invalidates the earlier token for the same number", async () => {
  const user = await newUser();
  const jid = nextJid();
  const first = await requestToken(jid);
  const second = await requestToken(jid);

  assert.deepEqual(await links.confirmLinkRequest(first, user.id), {
    ok: false,
    reason: "invalid_or_expired",
  });
  assert.equal((await links.confirmLinkRequest(second, user.id)).ok, true);
});

test("a user with an active link cannot link a second number", async () => {
  const user = await newUser();
  const firstJid = nextJid();
  assert.equal((await links.confirmLinkRequest(await requestToken(firstJid), user.id)).ok, true);

  const secondJid = nextJid();
  const result = await links.confirmLinkRequest(await requestToken(secondJid), user.id);

  assert.deepEqual(result, { ok: false, reason: "already_linked" });
  assert.equal(await links.activeLinkForJid(secondJid), undefined);
});

test("a number already linked to another account cannot be taken over", async () => {
  const owner = await newUser();
  const intruder = await newUser();
  const jid = nextJid();
  const ownerToken = await requestToken(jid);
  // Simulate a race: the number gets linked to the owner after the token was issued.
  await dbm.db.insert(dbm.whatsappLinksTable).values({ userId: owner.id, waJid: jid });

  const result = await links.confirmLinkRequest(ownerToken, intruder.id);

  assert.deepEqual(result, { ok: false, reason: "jid_in_use" });
  assert.equal((await links.activeLinkForJid(jid))?.userId, owner.id);
});

test("requesting a link for a number that is already linked is refused", async () => {
  const user = await newUser();
  const jid = nextJid();
  assert.equal((await links.confirmLinkRequest(await requestToken(jid), user.id)).ok, true);

  assert.deepEqual(await links.createLinkRequest(jid), { ok: false, reason: "already_linked" });
});

test("unlinking ends the link, and the number can then be linked again", async () => {
  const user = await newUser();
  const jid = nextJid();
  assert.equal((await links.confirmLinkRequest(await requestToken(jid), user.id)).ok, true);

  assert.equal(await links.unlinkJid(jid), true);
  assert.equal(await links.activeLinkForJid(jid), undefined);
  assert.equal(await links.unlinkJid(jid), false);

  const relink = await links.confirmLinkRequest(await requestToken(jid), user.id);
  assert.equal(relink.ok, true);
});
