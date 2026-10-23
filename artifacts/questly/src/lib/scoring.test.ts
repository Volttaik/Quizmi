import assert from "node:assert/strict";
import { test } from "node:test";

import {
  attemptIsExpired,
  deadline,
  sanitizeAnswerInput,
  scoreAttempt,
  secondsRemaining,
} from "./scoring";

const questions = [
  { id: 1, correctIndex: 2, marks: 1 },
  { id: 2, correctIndex: 0, marks: 2 },
  { id: 3, correctIndex: 1, marks: 1 },
];

test("scoreAttempt scores only correct selections and totals marks", () => {
  const result = scoreAttempt(
    questions,
    [
      { questionId: 1, selectedIndex: 2 }, // correct, 1 mark
      { questionId: 2, selectedIndex: 3 }, // wrong
      { questionId: 3, selectedIndex: 1 }, // correct, 1 mark
    ],
    50
  );

  assert.equal(result.score, 2);
  assert.equal(result.totalMarks, 4);
  assert.equal(result.correctCount, 2);
  assert.equal(result.totalQuestions, 3);
  assert.equal(result.percentage, 50);
  assert.equal(result.passed, true);
  assert.equal(result.answers.find((answer) => answer.questionId === 2)?.marksAwarded, 0);
});

test("unanswered questions score zero and count towards the total", () => {
  const result = scoreAttempt(questions, [], 50);

  assert.equal(result.score, 0);
  assert.equal(result.correctCount, 0);
  assert.equal(result.percentage, 0);
  assert.equal(result.passed, false);
  assert.equal(result.answers.length, 3);
  assert.ok(result.answers.every((answer) => answer.selectedIndex === null));
});

test("duplicate answers keep the last selection and unknown ids are ignored", () => {
  const result = scoreAttempt(
    questions,
    [
      { questionId: 1, selectedIndex: 0 },
      { questionId: 1, selectedIndex: 2 }, // last one wins
      { questionId: 999, selectedIndex: 1 }, // not part of this attempt
    ],
    40
  );

  const answer = result.answers.find((entry) => entry.questionId === 1);
  assert.equal(answer?.selectedIndex, 2);
  assert.equal(answer?.correct, true);
  assert.equal(result.totalQuestions, 3);
});

test("pass mark is inclusive", () => {
  const exact = scoreAttempt(questions, [{ questionId: 1, selectedIndex: 2 }], 25);
  assert.equal(exact.percentage, 25);
  assert.equal(exact.passed, true);
});

test("sanitizeAnswerInput drops malformed entries and duplicate question ids", () => {
  const cleaned = sanitizeAnswerInput([
    { questionId: 1, selectedIndex: 2 },
    { questionId: 1, selectedIndex: 0 }, // duplicate id is dropped
    { questionId: "2", selectedIndex: 1 },
    { questionId: 0, selectedIndex: 1 }, // invalid id
    { questionId: -4, selectedIndex: 1 },
    { questionId: 3, selectedIndex: -1 }, // invalid selection becomes null
    { questionId: 4, selectedIndex: 1.5 },
    null,
    "nope",
  ]);

  assert.deepEqual(cleaned, [
    { questionId: 1, selectedIndex: 2 },
    { questionId: 2, selectedIndex: 1 },
    { questionId: 3, selectedIndex: null },
    { questionId: 4, selectedIndex: null },
  ]);
});

test("sanitizeAnswerInput tolerates a non-array payload", () => {
  assert.deepEqual(sanitizeAnswerInput(null), []);
  assert.deepEqual(sanitizeAnswerInput({ answers: [] }), []);
});

test("timed attempts get a deadline and count down from it", () => {
  const start = new Date("2026-01-01T10:00:00.000Z");
  const expiresAt = deadline(30, start);
  assert.equal(expiresAt, "2026-01-01T10:30:00.000Z");

  const atStart = new Date("2026-01-01T10:00:00.000Z");
  assert.equal(secondsRemaining(expiresAt, atStart), 1800);
  assert.equal(attemptIsExpired(expiresAt, atStart), false);

  const atEnd = new Date("2026-01-01T10:30:00.000Z");
  assert.equal(secondsRemaining(expiresAt, atEnd), 0);
  assert.equal(attemptIsExpired(expiresAt, atEnd), true);
});

test("unlimited attempts have no deadline", () => {
  assert.equal(deadline(null), null);
  assert.equal(deadline(0), null);
  assert.equal(secondsRemaining(null), null);
  assert.equal(attemptIsExpired(null), false);
});

test("seconds remaining never goes negative", () => {
  const expiresAt = "2026-01-01T10:00:00.000Z";
  const late = new Date("2026-01-01T11:00:00.000Z");
  assert.equal(secondsRemaining(expiresAt, late), 0);
});
