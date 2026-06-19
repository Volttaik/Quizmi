"use client";

import { Brain, BarChart3, CheckCircle } from "lucide-react";

export default function PromoBanner() {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[hsl(222,47%,12%)] via-[hsl(222,47%,10%)] to-[hsl(262,50%,15%)] p-6 text-white">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold leading-tight">
            Smarter studying,
            <br />
            <span className="text-primary">better results.</span>
          </h3>
          <p className="text-xs text-white/40 mt-2 leading-relaxed">
            Use AI-powered tools to learn faster and remember longer.
          </p>
          <div className="flex gap-1.5 mt-4">
            <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
            <div className="w-4 h-1.5 rounded-full bg-primary" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
          </div>
        </div>

        <div className="relative w-36 h-28 flex-shrink-0">
          <img
            src="https://images.fillout.com/650815/btixbdasfc/generated-images/myrFENTki3AvnqEyWg5T3N/img_3du953VDTy1uiUzr.jpg"
            alt="Student studying"
            className="w-full h-full object-cover rounded-xl"
          />
          <div className="absolute -top-2 -left-2 w-7 h-7 rounded-lg bg-[hsl(262,72%,55%)] flex items-center justify-center">
            <Brain className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="absolute -top-1 right-2 w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <BarChart3 className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="absolute -bottom-1 right-0 w-7 h-7 rounded-full bg-[hsl(142,70%,45%)] flex items-center justify-center">
            <CheckCircle className="w-3.5 h-3.5 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}
