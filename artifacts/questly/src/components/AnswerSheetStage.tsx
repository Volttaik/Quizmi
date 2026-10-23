import { Check, Clock } from "lucide-react";

const OPTIONS = [
  { letter: "A", text: "The next best alternative you give up", marked: true },
  { letter: "B", text: "The money paid for a good" },
  { letter: "C", text: "The total cost of production" },
  { letter: "D", text: "The price set by the market" },
];

/**
 * QUIZMI's hero motif: a marked answer sheet, drawn in layout and CSS.
 *
 * Decorative only (`aria-hidden`) and static — no image asset, no animation
 * that competes with the headline. It is deliberately not a device mockup.
 */
export default function AnswerSheetStage() {
  return (
    <div className="relative mx-auto w-full max-w-[29rem] select-none" aria-hidden>
      {/* Sheets underneath, offset so the stack reads as a paper pile */}
      <div className="absolute inset-x-8 top-5 h-full rounded-[14px] border border-border/60 bg-card/60" />
      <div className="absolute inset-x-4 top-2.5 h-full rounded-[14px] border border-border/80 bg-card/90" />

      <div className="relative rounded-[16px] border border-border bg-card p-4 shadow-[var(--shadow-lg)] sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-secondary-foreground">
            Section B · Q14
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold tabular-nums text-primary-foreground">
            <Clock className="h-3 w-3" />
            14:52
          </span>
        </div>

        <p className="mt-4 font-serif text-[15px] font-semibold leading-snug text-foreground sm:text-base">
          Opportunity cost is best described as…
        </p>

        <ul className="mt-4 space-y-2">
          {OPTIONS.map((option) => (
            <li
              key={option.letter}
              className={`flex items-center gap-2.5 rounded-[8px] border px-2.5 py-2 text-[12px] leading-snug ${
                option.marked
                  ? "border-success/50 bg-success/[0.08] text-foreground"
                  : "border-border/70 text-muted-foreground"
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  option.marked ? "bg-success text-white" : "bg-muted text-foreground/70"
                }`}
              >
                {option.marked ? <Check className="h-3 w-3" /> : option.letter}
              </span>
              <span className="min-w-0 flex-1 truncate">{option.text}</span>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            14 of 20
          </span>
          <div className="flex gap-1">
            {Array.from({ length: 8 }).map((_, index) => (
              <span
                key={index}
                className={`h-1 w-4 rounded-full ${
                  index < 5 ? "bg-accent" : index === 5 ? "bg-success" : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Marked seal, sitting on the sheet corner */}
      <div className="absolute -bottom-4 -left-3 flex h-16 w-16 -rotate-12 items-center justify-center rounded-full border-2 border-success/70 bg-card shadow-[var(--shadow-sm)] sm:-left-5 sm:h-[4.5rem] sm:w-[4.5rem]">
        <span className="flex h-[3.1rem] w-[3.1rem] flex-col items-center justify-center rounded-full border border-dashed border-success/60 sm:h-14 sm:w-14">
          <Check className="h-3.5 w-3.5 text-success" />
          <span className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.12em] text-success">
            Marked
          </span>
        </span>
      </div>
    </div>
  );
}
