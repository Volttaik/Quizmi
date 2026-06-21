"use client";
import { useEffect, useState, useRef } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { LogOut, ChevronRight, Shield, Bell, HelpCircle, FileText, Camera, Loader2, Coins, Award, ImageIcon } from "lucide-react";
import BottomNav from "@/components/dashboard/BottomNav";
import Link from "next/link";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { User } from "lucide-react";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { type: "spring" as const, stiffness: 280, damping: 26 } },
};

export default function ProfilePage() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [credits, setCredits] = useState<number | null>(null);
  const [plan, setPlan] = useState("starter");
  const [wallpaperUrl, setWallpaperUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingWallpaper, setUploadingWallpaper] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);
  const wallpaperRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/user")
      .then((r) => r.json())
      .then((d) => {
        setCredits(d.credits ?? 0);
        setPlan(d.plan ?? "starter");
        setWallpaperUrl(d.wallpaperUrl ?? null);
      })
      .catch(() => {});
  }, []);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingPhoto(true);
    try {
      const res = await fetch("/api/upload/avatar", {
        method: "POST",
        headers: { "content-type": file.type },
        body: file,
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Upload failed");
      const { url } = await res.json();
      await Promise.all([
        user.setProfileImage({ file }),
        fetch("/api/user", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ avatarUrl: url }),
        }),
      ]);
      toast.success("Profile photo updated!");
    } catch {
      toast.error("Failed to upload photo. Try a smaller image.");
    } finally {
      setUploadingPhoto(false);
      e.target.value = "";
    }
  };

  const handleWallpaperUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingWallpaper(true);
    try {
      const res = await fetch("/api/upload/wallpaper", {
        method: "POST",
        headers: { "content-type": file.type },
        body: file,
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Upload failed");
      const { url } = await res.json();
      await fetch("/api/user", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ wallpaperUrl: url }),
      });
      setWallpaperUrl(url);
      toast.success("Wallpaper updated! Check your dashboard.");
    } catch {
      toast.error("Failed to upload wallpaper.");
    } finally {
      setUploadingWallpaper(false);
      e.target.value = "";
    }
  };

  const handleRemoveWallpaper = async () => {
    try {
      await fetch("/api/user", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ wallpaperUrl: "" }),
      });
      setWallpaperUrl(null);
      toast.success("Wallpaper removed.");
    } catch {
      toast.error("Failed to remove wallpaper.");
    }
  };

  const initials = (user?.fullName ?? user?.firstName ?? "U")
    .split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen bg-background pb-28 relative">
      <div className="absolute top-0 left-0 right-0 h-[220px] pointer-events-none overflow-hidden">
        {wallpaperUrl ? (
          <>
            <img src={wallpaperUrl} alt="Wallpaper" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-br from-[hsl(262,72%,32%)]/70 via-[hsl(265,65%,28%)]/60 to-[hsl(275,60%,22%)]/70" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-[hsl(262,72%,32%)] via-[hsl(265,65%,28%)] to-[hsl(275,60%,22%)]" />
            <div className="absolute top-0 left-0 w-64 h-64 bg-primary/30 rounded-full blur-[70px] -translate-x-1/3 -translate-y-1/3" />
            <div className="absolute top-0 right-0 w-56 h-56 bg-[hsl(280,72%,50%)]/25 rounded-full blur-[60px] translate-x-1/4 -translate-y-1/3" />
          </>
        )}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent" />
      </div>

      <motion.div
        className="relative max-w-lg mx-auto px-4 pt-10"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.h1 variants={item} className="text-lg font-extrabold text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.4)] mb-6">Profile</motion.h1>

        {/* Avatar section */}
        <motion.div variants={item} className="flex flex-col items-center mb-6">
          <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          <button
            onClick={() => photoRef.current?.click()}
            disabled={uploadingPhoto}
            className="relative group mb-3"
          >
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white/25 shadow-2xl shadow-black/30">
              {user?.imageUrl ? (
                <img src={user.imageUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary to-[hsl(275,72%,42%)] flex items-center justify-center">
                  <span className="text-3xl font-black text-white">{initials}</span>
                </div>
              )}
            </div>
            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-all">
              {uploadingPhoto
                ? <Loader2 className="w-6 h-6 text-white animate-spin" />
                : <Camera className="w-6 h-6 text-white" />}
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary border-2 border-background flex items-center justify-center shadow-md">
              <Camera className="w-3 h-3 text-white" />
            </div>
          </button>

          {/* Smart UI: text-shadow + dark text so it reads on both dark gradient and light fade */}
          <h2 className="text-xl font-extrabold text-foreground [text-shadow:0_1px_12px_rgba(0,0,0,0.5)] dark:text-white mt-1">
            {user?.fullName ?? user?.firstName ?? "Learner"}
          </h2>
          <p className="text-foreground/60 dark:text-white/55 [text-shadow:0_1px_8px_rgba(0,0,0,0.4)] text-sm mb-2">
            {user?.emailAddresses?.[0]?.emailAddress ?? ""}
          </p>
        </motion.div>

        {/* Wallpaper section */}
        <motion.div variants={item} className="bg-card rounded-2xl overflow-hidden border border-border/40 shadow-card dark:shadow-card mb-4">
          <input ref={wallpaperRef} type="file" accept="image/*" className="hidden" onChange={handleWallpaperUpload} />
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <ImageIcon className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Dashboard Wallpaper</p>
              <p className="text-[11px] text-muted-foreground">Shown at the top of your dashboard</p>
            </div>
            <div className="flex items-center gap-2">
              {wallpaperUrl && (
                <button
                  onClick={handleRemoveWallpaper}
                  className="text-[11px] text-muted-foreground hover:text-destructive font-medium transition-colors"
                >
                  Remove
                </button>
              )}
              <button
                onClick={() => wallpaperRef.current?.click()}
                disabled={uploadingWallpaper}
                className="flex items-center gap-1.5 text-[11px] font-bold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-full transition-colors"
              >
                {uploadingWallpaper ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <ImageIcon className="w-3 h-3" />
                )}
                {wallpaperUrl ? "Change" : "Set"}
              </button>
            </div>
          </div>
          {wallpaperUrl && (
            <div className="mx-4 mb-3 rounded-xl overflow-hidden h-16">
              <img src={wallpaperUrl} alt="Wallpaper preview" className="w-full h-full object-cover" />
            </div>
          )}
        </motion.div>

        {/* Credits card */}
        <motion.div variants={item} className="relative overflow-hidden bg-gradient-to-r from-primary/90 to-[hsl(275,72%,48%)] rounded-2xl p-4 mb-4 shadow-glow-primary">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-xl" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <Coins className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-white/60 font-medium">Study Credits</p>
                <p className="text-2xl font-extrabold text-white leading-none">
                  {credits === null ? "—" : credits.toLocaleString()}
                </p>
              </div>
            </div>
            <Link
              href="/buy-credits"
              className="bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-4 py-2 rounded-full transition-all active:scale-95"
            >
              Add Credits
            </Link>
          </div>
        </motion.div>

        <motion.div variants={item} className="bg-card rounded-2xl overflow-hidden border border-border/40 shadow-card dark:shadow-card mb-4">
          <SettingRow icon={Award} label="Achievements" to="/achievements" accent />
          <SettingRow icon={User} label="Account Details" to="/settings/account" />
          <SettingRow icon={Bell} label="Notifications" to="/settings/notifications" />
          <SettingRow icon={Shield} label="Privacy & Security" to="/settings/privacy" />
        </motion.div>

        <motion.div variants={item} className="bg-card rounded-2xl overflow-hidden border border-border/40 shadow-card dark:shadow-card mb-4">
          <SettingRow icon={HelpCircle} label="Help & Support" to="/settings/help" />
          <SettingRow icon={FileText} label="Terms & Privacy" to="/settings/terms" />
        </motion.div>

        <motion.div variants={item}>
          <button
            onClick={() => signOut({ redirectUrl: "/" })}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-red-500 font-bold border-2 border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-all active:scale-[0.99]"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </motion.div>
      </motion.div>

      <BottomNav />
    </div>
  );
}

function SettingRow({ icon: Icon, label, to, accent }: { icon: React.ElementType; label: string; to: string; accent?: boolean }) {
  return (
    <Link href={to} className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 active:bg-muted/70 transition-colors border-b border-border/30 last:border-0 group">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${accent ? "bg-yellow-400/15 group-hover:bg-yellow-400/25" : "bg-primary/10 group-hover:bg-primary/15"}`}>
        <Icon className={`w-4 h-4 ${accent ? "text-yellow-500" : "text-primary"}`} />
      </div>
      <span className="flex-1 text-sm font-semibold text-foreground text-left">{label}</span>
      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
    </Link>
  );
}
