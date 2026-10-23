import QRCode from "qrcode";
import type { AttemptResult } from "@/lib/types";

/**
 * Renders a completed attempt into a shareable achievement graphic using the
 * real, server-persisted result. Everything drawn on the card — score,
 * percentage, marks, date, status — comes from the stored attempt; nothing is
 * invented client-side.
 */

export const SHARE_CARD_SIZE = 1080;

const INK = "#140d29";
const INK_SOFT = "#1d1438";
const LAVENDER = "#c3b4f4";
const MUTED = "#8d81b8";
const WHITE = "#f7f5ff";
const GREEN = "#4ade80";
const ROSE = "#fb7185";
const AMBER = "#fbbf24";
const BRAND = "#8b5cf6";

const FONT_STACK = '"Plus Jakarta Sans", "Segoe UI", system-ui, sans-serif';

/** Canonical, public course URL — contains no private identifiers. */
export function courseUrlFor(slug: string): string {
  const configured = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/+$/, "");
  const origin =
    configured || (typeof window !== "undefined" ? window.location.origin : "");
  return `${origin}/courses/${encodeURIComponent(slug)}`;
}

export function shareTextFor(result: AttemptResult, courseUrl: string): string {
  const headline =
    result.status === "submitted"
      ? `I scored ${result.percentage}% on the ${result.courseTitle} assessment on QUIZIMI!`
      : `I completed the ${result.courseTitle} assessment on QUIZIMI (${result.percentage}%).`;
  return `${headline} Think you can do better? Take the same course here: ${courseUrl}`;
}

function statusChip(result: AttemptResult): { label: string; color: string } {
  if (result.status === "terminated") return { label: "ATTEMPT ENDED", color: AMBER };
  if (result.status === "expired") return { label: "TIME EXPIRED", color: AMBER };
  if (result.passed) return { label: "PASSED", color: GREEN };
  return { label: "COMPLETED", color: LAVENDER };
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

export async function renderResultCard(result: AttemptResult): Promise<Blob> {
  await loadBrandFont();

  const size = SHARE_CARD_SIZE;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available in this browser");

  const courseUrl = courseUrlFor(result.courseSlug);

  /* ── Background ──────────────────────────────────────────────────────── */
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, size, size);

  const glow = ctx.createRadialGradient(size * 0.82, size * 0.1, 40, size * 0.82, size * 0.1, 820);
  glow.addColorStop(0, "rgba(139, 92, 246, 0.34)");
  glow.addColorStop(0.55, "rgba(139, 92, 246, 0.08)");
  glow.addColorStop(1, "rgba(139, 92, 246, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);

  const glowBottom = ctx.createRadialGradient(size * 0.1, size * 0.95, 20, size * 0.1, size * 0.95, 620);
  glowBottom.addColorStop(0, "rgba(74, 222, 128, 0.10)");
  glowBottom.addColorStop(1, "rgba(74, 222, 128, 0)");
  ctx.fillStyle = glowBottom;
  ctx.fillRect(0, 0, size, size);

  /* ── Header: logo + wordmark ─────────────────────────────────────────── */
  const pad = 84;
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
  ctx.textBaseline = "alphabetic";
  ctx.fillText("QUIZIMI", pad + (logo ? 96 : 0), pad + 52);

  const chip = statusChip(result);
  ctx.font = `800 24px ${FONT_STACK}`;
  const chipTextWidth = ctx.measureText(chip.label).width;
  const chipWidth = chipTextWidth + 56;
  const chipX = size - pad - chipWidth;
  ctx.fillStyle = `${chip.color}26`;
  roundRect(ctx, chipX, pad + 12, chipWidth, 52, 26);
  ctx.fill();
  ctx.fillStyle = chip.color;
  ctx.fillText(chip.label, chipX + 28, pad + 48);

  /* ── Course title + meta ─────────────────────────────────────────────── */
  const meta = [result.subject ?? "General", formatDate(result.submittedAt)]
    .filter(Boolean)
    .join(" · ");
  ctx.fillStyle = MUTED;
  ctx.font = `600 26px ${FONT_STACK}`;
  ctx.fillText(meta.toUpperCase(), pad, pad + 158);

  ctx.fillStyle = WHITE;
  ctx.font = `800 58px ${FONT_STACK}`;
  const titleLines = wrapLines(ctx, result.courseTitle, size - pad * 2, 2);
  let titleY = pad + 232;
  for (const line of titleLines) {
    ctx.fillText(line, pad, titleY);
    titleY += 70;
  }

  /* ── Score block ─────────────────────────────────────────────────────── */
  const scoreTop = Math.max(titleY + 36, 520);

  ctx.fillStyle = WHITE;
  ctx.font = `800 210px ${FONT_STACK}`;
  ctx.fillText(`${result.percentage}%`, pad, scoreTop + 170);

  ctx.fillStyle = MUTED;
  ctx.font = `700 30px ${FONT_STACK}`;
  ctx.fillText("YOUR SCORE", pad, scoreTop + 224);

  /* Progress bar under the percentage */
  const barY = scoreTop + 262;
  const barWidth = size - pad * 2;
  ctx.fillStyle = INK_SOFT;
  roundRect(ctx, pad, barY, barWidth, 18, 9);
  ctx.fill();
  const passX = pad + (barWidth * Math.min(100, Math.max(0, result.passScore))) / 100;
  ctx.fillStyle = `${MUTED}66`;
  ctx.fillRect(passX - 2, barY - 8, 4, 34);
  const fillWidth = Math.max(18, (barWidth * Math.min(100, Math.max(0, result.percentage))) / 100);
  ctx.fillStyle = chip.color;
  roundRect(ctx, pad, barY, fillWidth, 18, 9);
  ctx.fill();

  ctx.fillStyle = MUTED;
  ctx.font = `600 22px ${FONT_STACK}`;
  ctx.fillText(`Pass mark ${result.passScore}%`, pad, barY + 52);

  /* ── Stat tiles ──────────────────────────────────────────────────────── */
  const tilesY = barY + 96;
  const gap = 24;
  const tileWidth = (size - pad * 2 - gap * 2) / 3;
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

  /* ── Footer: QR + CTA ────────────────────────────────────────────────── */
  const footerY = tilesY + 132 + 56;

  ctx.strokeStyle = "rgba(247, 245, 255, 0.12)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(pad, footerY - 36);
  ctx.lineTo(size - pad, footerY - 36);
  ctx.stroke();

  const qrSize = 190;
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
      roundRect(ctx, pad - 10, footerY - 10, qrSize + 20, qrSize + 20, 22);
      ctx.fill();
      ctx.drawImage(qr, pad, footerY, qrSize, qrSize);
    }
  } catch {
    // A missing QR still leaves the readable link below.
  }

  const ctaX = pad + qrSize + 48;
  ctx.fillStyle = WHITE;
  ctx.font = `800 40px ${FONT_STACK}`;
  const ctaLines = wrapLines(ctx, "Try this course on QUIZIMI", size - pad - ctaX, 2);
  let ctaY = footerY + 54;
  for (const line of ctaLines) {
    ctx.fillText(line, ctaX, ctaY);
    ctaY += 50;
  }
  ctx.fillStyle = LAVENDER;
  ctx.font = `600 25px ${FONT_STACK}`;
  const displayUrl = courseUrl.replace(/^https?:\/\//, "");
  ctx.fillText(shorten(displayUrl, 38), ctaX, ctaY + 12);
  ctx.fillStyle = MUTED;
  ctx.font = `600 22px ${FONT_STACK}`;
  ctx.fillText("Scan the code or open the link to start practising.", ctaX, ctaY + 52);

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
  return `quizimi-result-${slug}-${result.id}.png`;
}
