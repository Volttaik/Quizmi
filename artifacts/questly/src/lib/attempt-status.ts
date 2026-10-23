/**
 * The single definition of an attempt's lifecycle status.
 *
 * The database stores a free-form `status` string, so these rules are the only
 * guard against one part of the app calling an attempt "completed" while
 * another calls it "in progress". Everything — scoring, analytics, history and
 * the results page — reads its answer from this module.
 *
 * Statuses
 * ────────
 * `in_progress`    The learner is still taking the attempt (or it is a live
 *                  draft whose timer has not run out).
 * `submitted`      The learner finished the attempt themselves.
 * `expired`        The timer ran out and the saved draft was auto-submitted.
 * `terminated`     The departure policy ended the attempt.
 * `not_submitted`  The attempt was opened but abandoned, or it closed with no
 *                  recorded answer at all. There is no score and it must never
 *                  be counted as a completed attempt.
 *
 * Only the three graded statuses carry a score. `not_submitted` deliberately
 * does not, which is what prevents abandoned quizzes from showing up as
 * misleading 0% results and dragging analytics down to zero.
 */

export const ATTEMPT_STATUSES = [
  "in_progress",
  "submitted",
  "expired",
  "terminated",
  "not_submitted",
] as const;

export type AttemptStatus = (typeof ATTEMPT_STATUSES)[number];

/** Statuses that carry a real, server-computed score. */
export const GRADED_ATTEMPT_STATUSES = ["submitted", "expired", "terminated"] as const;

export type GradedAttemptStatus = (typeof GRADED_ATTEMPT_STATUSES)[number];

export function isAttemptStatus(value: unknown): value is AttemptStatus {
  return typeof value === "string" && (ATTEMPT_STATUSES as readonly string[]).includes(value);
}

export function isGradedStatus(status: unknown): status is GradedAttemptStatus {
  return typeof status === "string" && (GRADED_ATTEMPT_STATUSES as readonly string[]).includes(status);
}

export function isOpenStatus(status: unknown): status is "in_progress" {
  return status === "in_progress";
}

/** Only graded attempts have a result, a score or a review. */
export function hasResult(status: unknown): status is GradedAttemptStatus {
  return isGradedStatus(status);
}

/** True when an attempt with this status counts towards analytics. */
export function countsTowardAnalytics(status: unknown): boolean {
  return isGradedStatus(status);
}

export type AttemptStatusMeta = {
  label: string;
  /** Short explanation used in history rows and the results page. */
  description: string;
  /** Tailwind classes for the badge, matching the app's soft-tint palette. */
  className: string;
};

const STATUS_META: Record<AttemptStatus, AttemptStatusMeta> = {
  in_progress: {
    label: "In progress",
    description: "This attempt is still open.",
    className: "border-accent/30 bg-accent-soft text-accent-soft-foreground",
  },
  submitted: {
    label: "Submitted",
    description: "You submitted this attempt.",
    className: "border-success/25 bg-success-soft text-success-soft-foreground",
  },
  expired: {
    label: "Time expired",
    description: "The timer ran out and your saved answers were submitted.",
    className: "border-warning/25 bg-warning-soft text-warning-soft-foreground",
  },
  terminated: {
    label: "Stopped",
    description: "This attempt ended because you left the quiz.",
    className: "border-warning/25 bg-warning-soft text-warning-soft-foreground",
  },
  not_submitted: {
    label: "Not submitted",
    description: "This attempt was not submitted, so no score was recorded.",
    className: "border-border bg-surface-secondary text-muted-foreground",
  },
};

export function attemptStatusMeta(status: unknown): AttemptStatusMeta {
  return isAttemptStatus(status) ? STATUS_META[status] : STATUS_META.not_submitted;
}
