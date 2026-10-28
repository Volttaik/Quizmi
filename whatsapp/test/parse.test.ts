import { test } from "node:test";
import assert from "node:assert/strict";
import { normaliseCourseCode, parseCommand } from "../src/commands/parse.ts";

test("plain chat is never a command", () => {
  for (const text of ["hello", "search", "courses", "B", "  hi there "]) {
    assert.deepEqual(parseCommand(text), { kind: "none" });
  }
});

test("commands are case-insensitive and tolerate whitespace", () => {
  const parsed = parseCommand("   /CoUrSe   ecn101  ");
  assert.equal(parsed.kind, "command");
  if (parsed.kind !== "command") return;
  assert.equal(parsed.name, "course");
  assert.deepEqual(parsed.args, ["ecn101"]);
});

test("argument-taking commands without arguments return usage", () => {
  const parsed = parseCommand("/course");
  assert.equal(parsed.kind, "invalid");
  if (parsed.kind !== "invalid") return;
  assert.match(parsed.usage, /\/course \[course_code\]/);
});

test("unknown slash commands are reported, not swallowed", () => {
  const parsed = parseCommand("/nope");
  assert.equal(parsed.kind, "unknown");
});

test("bare slash is unknown", () => {
  assert.equal(parseCommand("/").kind, "unknown");
});

test("no-argument commands parse cleanly", () => {
  const parsed = parseCommand("/mycourses");
  assert.deepEqual(parsed.kind === "command" && parsed.name, "mycourses");
});

test("course codes normalise by removing spaces and uppercasing", () => {
  assert.equal(normaliseCourseCode("ecn 101"), "ECN101");
  assert.equal(normaliseCourseCode("ECN101"), "ECN101");
});
