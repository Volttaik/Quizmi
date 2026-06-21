"use client";
import { ChevronLeft, Shield, Lock, Eye, Trash2 } from "lucide-react";
import Link from "next/link";
import { useClerk } from "@clerk/nextjs";
import BottomNav from "@/components/dashboard/BottomNav";

export default function PrivacySecurityPage() {
  const { openUserProfile } = useClerk();

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="max-w-lg mx-auto px-4 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/profile" className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </Link>
          <h1 className="text-lg font-extrabold text-foreground">Privacy & Security</h1>
        </div>

        <div className="bg-card rounded-2xl border border-border/40 shadow-sm overflow-hidden mb-4">
          <ActionRow
            icon={Lock}
            label="Change Password"
            description="Update your login credentials"
            onClick={() => openUserProfile()}
          />
          <ActionRow
            icon={Eye}
            label="Manage Sessions"
            description="View active sign-in sessions"
            onClick={() => openUserProfile()}
          />
          <ActionRow
            icon={Shield}
            label="Two-Factor Auth"
            description="Add extra security to your account"
            onClick={() => openUserProfile()}
          />
        </div>

        <div className="bg-card rounded-2xl border border-border/40 shadow-sm overflow-hidden mb-4">
          <div className="px-4 py-3.5">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">Data</p>
          </div>
          <ActionRow
            icon={Trash2}
            label="Delete Account"
            description="Permanently remove your account and data"
            onClick={() => openUserProfile()}
            danger
          />
        </div>

        <div className="bg-primary/5 rounded-2xl border border-primary/10 p-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Your data is encrypted and stored securely. Quizmi never shares your personal information with third parties.
          </p>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

function ActionRow({ icon: Icon, label, description, onClick, danger }: {
  icon: React.ElementType; label: string; description: string; onClick: () => void; danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors border-b border-border/30 last:border-0 text-left"
    >
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${danger ? "bg-red-500/10" : "bg-primary/10"}`}>
        <Icon className={`w-4 h-4 ${danger ? "text-red-500" : "text-primary"}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${danger ? "text-red-500" : "text-foreground"}`}>{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </button>
  );
}
