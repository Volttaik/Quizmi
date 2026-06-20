"use client";
import { useState, useEffect } from "react";

const slides = [
  {
    src: "/study-1.png",
    caption: "Study anywhere, anytime",
  },
  {
    src: "/study-2.png",
    caption: "Learn smarter with AI",
  },
  {
    src: "/study-3.png",
    caption: "Collaborate and grow together",
  },
];

export default function StudySlideshow() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % slides.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative rounded-2xl overflow-hidden mb-4 h-40 shadow-md">
      {slides.map((slide, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-700 ${i === current ? "opacity-100" : "opacity-0"}`}
        >
          <img
            src={slide.src}
            alt={slide.caption}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <p className="absolute bottom-3 left-4 text-white text-sm font-bold drop-shadow">{slide.caption}</p>
        </div>
      ))}
      <div className="absolute bottom-3 right-4 flex gap-1.5">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`rounded-full transition-all ${i === current ? "w-4 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/40"}`}
          />
        ))}
      </div>
    </div>
  );
}
