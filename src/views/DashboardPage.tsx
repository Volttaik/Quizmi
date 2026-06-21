"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import CreditCard from "@/components/dashboard/CreditCard";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import ActionCards from "@/components/dashboard/ActionCards";
import PromoBanner from "@/components/dashboard/PromoBanner";
import BottomNav from "@/components/dashboard/BottomNav";
import StudySlideshow from "@/components/dashboard/StudySlideshow";
import StreakWidget from "@/components/dashboard/StreakWidget";

interface UserData {
  credits: number;
  name: string;
  plan: string;
  wallpaperUrl?: string;
}

interface Transaction {
  id: number;
  description: string;
  amount: number;
  type: string;
  createdAt: string;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { type: "spring" as const, stiffness: 320, damping: 30 } },
};

export default function DashboardPage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    fetch("/api/user")
      .then((r) => r.json())
      .then((d) => setUserData(d))
      .catch(() => {});
    fetch("/api/credits/transactions")
      .then((r) => r.json())
      .then((d) => setTransactions(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 160);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background pb-28 relative">
      {/* Hero gradient / wallpaper background */}
      <div className="fixed top-0 left-0 right-0 h-[280px] pointer-events-none overflow-hidden z-0">
        {userData?.wallpaperUrl ? (
          <>
            <img
              src={userData.wallpaperUrl}
              alt="Wallpaper"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-[hsl(262,72%,35%)]/60 via-[hsl(265,65%,28%)]/50 to-[hsl(275,60%,22%)]/60" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-[hsl(262,72%,35%)] via-[hsl(265,65%,28%)] to-[hsl(275,60%,22%)]" />
            <div className="absolute top-0 left-0 w-80 h-80 bg-primary/35 rounded-full blur-[90px] -translate-x-1/3 -translate-y-1/3" />
            <div className="absolute top-0 right-0 w-72 h-72 bg-[hsl(280,72%,50%)]/30 rounded-full blur-[80px] translate-x-1/4 -translate-y-1/3" />
          </>
        )}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent" />
      </div>

      {/* Smart UI Sticky Header */}
      <div className="sticky top-0 z-30">
        <div
          className={`w-full transition-all duration-300 ${
            scrolled
              ? "bg-background/90 backdrop-blur-xl border-b border-border/30 shadow-sm"
              : ""
          }`}
        >
          <div className="max-w-lg mx-auto px-4 pt-6 pb-3">
            <DashboardHeader name={userData?.name} scrolled={scrolled} />
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <motion.div className="relative max-w-lg mx-auto px-4" variants={container} initial="hidden" animate="show">
        <motion.div variants={item}><CreditCard credits={userData?.credits ?? 0} plan={userData?.plan ?? "starter"} /></motion.div>
        <motion.div variants={item}><StreakWidget /></motion.div>
        <motion.div variants={item}><StudySlideshow /></motion.div>
        <motion.div variants={item} className="mb-3 px-0.5">
          <h3 className="text-sm font-extrabold text-foreground">Quick Actions</h3>
        </motion.div>
        <motion.div variants={item}><ActionCards /></motion.div>
        <motion.div variants={item}><RecentTransactions transactions={transactions} /></motion.div>
        <motion.div variants={item}><PromoBanner /></motion.div>
      </motion.div>

      <BottomNav />
    </div>
  );
}
