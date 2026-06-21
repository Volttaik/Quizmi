import type { QuizType } from "@/lib/quizTypes";

interface ShareCardParams {
  type: QuizType;
  quizTitle: string;
  subjectName: string;
  pct: number;
  banner: string;
  shareUrl: string;
}

const GRAD: Record<QuizType, [string, string, string]> = {
  study:       ["#7c3aed", "#6d28d9", "#4c1d95"],
  love:        ["#f43f5e", "#ec4899", "#be185d"],
  friendship:  ["#f59e0b", "#ea580c", "#b45309"],
  family:      ["#10b981", "#0d9488", "#065f46"],
  classroom:   ["#3b82f6", "#4f46e5", "#1e3a8a"],
  personality: ["#a855f7", "#d946ef", "#7e22ce"],
  knowme:      ["#06b6d4", "#0891b2", "#164e63"],
};

const TYPE_EMOJI: Record<QuizType, string> = {
  study: "🧠", love: "💕", friendship: "🔥",
  family: "💪", classroom: "⭐", personality: "🧩", knowme: "🤔",
};

const TYPE_LABEL: Record<QuizType, string> = {
  study: "Study Quiz", love: "Love Quiz", friendship: "Friendship Quiz",
  family: "Family Quiz", classroom: "Classroom Quiz",
  personality: "Personality Quiz", knowme: "Know Me Quiz",
};

function seededRandom(seed: number) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 4294967296; };
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? current + " " + word : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function generateShareCard(params: ShareCardParams): Promise<Blob> {
  const { type, quizTitle, pct, banner, shareUrl } = params;
  const SIZE = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d")!;

  const [c1, c2, c3] = GRAD[type];

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, SIZE, SIZE);
  bg.addColorStop(0, c1);
  bg.addColorStop(0.5, c2);
  bg.addColorStop(1, c3);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // Confetti (seeded for consistency)
  const rand = seededRandom(pct * 137 + type.length * 31);
  const confettiColors = ["#ffffff", "#ffd700", "#ff6b9d", "#a8ff78", "#78c1ff", "#ff9f43"];
  for (let i = 0; i < 80; i++) {
    const x = rand() * SIZE;
    const y = rand() * SIZE;
    const w = rand() * 18 + 6;
    const h = rand() * 10 + 4;
    const angle = rand() * Math.PI * 2;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = confettiColors[Math.floor(rand() * confettiColors.length)];
    ctx.globalAlpha = 0.55 + rand() * 0.45;
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.restore();
  }
  // Small circles too
  for (let i = 0; i < 40; i++) {
    const x = rand() * SIZE;
    const y = rand() * SIZE;
    const r = rand() * 8 + 3;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = confettiColors[Math.floor(rand() * confettiColors.length)];
    ctx.globalAlpha = 0.4 + rand() * 0.5;
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Semi-transparent frosted card in center
  ctx.save();
  const cardX = 80, cardY = 120, cardW = SIZE - 160, cardH = SIZE - 240;
  ctx.beginPath();
  const r = 60;
  ctx.moveTo(cardX + r, cardY);
  ctx.lineTo(cardX + cardW - r, cardY);
  ctx.quadraticCurveTo(cardX + cardW, cardY, cardX + cardW, cardY + r);
  ctx.lineTo(cardX + cardW, cardY + cardH - r);
  ctx.quadraticCurveTo(cardX + cardW, cardY + cardH, cardX + cardW - r, cardY + cardH);
  ctx.lineTo(cardX + r, cardY + cardH);
  ctx.quadraticCurveTo(cardX, cardY + cardH, cardX, cardY + cardH - r);
  ctx.lineTo(cardX, cardY + r);
  ctx.quadraticCurveTo(cardX, cardY, cardX + r, cardY);
  ctx.closePath();
  ctx.fillStyle = "rgba(0,0,0,0.30)";
  ctx.fill();
  ctx.restore();

  const cx = SIZE / 2;

  // Emoji
  ctx.font = "bold 100px serif";
  ctx.textAlign = "center";
  ctx.fillStyle = "white";
  ctx.fillText(TYPE_EMOJI[type], cx, 320);

  // Quiz type label
  ctx.font = "bold 36px sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fillText(TYPE_LABEL[type].toUpperCase(), cx, 380);

  // Score
  ctx.font = "900 220px sans-serif";
  ctx.fillStyle = "white";
  ctx.shadowColor = "rgba(0,0,0,0.4)";
  ctx.shadowBlur = 30;
  ctx.fillText(`${pct}%`, cx, 600);
  ctx.shadowBlur = 0;

  // Banner message — wrapped
  ctx.font = "bold 44px sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  const bannerLines = wrapText(ctx, banner, cardW - 80);
  bannerLines.forEach((line, i) => ctx.fillText(line, cx, 680 + i * 56));

  // Quiz title — wrapped
  ctx.font = "500 32px sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.60)";
  const titleLines = wrapText(ctx, `"${quizTitle}"`, cardW - 80);
  const bannerBottom = 680 + bannerLines.length * 56;
  titleLines.forEach((line, i) => ctx.fillText(line, cx, bannerBottom + 20 + i * 42));

  // Divider
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cardX + 60, 880);
  ctx.lineTo(cardX + cardW - 60, 880);
  ctx.stroke();

  // Branding
  ctx.font = "bold 40px sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.90)";
  ctx.fillText("quizmi.space", cx, 940);

  // Share URL (truncated)
  ctx.font = "28px sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  const shortUrl = shareUrl.replace(/^https?:\/\//, "");
  ctx.fillText(shortUrl.length > 45 ? shortUrl.slice(0, 45) + "…" : shortUrl, cx, 988);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Canvas toBlob failed"));
    }, "image/png");
  });
}
