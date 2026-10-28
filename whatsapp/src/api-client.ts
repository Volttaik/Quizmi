import type { Config } from "./config.js";

export type BotCourse = {
  code: string | null;
  slug: string;
  title: string;
  subject: string | null;
  description: string;
  priceKobo: number;
  currency: string;
  questionCount: number;
  durationMinutes: number | null;
  passScore: number;
  coverImageUrl: string | null;
  url: string;
};

export type BotCourseDetail = BotCourse & {
  chapters: { number: number; title: string; questionCount: number }[];
};

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string
  ) {
    super(message);
  }
}

export type LinkStart =
  | { status: "already_linked" }
  | { status: "pending"; url: string; expiresAt: string };

export type AccountStatus = {
  linked: boolean;
  name?: string;
  courses?: { code: string | null; slug: string; title: string; attemptsUsed: number; bestPercentage: number | null }[];
};

export type PurchaseLink =
  | { kind: "redirect"; url: string; reference: string }
  | { kind: "free" | "owned" };

export type QuizQuestion = { questionId: number; prompt: string; options: string[] };

export type QuizStart = {
  attemptId: number;
  courseTitle: string;
  questions: QuizQuestion[];
};

export type QuizResult = {
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  passScore: number;
  correctCount: number;
  totalQuestions: number;
  courseTitle: string;
};

export type QuizmiApi = {
  searchCourses(query: string | undefined, offset?: number): Promise<BotCourse[]>;
  getCourse(code: string): Promise<BotCourseDetail | null>;
  startLink(jid: string): Promise<LinkStart>;
  accountStatus(jid: string): Promise<AccountStatus>;
  unlink(jid: string): Promise<boolean>;
  recordCard(jid: string, messageId: string, courseCode: string): Promise<void>;
  resolveCard(jid: string, messageId: string): Promise<{ code: string | null; slug: string; title: string } | null>;
  purchase(jid: string, target: { courseCode?: string; messageId?: string }): Promise<PurchaseLink>;
  startQuiz(jid: string, courseCode: string): Promise<QuizStart>;
  submitQuiz(jid: string, attemptId: number, answers: { questionId: number; selectedIndex: number | null }[]): Promise<QuizResult>;
};

const TIMEOUT_MS = 10_000;

export function createApiClient(config: Pick<Config, "apiBaseUrl" | "apiKey">): QuizmiApi {
  async function call<T>(path: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(config.apiBaseUrl + path);
    for (const [key, value] of Object.entries(params ?? {})) url.searchParams.set(key, value);

    const response = await fetch(url, {
      headers: { authorization: `Bearer ${config.apiKey}`, accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    if (!response.ok) {
      throw new ApiError(response.status, body?.error ?? `HTTP ${response.status}`);
    }
    return body as T;
  }

  async function send<T>(method: "POST" | "PUT" | "DELETE", path: string, init: { query?: Record<string, string>; body?: unknown } = {}): Promise<T> {
    const url = new URL(config.apiBaseUrl + path);
    for (const [key, value] of Object.entries(init.query ?? {})) url.searchParams.set(key, value);
    const response = await fetch(url, {
      method,
      headers: {
        authorization: `Bearer ${config.apiKey}`,
        accept: "application/json",
        ...(init.body ? { "content-type": "application/json" } : {}),
      },
      body: init.body ? JSON.stringify(init.body) : undefined,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    if (!response.ok) throw new ApiError(response.status, body?.error ?? `HTTP ${response.status}`);
    return body as T;
  }

  return {
    async startLink(jid) {
      return send<LinkStart>("POST", "/whatsapp/api/v1/link", { body: { jid } });
    },
    async accountStatus(jid) {
      return call<AccountStatus>("/whatsapp/api/v1/account", { jid });
    },
    async unlink(jid) {
      const body = await send<{ unlinked: boolean }>("DELETE", "/whatsapp/api/v1/account", { query: { jid } });
      return body.unlinked;
    },
    async searchCourses(query, offset = 0) {
      const params: Record<string, string> = {};
      if (query) params.q = query;
      if (offset > 0) params.offset = String(offset);
      const body = await call<{ courses: BotCourse[] }>("/whatsapp/api/v1/courses", params);
      return body.courses;
    },
    async resolveCard(jid, messageId) {
      const body = await call<{ course: { code: string | null; slug: string; title: string } | null }>(
        "/whatsapp/api/v1/cards",
        { jid, messageId }
      );
      return body.course;
    },
    async recordCard(jid, messageId, courseCode) {
      await send<{ recorded: boolean }>("POST", "/whatsapp/api/v1/cards", { body: { jid, messageId, courseCode } });
    },
    async purchase(jid, target) {
      return send<PurchaseLink>("POST", "/whatsapp/api/v1/purchase", { body: { jid, ...target } });
    },
    async startQuiz(jid, courseCode) {
      return send<QuizStart>("POST", "/whatsapp/api/v1/quiz", { body: { jid, courseCode } });
    },
    async submitQuiz(jid, attemptId, answers) {
      return send<QuizResult>("PUT", "/whatsapp/api/v1/quiz", { body: { jid, attemptId, answers } });
    },
    async getCourse(code) {
      try {
        const body = await call<{ course: BotCourseDetail }>(
          `/whatsapp/api/v1/courses/${encodeURIComponent(code)}`
        );
        return body.course;
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) return null;
        throw error;
      }
    },
  };
}
