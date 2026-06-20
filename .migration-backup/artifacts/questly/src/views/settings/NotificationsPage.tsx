"use client";
import { useState, useEffect } from "react";
import { ChevronLeft, Bell, Zap, Trophy, Star, Clock, Calendar } from "lucide-react";
import Link from "next/link";
import BottomNav from "@/components/dashboard/BottomNav";
import { toast } from "sonner";

const STORAGE_KEY = "quizmi_notification_settings";

const notifOptions = [
  { icon: Zap, label: "Quiz Results", description: "Get notified when your quiz is ready", key: "quiz", color: "text-primary bg-primary/10" },
  { icon: Trophy, label: "Achievements", description: "Celebrate when you hit a milestone", key: "achievements", color: "text-yellow-500 bg-yellow-500/10" },
  { icon: Star, label: "Credits Updates", description: "Be notified about credit changes", key: "credits", color: "text-orange-500 bg-orange-500/10" },
  { icon: Bell, label: "Product Updates", description: "New features and improvements", key: "updates", color: "text-blue-500 bg-blue-500/10" },
];

const REMINDER_TIMES = [
  "07:00", "08:00", "09:00", "10:00", "12:00",
  "14:00", "16:00", "18:00", "19:00", "20:00", "21:00",
];

export default function NotificationsPage() {
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    quiz: true, achievements: true, credits: true, updates: false,
  });
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState("19:00");
  const [reminderDays, setReminderDays] = useState<number[]>([1, 2, 3, 4, 5]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.enabled) setEnabled(parsed.enabled);
        if (parsed.reminderEnabled !== undefined) setReminderEnabled(parsed.reminderEnabled);
        if (parsed.reminderTime) setReminderTime(parsed.reminderTime);
        if (parsed.reminderDays) setReminderDays(parsed.reminderDays);
      }
    } catch {}
  }, []);

  const save = (updates: object) => {
    const current = { enabled, reminderEnabled, reminderTime, reminderDays };
    const merged = { ...current, ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    toast.success("Settings saved");
  };

  const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="max-w-lg mx-auto px-4 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/profile" className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </Link>
          <h1 className="text-lg font-extrabold text-foreground">Notifications</h1>
        </div>

        <p className="text-sm text-muted-foreground mb-5">Manage your notification preferences.</p>

        {/* Study Reminder */}
        <div className="bg-card rounded-2xl border border-border/40 shadow-card p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Daily Study Reminder</p>
                <p className="text-xs text-muted-foreground">Get a nudge to study each day</p>
              </div>
            </div>
            <button
              onClick={() => { const val = !reminderEnabled; setReminderEnabled(val); save({ reminderEnabled: val }); }}
              className={`relative w-11 h-6 rounded-full transition-colors ${reminderEnabled ? "bg-primary" : "bg-muted"}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${reminderEnabled ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </div>

          {reminderEnabled && (
            <div className="space-y-3 pt-3 border-t border-border/30">
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Clock className="w-3 h-3" /> Reminder time
                </p>
                <div className="grid grid-cols-4 gap-1.5">
                  {REMINDER_TIMES.map((t) => (
                    <button
                      key={t}
                      onClick={() => { setReminderTime(t); save({ reminderTime: t }); }}
                      className={`py-1.5 rounded-xl text-xs font-bold transition-all ${
                        reminderTime === t
                          ? "bg-primary text-white shadow-sm"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" /> Days
                </p>
                <div className="flex gap-1.5">
                  {DAY_LABELS.map((d, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        const newDays = reminderDays.includes(i)
                          ? reminderDays.filter((x) => x !== i)
                          : [...reminderDays, i];
                        setReminderDays(newDays);
                        save({ reminderDays: newDays });
                      }}
                      className={`flex-1 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                        reminderDays.includes(i)
                          ? "bg-primary text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Other notifications */}
        <div className="bg-card rounded-2xl border border-border/40 shadow-card overflow-hidden mb-4">
          {notifOptions.map(({ icon: Icon, label, description, key, color }) => (
            <div key={key} className="flex items-center gap-3 px-4 py-3.5 border-b border-border/30 last:border-0">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
              <button
                onClick={() => {
                  const newEnabled = { ...enabled, [key]: !enabled[key] };
                  setEnabled(newEnabled);
                  save({ enabled: newEnabled });
                }}
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
