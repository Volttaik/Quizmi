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

  return { questionCount, durationMinutes, resultMode };
}

export function preferencesToQuery(preferences: AssessmentPreferences): string {
  const params = new URLSearchParams({
    count: String(preferences.questionCount),
    duration: preferences.durationMinutes === null ? "unlimited" : String(preferences.durationMinutes),
    mode: preferences.resultMode,
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
      !isSupportedResultMode(parsed.resultMode)
    ) {
      return null;
    }
    return {
      questionCount: Number(parsed.questionCount),
      durationMinutes: parsed.durationMinutes ?? null,
      resultMode: parsed.resultMode,
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
