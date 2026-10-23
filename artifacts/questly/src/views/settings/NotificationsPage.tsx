"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, Calendar, ChevronLeft, Clock, Megaphone, Trophy } from "lucide-react";
import { toast } from "sonner";

const STORAGE_KEY = "quizmi_notification_settings";

const OPTIONS = [
  {
    icon: Trophy,
    label: "Result summaries",
    description: "Show a summary card after each submission",
    key: "results",
    color: "text-primary bg-primary/10",
  },
  {
    icon: Bell,
    label: "Attempt reminders",
    description: "Remind me about unfinished attempts",
    key: "attempts",
    color: "text-amber-500 bg-amber-500/10",
  },
  {
    icon: Megaphone,
    label: "Product updates",
    description: "New features and course catalogue additions",
    key: "updates",
    color: "text-blue-500 bg-blue-500/10",
  },
];

const REMINDER_TIMES = [
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "12:00",
  "14:00",
  "16:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
];

const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

type Prefs = {
  enabled: Record<string, boolean>;
  reminderEnabled: boolean;
  reminderTime: string;
  reminderDays: number[];
};

const DEFAULTS: Prefs = {
  enabled: { results: true, attempts: true, updates: false },
  reminderEnabled: false,
  reminderTime: "19:00",
  reminderDays: [1, 2, 3, 4, 5],
};

export default function NotificationsPage() {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<Prefs>;
        setPrefs({
          enabled: { ...DEFAULTS.enabled, ...(parsed.enabled ?? {}) },
          reminderEnabled: parsed.reminderEnabled ?? DEFAULTS.reminderEnabled,
          reminderTime: parsed.reminderTime ?? DEFAULTS.reminderTime,
          reminderDays: Array.isArray(parsed.reminderDays)
            ? parsed.reminderDays
            : DEFAULTS.reminderDays,
        });
      }
    } catch {
      // Ignore unreadable preferences and fall back to defaults.
    }
  }, []);

  const update = (next: Partial<Prefs>) => {
    const merged = { ...prefs, ...next };
    setPrefs(merged);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      toast.success("Preferences saved");
    } catch {
      toast.error("Could not save preferences on this device");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-12">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/profile"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-muted transition-colors hover:bg-muted/80"
            aria-label="Back to profile"
          >
            <ChevronLeft className="h-5 w-5 text-foreground" />
          </Link>
          <h1 className="text-lg font-extrabold text-foreground">Notifications</h1>
        </div>

        <p className="mb-5 text-sm text-muted-foreground">
          These preferences are stored on this device.
        </p>

        {/* Reminder */}
        <div className="mb-4 rounded-2xl border border-border/70 bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Practice reminder</p>
                <p className="text-xs text-muted-foreground">A nudge to practise with a course</p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={prefs.reminderEnabled}
              aria-label="Toggle practice reminder"
              onClick={() => update({ reminderEnabled: !prefs.reminderEnabled })}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                prefs.reminderEnabled ? "bg-primary" : "bg-muted"
              }`}
            >
              <span
                className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  prefs.reminderEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {prefs.reminderEnabled && (
            <div className="mt-4 space-y-4 border-t border-border/60 pt-4">
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <Clock className="h-3 w-3" /> Reminder time
                </p>
                <div className="grid grid-cols-4 gap-1.5">
                  {REMINDER_TIMES.map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => update({ reminderTime: time })}
                      aria-pressed={prefs.reminderTime === time}
                      className={`rounded-xl py-1.5 text-xs font-bold transition-colors ${
                        prefs.reminderTime === time
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <Calendar className="h-3 w-3" /> Days
                </p>
                <div className="flex gap-1.5">
                  {DAY_LABELS.map((day, index) => {
                    const active = prefs.reminderDays.includes(index);
                    return (
                      <button
                        key={day}
                        type="button"
                        aria-pressed={active}
                        aria-label={day}
                        onClick={() =>
                          update({
                            reminderDays: active
                              ? prefs.reminderDays.filter((value) => value !== index)
                              : [...prefs.reminderDays, index].sort(),
                          })
                        }
                        className={`flex-1 rounded-xl py-1.5 text-[11px] font-bold transition-colors ${
                          active
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Toggles */}
        <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
          {OPTIONS.map(({ icon: Icon, label, description, key, color }) => (
            <div
              key={key}
              className="flex items-center gap-3 border-b border-border/60 px-4 py-3.5 last:border-0"
            >
              <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={prefs.enabled[key] ?? false}
                aria-label={`Toggle ${label}`}
                onClick={() =>
                  update({ enabled: { ...prefs.enabled, [key]: !prefs.enabled[key] } })
                }
                className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors ${
                  prefs.enabled[key] ? "bg-primary" : "bg-muted"
                }`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    prefs.enabled[key] ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
