"use client";

import { ShoppingCart, ChevronRight, Zap } from "lucide-react";

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

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function RecentTransactions({ transactions }: Props) {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="mb-6">
        <h3 className="text-base font-extrabold text-foreground mb-3">
          Recent Transactions
        </h3>
        <div className="rounded-2xl bg-card border border-border p-6 text-center">
          <p className="text-xs text-muted-foreground font-medium">
            No transactions yet. Buy credits to get started!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-extrabold text-foreground">
          Recent Transactions
        </h3>
        <button className="flex items-center gap-1 text-xs font-bold text-primary">
          View all <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-sm">
        {transactions.slice(0, 5).map((t, i) => (
          <div
            key={t.id}
            className={`flex items-center gap-3 px-4 py-4 ${
              i < Math.min(transactions.length, 5) - 1 ? "border-b border-border" : ""
            }`}
          >
            <div className="w-11 h-11 rounded-2xl bg-muted flex items-center justify-center flex-shrink-0">
              {t.type === "purchase" ? (
                <ShoppingCart className="w-4 h-4 text-muted-foreground" strokeWidth={1.8} />
              ) : (
                <Zap className="w-4 h-4 text-muted-foreground" strokeWidth={1.8} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">{t.description}</p>
              <p className="text-xs text-muted-foreground font-medium">
                {t.type === "purchase" ? "via Paystack" : "AI Usage"}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p
                className={`text-sm font-extrabold ${
                  t.type === "purchase" ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {t.type === "purchase" ? "+" : "-"}
                {Math.abs(t.amount).toLocaleString()}
              </p>
              <p className="text-[10px] text-muted-foreground font-medium">
                {formatDate(t.createdAt)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
