/**
 * Every typed command must begin with "/". Anything else is ordinary chat and
 * is never treated as a command (so "hello", "search" or "B" stay plain text).
 */
export const COMMANDS = [
  "start",
  "help",
  "menu",
  "login",
  "logout",
  "search",
  "courses",
  "course",
  "mycourses",
  "buy",
  "pay",
  "verify",
  "quiz",
  "next",
  "prev",
  "answer",
  "progress",
  "submit",
  "resume",
  "cancel",
  "results",
  "review",
  "history",
] as const;

export type CommandName = (typeof COMMANDS)[number];

export type ParsedCommand =
  | { kind: "none" }
  | { kind: "command"; name: CommandName; args: string[]; raw: string }
  | { kind: "unknown"; name: string; raw: string }
  | { kind: "invalid"; name: CommandName; usage: string; raw: string };

/** Usage strings for commands that take arguments. */
export const USAGE: Partial<Record<CommandName, string>> = {
  search: "/search [query]  e.g. /search economics",
  course: "/course [course_code]  e.g. /course ECN101",
  buy: "/buy [course_code]  e.g. /buy ECN101",
  pay: "/pay [course_code]  e.g. /pay ECN101",
  verify: "/verify [reference]  e.g. /verify qz_123abc",
  quiz: "/quiz [course_code]  e.g. /quiz ECN101",
  answer: "/answer [option]  e.g. /answer B",
  review: "/review [attempt_id]  e.g. /review 42",
};

/** Commands that accept an argument, and whether that argument is required. */
const REQUIRES_ARG = new Set<CommandName>(["course", "buy", "pay", "verify", "quiz", "answer", "review"]);

const COMMAND_SET = new Set<string>(COMMANDS);

/**
 * Parses one incoming text message. Leading/trailing whitespace is tolerated,
 * the command name is case-insensitive, and arguments are split on whitespace.
 */
export function parseCommand(text: string): ParsedCommand {
  const trimmed = text.trim();
  if (!trimmed.startsWith("/")) return { kind: "none" };

  const [head = "", ...args] = trimmed.slice(1).split(/\s+/).filter(Boolean);
  const name = head.toLowerCase();

  if (!COMMAND_SET.has(name)) {
    return { kind: "unknown", name, raw: trimmed };
  }

  const command = name as CommandName;
  if (REQUIRES_ARG.has(command) && args.length === 0) {
    return { kind: "invalid", name: command, usage: USAGE[command] ?? `/${command}`, raw: trimmed };
  }
  return { kind: "command", name: command, args, raw: trimmed };
}

/**
 * Normalises a course code for lookup: removes whitespace and uppercases, so
 * "ecn 101", "ECN101" and "Ecn-101" are not all treated alike; only spaces are
 * ignored, matching the website's code search.
 */
export function normaliseCourseCode(input: string): string {
  return input.replace(/\s+/g, "").toUpperCase();
}
