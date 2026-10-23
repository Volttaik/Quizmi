import assert from "node:assert/strict";
import { test } from "node:test";

import { countsTowardAnalytics, isGradedStatus } from "./attempt-status";
import {
  assignAttemptNumbers,
  groupAttemptsByCourse,
  matchesHistoryFilter,
  summarizeAnalytics,
  summarizeAnswers,
  summarizeDashboardStats,
} from "./attempt-summary";
import type { HistoryItem } from "./types";

const questionIds = [11, 12, 13, 14];

function answer(questionId: number, selectedIndex: number | null, correct = false) {
  return { questionId, selectedIndex, correct, marksAwarded: correct ? 1 : 0 };
}

function historyItem(overrides: Partial<HistoryItem> & { attemptId: number; courseId: number }): HistoryItem {
  return {
    attemptNumber: 0,
    courseSlug: "demo-english-usage",
    courseTitle: "Demo Course",
    subject: "English",
    difficulty: "medium",
    status: "submitted",
    hasResult: true,
    score: 0,
    totalMarks: 4,
    percentage: 0,
    passed: false,
    answeredCount: 0,
    correctCount: 0,
    incorrectCount: 0,
    unansweredCount: 4,
    totalQuestions: 4,
    startedAt: "2026-10-01T10:00:00.000Z",
    submittedAt: "2026-10-01T10:10:00.000Z",
    expiresAt: null,
    timeTakenSeconds: 600,
    terminationReason: null,
    chapterNumber: null,
    ...overrides,
    attemptId: overrides.attemptId,
    courseId: overrides.courseId,
  };
}

test("status rules: only submitted, expired and terminated attempts carry results", () => {
  assert.equal(isGradedStatus("submitted"), true);
  assert.equal(isGradedStatus("expired"), true);
  assert.equal(isGradedStatus("terminated"), true);
  assert.equal(isGradedStatus("in_progress"), false);
  assert.equal(isGradedStatus("not_submitted"), false);
  assert.equal(countsTowardAnalytics("not_submitted"), false);
});

test("an all-correct attempt reports full marks and no incorrect/unanswered questions", () => {
  const summary = summarizeAnswers({
    status: "submitted",
    questionIds,
    answers: questionIds.map((id, index) => answer(id, index, true)),
  });

  assert.deepEqual(summary, {
    totalQuestions: 4,
    answeredCount: 4,
    correctCount: 4,
    incorrectCount: 0,
    unansweredCount: 0,
    hasResult: true,
  });
});

test("a mixed attempt separates incorrect from unanswered", () => {
  const summary = summarizeAnswers({
    status: "submitted",
    questionIds,
    answers: [
      answer(11, 0, true),
      answer(12, 2, false),
      answer(13, null, false),
      answer(14, null, false),
    ],
  });

  assert.equal(summary.answeredCount, 2);
  assert.equal(summary.correctCount, 1);
  assert.equal(summary.incorrectCount, 1);
  assert.equal(summary.unansweredCount, 2);
  assert.equal(summary.totalQuestions, 4);
});

test("a padded answer sheet does not inflate the answered count", () => {
  const summary = summarizeAnswers({
    status: "expired",
    questionIds,
    answers: [
      answer(11, 1, false),
      answer(12, null),
      answer(13, null),
      answer(14, null),
    ],
  });

  assert.equal(summary.answeredCount, 1);
  assert.equal(summary.unansweredCount, 3);
  assert.equal(summary.correctCount, 0);
  assert.equal(summary.incorrectCount, 1);
});

test("an attempt that was never submitted has no score and no misleading counts", () => {
  const summary = summarizeAnswers({
    status: "not_submitted",
    questionIds,
    answers: [answer(11, 3, true)],
  });

  assert.equal(summary.hasResult, false);
  assert.equal(summary.answeredCount, 1);
  assert.equal(summary.correctCount, 0);
  assert.equal(summary.incorrectCount, 0);
  assert.equal(summary.unansweredCount, 0);
});

test("attempts are numbered per course in chronological order, independent of list order", () => {
  const items = [
    historyItem({ attemptId: 30, courseId: 10 }),
    historyItem({ attemptId: 7, courseId: 10 }),
    historyItem({ attemptId: 9, courseId: 20 }),
    historyItem({ attemptId: 20, courseId: 10 }),
  ];

  const numbered = assignAttemptNumbers(items);
  const find = (id: number) => numbered.find((item) => item.attemptId === id)?.attemptNumber;

  assert.equal(find(7), 1);
  assert.equal(find(20), 2);
  assert.equal(find(30), 3);
  assert.equal(find(9), 1);
});

test("history groups by course with chronological attempts and per-course best", () => {
  const items = assignAttemptNumbers([
    historyItem({ attemptId: 31, courseId: 10, percentage: 40, score: 8, passed: false }),
    historyItem({ attemptId: 12, courseId: 10, percentage: 80, score: 16, passed: true }),
    historyItem({
      attemptId: 5,
      courseId: 20,
      status: "not_submitted",
      hasResult: false,
      courseTitle: "ECN 102",
      submittedAt: null,
    }),
  ]);

  const groups = groupAttemptsByCourse(items);
  assert.equal(groups.length, 2);

  const demo = groups.find((group) => group.courseId === 10);
  assert.ok(demo);
  assert.deepEqual(
    demo.attempts.map((attempt) => attempt.attemptNumber),
    [1, 2]
  );
  assert.equal(demo.gradedAttempts, 2);
  assert.equal(demo.unfinishedAttempts, 0);
  assert.equal(demo.bestPercentage, 80);

  const ecn = groups.find((group) => group.courseId === 20);
  assert.ok(ecn);
  assert.equal(ecn.gradedAttempts, 0);
  assert.equal(ecn.unfinishedAttempts, 1);
  assert.equal(ecn.bestPercentage, null);
});

test("analytics use graded attempts only and never count an abandoned attempt as zero", () => {
  const analytics = summarizeAnalytics([
    {
      courseId: 10,
      status: "submitted",
      subject: "English",
      passed: true,
      percentage: 80,
      timeTakenSeconds: 600,
      startedAt: "2026-10-01T10:00:00.000Z",
      submittedAt: "2026-10-01T10:10:00.000Z",
    },
    {
      courseId: 10,
      status: "not_submitted",
      subject: "English",
      passed: false,
      percentage: 0,
      timeTakenSeconds: null,
      startedAt: "2026-10-02T10:00:00.000Z",
      submittedAt: null,
    },
    {
      courseId: 20,
      status: "in_progress",
      subject: "Maths",
      passed: false,
      percentage: 0,
      timeTakenSeconds: null,
      startedAt: "2026-10-03T10:00:00.000Z",
      submittedAt: null,
    },
  ]);

  assert.equal(analytics.totalAttempts, 3);
  assert.equal(analytics.completedAttempts, 1);
  assert.equal(analytics.notSubmittedAttempts, 1);
  assert.equal(analytics.inProgressAttempts, 1);
  assert.equal(analytics.averagePercentage, 80);
  assert.equal(analytics.passRate, 100);
  assert.equal(analytics.bestPercentage, 80);
  assert.equal(analytics.totalMinutes, 10);
  assert.deepEqual(analytics.trend, [
    { date: "2026-10-01T10:10:00.000Z", percentage: 80 },
  ]);
  assert.deepEqual(analytics.bySubject, [
    { subject: "English", attempts: 1, averagePercentage: 80 },
  ]);
});

test("an empty history is a genuine empty analytics state", () => {
  const analytics = summarizeAnalytics([]);
  assert.equal(analytics.totalAttempts, 0);
  assert.equal(analytics.completedAttempts, 0);
  assert.equal(analytics.averagePercentage, 0);
  assert.equal(analytics.passRate, 0);
  assert.deepEqual(analytics.trend, []);
  assert.deepEqual(analytics.bySubject, []);

  const stats = summarizeDashboardStats([]);
  assert.equal(stats.coursesTaken, 0);
  assert.equal(stats.completedAttempts, 0);
});

test("dashboard stats match the analytics rows they are built from", () => {
  const stats = summarizeDashboardStats([
    { courseId: 10, status: "submitted", passed: true, percentage: 90 },
    { courseId: 10, status: "submitted", passed: false, percentage: 30 },
    { courseId: 20, status: "expired", passed: false, percentage: 50 },
    { courseId: 20, status: "not_submitted", passed: false, percentage: 0 },
  ]);

  assert.equal(stats.coursesTaken, 2);
  assert.equal(stats.completedAttempts, 3);
  assert.equal(stats.averagePercentage, 57);
  assert.equal(stats.passRate, 33);
  assert.equal(stats.bestPercentage, 90);
  assert.equal(stats.notSubmittedAttempts, 1);
});

test("history filters never classify an unfinished attempt as failed", () => {
  const submitted = historyItem({ attemptId: 1, courseId: 10, passed: false });
  const unfinished = historyItem({
    attemptId: 2,
    courseId: 10,
    status: "not_submitted",
    hasResult: false,
  });

  assert.equal(matchesHistoryFilter(unfinished, "all"), true);
  assert.equal(matchesHistoryFilter(unfinished, "unfinished"), true);
  assert.equal(matchesHistoryFilter(unfinished, "failed"), false);
  assert.equal(matchesHistoryFilter(unfinished, "passed"), false);
  assert.equal(matchesHistoryFilter(submitted, "failed"), true);
  assert.equal(matchesHistoryFilter(submitted, "unfinished"), false);
});
