import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

const KEY = "k".repeat(40);
const original = process.env.WHATSAPP_BOT_API_KEYS;

// The route modules import the database client at load time. These tests only
// exercise rejection paths that return before any query, so a placeholder URL
// is enough for the import to succeed.
process.env.TURSO_DATABASE_URL ??= "libsql://placeholder.invalid";
process.env.TURSO_AUTH_TOKEN ??= "placeholder";

beforeEach(() => {
  process.env.WHATSAPP_BOT_API_KEYS = KEY;
});

afterEach(() => {
  if (original === undefined) delete process.env.WHATSAPP_BOT_API_KEYS;
  else process.env.WHATSAPP_BOT_API_KEYS = original;
});

const base = "https://quizmi.space/whatsapp/api/v1/courses";

test("list route rejects a request without a bot key before touching the DB", async () => {
  const { GET } = await import("../../app/whatsapp/api/v1/courses/route");
  const response = await GET(new Request(base) as never);
  assert.equal(response.status, 401);
});

test("list route rejects a wrong bot key", async () => {
  const { GET } = await import("../../app/whatsapp/api/v1/courses/route");
  const response = await GET(
    new Request(base, { headers: { authorization: `Bearer ${"x".repeat(40)}` } }) as never
  );
  assert.equal(response.status, 401);
});

test("code route rejects a malformed code before touching the DB", async () => {
  const { GET } = await import("../../app/whatsapp/api/v1/courses/[code]/route");
  const response = await GET(
    new Request(`${base}/bad;drop`, { headers: { authorization: `Bearer ${KEY}` } }),
    { params: Promise.resolve({ code: "bad%3Bdrop" }) }
  );
  assert.equal(response.status, 400);
});

test("code route rejects a request without a bot key", async () => {
  const { GET } = await import("../../app/whatsapp/api/v1/courses/[code]/route");
  const response = await GET(new Request(`${base}/ECN101`), {
    params: Promise.resolve({ code: "ECN101" }),
  });
  assert.equal(response.status, 401);
});
