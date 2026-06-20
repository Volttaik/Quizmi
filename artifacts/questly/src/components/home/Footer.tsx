"use client";
import Link from "next/link";
import { QuizmiWordmark } from "@/components/QuizmiLogo";

const links = {
  Product: ["AI Quizzes", "Flashcards", "Summaries", "Analytics"],
  Resources: ["Documentation", "API", "Community", "Tutorials"],
  Company: ["About", "Careers", "Blog", "Press"],
  Legal: ["Privacy", "Terms", "Cookies"],
};

export default function Footer() {
  return (
    <footer className="border-t border-white/[0.04] py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link href="/">
              <QuizmiWordmark variant="dark" className="mb-4" />
            </Link>
            <p className="text-white/25 text-xs leading-relaxed">
              Study smarter, not harder. AI-powered study tools for every learner.
            </p>
          </div>

          {Object.entries(links).map(([title, items]) => (
            <div key={title}>
              <h4 className="text-white/60 font-semibold text-xs uppercase tracking-wider mb-4">
                {title}
              </h4>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item}>
                    <a href="#" className="text-white/30 text-sm hover:text-white/60 transition-colors">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-white/[0.04] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-white/20 text-xs">
            &copy; {new Date().getFullYear()} Quizmi. All rights reserved.
          </p>
          <p className="text-white/15 text-xs">
            Made with ❤️ for students everywhere
          </p>
        </div>
      </div>
    </footer>
  );
}
