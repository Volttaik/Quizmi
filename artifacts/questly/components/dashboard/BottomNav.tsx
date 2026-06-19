"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Layers, Sparkles, Clock, User } from "lucide-react";

const tabs = [
  { icon: Home, label: "Home", path: "/dashboard" },
  { icon: Layers, label: "Quizzes", path: "/create-quiz" },
  { icon: Sparkles, label: "AI Study", path: "/summary", center: true },
  { icon: Clock, label: "History", path: "/dashboard" },
  { icon: User, label: "Profile", path: "/dashboard" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
      <div className="max-w-lg mx-auto flex items-end justify-around px-2 pt-1 pb-2">
        {tabs.map(({ icon: Icon, label, path, center }) => {
          const active = pathname === path;

          if (center) {
            return (
              <Link key={label} href={path} className="flex flex-col items-center -mt-5">
                <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30 mb-0.5">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-[10px] font-semibold text-primary">{label}</span>
              </Link>
            );
          }

          return (
            <Link
              key={label}
              href={path}
              className="flex flex-col items-center gap-0.5 py-2 px-3"
            >
              <Icon
                className={`w-5 h-5 ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              />
              <span
                className={`text-[10px] font-medium ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
