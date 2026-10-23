export const TIMER_OPTIONS = [10, 20, 30, 40, 50, 60] as const;

/** Supported timer choices in minutes. `null` means unlimited. */
export const DURATION_OPTIONS: ReadonlyArray<{ minutes: number | null; label: string }> = [
  ...TIMER_OPTIONS.map((minutes) => ({ minutes, label: `${minutes} minutes` })),
  { minutes: null, label: "Unlimited time" },
];

export const DEFAULT_DURATION_MINUTES = 30;
export const DEFAULT_QUESTION_COUNT = 20;
export const MAX_QUESTIONS_PER_ATTEMPT = 1000;
export const QUESTION_COUNT_PRESETS = [10, 20, 25, 30, 40, 50, 60, 80, 100];

/** Departures after which an attempt is terminated by the server. */
export const MAX_DEPARTURES = 3;

/** Two browser events for one navigation are recorded once within this window. */
export const DEPARTURE_DEDUPE_MS = 4000;

export function isSupportedDuration(value: unknown): value is number | null {
  if (value === null) return true;
  return typeof value === "number" && (TIMER_OPTIONS as readonly number[]).includes(value);
}
