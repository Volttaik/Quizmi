import { test } from "node:test";
import assert from "node:assert/strict";
import { ApiError, type BotCourse, type BotCourseDetail, type QuizmiApi } from "../src/api-client.js";
import { formatPrice, planReply, routeMessage, PAGE_SIZE } from "../src/commands/router.js";

const JID = "447700900123@s.whatsapp.net";

const ECN: BotCourse = {
  code: "ECN 101",
  slug: "ecn-101",
  title: "Introduction to Economics",
  subject: "Economics",
  description: "Basics",
  priceKobo: 500_000,
  currency: "NGN",
  questionCount: 40,
  durationMinutes: 30,
  passScore: 50,
  coverImageUrl: null,
  url: "https://quizme.test/courses/ecn-101",
};

function fakeApi(overrides: Partial<QuizmiApi> = {}): QuizmiApi & { searches: (string | undefined)[]; offsets: number[] } {
  const searches: (string | undefined)[] = [];
  const offsets: number[] = [];
  return {
    searches,
    offsets,
    async recordCard() {},
    async resolveCard() {
      return null;
    },
    async purchase() {
      return { kind: "free" };
    },
    async startQuiz() {
      throw new ApiError(403, "Purchase this course before starting an assessment");
    },
    async submitQuiz() {
      throw new ApiError(500, "unused");
    },
    async startLink() {
      return { status: "pending", url: "https://quizme.test/whatsapp/link#x", expiresAt: "2099-01-01T00:00:00.000Z" };
    },
    async accountStatus() {
      return { linked: false };
    },
    async unlink() {
      return false;
    },
    async searchCourses(query, offset = 0) {
      searches.push(query);
      offsets.push(offset);
      return [ECN];
    },
    async getCourse(code) {
      if (code !== "ECN101") return null;
      const detail: BotCourseDetail = {
        ...ECN,
        chapters: [{ number: 1, title: "Supply", questionCount: 10 }],
      };
      return detail;
    },
    ...overrides,
  };
}

test("ordinary chat gets no reply", async () => {
  assert.equal(await routeMessage("hello there", JID, fakeApi()), null);
});

test("/help and /start show the menu", async () => {
  assert.match((await routeMessage("/help", JID, fakeApi())) ?? "", /QuizMe/);
  assert.match((await routeMessage("/START", JID, fakeApi())) ?? "", /QuizMe/);
});

test("/search passes the query through and lists results", async () => {
  const api = fakeApi();
  const reply = await routeMessage("/search economics", JID, api);
  assert.deepEqual(api.searches, ["economics"]);
  assert.match(reply ?? "", /Results for "economics"/);
  assert.match(reply ?? "", /ECN 101 · Introduction to Economics – NGN 5,000/);
});

test("/courses lists without a query", async () => {
  const api = fakeApi();
  const reply = await routeMessage("/courses", JID, api);
  assert.deepEqual(api.searches, [undefined]);
  assert.match(reply ?? "", /Popular courses/);
});

test("/course finds a code regardless of spaces and case", async () => {
  const reply = await routeMessage("/course ecn 101", JID, fakeApi());
  assert.match(reply ?? "", /Introduction to Economics/);
  assert.match(reply ?? "", /Chapters:/);
  assert.match(reply ?? "", /1\. Supply \(10\)/);
});

test("/course reports an unknown code", async () => {
  assert.equal(await routeMessage("/course XYZ999", JID, fakeApi()), "No course found for XYZ999.");
});

test("a missing argument returns the usage hint", async () => {
  assert.equal(await routeMessage("/course", JID, fakeApi()), "Usage: /course [course_code]  e.g. /course ECN101");
});

test("an unknown command points back to the menu", async () => {
  assert.match((await routeMessage("/wat", JID, fakeApi())) ?? "", /Unknown command \/wat/);
});

test("a 401 from the API tells the user the bot is not authorised", async () => {
  const api = fakeApi({
    searchCourses: async () => {
      throw new ApiError(401, "Unauthorized");
    },
  });
  assert.match((await routeMessage("/courses", JID, api)) ?? "", /not authorised/);
});

test("a network failure gives a friendly retry message, not a stack trace", async () => {
  const api = fakeApi({
    searchCourses: async () => {
      throw new TypeError("fetch failed");
    },
  });
  assert.match((await routeMessage("/courses", JID, api)) ?? "", /unavailable right now/);
});

test("/login replies with the one-time link", async () => {
  const reply = (await routeMessage("/login", JID, fakeApi())) ?? "";
  assert.match(reply, /https:\/\/quizme\.test\/whatsapp\/link/);
});

test("/login tells a linked number it is already linked", async () => {
  const api = fakeApi({
    startLink: async () => ({ status: "already_linked" }),
  });
  assert.match((await routeMessage("/login", JID, api)) ?? "", /already linked/);
});

test("/mycourses asks an unlinked number to log in first", async () => {
  assert.match((await routeMessage("/mycourses", JID, fakeApi())) ?? "", /not linked yet/);
});

test("/mycourses lists the linked student's courses", async () => {
  const api = fakeApi({
    accountStatus: async () => ({
      linked: true,
      name: "Ada",
      courses: [{ code: "ECN 101", slug: "ecn-101", title: "Introduction to Economics", attemptsUsed: 1, bestPercentage: 60 }],
    }),
  });
  const reply = (await routeMessage("/mycourses", JID, api)) ?? "";
  assert.match(reply, /Hi Ada/);
  assert.match(reply, /ECN 101 · Introduction to Economics/);
});

test("/logout reports whether a link was removed", async () => {
  assert.match((await routeMessage("/logout", JID, fakeApi({ unlink: async () => true }))) ?? "", /Unlinked/);
  assert.equal((await routeMessage("/logout", JID, fakeApi())), "This number is not linked.");
});

test("search replies carry one card per course, for recording", async () => {
  const reply = await planReply({ jid: JID, text: "/courses", id: "m1", quotedId: null }, fakeApi(), { chats: new Map() });
  assert.equal(reply?.cards?.length, 1);
  assert.equal(reply?.cards?.[0]?.courseCode, "ECN 101");
  assert.match(reply?.cards?.[0]?.text ?? "", /Reply to this with BUY, DETAILS or QUIZ/);
});

test("/next pages past the first results", async () => {
  const api = fakeApi();
  const chats = new Map();
  await planReply({ jid: JID, text: "/search econ", id: "m1", quotedId: null }, api, { chats });
  await planReply({ jid: JID, text: "/next", id: "m2", quotedId: null }, api, { chats });
  assert.deepEqual(api.searches, ["econ", "econ"]);
  assert.deepEqual(api.offsets, [0, PAGE_SIZE]);
});

test("a quoted BUY resolves the card and buys that course", async () => {
  let bought: { courseCode?: string; messageId?: string } | undefined;
  const api = fakeApi({
    resolveCard: async () => ({ code: "ECN 101", slug: "ecn-101", title: ECN.title }),
    purchase: async (_jid, target) => {
      bought = target;
      return { kind: "free" };
    },
  });
  const reply = await planReply({ jid: JID, text: "buy", id: "m3", quotedId: "card-1" }, api, { chats: new Map() });
  assert.equal(bought?.courseCode, "ECN 101");
  assert.match(reply?.text ?? "", /free/);
});

test("a quiz runs from letter answers to a submitted result", async () => {
  let submitted: { attemptId: number; answers: { questionId: number; selectedIndex: number | null }[] } | undefined;
  const api = fakeApi({
    startQuiz: async () => ({
      attemptId: 7,
      courseTitle: ECN.title,
      questions: [
        { questionId: 11, prompt: "First?", options: ["x", "y"] },
        { questionId: 12, prompt: "Second?", options: ["x", "y"] },
      ],
    }),
    submitQuiz: async (_jid, attemptId, answers) => {
      submitted = { attemptId, answers };
      return {
        score: 1,
        totalMarks: 2,
        percentage: 50,
        passed: false,
        passScore: 60,
        correctCount: 1,
        totalQuestions: 2,
        courseTitle: ECN.title,
      };
    },
  });
  const chats = new Map();
  const options = { chats };
  const start = await planReply({ jid: JID, text: "/quiz ECN101", id: "q0", quotedId: null }, api, options);
  assert.match(start?.text ?? "", /Question 1 of 2/);
  await planReply({ jid: JID, text: "A", id: "q1", quotedId: null }, api, options);
  await planReply({ jid: JID, text: "B", id: "q2", quotedId: null }, api, options);
  const result = await planReply({ jid: JID, text: "/submit", id: "q3", quotedId: null }, api, options);
  assert.equal(submitted?.attemptId, 7);
  assert.deepEqual(submitted?.answers, [
    { questionId: 11, selectedIndex: 0 },
    { questionId: 12, selectedIndex: 1 },
  ]);
  assert.match(result?.text ?? "", /Score: 1\/2 \(50%\)/);
});

test("formatPrice shows Free for zero", () => {
  assert.equal(formatPrice(0), "Free");
  assert.equal(formatPrice(500_000, "NGN"), "NGN 5,000");
});
