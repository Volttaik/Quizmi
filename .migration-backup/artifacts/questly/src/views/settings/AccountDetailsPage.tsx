"use client";
import { useUser } from "@clerk/nextjs";
import { ChevronLeft, User, Mail, Phone, Calendar, Pencil, Check, X, Loader2 } from "lucide-react";
import Link from "next/link";
import BottomNav from "@/components/dashboard/BottomNav";
import { useState } from "react";
import { toast } from "sonner";

export default function AccountDetailsPage() {
  const { user } = useUser();
  const [editingName, setEditingName] = useState(false);
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [savingName, setSavingName] = useState(false);

  const startEdit = () => {
    setNewFirstName(user?.firstName ?? "");
    setNewLastName(user?.lastName ?? "");
    setEditingName(true);
  };

  const cancelEdit = () => {
    setEditingName(false);
    setNewFirstName("");
    setNewLastName("");
  };

  const saveName = async () => {
    if (!user) return;
    if (!newFirstName.trim()) { toast.error("First name cannot be empty"); return; }
    setSavingName(true);
    try {
      await user.update({ firstName: newFirstName.trim(), lastName: newLastName.trim() });
      await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: `${newFirstName.trim()} ${newLastName.trim()}`.trim() }),
      }).catch(() => {});
      toast.success("Name updated!");
      setEditingName(false);
    } catch {
      toast.error("Failed to update name. Please try again.");
    } finally {
      setSavingName(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="max-w-lg mx-auto px-4 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/profile" className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </Link>
          <h1 className="text-lg font-extrabold text-foreground">Account Details</h1>
        </div>

        <div className="flex flex-col items-center mb-8">
          {user?.imageUrl ? (
            <img src={user.imageUrl} alt="Avatar" className="w-20 h-20 rounded-full border-4 border-primary/20 shadow-xl mb-3" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-primary/20 border-4 border-primary/10 flex items-center justify-center mb-3">
              <User className="w-8 h-8 text-primary" />
            </div>
          )}
          <p className="text-sm text-muted-foreground">Your account information</p>
        </div>

        <div className="bg-card rounded-2xl border border-border/40 shadow-sm overflow-hidden mb-4">
          {/* Editable Name Row */}
          <div className="px-4 py-3.5 border-b border-border/30">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium mb-1">Full Name</p>
                {editingName ? (
                  <div className="flex gap-2 flex-wrap">
                    <input
                      type="text"
                      value={newFirstName}
                      onChange={(e) => setNewFirstName(e.target.value)}
                      placeholder="First name"
                      autoFocus
                      className="flex-1 min-w-0 text-sm font-semibold bg-muted/60 border border-border rounded-lg px-2.5 py-1.5 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/15 transition-all"
                    />
                    <input
                      type="text"
                      value={newLastName}
                      onChange={(e) => setNewLastName(e.target.value)}
                      placeholder="Last name"
                      onKeyDown={(e) => { if (e.key === "Enter") saveName(); if (e.key === "Escape") cancelEdit(); }}
                      className="flex-1 min-w-0 text-sm font-semibold bg-muted/60 border border-border rounded-lg px-2.5 py-1.5 outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/15 transition-all"
                    />
                  </div>
                ) : (
                  <p className="text-sm font-semibold text-foreground">{user?.fullName ?? "—"}</p>
                )}
              </div>
              {editingName ? (
                <div className="flex gap-1.5 flex-shrink-0">
                  <button onClick={saveName} disabled={savingName} className="w-8 h-8 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center text-primary transition-colors">
                    {savingName ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={cancelEdit} className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center text-muted-foreground transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button onClick={startEdit} className="w-8 h-8 rounded-full bg-muted hover:bg-primary/10 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors flex-shrink-0">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <DetailRow icon={Mail} label="Email" value={user?.emailAddresses?.[0]?.emailAddress ?? "—"} />
          <DetailRow icon={Phone} label="Phone" value={user?.phoneNumbers?.[0]?.phoneNumber ?? "Not set"} />
          <DetailRow
            icon={Calendar}
            label="Member since"
            value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "—"}
          />
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border/30 last:border-0">
      <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        <p className="text-sm font-semibold text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}
