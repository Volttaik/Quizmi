import { ArrowDownLeft, ArrowUpRight, Zap } from "lucide-react";
import { Link } from "wouter";

interface Transaction {
  id: number;
  description: string;
  amount: number;
  type: string;
  createdAt: string;
}

interface Props {
  transactions: Transaction[];
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function RecentTransactions({ transactions }: Props) {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="mb-6">
        <h3 className="text-sm font-extrabold text-foreground mb-3">Recent Activity</h3>
        <div className="rounded-2xl bg-card border border-border/60 p-6 text-center shadow-[0_2px_16px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_16px_rgba(0,0,0,0.25)]">
          <div className="w-10 h-10 rounded-2xl bg-muted mx-auto mb-3 flex items-center justify-center">
            <Zap className="w-4 h-4 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground font-medium">No activity yet. Start by creating a quiz!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3 px-0.5">
        <h3 className="text-sm font-extrabold text-foreground">Recent Activity</h3>
        <Link to="/history" className="text-xs text-primary font-semibold">See all →</Link>
      </div>
      <div className="rounded-2xl bg-card border border-border/60 overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_16px_rgba(0,0,0,0.25)]">
        {transactions.slice(0, 4).map((t, i) => {
          const isIn = t.type === "purchase" || t.amount > 0;
          return (
            <div
              key={t.id}
              className={`flex items-center gap-3 px-4 py-3.5 ${
                i < Math.min(transactions.length, 4) - 1 ? "border-b border-border/40" : ""
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                isIn ? "bg-[hsl(142,70%,45%)]/12 dark:bg-[hsl(142,70%,45%)]/15" : "bg-red-500/10"
              }`}>
                {isIn
                  ? <ArrowDownLeft className="w-4 h-4 text-[hsl(142,70%,45%)]" />
                  : <ArrowUpRight className="w-4 h-4 text-red-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{t.description}</p>
                <p className="text-[11px] text-muted-foreground font-medium">{timeAgo(t.createdAt)}</p>
              </div>
              <span className={`text-sm font-extrabold flex-shrink-0 ${isIn ? "text-[hsl(142,70%,45%)]" : "text-red-500"}`}>
                {isIn ? "+" : "−"}{Math.abs(t.amount).toLocaleString()} cr
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
