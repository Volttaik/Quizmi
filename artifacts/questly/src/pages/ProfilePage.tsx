import { useEffect, useState } from "react";
import { useUser, useClerk } from "@clerk/react";
import { User, Mail, Star, LogOut, ChevronRight, Shield, Bell, HelpCircle, FileText } from "lucide-react";
import BottomNav from "@/components/dashboard/BottomNav";
import { Link } from "wouter";

export default function ProfilePage() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [credits, setCredits] = useState<number | null>(null);
  const [plan, setPlan] = useState("free");

  useEffect(() => {
    fetch("/api/user")
      .then((r) => r.json())
      .then((d) => {
        setCredits(d.credits ?? 0);
        setPlan(d.plan ?? "free");
      })
      .catch(() => {});
  }, []);

  const initials = (user?.fullName ?? user?.firstName ?? "U")
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="absolute top-0 left-0 right-0 h-[220px] pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(262,72%,35%)] via-[hsl(265,65%,30%)] to-[hsl(275,60%,24%)]" />
        <div className="absolute top-0 left-0 w-72 h-72 bg-primary/30 rounded-full blur-[80px] -translate-x-1/3 -translate-y-1/3" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-[hsl(280,72%,50%)]/25 rounded-full blur-[70px] translate-x-1/4 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="relative max-w-lg mx-auto px-4 pt-8">
        <h1 className="text-lg font-extrabold text-white mb-6">Profile</h1>

        <div className="flex flex-col items-center mb-6">
          {user?.imageUrl ? (
            <img src={user.imageUrl} alt="Avatar" className="w-20 h-20 rounded-full border-4 border-white/20 shadow-xl mb-3" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-primary/80 border-4 border-white/20 shadow-xl flex items-center justify-center mb-3">
              <span className="text-2xl font-bold text-white">{initials}</span>
            </div>
          )}
          <h2 className="text-xl font-bold text-white">{user?.fullName ?? user?.firstName ?? "Learner"}</h2>
          <p className="text-white/60 text-sm">{user?.emailAddresses?.[0]?.emailAddress ?? ""}</p>
          <span className={`mt-2 px-3 py-0.5 rounded-full text-xs font-bold ${plan === "pro" ? "bg-yellow-400/20 text-yellow-300" : "bg-white/10 text-white/60"}`}>
            {plan === "pro" ? "⚡ Pro Learner" : "Free Plan"}
          </span>
        </div>

        <div className="bg-card rounded-2xl p-4 mb-4 flex items-center justify-between shadow-sm border border-border/40">
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-0.5">Study Credits</p>
            <p className="text-2xl font-extrabold text-foreground">{credits === null ? "—" : credits.toLocaleString()}</p>
          </div>
          <Link to="/buy-credits" className="bg-primary/10 text-primary text-xs font-bold px-4 py-2 rounded-full hover:bg-primary/20 transition-colors">
            Add Credits
          </Link>
        </div>

        <div className="bg-card rounded-2xl overflow-hidden border border-border/40 shadow-sm mb-4">
          <SettingRow icon={User} label="Account Details" to="/settings/account" />
          <SettingRow icon={Bell} label="Notifications" to="/settings/notifications" />
          <SettingRow icon={Shield} label="Privacy & Security" to="/settings/privacy" />
        </div>

        <div className="bg-card rounded-2xl overflow-hidden border border-border/40 shadow-sm mb-4">
          <SettingRow icon={HelpCircle} label="Help & Support" to="/settings/help" />
          <SettingRow icon={FileText} label="Terms & Privacy" to="/settings/terms" />
        </div>

        <button
          onClick={() => signOut({ redirectUrl: "/" })}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-red-500 font-bold border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>

      <BottomNav />
    </div>
  );
}

function SettingRow({ icon: Icon, label, to }: { icon: React.ElementType; label: string; to: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors border-b border-border/30 last:border-0">
      <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <span className="flex-1 text-sm font-semibold text-foreground text-left">{label}</span>
      <ChevronRight className="w-4 h-4 text-muted-foreground" />
    </Link>
  );
}
