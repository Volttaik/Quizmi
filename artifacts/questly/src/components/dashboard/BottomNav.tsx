import { Link, useLocation } from "wouter";
import { Home, GraduationCap, Sparkles, BookMarked, User } from "lucide-react";

const tabs = [
  { icon: Home, label: "Home", path: "/dashboard" },
  { icon: GraduationCap, label: "Quizzes", path: "/create-quiz" },
  { icon: Sparkles, label: "AI", path: "/summary", center: true },
  { icon: BookMarked, label: "Cards", path: "/flashcards" },
  { icon: User, label: "Profile", path: "/buy-credits" },
];

export default function BottomNav() {
  const [pathname] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border/60 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.4)]">
      <div className="max-w-lg mx-auto flex items-end justify-around px-2 pt-1.5 pb-3">
        {tabs.map(({ icon: Icon, label, path, center }) => {
          const active = pathname === path || pathname.startsWith(path + "/");

          if (center) {
            return (
              <Link key={label} to={path} className="flex flex-col items-center -mt-6">
                <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/35 mb-0.5">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-[10px] font-semibold text-primary">{label}</span>
              </Link>
            );
          }

          return (
            <Link
              key={label}
              to={path}
              className="flex flex-col items-center gap-0.5 py-1 px-3"
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                active ? "bg-primary/10" : ""
              }`}>
                <Icon className={`w-5 h-5 transition-colors ${active ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <span className={`text-[10px] font-semibold transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
