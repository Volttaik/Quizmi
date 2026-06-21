"use client";
import { useState, useEffect, useRef } from "react";
import { Sparkles, Brain, Users } from "lucide-react";

const slides = [
  {
    src: "/study-1.png",
    caption: "Study anywhere, anytime",
    tag: "Flexible Learning",
    Icon: Sparkles,
  },
  {
    src: "/study-2.png",
    caption: "Learn smarter with AI",
    tag: "AI-Powered",
    Icon: Brain,
  },
  {
    src: "/study-3.png",
    caption: "Collaborate and grow together",
    tag: "Community",
    Icon: Users,
  },
];

export default function StudySlideshow() {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % slides.length);
    }, 4000);
  };

  useEffect(() => {
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const go = (i: number) => {
    setCurrent(i);
    startTimer();
  };

  return (
    <div className="relative rounded-2xl overflow-hidden mb-4 h-44 shadow-elevated dark:shadow-elevated bg-muted">
      {slides.map((slide, i) => {
        const TagIcon = slide.Icon;
        return (
          <div
            key={slide.src}
            className="absolute inset-0 transition-opacity duration-700 ease-in-out"
            style={{ opacity: i === current ? 1 : 0, zIndex: i === current ? 1 : 0 }}
          >
            <img
              src={slide.src}
              alt={slide.caption}
              className="w-full h-full object-cover"
              loading={i === 0 ? "eager" : "lazy"}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />

            <div className="absolute top-3 left-3">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-white/90 bg-white/15 backdrop-blur-sm border border-white/10 px-2.5 py-1 rounded-full">
                <TagIcon className="w-3 h-3" />
                {slide.tag}
              </span>
            </div>
            <p className="absolute bottom-3 left-4 text-white text-sm font-extrabold drop-shadow-lg leading-tight">
              {slide.caption}
            </p>
          </div>
        );
      })}

      <div className="absolute bottom-3 right-4 flex gap-1.5 z-10">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => go(i)}
            className={`rounded-full transition-all duration-300 ${
              i === current
                ? "w-5 h-1.5 bg-white"
                : "w-1.5 h-1.5 bg-white/40 hover:bg-white/60"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
