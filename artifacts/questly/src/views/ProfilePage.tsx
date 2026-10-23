"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useClerk, useUser } from "@clerk/nextjs";
import {
  BarChart3,
  Bell,
  Camera,
  ChevronRight,
  FileText,
  HelpCircle,
  Loader2,
  LogOut,
  Monitor,
  Moon,
  Shield,
  Sun,
  Target,
  Trophy,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";
import type { Analytics } from "@/lib/types";

const THEMES = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export default function ProfilePage() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { theme, setTheme } = useTheme();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  useEffect(() => {
    fetch("/api/analytics")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => setAnalytics(data))
      .catch(() => {});
  }, []);

  const handlePhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      await user.setProfileImage({ file });
      toast.success("Profile photo updated");
    } catch {
      toast.error("Could not update your photo. Try a smaller image.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const initials = (user?.fullName ?? user?.firstName ?? "?")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Profile</h1>
      <p className="mt-1 text-sm text-muted-foreground">Manage your account and preferences.</p>

      {/* Identity */}
      <section className="mt-6 rounded-2xl border border-border/70 bg-card p-5">
        <div className="flex items-center gap-4">
          <div className="relative">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              aria-label="Change profile photo"
              className="group relative block h-16 w-16 overflow-hidden rounded-full border-2 border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              {user?.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.imageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full w-full items-center justify-center bg-primary/15 text-lg font-black text-primary">
                  {initials}
                </span>
              )}
              <span className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : (
                  <Camera className="h-4 w-4 text-white" />
                )}
              </span>
            </button>
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-extrabold text-card-foreground">
              {user?.fullName ?? "Learner"}
            </p>
            <p className="truncate text-sm text-muted-foreground">
              {user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses?.[0]?.emailAddress ?? ""}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2 border-t border-border/60 pt-4 text-center">
          <div>
            <p className="text-lg font-extrabold text-foreground">
              {analytics?.completedAttempts ?? 0}
            </p>
            <p className="text-[11px] font-semibold text-muted-foreground">Attempts</p>
          </div>
          <div>
            <p className="text-lg font-extrabold text-foreground">
              {analytics?.averagePercentage ?? 0}%
            </p>
            <p className="text-[11px] font-semibold text-muted-foreground">Average</p>
          </div>
          <div>
            <p className="text-lg font-extrabold text-foreground">{analytics?.passRate ?? 0}%</p>
            <p className="text-[11px] font-semibold text-muted-foreground">Pass rate</p>
          </div>
        </div>
      </section>

      {/* Appearance */}
      <section className="mt-4 rounded-2xl border border-border/70 bg-card p-5">
        <h2 className="text-sm font-extrabold text-card-foreground">Appearance</h2>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {THEMES.map((option) => {
            const active = theme === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setTheme(option.value)}
                aria-pressed={active}
                className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold transition-colors ${
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/70 text-muted-foreground hover:text-foreground"
                }`}
              >
                <option.icon className="h-4 w-4" />
                {option.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Links */}
      <section className="mt-4 overflow-hidden rounded-2xl border border-border/70 bg-card">
        <Row icon={User} label="Account details" href="/settings/account" />
        <Row icon={BarChart3} label="Performance history" href="/history" />
        <Row icon={Bell} label="Notifications" href="/settings/notifications" />
        <Row icon={Shield} label="Privacy & security" href="/settings/privacy" />
      </section>

      <section className="mt-4 overflow-hidden rounded-2xl border border-border/70 bg-card">
        <Row icon={HelpCircle} label="Help & support" href="/settings/help" />
        <Row icon={FileText} label="Terms & privacy" href="/settings/terms" />
      </section>

      <section className="mt-4 rounded-2xl border border-border/70 bg-card p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
            <Trophy className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-card-foreground">Best score</p>
            <p className="text-xs text-muted-foreground">
              Across all completed attempts
            </p>
          </div>
          <p className="text-lg font-extrabold text-foreground">{analytics?.bestPercentage ?? 0}%</p>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Target className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-card-foreground">Time on exams</p>
            <p className="text-xs text-muted-foreground">Total time across attempts</p>
          </div>
          <p className="text-lg font-extrabold text-foreground">{analytics?.totalMinutes ?? 0}m</p>
        </div>
      </section>

      <Button
        variant="outline"
        className="mt-4 w-full rounded-xl border-destructive/30 text-destructive hover:bg-destructive/5"
        onClick={() => signOut({ redirectUrl: "/" })}
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </Button>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  href,
}: {
  icon: React.ElementType;
  label: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 border-b border-border/60 px-4 py-3.5 transition-colors last:border-0 hover:bg-muted/40"
    >
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <span className="flex-1 text-sm font-semibold text-foreground">{label}</span>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}
