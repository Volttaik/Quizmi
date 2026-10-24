/**
 * SOC 105 – Elements of Scientific Thoughts content ingestion.
 *
 * Reads the source bank at scripts/content/soc105-questions.txt (1,000
 * questions across 16 chapters, each with options, a correct answer and an
 * explanation), validates it against the answer index printed at the end of
 * the file, then writes the course row and every question into Turso.
 *
 * The script is idempotent: re-running it updates the course and replaces its
 * questions instead of duplicating course or question rows.
 *
 *   Parse and validate only, no database writes:
 *     pnpm --filter @workspace/scripts run ingest:soc105 -- --parse-only
 *
 *   Parse, validate and write to Turso:
 *     pnpm --filter @workspace/scripts run ingest:soc105
 *
 *   Reprice an existing row:
 *     pnpm --filter @workspace/scripts run ingest:soc105 -- --price-kobo 50000
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createClient } from "@libsql/client";
import "./env";

const SOURCE_FILE = fileURLToPath(
  new URL("../content/soc105-questions.txt", import.meta.url)
);

export const COURSE = {
  slug: "soc-105-elements-of-scientific-thoughts",
  title: "SOC 105 – Elements of Scientific Thoughts",
  code: "SOC 105",
  description:
    "An introductory course exploring scientific thinking, the scientific method, the principles of scientific knowledge, and the development of sociology as a science. Topics include objectivity, evidence-based reasoning, major sociological thinkers, scientific research methods, and the limitations of studying human society scientifically.",
  subject: "Sociology",
  difficulty: "medium",
  /** ₦1000. Prices are stored in kobo so the Paystack amount is an integer. */
  priceKobo: 100_000,
  currency: "NGN",
  passScore: 50,
  maxAttempts: null as number | null,
  durationMinutes: 60,
  isPublished: 1,
  featured: 1,
  /** Served from the app's public directory; verified by the app's <img> tags. */
  coverImageUrl: "/soc105/banner.webp",
} as const;

const EXPECTED_CHAPTERS = 16;
const EXPECTED_QUESTIONS = 1000;
const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"];

export type ParsedQuestion = {
  number: number;
  chapterNumber: number;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

export type ParsedChapter = {
  number: number;
  title: string;
  questions: ParsedQuestion[];
};

/* ── Parsing ─────────────────────────────────────────────────────────────── */

// This bank's table of contents prints ranges as "(001-063)" — the optional
// "Questions" word is accepted so the parser matches both styles used by the
// existing banks.
const TOC_LINE = /^Chapter (\d+): (.+?) \((?:Questions )?(\d+)-(\d+)\)$/;
const CHAPTER_HEADER = /^CHAPTER (\d+): (.+)$/;
const QUESTION_START = /^Question (\d{1,4})\.\s+(.*)$/;
const OPTION_LINE = /^([A-F])\.\s+(.*)$/;
const ANSWER_LINE = /^Correct Answer:\s*([A-F])\s*$/;
const EXPLANATION_START = /^Explanation:\s*(.*)$/;
const ANSWER_INDEX_MARKER = /^ANSWER INDEX/;
const RULE_LINE = /^={10,}$/;
const ANSWER_ENTRY = /(\d{3,4})-\s*([A-F])/g;

export function parseQuestionBank(source: string): {
  chapters: ParsedChapter[];
  answerIndex: Map<number, string>;
  orphanLines: string[];
} {
  const lines = source.split(/\r?\n/);

  // Chapter titles come from the table of contents (title case); the in-body
  // CHAPTER headers are shouty and are only used to switch chapters.
  const tocTitles = new Map<number, string>();
  const answerIndex = new Map<number, string>();
  const chaptersByNumber = new Map<number, ParsedChapter>();
  const orphanLines: string[] = [];
  const orderedQuestions: ParsedQuestion[] = [];

  let inAnswerIndex = false;
  let currentChapterNumber = 0;
  let current: {
    chapterNumber: number;
    number: number;
    promptParts: string[];
    options: { letter: string; text: string }[];
    answerLetter: string | null;
    explanationParts: string[];
    inExplanation: boolean;
  } | null = null;

  const flush = () => {
    if (!current) return;
    const { chapterNumber, number, promptParts, options, answerLetter, explanationParts } = current;

    if (options.length < 2) {
      throw new Error(`Question ${number}: expected at least 2 options, found ${options.length}`);
    }
    if (!answerLetter) throw new Error(`Question ${number}: missing "Correct Answer" line`);

    const correctIndex = OPTION_LETTERS.indexOf(answerLetter);
    if (correctIndex >= options.length) {
      throw new Error(`Question ${number}: answer ${answerLetter} has no matching option`);
    }

    orderedQuestions.push({
      number,
      chapterNumber,
      prompt: promptParts.join(" ").trim(),
      options: options.map((option) => option.text.trim()),
      correctIndex,
      explanation: explanationParts.join(" ").trim(),
    });
    current = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (ANSWER_INDEX_MARKER.test(line)) {
      flush();
      inAnswerIndex = true;
      continue;
    }

    if (inAnswerIndex) {
      // The index prints entries like "001-D  101-B" grouped per chapter;
      // the bare "Chapter N" spacers between groups are skipped.
      let match: RegExpExecArray | null;
      ANSWER_ENTRY.lastIndex = 0;
      while ((match = ANSWER_ENTRY.exec(line)) !== null) {
        answerIndex.set(Number(match[1]), match[2]);
      }
      continue;
    }

    const toc = TOC_LINE.exec(line);
    if (toc) {
      tocTitles.set(Number(toc[1]), toc[2].trim());
      continue;
    }

    const header = CHAPTER_HEADER.exec(line);
    if (header) {
      flush();
      currentChapterNumber = Number(header[1]);
      continue;
    }

    const question = QUESTION_START.exec(line);
    if (question) {
      flush();
      current = {
        chapterNumber: currentChapterNumber,
        number: Number(question[1]),
        promptParts: [question[2]],
        options: [],
        answerLetter: null,
        explanationParts: [],
        inExplanation: false,
      };
      continue;
    }

    if (!current) {
      // Document front matter and chapter preambles (question ranges, rules)
      // are not question content and are skipped.
      continue;
    }

    const option = OPTION_LINE.exec(line);
    if (option) {
      current.options.push({ letter: option[1], text: option[2] });
      current.inExplanation = false;
      continue;
    }

    const answer = ANSWER_LINE.exec(line);
    if (answer) {
      current.answerLetter = answer[1];
      current.inExplanation = false;
      continue;
    }

    // The ==== rule closes each chapter after its last question is read.
    if (RULE_LINE.test(line)) {
      flush();
      continue;
    }

    const explanation = EXPLANATION_START.exec(line);
    if (explanation) {
      current.explanationParts.push(explanation[1]);
      current.inExplanation = true;
      continue;
    }

    if (line.trim() === "") {
      current.inExplanation = false;
      continue;
    }

    // Continuation of a wrapped explanation; anything else is unexpected and
    // is reported by validation.
    if (current.inExplanation) {
      current.explanationParts.push(line.trim());
      continue;
    }
    orphanLines.push(line);
  }
  flush();

  for (const question of orderedQuestions) {
    let chapter = chaptersByNumber.get(question.chapterNumber);
    if (!chapter) {
      chapter = { number: question.chapterNumber, title: "", questions: [] };
      chaptersByNumber.set(question.chapterNumber, chapter);
    }
    chapter.questions.push(question);
  }

  const chapters = [...chaptersByNumber.values()].sort((a, b) => a.number - b.number);
  for (const chapter of chapters) {
    chapter.title = tocTitles.get(chapter.number) ?? `Chapter ${chapter.number}`;
  }

  return { chapters, answerIndex, orphanLines };
}

/* ── Validation ──────────────────────────────────────────────────────────── */

export function validate(
  chapters: ParsedChapter[],
  answerIndex: Map<number, string>,
  orphanLines: string[]
): void {
  const problems: string[] = [];

  if (chapters.length !== EXPECTED_CHAPTERS) {
    problems.push(`expected ${EXPECTED_CHAPTERS} chapters, parsed ${chapters.length}`);
  }

  const total = chapters.reduce((sum, chapter) => sum + chapter.questions.length, 0);
  if (total !== EXPECTED_QUESTIONS) {
    problems.push(`expected ${EXPECTED_QUESTIONS} questions, parsed ${total}`);
  }

  if (answerIndex.size !== EXPECTED_QUESTIONS) {
    problems.push(`answer index has ${answerIndex.size} entries, expected ${EXPECTED_QUESTIONS}`);
  }

  if (orphanLines.length > 0) {
    problems.push(
      `${orphanLines.length} unrecognised line(s), first: ${JSON.stringify(orphanLines[0])}`
    );
  }

  const seen = new Set<number>();
  for (const chapter of chapters) {
    if (chapter.questions.length === 0) problems.push(`chapter ${chapter.number} has no questions`);
    for (const question of chapter.questions) {
      if (seen.has(question.number)) problems.push(`duplicate question ${question.number}`);
      seen.add(question.number);
      // This bank has short review-style stems ("Scientific thought is:"),
      // so only flag near-empty prompts (likely a parser glitch).
      if (question.prompt.length < 6) {
        problems.push(`question ${question.number} has a suspiciously short prompt`);
      }
      if (question.options.length !== 4) {
        problems.push(
          `question ${question.number} has ${question.options.length} options, expected 4`
        );
      }
      if (question.correctIndex < 0 || question.correctIndex >= question.options.length) {
        problems.push(`question ${question.number} has an out-of-range correct index`);
      }
      if (question.explanation.length === 0) {
        problems.push(`question ${question.number} is missing its explanation`);
      }
      const indexed = answerIndex.get(question.number);
      if (!indexed) {
        problems.push(`question ${question.number} is missing from the answer index`);
      } else if (indexed !== OPTION_LETTERS[question.correctIndex]) {
        problems.push(
          `question ${question.number}: inline answer ${OPTION_LETTERS[question.correctIndex]} != answer index ${indexed}`
        );
      }
    }
  }

  for (let n = 1; n <= EXPECTED_QUESTIONS; n++) {
    if (!seen.has(n)) problems.push(`question ${n} is missing from the bank`);
  }

  if (problems.length > 0) {
    throw new Error(`question bank failed validation:\n  - ${problems.join("\n  - ")}`);
  }
}

/* ── Ingestion ───────────────────────────────────────────────────────────── */

async function ingest(chapters: ParsedChapter[], priceKobo: number): Promise<void> {
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) throw new Error("TURSO_DATABASE_URL is not set");
  const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });

  try {
    const hasTable = await client
      .execute("SELECT 1 FROM courses LIMIT 1")
      .then(() => true)
      .catch(() => false);
    if (!hasTable) throw new Error("courses table missing; run db:migrate first");

    const total = chapters.reduce((sum, chapter) => sum + chapter.questions.length, 0);

    // Re-runs update this course in place and replace its bank, so the slug,
    // course id, purchases and attempt history survive a re-import.
    const existing = await client.execute({
      sql: "SELECT id, price_kobo FROM courses WHERE slug = ?",
      args: [COURSE.slug],
    });
    const existingRow = existing.rows[0] as unknown as
      | { id: number; price_kobo: number }
      | undefined;
    const existed = Boolean(existingRow);

    let courseId: number;
    if (existingRow) {
      await client.execute({
        sql: `UPDATE courses SET
            title = ?, code = ?, description = ?, subject = ?, difficulty = ?,
            price_kobo = ?, currency = ?, pass_score = ?, max_attempts = ?,
            duration_minutes = ?, question_count = ?, is_published = ?, featured = ?,
            cover_image_url = ?, updated_at = (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
          WHERE id = ?`,
        args: [
          COURSE.title,
          COURSE.code,
          COURSE.description,
          COURSE.subject,
          COURSE.difficulty,
          priceKobo,
          COURSE.currency,
          COURSE.passScore,
          COURSE.maxAttempts,
          COURSE.durationMinutes,
          total,
          COURSE.isPublished,
          COURSE.featured,
          COURSE.coverImageUrl,
          existingRow.id,
        ],
      });
      await client.execute({
        sql: "DELETE FROM questions WHERE course_id = ?",
        args: [existingRow.id],
      });
      courseId = Number(existingRow.id);
      console.log(`updating existing course id=${courseId}`);
    } else {
      const inserted = await client.execute({
        sql: `INSERT INTO courses (
            slug, title, code, description, subject, difficulty,
            price_kobo, currency, pass_score, max_attempts,
            duration_minutes, question_count, is_published, featured, cover_image_url
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          RETURNING id`,
        args: [
          COURSE.slug,
          COURSE.title,
          COURSE.code,
          COURSE.description,
          COURSE.subject,
          COURSE.difficulty,
          priceKobo,
          COURSE.currency,
          COURSE.passScore,
          COURSE.maxAttempts,
          COURSE.durationMinutes,
          total,
          COURSE.isPublished,
          COURSE.featured,
          COURSE.coverImageUrl,
        ],
      });
      const row = inserted.rows[0];
      if (!row) throw new Error("course insert returned no row");
      courseId = Number(row.id);
      console.log(`created course id=${courseId}`);
    }

    const statements = chapters.flatMap((chapter) =>
      chapter.questions.map((question) => ({
        sql: `INSERT INTO questions (
            course_id, prompt, options, correct_index, explanation,
            marks, order_index, chapter_number, chapter_title
          ) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)`,
        args: [
          courseId,
          question.prompt,
          JSON.stringify(question.options),
          question.correctIndex,
          question.explanation,
          question.number - 1,
          chapter.number,
          chapter.title,
        ],
      }))
    );

    // libSQL batches are capped per call; write in page-sized chunks.
    const PAGE = 500;
    for (let offset = 0; offset < statements.length; offset += PAGE) {
      await client.batch(statements.slice(offset, offset + PAGE), "write");
    }

    // The bank is the source of truth; keep the cached catalogue count exact.
    await client.execute({
      sql: "UPDATE courses SET question_count = ? WHERE id = ?",
      args: [total, courseId],
    });

    console.log(`inserted ${total} questions across ${chapters.length} chapters`);
    console.log(
      `SOC 105 ${existed ? "updated" : "created"}: slug=${COURSE.slug}, course_id=${courseId}, price_kobo=${priceKobo}`
    );
  } finally {
    client.close();
  }
}

/* ── CLI ─────────────────────────────────────────────────────────────────── */

async function main() {
  const args = process.argv.slice(2);
  const parseOnly = args.includes("--parse-only");
  const priceFlag = args.indexOf("--price-kobo");
  const priceKobo = priceFlag >= 0 ? Number(args[priceFlag + 1]) : COURSE.priceKobo;
  if (!Number.isInteger(priceKobo) || priceKobo < 0) {
    throw new Error("--price-kobo must be a non-negative integer (kobo, 0 = free)");
  }

  const source = readFileSync(SOURCE_FILE, "utf8");
  const { chapters, answerIndex, orphanLines } = parseQuestionBank(source);
  validate(chapters, answerIndex, orphanLines);

  for (const chapter of chapters) {
    console.log(
      `chapter ${String(chapter.number).padStart(2, "0")} · ${chapter.questions.length} questions · ${chapter.title}`
    );
  }
  console.log(
    `validated ${chapters.reduce((sum, chapter) => sum + chapter.questions.length, 0)} questions with answers and explanations`
  );

  if (parseOnly) {
    console.log("parse-only: no database writes performed");
    return;
  }

  await ingest(chapters, priceKobo);
}

main().catch((error) => {
  console.error("SOC 105 ingestion failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
