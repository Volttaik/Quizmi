import { ApiError, type BotCourse, type BotCourseDetail, type QuizmiApi, type QuizStart } from "../api-client.js";
import { normaliseCourseCode, parseCommand } from "./parse.js";
import type { IncomingMessage, OutgoingReply } from "../whatsapp/connection.js";

const MENU = [
  "*QuizMe* 📚",
  "/search [query] – find courses",
  "/courses – browse popular courses",
  "/course [code] – course details",
  "/login – link your QuizMe account",
  "/mycourses – your purchased courses",
  "/quiz [code] – start a timed quiz",
  "/help – show this menu",
  "Reply to a course card with BUY, DETAILS or QUIZ to act on that course.",
].join("\n");

export const PAGE_SIZE = 5;

export function formatPrice(priceKobo: number, currency = "NGN"): string {
  if (!priceKobo || priceKobo <= 0) return "Free";
  const amount = (priceKobo / 100).toLocaleString("en-NG", { maximumFractionDigits: 2 });
  return `${currency} ${amount}`;
}

function courseLine(course: BotCourse): string {
  const code = course.code ? `${course.code} · ` : "";
  return `• ${code}${course.title} – ${formatPrice(course.priceKobo, course.currency)}`;
}

export function formatCourseList(courses: BotCourse[], heading: string): string {
  if (courses.length === 0) return "No courses found. Try /courses to browse.";
  return [heading, ...courses.map(courseLine)].join("\n");
}

/** A single course as a card: name, code, description, price, link, and quoting hints. */
export function formatCourseCard(course: BotCourse): string {
  const lines = [
    `*${course.title}*${course.code ? ` (${course.code})` : ""}`,
    course.subject ? `Subject: ${course.subject}` : null,
    `Price: ${formatPrice(course.priceKobo, course.currency)}`,
    `Questions: ${course.questionCount}`,
    `Pass mark: ${course.passScore}%`,
  ].filter((line): line is string => line !== null);
  if (course.description) lines.push("", course.description);
  lines.push("", course.url);
  lines.push("Reply to this with BUY, DETAILS or QUIZ.");
  return lines.join("\n");
}

export function formatCourseDetail(course: BotCourseDetail): string {
  const lines = [
    `*${course.title}*${course.code ? ` (${course.code})` : ""}`,
    course.subject ? `Subject: ${course.subject}` : null,
    `Price: ${formatPrice(course.priceKobo, course.currency)}`,
    `Questions: ${course.questionCount}`,
    course.durationMinutes ? `Time: ${course.durationMinutes} min` : null,
    `Pass mark: ${course.passScore}%`,
  ].filter((line): line is string => line !== null);
  if (course.description) lines.push("", course.description);
  if (course.chapters.length > 0) {
    lines.push("", "Chapters:");
    for (const chapter of course.chapters) {
      lines.push(`${chapter.number}. ${chapter.title} (${chapter.questionCount})`);
    }
  }
  return lines.join("\n");
}

export function formatQuestion(index: number, total: number, question: QuizStart["questions"][number]): string {
  const letters = ["A", "B", "C", "D", "E", "F", "G", "H"];
  const options = question.options.map((option, i) => `${letters[i] ?? i + 1}. ${option}`);
  return [`Question ${index + 1} of ${total}`, question.prompt, ...options, "Reply with a letter, e.g. /answer B"].join("\n");
}

const UNAVAILABLE = "QuizMe is unavailable right now. Please try again in a moment.";

/** Per-chat state. Pagination and the open quiz live here; restarting the bot ends an open quiz. */
export type ChatState = {
  /** Last search and the next offset, for /next. */
  browse?: { query: string | undefined; offset: number };
  quiz?: {
    courseCode: string;
    attemptId: number;
    questions: QuizStart["questions"];
    answers: Map<number, number | null>;
    index: number;
  };
};

export type ReplyOptions = {
  /** Shared across messages so /next and quizzes survive between messages. */
  chats: Map<string, ChatState>;
};

function chatState(chats: Map<string, ChatState>, jid: string): ChatState {
  let state = chats.get(jid);
  if (!state) {
    state = {};
    chats.set(jid, state);
  }
  return state;
}

/** Text-only entry point: returns the reply text, or null for ordinary chat. */
export async function routeMessage(
  text: string,
  jid: string,
  api: QuizmiApi,
  options: ReplyOptions = { chats: new Map() }
): Promise<string | null> {
  const reply = await planReply({ jid, text, id: "", quotedId: null }, api, options);
  return reply?.text ?? null;
}

/** Full reply for an incoming message, including course cards to send and record. */
export async function planReply(message: IncomingMessage, api: QuizmiApi, options: ReplyOptions): Promise<OutgoingReply> {
  const { text, jid } = message;
  const state = chatState(options.chats, jid);

  // Quoted-reply actions act on the course the student replied to.
  if (message.quotedId && !text.trim().startsWith("/")) {
    const action = text.trim().toUpperCase();
    if (action === "BUY" || action === "DETAILS" || action === "QUIZ" || action === "OPEN") {
      try {
        const card = await api.resolveCard(jid, message.quotedId);
        if (!card) return { text: "I could not find that course. Send /courses to browse again." };
        if (action === "DETAILS" || action === "OPEN") {
          const detail = card.code ? await api.getCourse(normaliseCourseCode(card.code)) : null;
          return { text: detail ? formatCourseDetail(detail) : `Course: ${card.title}` };
        }
        if (action === "BUY") return { text: await buyText(jid, api, { courseCode: card.code ?? undefined }) };
        return startQuizFor(jid, card.code ?? "", api, state);
      } catch (error) {
        return errorReply(error);
      }
    }
  }

  // An open quiz takes single-letter answers as plain text.
  if (state.quiz && !text.trim().startsWith("/")) {
    const letter = text.trim().toUpperCase();
    if (/^[A-H]$/.test(letter)) return { text: recordAnswer(state, letter) };
  }

  const parsed = parseCommand(text);
  if (parsed.kind === "none") return null;
  if (parsed.kind === "unknown") return { text: `Unknown command /${parsed.name}.\n\n${MENU}` };
  if (parsed.kind === "invalid") return { text: `Usage: ${parsed.usage}` };

  try {
    switch (parsed.name) {
      case "start":
      case "help":
      case "menu":
        return { text: MENU };
      case "search":
      case "courses": {
        const query = parsed.name === "search" ? parsed.args.join(" ") || undefined : undefined;
        state.browse = { query, offset: 0 };
        return await browsePage(api, state, jid);
      }
      case "next": {
        if (!state.browse) return { text: "Search or browse first, e.g. /courses." };
        state.browse.offset += PAGE_SIZE;
        return await browsePage(api, state, jid);
      }
      case "course": {
        const code = normaliseCourseCode(parsed.args.join(" "));
        const course = await api.getCourse(code);
        return { text: course ? formatCourseDetail(course) : `No course found for ${parsed.args.join(" ")}.` };
      }
      case "buy":
      case "pay":
        return { text: await buyText(jid, api, { courseCode: normaliseCourseCode(parsed.args.join(" ")) }) };
      case "quiz":
        return startQuizFor(jid, normaliseCourseCode(parsed.args.join(" ")), api, state);
      case "answer": {
        if (!state.quiz) return { text: "No quiz is open. Start one with /quiz [code]." };
        return { text: recordAnswer(state, parsed.args.join(" ").trim().toUpperCase()) };
      }
      case "submit":
        return { text: await submitQuiz(jid, api, state) };
      case "login": {
        const started = await api.startLink(jid);
        if (started.status === "already_linked") {
          return { text: "This number is already linked to a QuizMe account. Send /mycourses to see your courses." };
        }
        return {
          text: [
            "Open this link on your phone or computer, sign in to QuizMe, and confirm. It works once and expires in 10 minutes:",
            started.url,
          ].join("\n"),
        };
      }
      case "mycourses": {
        const status = await api.accountStatus(jid);
        if (!status.linked) return { text: "Your WhatsApp is not linked yet. Send /login to start." };
        const courses = status.courses ?? [];
        if (courses.length === 0) return { text: `Hi ${status.name}. You have no purchased courses yet. Try /courses.` };
        return {
          text: [
            `Hi ${status.name}. Your courses:`,
            ...courses.map((c) => `• ${c.code ? `${c.code} · ` : ""}${c.title}`),
          ].join("\n"),
        };
      }
      case "logout": {
        const unlinked = await api.unlink(jid);
        return {
          text: unlinked
            ? "Unlinked. Your QuizMe account and progress are kept. Send /login to link again."
            : "This number is not linked.",
        };
      }
      default:
        return { text: `/${parsed.name} is coming soon.` };
    }
  } catch (error) {
    return errorReply(error);
  }
}

function errorReply(error: unknown): OutgoingReply {
  if (error instanceof ApiError && error.status === 401) {
    return { text: "The bot is not authorised to reach QuizMe. Please contact support." };
  }
  if (error instanceof ApiError && error.status === 403) return { text: error.message };
  return { text: UNAVAILABLE };
}

/**
 * Sends one page of results. Each course is sent as its own card, so each card
 * is recorded and can be quoted. The card text and image come from the API.
 */
async function browsePage(api: QuizmiApi, state: ChatState, jid: string): Promise<OutgoingReply> {
  void jid;
  const browse = state.browse ?? { query: undefined, offset: 0 };
  const courses = await api.searchCourses(browse.query, browse.offset);
  if (courses.length === 0) return { text: "No more courses. Try /search [query] or /courses to start again." };
  const heading = browse.query ? `Results for "${browse.query}":` : "Popular courses:";
  return {
    text: `${formatCourseList(courses, heading)}\n\nSend /next for more.`,
    cards: courses.map((course) => ({
      text: formatCourseCard(course),
      image: course.coverImageUrl ?? undefined,
      courseCode: course.code ?? undefined,
    })),
  };
}

async function buyText(jid: string, api: QuizmiApi, target: { courseCode?: string; messageId?: string }): Promise<string> {
  const link = await api.purchase(jid, target);
  if (link.kind === "redirect") {
    return `Complete your payment here. Access is granted once Paystack confirms it:\n${link.url}`;
  }
  if (link.kind === "owned") return "You already own this course. Send /mycourses to see it.";
  return "This course is free. Start it with /quiz.";
}

async function startQuizFor(jid: string, courseCode: string, api: QuizmiApi, state: ChatState): Promise<OutgoingReply> {
  if (!courseCode) return { text: "Usage: /quiz [course_code]  e.g. /quiz ECN101" };
  try {
    const quiz = await api.startQuiz(jid, courseCode);
    state.quiz = {
      courseCode,
      attemptId: quiz.attemptId,
      questions: quiz.questions,
      answers: new Map(),
      index: 0,
    };
    const first = quiz.questions[0];
    if (!first) return { text: "This course has no questions yet." };
    return {
      text: [`Starting *${quiz.courseTitle}*. Answer with a letter, then send /submit when finished.`, formatQuestion(0, quiz.questions.length, first)].join("\n\n"),
    };
  } catch (error) {
    return errorReply(error);
  }
}

function recordAnswer(state: ChatState, letter: string): string {
  const quiz = state.quiz;
  if (!quiz) return "No quiz is open. Start one with /quiz [code].";
  const index = letter.charCodeAt(0) - 65;
  const question = quiz.questions[quiz.index];
  if (!question) return "You have reached the last question. Send /submit to finish.";
  if (index < 0 || index >= question.options.length) return `Choose a letter from A to ${String.fromCharCode(64 + question.options.length)}.`;
  quiz.answers.set(question.questionId, index);
  if (quiz.index + 1 < quiz.questions.length) {
    quiz.index += 1;
    const next = quiz.questions[quiz.index];
    return formatQuestion(quiz.index, quiz.questions.length, next!);
  }
  return "That was the last question. Send /submit to finish.";
}

async function submitQuiz(jid: string, api: QuizmiApi, state: ChatState): Promise<string> {
  const quiz = state.quiz;
  if (!quiz) return "No quiz is open. Start one with /quiz [code].";
  const answers = quiz.questions.map((q) => ({
    questionId: q.questionId,
    selectedIndex: quiz.answers.get(q.questionId) ?? null,
  }));
  try {
    const result = await api.submitQuiz(jid, quiz.attemptId, answers);
    state.quiz = undefined;
    return [
      `*${result.courseTitle}* – result`,
      `Score: ${result.score}/${result.totalMarks} (${result.percentage}%)`,
      `Correct: ${result.correctCount} of ${result.totalQuestions}`,
      result.passed ? `Passed. Pass mark is ${result.passScore}%.` : `Not passed. Pass mark is ${result.passScore}%.`,
    ].join("\n");
  } catch (error) {
    return errorReply(error)?.text ?? UNAVAILABLE;
  }
}
