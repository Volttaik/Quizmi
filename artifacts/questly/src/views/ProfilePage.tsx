"use client";
import { useEffect, useState, useRef } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { LogOut, ChevronRight, Shield, Bell, HelpCircle, FileText, Camera, Loader2, Coins, Sparkles, Award } from "lucide-react";
import BottomNav from "@/components/dashboard/BottomNav";
import Link from "next/link";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { User } from "lucide-react";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.15 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 280, damping: 26 } },
};

export default function ProfilePage() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [credits, setCredits] = useState<number | null>(null);
  const [plan, setPlan] = useState("free");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/user")
      .then((r) => r.json())
      .then((d) => { setCredits(d.credits ?? 0); setPlan(d.plan ?? "free"); })
      .catch(() => {});
  }, []);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingPhoto(true);
    try {
      await user.setProfileImage({ file });
      toast.success("Profile photo updated!");
    } catch {
      toast.error("Failed to upload photo. Try a smaller image.");
    } finally {
      setUploadingPhoto(false);
      e.target.value = "";
    }
  };

  const initials = (user?.fullName ?? user?.firstName ?? "U")
    .split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  const isPro = plan === "pro";

  return (
    <div className="min-h-screen bg-background pb-28 overflow-hidden">
      {/* Header gradient */}
      <div className="absolute top-0 left-0 right-0 h-[260px] pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(262,72%,32%)] via-[hsl(265,65%,28%)] to-[hsl(275,60%,22%)]" />
        <div className="absolute top-0 left-0 w-80 h-80 bg-primary/35 rounded-full blur-[90px] -translate-x-1/3 -translate-y-1/3" />
        <div className="absolute top-0 right-0 w-72 h-72 bg-[hsl(280,72%,50%)]/30 rounded-full blur-[80px] translate-x-1/4 -translate-y-1/3" />
        <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-[hsl(200,90%,50%)]/10 rounded-full blur-[60px] -translate-x-1/2 -translate-y-1/4" />
        {/* dot pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="profile-dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#profile-dots)" />
        </svg>
        <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-background to-transparent" />
      </div>

      <motion.div
        className="relative max-w-lg mx-auto px-4 pt-10"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.h1 variants={item} className="text-lg font-extrabold text-white mb-6">Profile</motion.h1>

        {/* Avatar + name */}
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
            {/* Camera overlay */}
            <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-all">
              {uploadingPhoto
                ? <Loader2 className="w-6 h-6 text-white animate-spin" />
                : <Camera className="w-6 h-6 text-white" />}
            </div>
            {/* Upload badge */}
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary border-2 border-white dark:border-card flex items-center justify-center shadow-md">
              <Camera className="w-3 h-3 text-white" />
            </div>
          </button>

          <h2 className="text-xl font-extrabold text-white mt-1">{user?.fullName ?? user?.firstName ?? "Learner"}</h2>
          <p className="text-white/55 text-sm mb-2">{user?.emailAddresses?.[0]?.emailAddress ?? ""}</p>
          <span className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold border ${
            isPro
              ? "bg-yellow-400/20 text-yellow-300 border-yellow-400/20"
              : "bg-white/10 text-white/60 border-white/10"
          }`}>
            {isPro ? <><Sparkles className="w-3 h-3" /> Pro Learner</> : "Free Plan"}
          </span>
        </motion.div>

        {/* Credits card */}
        <motion.div variants={item} className="relative overflow-hidden bg-gradient-to-r from-primary/90 to-[hsl(275,72%,48%)] rounded-2xl p-4 mb-4 shadow-glow-primary">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-xl" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
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

        {/* Settings sections */}
        <motion.div variants={item} className="bg-card rounded-2xl overflow-hidden border border-border/40 shadow-card dark:shadow-card mb-4">
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

function SettingRow({ icon: Icon, label, to }: { icon: React.ElementType; label: string; to: string }) {
  return (
    <Link href={to} className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 active:bg-muted/70 transition-colors border-b border-border/30 last:border-0 group">
      <div className="w-9 h-9 rounded-xl bg-primary/10 group-hover:bg-primary/15 flex items-center justify-center flex-shrink-0 transition-colors">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <span className="flex-1 text-sm font-semibold text-foreground text-left">{label}</span>
      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
    </Link>
  );
}
