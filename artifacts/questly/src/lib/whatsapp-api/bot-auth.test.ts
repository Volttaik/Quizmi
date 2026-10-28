import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { verifyBotRequest } from "./bot-auth";

const KEY_A = "a".repeat(40);
const KEY_B = "b".repeat(40);
const original = process.env.WHATSAPP_BOT_API_KEYS;

beforeEach(() => {
  process.env.WHATSAPP_BOT_API_KEYS = `${KEY_A}, ${KEY_B}`;
});

afterEach(() => {
  if (original === undefined) delete process.env.WHATSAPP_BOT_API_KEYS;
  else process.env.WHATSAPP_BOT_API_KEYS = original;
});

function request(authorization?: string): Request {
  const headers: Record<string, string> = {};
  if (authorization !== undefined) headers.authorization = authorization;
  return new Request("https://quizmi.space/whatsapp/api/v1/courses", { headers });
}

test("accepts a configured key", () => {
  assert.equal(verifyBotRequest(request(`Bearer ${KEY_A}`)).ok, true);
});

test("accepts the second key so rotation works without downtime", () => {
  assert.equal(verifyBotRequest(request(`Bearer ${KEY_B}`)).ok, true);
});

test("rejects a missing header", () => {
  const result = verifyBotRequest(request());
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.response.status, 401);
});

test("rejects a wrong key", () => {
  const result = verifyBotRequest(request(`Bearer ${"c".repeat(40)}`));
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.response.status, 401);
});

test("rejects a non-bearer scheme", () => {
  assert.equal(verifyBotRequest(request(`Basic ${KEY_A}`)).ok, false);
});

test("fails closed with 503 when no keys are configured", () => {
  process.env.WHATSAPP_BOT_API_KEYS = "";
  const result = verifyBotRequest(request(`Bearer ${KEY_A}`));
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.response.status, 503);
});

test("ignores keys shorter than 32 characters", () => {
  process.env.WHATSAPP_BOT_API_KEYS = "short";
  const result = verifyBotRequest(request("Bearer short"));
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.response.status, 503);
});
