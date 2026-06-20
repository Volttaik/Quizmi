"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const slides = [
  {
    src: "/study-1.png",
    caption: "Study anywhere, anytime",
    tag: "✨ Flexible Learning",
  },
  {
    src: "/study-2.png",
    caption: "Learn smarter with AI",
    tag: "🧠 AI-Powered",
  },
  {
    src: "/study-3.png",
    caption: "Collaborate and grow together",
    tag: "🤝 Community",
  },
];

export default function StudySlideshow() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setCurrent((c) => (c + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const go = (i: number) => {
    setDirection(i > current ? 1 : -1);
    setCurrent(i);
  };

  return (
    <div className="relative rounded-2xl overflow-hidden mb-4 h-44 shadow-elevated dark:shadow-elevated bg-muted">
      <AnimatePresence mode="popLayout" custom={direction}>
        <motion.div
          key={current}
          custom={direction}
          variants={{
            enter: (d: number) => ({ x: d * 60, opacity: 0, scale: 0.97 }),
            center: { x: 0, opacity: 1, scale: 1 },
            exit: (d: number) => ({ x: d * -60, opacity: 0, scale: 0.97 }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
          className="absolute inset-0"
        >
          <img
            src={slides[current].src}
            alt={slides[current].caption}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />

          <div className="absolute top-3 left-3">
            <span className="text-[10px] font-bold text-white/80 bg-white/15 backdrop-blur-sm border border-white/10 px-2.5 py-1 rounded-full">
              {slides[current].tag}
            </span>
          </div>
          <p className="absolute bottom-3 left-4 text-white text-sm font-extrabold drop-shadow-lg leading-tight">
            {slides[current].caption}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Dots */}
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
