/**
 * Quiz feedback sound layer — ported from Lumio.
 *
 * Positive and negative feedback uses the recorded voice clips served from
 * `public/audio/`. A tiny Web Audio fallback covers the neutral UI cues — and
 * any environment where a clip cannot be played — so audio never breaks the
 * quiz.
 */
export type Cue = "correct" | "wrong" | "streak3" | "streak5" | "tap" | "complete";

/**
 * Bump this whenever the clips in `public/audio/` are regenerated: the version
 * is part of the URL, so a cached delivery is never silently replayed.
 */
const CLIP_VERSION = "3";

/** Recorded clips. Files live in `public/audio/` and are committed. */
export const CLIP_URLS: Partial<Record<Cue, string>> = {
  correct: `/audio/correct.mp3?v=${CLIP_VERSION}`,
  wrong: `/audio/wrong.mp3?v=${CLIP_VERSION}`,
  streak3: `/audio/very-good.mp3?v=${CLIP_VERSION}`,
  streak5: `/audio/youre-on-fire.mp3?v=${CLIP_VERSION}`,
};

/**
 * The single feedback cue for an answer, derived from that answer's result and
 * the consecutive-correct streak after the answer is counted.
 *
 *   1 correct   → "Correct!"
 *   5 correct   → "Very good."
 *  10 correct   → "You're on fire!"
 *
 * A wrong answer always plays the wrong cue and resets the streak, so a
 * milestone can only be reached by consecutive correct answers.
 */
export function feedbackCue(correct: boolean, currentStreak: number): Cue {
  if (!correct) return "wrong";
  if (currentStreak === 10) return "streak5";
  if (currentStreak === 5) return "streak3";
  return "correct";
}

let ctx: AudioContext | null = null;
let busyUntil = 0;
const clipCache = new Map<Cue, HTMLAudioElement>();

function clipFor(cue: Cue): HTMLAudioElement | null {
  const url = CLIP_URLS[cue];
  if (!url || typeof window === "undefined" || typeof window.Audio === "undefined") return null;
  let element = clipCache.get(cue);
  if (!element) {
    element = new window.Audio(url);
    element.preload = "auto";
    element.load();
    clipCache.set(cue, element);
  }
  return element;
}

/** Warm the clip cache so feedback is immediate. Safe before a user gesture. */
export function preloadClips() {
  (Object.keys(CLIP_URLS) as Cue[]).forEach((cue) => {
    clipFor(cue);
  });
}

/**
 * Create/resume the audio context. Must be called from a user gesture at least
 * once per session (browsers block audio otherwise). Wiring this to the quiz's
 * Start action and to every answer tap keeps playback reliable.
 */
export function unlockAudio() {
  preloadClips();
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AC) ctx = new AC();
  }
  if (ctx?.state === "suspended") void ctx.resume().catch(() => {});
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = "sine", vol = 0.12) {
  if (!ctx) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  const t = ctx.currentTime + start;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

/** Synthesized fallback, used for tap/complete and if a clip cannot play. */
function synth(cue: Cue) {
  if (!ctx) return;
  switch (cue) {
    case "correct":
      tone(660, 0, 0.18);
      tone(990, 0.09, 0.28);
      break;
    case "wrong":
      tone(220, 0, 0.22, "triangle", 0.1);
      tone(180, 0.12, 0.3, "triangle", 0.08);
      break;
    case "streak3":
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.05 + i * 0.09, 0.3, "sine", 0.1));
      break;
    case "streak5":
      [523, 659, 784, 1047, 1319, 1568].forEach((f, i) =>
        tone(f, 0.05 + i * 0.07, 0.35, "triangle", 0.09)
      );
      break;
    case "complete":
      [392, 523, 659].forEach((f, i) => tone(f, i * 0.12, 0.5, "sine", 0.09));
      break;
    case "tap":
      tone(880, 0, 0.06, "sine", 0.05);
      break;
  }
}

export function play(cue: Cue) {
  unlockAudio();

  const clip = clipFor(cue);
  if (clip) {
    try {
      clip.currentTime = 0;
    } catch {
      /* not seekable yet — playing from the start anyway */
    }
    const started = clip.play();
    if (started && typeof started.catch === "function") {
      started.catch(() => {
        // Blocked or unsupported: fall back to a synthesized cue rather than
        // letting an audio failure surface in the quiz.
        synth(cue);
      });
    }
    return;
  }

  const now = typeof performance !== "undefined" ? performance.now() : Date.now();
  if (now < busyUntil) return;
  synth(cue);
  if (cue === "correct") busyUntil = now + 1100;
  else if (cue === "wrong") busyUntil = now + 1200;
  else if (cue === "streak3") busyUntil = now + 1400;
  else if (cue === "streak5") busyUntil = now + 1700;
  else if (cue === "complete") busyUntil = now + 800;
}
