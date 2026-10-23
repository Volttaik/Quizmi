import {
  DEFAULT_DURATION_MINUTES,
  DEFAULT_RESULT_MODE,
  isSupportedDuration,
  isSupportedResultMode,
  MAX_QUESTIONS_PER_ATTEMPT,
  type ResultMode,
} from "@/lib/course-config";

/**
 * Preferences chosen on the configuration screen. They live in the URL while
 * the learner moves between configuration and instructions, and in
 * sessionStorage so a refresh on the instructions screen does not lose them.
 * The attempt itself is only created on Start Assessment.
 */
export type AssessmentPreferences = {
  questionCount: number;
  durationMinutes: number | null;
  resultMode: ResultMode;
  /** null = the whole course; a number = one chapter to practise. */
  chapterNumber: number | null;
};

const STORAGE_PREFIX = "quizmi:assessment-preferences:";

function clampCount(value: number, available: number): number {
  return Math.max(1, Math.min(Math.floor(value), available));
}

export function defaultPreferences(
  available: number,
  suggestedDurationMinutes: number | null
): AssessmentPreferences {
  const duration =
    isSupportedDuration(suggestedDurationMinutes) && suggestedDurationMinutes !== null
      ? suggestedDurationMinutes
      : DEFAULT_DURATION_MINUTES;
  return {
    questionCount: Math.max(1, Math.min(20, available || 1)),
    durationMinutes: duration,
    resultMode: DEFAULT_RESULT_MODE,
    chapterNumber: null,
  };
}

/** Reads preferences from a query string, falling back to safe defaults. */
export function preferencesFromSearch(
  search: string,
  available: number,
  fallback: AssessmentPreferences
): AssessmentPreferences {
  const params = new URLSearchParams(search);
  const cap = Math.max(1, Math.min(available, MAX_QUESTIONS_PER_ATTEMPT));

  const rawCount = Number(params.get("count"));
  const questionCount =
    Number.isInteger(rawCount) && rawCount >= 1 ? clampCount(rawCount, cap) : clampCount(fallback.questionCount, cap);

  const rawDuration = params.get("duration");
  let durationMinutes: number | null = fallback.durationMinutes;
  if (rawDuration === "unlimited") {
    durationMinutes = null;
  } else if (rawDuration !== null && rawDuration !== "") {
    const parsed = Number(rawDuration);
    if (isSupportedDuration(parsed)) durationMinutes = parsed;
  }

  const rawMode = params.get("mode");
  const resultMode = isSupportedResultMode(rawMode) ? rawMode : fallback.resultMode;

  // "chapter=3" narrows the attempt to one chapter; "chapter=all", an empty
  // value or an absent key means the whole course. Callers that know the
  // course's chapters re-validate the number and re-clamp the count.
  const rawChapter = params.get("chapter");
  let chapterNumber: number | null = fallback.chapterNumber ?? null;
  if (rawChapter === "all" || rawChapter === "") {
    chapterNumber = null;
  } else if (rawChapter !== null) {
    const parsedChapter = Number(rawChapter);
    chapterNumber =
      Number.isInteger(parsedChapter) && parsedChapter >= 1
        ? parsedChapter
        : (fallback.chapterNumber ?? null);
  }

  return { questionCount, durationMinutes, resultMode, chapterNumber };
}

export function preferencesToQuery(preferences: AssessmentPreferences): string {
  const params = new URLSearchParams({
    count: String(preferences.questionCount),
    duration: preferences.durationMinutes === null ? "unlimited" : String(preferences.durationMinutes),
    mode: preferences.resultMode,
    chapter: preferences.chapterNumber === null ? "all" : String(preferences.chapterNumber),
  });
  return params.toString();
}

export function readStoredPreferences(slug: string): AssessmentPreferences | null {
  if (typeof window === "undefined" || !slug) return null;
  try {
    const raw = window.sessionStorage.getItem(`${STORAGE_PREFIX}${slug}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AssessmentPreferences>;
    if (
      !Number.isInteger(parsed.questionCount) ||
      !(parsed.durationMinutes === null || isSupportedDuration(parsed.durationMinutes)) ||
      !isSupportedResultMode(parsed.resultMode) ||
      !(parsed.chapterNumber === null ||
        (Number.isInteger(parsed.chapterNumber) && (parsed.chapterNumber as number) >= 1))
    ) {
      return null;
    }
    return {
      questionCount: Number(parsed.questionCount),
      durationMinutes: parsed.durationMinutes ?? null,
      resultMode: parsed.resultMode,
      chapterNumber: parsed.chapterNumber ?? null,
    };
  } catch {
    return null;
  }
}

export function savePreferences(slug: string, preferences: AssessmentPreferences): void {
  if (typeof window === "undefined" || !slug) return;
  try {
    window.sessionStorage.setItem(`${STORAGE_PREFIX}${slug}`, JSON.stringify(preferences));
  } catch {
    // Storage can be unavailable in private modes; the URL still carries them.
  }
}
