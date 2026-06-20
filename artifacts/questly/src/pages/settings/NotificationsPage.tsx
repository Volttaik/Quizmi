import { useState } from "react";
import { ChevronLeft, Bell, Zap, Trophy, Star } from "lucide-react";
import { Link } from "wouter";
import BottomNav from "@/components/dashboard/BottomNav";

const notifOptions = [
  { icon: Zap, label: "Quiz Results", description: "Get notified when your quiz is ready", key: "quiz" },
  { icon: Trophy, label: "Achievements", description: "Celebrate when you hit a milestone", key: "achievements" },
  { icon: Star, label: "Credits Updates", description: "Be notified about credit changes", key: "credits" },
  { icon: Bell, label: "Product Updates", description: "New features and improvements", key: "updates" },
];

export default function NotificationsPage() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    quiz: true,
    achievements: true,
    credits: true,
    updates: false,
  });

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="max-w-lg mx-auto px-4 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/profile" className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </Link>
          <h1 className="text-lg font-extrabold text-foreground">Notifications</h1>
        </div>

        <p className="text-sm text-muted-foreground mb-6">Choose what you want to be notified about.</p>

        <div className="bg-card rounded-2xl border border-border/40 shadow-sm overflow-hidden">
          {notifOptions.map(({ icon: Icon, label, description, key }) => (
            <div key={key} className="flex items-center gap-3 px-4 py-3.5 border-b border-border/30 last:border-0">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
              <button
                onClick={() => setEnabled((prev) => ({ ...prev, [key]: !prev[key] }))}
                className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${enabled[key] ? "bg-primary" : "bg-muted"}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${enabled[key] ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
