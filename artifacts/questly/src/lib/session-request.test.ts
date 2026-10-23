import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import {
  decideAfterResponse,
  requestWithSession,
  type SessionRequestOutcome,
} from "./session-request";

/**
 * Regression coverage for the forced-logout bug: a 401 from a quiz API must be
 * retried with a refreshed session, and only a *freshly refreshed* token that
 * is still rejected may be reported as a sign-out.
 */

const realFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = realFetch;
});

function stubFetch(responses: Array<Response | Error>) {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(input), init });
    const next = responses.shift();
    if (!next) throw new Error("Unexpected extra fetch call");
    if (next instanceof Error) throw next;
    return next;
  }) as typeof fetch;
  return calls;
}

const noSleep = async () => {};

test("decideAfterResponse retries the first 401 with a token refresh", () => {
  assert.equal(decideAfterResponse(401, null, false), "refresh");
  assert.equal(decideAfterResponse(401, null, true), "accept");
  assert.equal(decideAfterResponse(200, null, false), "accept");
  assert.equal(decideAfterResponse(404, null, false), "accept");
});

test("a temporary session verification failure is retried, not treated as sign-out", () => {
  assert.equal(decideAfterResponse(503, "session_unavailable", false), "retry");
  assert.equal(decideAfterResponse(503, "session_unavailable", true), "accept");
  assert.equal(decideAfterResponse(500, null, false), "retry");
});

test("a rejected answer request is retried once with a fresh token and then succeeds", async () => {
  const calls = stubFetch([
    new Response(JSON.stringify({ error: "Unauthorized", code: "unauthenticated" }), {
      status: 401,
    }),
    new Response(JSON.stringify({ saved: true, status: "in_progress" }), { status: 200 }),
  ]);

  let refreshes = 0;
  const outcome = await requestWithSession(
    "/api/attempts/7",
    { method: "PATCH" },
    {
      refresh: async () => {
        refreshes += 1;
      },
      sleep: noSleep,
    }
  );

  assert.equal(outcome.ok, true);
  assert.equal(refreshes, 1, "the token is refreshed exactly once");
  assert.equal(calls.length, 2, "the request is retried exactly once");
});

test("only a 401 that survives a token refresh is reported as unauthenticated", async () => {
  stubFetch([
    new Response(JSON.stringify({ code: "unauthenticated" }), { status: 401 }),
    new Response(JSON.stringify({ code: "unauthenticated" }), { status: 401 }),
  ]);

  let refreshes = 0;
  const outcome = (await requestWithSession(
    "/api/attempts/7",
    { method: "PATCH" },
    {
      refresh: async () => {
        refreshes += 1;
      },
      sleep: noSleep,
    }
  )) as Extract<SessionRequestOutcome, { ok: false }>;

  assert.equal(outcome.ok, false);
  assert.equal(outcome.failure, "unauthenticated");
  assert.equal(refreshes, 1);
});

test("a network blip is retried and never reported as a sign-out", async () => {
  stubFetch([
    new Error("network down"),
    new Response(JSON.stringify({ ok: true }), { status: 200 }),
  ]);

  const outcome = await requestWithSession(
    "/api/attempts/7",
    {},
    { refresh: async () => {}, sleep: noSleep }
  );

  assert.equal(outcome.ok, true);
});

test("a persistent network failure is a retryable session problem", async () => {
  stubFetch([new Error("network down"), new Error("network down")]);

  const outcome = (await requestWithSession(
    "/api/attempts/7",
    {},
    { refresh: async () => {}, sleep: noSleep }
  )) as Extract<SessionRequestOutcome, { ok: false }>;

  assert.equal(outcome.ok, false);
  assert.equal(outcome.failure, "unavailable");
});

test("an unverified session (503) is retried and then surfaces as unavailable", async () => {
  stubFetch([
    new Response(JSON.stringify({ code: "session_unavailable" }), { status: 503 }),
    new Response(JSON.stringify({ code: "session_unavailable" }), { status: 503 }),
  ]);

  const outcome = (await requestWithSession(
    "/api/attempts/7",
    { method: "PATCH" },
    { refresh: async () => {}, sleep: noSleep }
  )) as Extract<SessionRequestOutcome, { ok: false }>;

  assert.equal(outcome.ok, false);
  assert.equal(outcome.failure, "unavailable");
});

test("a server error is handed to the caller instead of being treated as a sign-out", async () => {
  stubFetch([
    new Response(JSON.stringify({ error: "boom" }), { status: 500 }),
    new Response(JSON.stringify({ error: "boom" }), { status: 500 }),
  ]);

  const outcome = await requestWithSession(
    "/api/attempts/7",
    { method: "PATCH" },
    { refresh: async () => {}, sleep: noSleep }
  );

  assert.equal(outcome.ok, true);
  if (outcome.ok) assert.equal(outcome.response.status, 500);
});
