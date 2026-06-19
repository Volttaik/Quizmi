import { Sparkles, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function PromoBanner() {
  return (
    <div className="relative overflow-hidden rounded-3xl mb-6 shadow-[0_4px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_4px_32px_rgba(0,0,0,0.5)]">
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(222,47%,12%)] via-[hsl(240,40%,10%)] to-[hsl(262,50%,14%)]" />
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />

      <div className="relative flex items-center gap-4 p-5">
        <div className="flex-1">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">Pro Feature</span>
          </div>
          <h3 className="text-base font-extrabold text-white leading-tight mb-1">
            Smarter study,<br />
            <span className="text-primary">better results.</span>
          </h3>
          <p className="text-[11px] text-white/40 leading-relaxed mb-3">
            AI tools that adapt to how you learn.
          </p>
          <Link
            to="/buy-credits"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-primary/80 hover:bg-primary px-3.5 py-2 rounded-full transition-colors"
          >
            Upgrade now <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="relative w-28 h-28 flex-shrink-0 rounded-2xl overflow-hidden">
          <img
            src="/hero-visual.png"
            alt="Study smarter"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>
      </div>
    </div>
  );
}
