import QRCode from "qrcode";
import type { AttemptResult } from "@/lib/types";

/**
 * Renders a completed attempt into a shareable achievement graphic using the
 * real, server-persisted result. Everything drawn on the card — score,
 * percentage, marks, date, status — comes from the stored attempt; nothing is
 * invented client-side. The performance tier (see `performanceBand`) chooses
 * one of five distinct designs from fail up to excellent.
 */

/**
 * The card is a 4:5 portrait (1080×1320). The previous square canvas cropped
 * its footer off the bottom edge; every section below is positioned from the
 * top with printed measurements, so the QR code and call to action always sit
 * inside the padded area of the canvas.
 */
export const SHARE_CARD_SIZE = 1080;
export const SHARE_CARD_HEIGHT = 1320;

const INK = "#140d29";
const INK_SOFT = "#1d1438";
const LAVENDER = "#c3b4f4";
const MUTED = "#8d81b8";
const WHITE = "#f7f5ff";
const GREEN = "#4ade80";
const AMBER = "#fbbf24";
const ROSE = "#fb7185";
const VIOLET = "#a78bfa";

const FONT_STACK = '"Plus Jakarta Sans", "Segoe UI", system-ui, sans-serif';

export type PerformanceBand = {
  /** 1 = fail … 5 = excellent. Drives stars, colour theme and copy. */
  tier: 1 | 2 | 3 | 4 | 5;
  chipLabel: string;
  /** Short tier message painted under the progress bar. */
  headline: string;
  color: string;
};

/**
 * One design per performance level, measured only against the real stored
 * score and the course's own pass mark:
 *   1 — below the pass mark (fail)
 *   2 — passed, under 70%
 *   3 — 70–84%
 *   4 — 85–94%
 *   5 — 95% or higher (excellent)
 */
export function performanceBand(result: AttemptResult): PerformanceBand {
  const pct = Math.min(100, Math.max(0, result.percentage));
  if (!result.passed) {
    return {
      tier: 1,
      chipLabel: "NOT PASSED",
      headline: "Every expert was once here — another attempt is waiting.",
      color: ROSE,
    };
  }
  if (pct < 70) {
    return {
      tier: 2,
      chipLabel: "PASSED",
      headline: "You cleared the pass mark — the next band is close.",
      color: GREEN,
    };
  }
  if (pct < 85) {
    return {
      tier: 3,
      chipLabel: "STRONG RESULT",
      headline: "A strong paper — the details are coming together.",
      color: VIOLET,
    };
  }
  if (pct < 95) {
    return {
      tier: 4,
      chipLabel: "OUTSTANDING",
      headline: "Outstanding — only a handful of answers slipped by.",
      color: AMBER,
    };
  }
  return {
    tier: 5,
    chipLabel: "TOP OF THE CLASS",
    headline: "Elite score — you own this course.",
    color: AMBER,
  };
}

function hexToRgba(hex: string, alpha: number): string {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Canonical, public course URL — contains no private identifiers. */
export function courseUrlFor(slug: string): string {
  const configured = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/+$/, "");
  const origin =
    configured || (typeof window !== "undefined" ? window.location.origin : "");
  return `${origin}/courses/${encodeURIComponent(slug)}`;
}

export function shareTextFor(
  result: AttemptResult,
  courseUrl: string,
  options?: { userName?: string | null }
): string {
  // A card is only offered for graded attempts, but never let a missing result
  // turn into a claimed score if that changes.
  if (!result.hasResult) {
    return `I'm studying ${result.courseTitle} on QUIZMI. Take the course here: ${courseUrl}`;
  }
  const who = options?.userName?.trim() ? options.userName.trim() : "I";
  const headline =
    result.status === "submitted"
      ? `${who} scored ${result.percentage}% on the ${result.courseTitle} assessment on QUIZMI!`
      : `${who} completed the ${result.courseTitle} assessment on QUIZMI (${result.percentage}%).`;
  return `${headline} Think you can do better? Take the same course here: ${courseUrl}`;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      line = candidate;
      continue;
    }
    if (line) lines.push(line);
    line = word;
    if (lines.length === maxLines) break;
  }
  if (line && lines.length < maxLines) lines.push(line);

  if (lines.length === maxLines && words.join(" ").length > lines.join(" ").length) {
    let last = lines[maxLines - 1];
    while (last.length > 1 && ctx.measureText(`${last}…`).width > maxWidth) {
      last = last.slice(0, -1);
    }
    lines[maxLines - 1] = `${last}…`;
  }
  return lines;
}

async function loadBrandFont(): Promise<void> {
  try {
    if (typeof document !== "undefined" && "fonts" in document) {
      await Promise.all([
        document.fonts.load(`800 64px "Plus Jakarta Sans"`),
        document.fonts.load(`600 28px "Plus Jakarta Sans"`),
      ]);
      await document.fonts.ready;
    }
  } catch {
    // The system font stack keeps the card legible if the web font is missing.
  }
}

/** Draws the 5-star rating; earned stars take the band colour. */
function drawStars(
  ctx: CanvasRenderingContext2D,
  x: number,
  baseline: number,
  band: PerformanceBand
) {
  const size = 46;
  const pitch = 60;
  for (let i = 0; i < 5; i += 1) {
    const earned = i < band.tier;
    ctx.fillStyle = earned ? band.color : `${WHITE}24`;
    ctx.beginPath();
    for (let point = 0; point < 10; point += 1) {
      const radius = point % 2 === 0 ? size / 2 : size / 4.6;
      const angle = (Math.PI / 5) * point - Math.PI / 2;
      const cx = x + i * pitch + size / 2 + radius * Math.cos(angle);
      const cy = baseline - size / 4 + radius * Math.sin(angle);
      if (point === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    }
    ctx.closePath();
    ctx.fill();
  }
}

/** A few soft sparkles near the big score for the top two tiers. */
function drawSparkles(
  ctx: CanvasRenderingContext2D,
  color: string,
  scoreRight: number,
  scoreTop: number
) {
  const spots = [
    { x: scoreRight - 40, y: scoreTop + 40, r: 9 },
    { x: scoreRight + 60, y: scoreTop + 90, r: 6 },
    { x: scoreRight + 20, y: scoreTop + 170, r: 12 },
    { x: scoreRight + 90, y: scoreTop + 30, r: 5 },
  ];
  for (const spot of spots) {
    ctx.fillStyle = hexToRgba(color, 0.55);
    ctx.beginPath();
    ctx.arc(spot.x, spot.y, spot.r * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = hexToRgba(color, 0.25);
    ctx.beginPath();
    ctx.arc(spot.x, spot.y, spot.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

export async function renderResultCard(
  result: AttemptResult,
  options?: { userName?: string | null }
): Promise<Blob> {
  await loadBrandFont();

  const size = SHARE_CARD_SIZE;
  const height = SHARE_CARD_HEIGHT;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available in this browser");

  const courseUrl = courseUrlFor(result.courseSlug);
  const band = performanceBand(result);
  const userName = options?.userName?.trim() ? options.userName.trim() : null;

  /* ── Background (tinted by the performance band) ─────────────────────── */
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, size, height);

  const glow = ctx.createRadialGradient(size * 0.82, 70, 40, size * 0.82, 70, 820);
  glow.addColorStop(0, hexToRgba(band.color, 0.34));
  glow.addColorStop(0.55, hexToRgba(band.color, 0.08));
  glow.addColorStop(1, hexToRgba(band.color, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, height);

  const glowBottom = ctx.createRadialGradient(
    size * 0.1,
    height * 0.97,
    20,
    size * 0.1,
    height * 0.97,
    620
  );
  glowBottom.addColorStop(0, hexToRgba(band.color, 0.1));
  glowBottom.addColorStop(1, hexToRgba(band.color, 0));
  ctx.fillStyle = glowBottom;
  ctx.fillRect(0, 0, size, height);

  /* ── Layout constants ────────────────────────────────────────────────── */
  const pad = 84;
  const contentWidth = size - pad * 2;
  ctx.textBaseline = "alphabetic";

  /* ── Header: logo + wordmark + performance chip ──────────────────────── */
  const logo = await loadImage("/logo.png");
  if (logo) {
    ctx.save();
    roundRect(ctx, pad, pad, 76, 76, 20);
    ctx.clip();
    ctx.drawImage(logo, pad, pad, 76, 76);
    ctx.restore();
  }

  ctx.fillStyle = WHITE;
  ctx.font = `800 34px ${FONT_STACK}`;
  ctx.fillText("QUIZMI", pad + (logo ? 96 : 0), pad + 52);

  ctx.font = `800 24px ${FONT_STACK}`;
  const chipTextWidth = ctx.measureText(band.chipLabel).width;
  const chipWidth = chipTextWidth + 56;
  const chipX = size - pad - chipWidth;
  ctx.fillStyle = hexToRgba(band.color, 0.15);
  roundRect(ctx, chipX, pad + 12, chipWidth, 52, 26);
  ctx.fill();
  ctx.strokeStyle = hexToRgba(band.color, 0.45);
  ctx.lineWidth = 2.5;
  roundRect(ctx, chipX, pad + 12, chipWidth, 52, 26);
  ctx.stroke();
  ctx.fillStyle = band.color;
  ctx.fillText(band.chipLabel, chipX + 28, pad + 48);

  /* ── Achieved by … (username row with initial avatar) ────────────────── */
  const avatarTop = pad + 132;
  const avatar = 64;
  if (userName) {
    ctx.fillStyle = hexToRgba(band.color, 0.2);
    ctx.beginPath();
    ctx.arc(pad + avatar / 2, avatarTop + avatar / 2, avatar / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = band.color;
    ctx.font = `800 30px ${FONT_STACK}`;
    ctx.textAlign = "center";
    ctx.fillText(userName.charAt(0).toUpperCase(), pad + avatar / 2, avatarTop + 42);
    ctx.textAlign = "left";

    ctx.fillStyle = WHITE;
    ctx.font = `700 34px ${FONT_STACK}`;
    ctx.fillText(shorten(userName, 34), pad + avatar + 24, avatarTop + 34);

    ctx.fillStyle = MUTED;
    ctx.font = `700 20px ${FONT_STACK}`;
    ctx.fillText("YOUR LATEST RUN", pad + avatar + 24, avatarTop + 62);
  }

  /* ── Course subject + date ───────────────────────────────────────────── */
  const metaY = avatarTop + avatar + 44;
  const meta = [result.subject ?? "General", formatDate(result.submittedAt)]
    .filter(Boolean)
    .join(" · ");
  ctx.fillStyle = MUTED;
  ctx.font = `600 26px ${FONT_STACK}`;
  ctx.fillText(meta.toUpperCase(), pad, metaY);

  /* ── Course title ────────────────────────────────────────────────────── */
  ctx.fillStyle = WHITE;
  ctx.font = `800 58px ${FONT_STACK}`;
  const titleLines = wrapLines(ctx, result.courseTitle, contentWidth, 2);
  let titleY = metaY + 78;
  for (const line of titleLines) {
    ctx.fillText(line, pad, titleY);
    titleY += 70;
  }
  const titleBottom = titleY - 70;

  /* ── Score block ─────────────────────────────────────────────────────── */
  const scoreTop = Math.max(titleBottom + 56, 520);

  ctx.fillStyle = band.color;
  ctx.font = `800 210px ${FONT_STACK}`;
  const scoreText = `${result.percentage}%`;
  ctx.fillText(scoreText, pad, scoreTop + 170);
  const scoreRight = pad + ctx.measureText(scoreText).width;

  if (band.tier >= 4) drawSparkles(ctx, band.color, scoreRight + 24, scoreTop + 10);

  ctx.fillStyle = MUTED;
  ctx.font = `700 30px ${FONT_STACK}`;
  ctx.fillText("YOUR SCORE", pad, scoreTop + 224);
  drawStars(ctx, pad + 290, scoreTop + 232, band);

  /* Progress bar under the percentage */
  const barY = scoreTop + 262;
  const barWidth = contentWidth;
  ctx.fillStyle = INK_SOFT;
  roundRect(ctx, pad, barY, barWidth, 18, 9);
  ctx.fill();
  const passX = pad + (barWidth * Math.min(100, Math.max(0, result.passScore))) / 100;
  ctx.fillStyle = `${MUTED}66`;
  ctx.fillRect(passX - 2, barY - 8, 4, 34);
  const fillWidth = Math.max(18, (barWidth * Math.min(100, Math.max(0, result.percentage))) / 100);
  // The top two tiers get a graded gold fill; everything else is flat.
  if (band.tier >= 4 && fillWidth > 24) {
    const fill = ctx.createLinearGradient(pad, barY, pad + fillWidth, barY);
    fill.addColorStop(0, hexToRgba(band.color, 0.75));
    fill.addColorStop(1, band.color);
    ctx.fillStyle = fill;
  } else {
    ctx.fillStyle = band.color;
  }
  roundRect(ctx, pad, barY, fillWidth, 18, 9);
  ctx.fill();

  ctx.fillStyle = MUTED;
  ctx.font = `600 22px ${FONT_STACK}`;
  ctx.fillText(`Pass mark ${result.passScore}%`, pad, barY + 52);

  /* ── Performance headline ────────────────────────────────────────────── */
  ctx.fillStyle = band.color;
  ctx.font = `italic 700 28px ${FONT_STACK}`;
  ctx.fillText(wrapLines(ctx, band.headline, contentWidth, 1)[0], pad, barY + 100);

  /* ── Stat tiles ──────────────────────────────────────────────────────── */
  const tilesY = barY + 138;
  const gap = 24;
  const tileWidth = (contentWidth - gap * 2) / 3;
  const tiles: Array<{ label: string; value: string }> = [
    { label: "CORRECT", value: `${result.correctCount}/${result.totalQuestions}` },
    { label: "MARKS", value: `${result.score}/${result.totalMarks}` },
    {
      label: "TIME TAKEN",
      value: result.timeTakenSeconds ? formatDuration(result.timeTakenSeconds) : "0s",
    },
  ];

  tiles.forEach((tile, index) => {
    const x = pad + index * (tileWidth + gap);
    ctx.fillStyle = "rgba(247, 245, 255, 0.055)";
    roundRect(ctx, x, tilesY, tileWidth, 132, 24);
    ctx.fill();
    ctx.strokeStyle = "rgba(247, 245, 255, 0.09)";
    ctx.lineWidth = 2;
    roundRect(ctx, x, tilesY, tileWidth, 132, 24);
    ctx.stroke();

    ctx.fillStyle = MUTED;
    ctx.font = `700 22px ${FONT_STACK}`;
    ctx.fillText(tile.label, x + 28, tilesY + 48);
    ctx.fillStyle = WHITE;
    ctx.font = `800 44px ${FONT_STACK}`;
    ctx.fillText(tile.value, x + 28, tilesY + 104);
  });
  const tilesBottom = tilesY + 132;

  /* ── Footer: divider, QR code and call to action ─────────────────────── */
  const dividerY = tilesBottom + 36;
  ctx.strokeStyle = "rgba(247, 245, 255, 0.12)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(pad, dividerY);
  ctx.lineTo(size - pad, dividerY);
  ctx.stroke();

  const footerTop = dividerY + 36;
  const qrSize = 140;
  try {
    const qrDataUrl = await QRCode.toDataURL(courseUrl, {
      margin: 1,
      width: qrSize * 2,
      errorCorrectionLevel: "M",
      color: { dark: "#140d29ff", light: "#f7f5ffff" },
    });
    const qr = await loadImage(qrDataUrl);
    if (qr) {
      ctx.fillStyle = "#ffffff";
      roundRect(ctx, pad - 10, footerTop - 10, qrSize + 20, qrSize + 20, 18);
      ctx.fill();
      ctx.drawImage(qr, pad, footerTop, qrSize, qrSize);
    }
  } catch {
    // A missing QR still leaves the readable link below.
  }

  const ctaX = pad + qrSize + 44;
  ctx.fillStyle = WHITE;
  ctx.font = `800 32px ${FONT_STACK}`;
  const ctaLines = wrapLines(ctx, "Try this course on QUIZMI", size - pad - ctaX, 2);
  let ctaY = footerTop + 44;
  for (const line of ctaLines) {
    ctx.fillText(line, ctaX, ctaY);
    ctaY += 40;
  }
  ctx.fillStyle = LAVENDER;
  ctx.font = `600 24px ${FONT_STACK}`;
  const displayUrl = courseUrl.replace(/^https?:\/\//, "");
  ctx.fillText(shorten(displayUrl, 38), ctaX, ctaY + 8);
  ctx.fillStyle = MUTED;
  ctx.font = `600 21px ${FONT_STACK}`;
  ctx.fillText("Scan the code or open the link to start practising.", ctaX, ctaY + 44);

  // Worst case audit (two-line title + one-line CTA — "Try this course on
  // QUIZMI" fits the cta width at 32px, so never wraps):
  //   avatarBottom 280, metaY 324, title 402 (+70) → titleBottom 472,
  //   scoreTop = max(528, 520) = 528, barY 790, headline 890,
  //   tiles 928–1060, divider 1096, footerTop 1132, QR bottom 1272,
  //   CTA text bottom ≈ 1264 — all inside 1320 with ≥ 24px to spare.
  // A one-line title raises no bottom edge (scoreTop floors at 520).

  /* ── Export ───────────────────────────────────────────────────────────── */
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Could not build the result image"));
    }, "image/png");
  });
}

function shorten(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(
    date
  );
}

function formatDuration(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  if (mins === 0) return `${secs}s`;
  if (mins < 60) return `${mins}m ${secs.toString().padStart(2, "0")}s`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

/** File name for the downloaded card; contains no private data. */
export function cardFileName(result: AttemptResult): string {
  const slug = result.courseSlug.replace(/[^a-z0-9-]+/gi, "-").toLowerCase();
  return `quizmi-result-${slug}-${result.id}.png`;
}
