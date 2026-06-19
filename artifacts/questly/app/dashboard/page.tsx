"use client";

import { useEffect, useState } from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import CreditCard from "@/components/dashboard/CreditCard";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import ActionCards from "@/components/dashboard/ActionCards";
import PromoBanner from "@/components/dashboard/PromoBanner";
import BottomNav from "@/components/dashboard/BottomNav";

interface UserData {
  credits: number;
  name: string;
  plan: string;
}

interface Transaction {
  id: number;
  description: string;
  amount: number;
  type: string;
  createdAt: string;
}

export default function DashboardPage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    fetch("/api/user")
      .then((r) => r.json())
      .then((d) => setUserData(d))
      .catch(() => {});

    fetch("/api/credits/transactions")
      .then((r) => r.json())
      .then((d) => setTransactions(d))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="absolute top-0 left-0 right-0 h-[340px] overflow-hidden">
        <div className="w-full h-full bg-gradient-to-br from-[hsl(262,72%,40%)] via-[hsl(262,72%,35%)] to-[hsl(270,72%,28%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="relative max-w-lg mx-auto px-4 pt-6">
        <DashboardHeader name={userData?.name} />
        <CreditCard credits={userData?.credits ?? 0} plan={userData?.plan ?? "free"} />
        <RecentTransactions transactions={transactions} />
        <ActionCards />
        <PromoBanner />
      </div>
      <BottomNav />
    </div>
  );
}
