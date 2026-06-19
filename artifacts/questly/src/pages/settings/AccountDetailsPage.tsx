import { useUser } from "@clerk/react";
import { ChevronLeft, User, Mail, Phone, Calendar } from "lucide-react";
import { Link } from "wouter";
import BottomNav from "@/components/dashboard/BottomNav";

export default function AccountDetailsPage() {
  const { user } = useUser();

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="max-w-lg mx-auto px-4 pt-6">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/profile" className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
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
          <DetailRow icon={User} label="Full Name" value={user?.fullName ?? "—"} />
          <DetailRow icon={Mail} label="Email" value={user?.emailAddresses?.[0]?.emailAddress ?? "—"} />
          <DetailRow icon={Phone} label="Phone" value={user?.phoneNumbers?.[0]?.phoneNumber ?? "Not set"} />
          <DetailRow
            icon={Calendar}
            label="Member since"
            value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "—"}
          />
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200/50 dark:border-amber-800/30 p-4">
          <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
            To update your name, email or photo, use the Clerk account portal available after signing in with Google.
          </p>
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
